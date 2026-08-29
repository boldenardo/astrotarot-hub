// HotmartClient — TODO HTTP com a Hotmart passa por aqui.
//
// - ALLOWLIST fechada de operações (fonte: docs oficiais Hotmart Developers,
//   lidas em 2026-08-20 via workflow de mapeamento). Nenhuma tool monta URL:
//   quem chama passa o NOME da operação + params; hostname/protocolo/headers
//   nunca vêm de fora (anti-SSRF / anti-exfiltração de credencial).
// - Retry pós-401 (token renovado uma vez), backoff em 429 respeitando
//   RateLimit-Reset (janela de 1 min, limite 500/min documentado).
// - Sandbox: HOTMART_ENV=sandbox troca a base para sandbox.hotmart.com
//   (mesmos paths, credencial TIPO sandbox — a de produção não funciona lá).
// - Paginação por cursor (page_token/next_page_token) com helper getAll.

import { HotmartError, mapHttpError } from "./errors";
import { getTokenManager, HotmartTokenManager } from "./token-manager";

const PROD_BASE = "https://developers.hotmart.com";
const SANDBOX_BASE = "https://sandbox.hotmart.com";

type Method = "GET" | "POST" | "PUT" | "PATCH";

interface OperationDef {
  method: Method;
  /** Path com {placeholders}; sempre relativo à base — nunca URL absoluta. */
  path: string;
  /** Doc oficial que estabelece a operação. */
  doc: string;
  write?: boolean;
}

/**
 * Operações oficiais suportadas. Fora desta tabela → HOTMART_OPERATION_UNAVAILABLE.
 */
export const OPERATIONS = {
  // ── SALES (read) ────────────────────────────────────────────────────
  salesHistory: {
    method: "GET",
    path: "/payments/api/v1/sales/history",
    doc: "docs/en/v1/sales/sales-history/",
  },
  salesSummary: {
    method: "GET",
    path: "/payments/api/v1/sales/summary",
    doc: "docs/en/v1/sales/sales-summary/",
  },
  salesUsers: {
    method: "GET",
    path: "/payments/api/v1/sales/users",
    doc: "docs/en/v1/sales/sales-users/",
  },
  salesCommissions: {
    method: "GET",
    path: "/payments/api/v1/sales/commissions",
    doc: "docs/en/v1/sales/sales-commissions/",
  },
  salesPriceDetails: {
    method: "GET",
    path: "/payments/api/v1/sales/price/details",
    doc: "docs/en/v1/sales/sales-price-details/",
  },
  // ── SALES (write) ───────────────────────────────────────────────────
  refundSale: {
    method: "PUT",
    path: "/payments/api/v1/sales/{transaction}/refund",
    doc: "docs/en/v1/sales/sales-refunds (constraints: status APPROVED/COMPLETE, não-trial, não BACS/SEPA)",
    write: true,
  },
  // ── SUBSCRIPTIONS (read) ────────────────────────────────────────────
  subscriptions: {
    method: "GET",
    path: "/payments/api/v1/subscriptions",
    doc: "docs/en/v1/subscription/get-subscribers/",
  },
  subscriptionSummary: {
    method: "GET",
    path: "/payments/api/v1/subscriptions/summary",
    doc: "docs/en/v1/subscription/subscription-summary/ (atraso de até 24h)",
  },
  subscriptionTransactions: {
    method: "GET",
    path: "/payments/api/v1/subscriptions/transactions",
    doc: "docs/en/v1/subscription/subscription-transactions/ (atraso de até 24h)",
  },
  subscriptionPurchases: {
    method: "GET",
    path: "/payments/api/v1/subscriptions/{subscriber_code}/purchases",
    doc: "docs/en/v1/subscription/get-subscribers-purchases/",
  },
  // ── SUBSCRIPTIONS (write) ───────────────────────────────────────────
  cancelSubscription: {
    method: "POST",
    path: "/payments/api/v1/subscriptions/{subscriber_code}/cancel",
    doc: "docs/en/v1/subscription/cancel-subscription/ (body: send_mail — não send_email)",
    write: true,
  },
  cancelSubscriptionList: {
    method: "POST",
    path: "/payments/api/v1/subscriptions/cancel",
    doc: "docs/en/v1/subscription/cancel-subscription-list/ (body: subscriber_code[])",
    write: true,
  },
  reactivateSubscription: {
    method: "POST",
    path: "/payments/api/v1/subscriptions/{subscriber_code}/reactivate",
    doc: "docs/en/v1/subscription/reactivate-and-charge-subscription/ — só INACTIVE; assinante precisa ACEITAR por e-mail (link válido 3 dias)",
    write: true,
  },
  reactivateSubscriptionList: {
    method: "POST",
    path: "/payments/api/v1/subscriptions/reactivate",
    doc: "docs/en/v1/subscription/reactivate-and-charge-subscription-list/",
    write: true,
  },
  changeDueDay: {
    method: "PATCH",
    path: "/payments/api/v1/subscriptions/{subscriber_code}",
    doc: "docs/en/v1/subscription/change-charge-day/ (body: due_day 1-31; só ACTIVE/OVERDUE; nunca em trial)",
    write: true,
  },
  // ── PRODUCTS / CLUB (read) ──────────────────────────────────────────
  products: {
    method: "GET",
    path: "/products/api/v1/products",
    doc: "docs/en/v1/product/product-list/",
  },
  clubModules: {
    method: "GET",
    path: "/club/api/v1/modules",
    doc: "docs/en/v1/club/get-modules/ (query: subdomain)",
  },
  clubUsers: {
    method: "GET",
    path: "/club/api/v1/users",
    doc: "docs/en/v1/club/get-users/ (query: subdomain)",
  },
} as const satisfies Record<string, OperationDef>;

export type OperationName = keyof typeof OPERATIONS;

export interface CallOptions {
  /** Substituições de {placeholder} no path. Valores são URL-encoded. */
  pathParams?: Record<string, string>;
  /** Query string (só valores definidos entram). */
  query?: Record<string, string | number | boolean | undefined>;
  /** Body JSON (POST/PUT/PATCH). */
  body?: unknown;
}

export interface PageInfo {
  total_results?: number;
  next_page_token?: string;
  prev_page_token?: string;
  results_per_page?: number;
}

export class HotmartClient {
  private readonly tokens: HotmartTokenManager;
  private readonly fetchImpl: typeof fetch;
  private readonly base: string;

  constructor(opts?: {
    tokenManager?: HotmartTokenManager;
    fetchImpl?: typeof fetch;
    env?: "production" | "sandbox";
  }) {
    this.tokens = opts?.tokenManager ?? getTokenManager();
    this.fetchImpl = opts?.fetchImpl ?? fetch;
    const env = opts?.env ?? (process.env.HOTMART_ENV === "sandbox" ? "sandbox" : "production");
    this.base = env === "sandbox" ? SANDBOX_BASE : PROD_BASE;
  }

  isWrite(op: OperationName): boolean {
    return Boolean((OPERATIONS[op] as OperationDef).write);
  }

  /**
   * Executa uma operação da allowlist. `maxAttempts` cobre 429/timeout;
   * 401 tem um retry próprio (token renovado) que não conta como tentativa.
   */
  async call<T = unknown>(op: OperationName, opts: CallOptions = {}, maxAttempts = 3): Promise<T> {
    const def = OPERATIONS[op] as OperationDef;
    if (!def) {
      throw new HotmartError("HOTMART_OPERATION_UNAVAILABLE", `Unknown operation "${op}".`);
    }

    let path = def.path;
    for (const [k, v] of Object.entries(opts.pathParams ?? {})) {
      if (!path.includes(`{${k}}`)) {
        throw new HotmartError("HOTMART_VALIDATION_ERROR", `Path param "${k}" not expected by ${op}.`);
      }
      path = path.replace(`{${k}}`, encodeURIComponent(v));
    }
    if (/\{[a-z_]+\}/.test(path)) {
      throw new HotmartError("HOTMART_VALIDATION_ERROR", `Missing path params for ${op}: ${path}`);
    }

    const url = new URL(this.base + path);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }

    let retried401 = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method: def.method,
          headers: {
            Authorization: await this.tokens.authHeader(),
            "Content-Type": "application/json",
          },
          ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
          signal: AbortSignal.timeout(30_000),
        });
      } catch (e) {
        if (attempt < maxAttempts && !def.write) {
          // Reads são seguros de repetir; WRITES nunca se repetem às cegas
          // depois de um timeout — o chamador confirma o estado primeiro.
          await sleep(500 * attempt + Math.random() * 250);
          continue;
        }
        throw new HotmartError(
          def.write ? "HOTMART_MUTATION_UNCONFIRMED" : "HOTMART_TIMEOUT",
          `${op}: request did not complete (${e instanceof Error ? e.name : "network"}). ` +
            (def.write ? "State unknown — READ the resource before any retry." : "")
        );
      }

      if (res.status === 401 && !retried401) {
        retried401 = true;
        this.tokens.invalidate();
        attempt--; // não consome tentativa
        continue;
      }

      if (res.status === 429 && attempt < maxAttempts) {
        // Janela de 1 min; respeita RateLimit-Reset quando presente.
        const reset = Number(res.headers.get("RateLimit-Reset") ?? "");
        const waitMs = Number.isFinite(reset) && reset > 0
          ? Math.min(reset * 1000, 65_000)
          : Math.min(2 ** attempt * 1000 + Math.random() * 500, 30_000);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw mapHttpError(res.status, body);
      }

      // Refund documenta corpo vazio (só HTTP code) — tolera respostas sem JSON.
      const text = await res.text();
      if (!text) return undefined as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        return undefined as T;
      }
    }

    throw new HotmartError("HOTMART_RATE_LIMITED", `${op}: rate limit persisted after ${maxAttempts} attempts.`);
  }

  /**
   * Percorre TODAS as páginas de uma operação de listagem (cursor
   * page_token → next_page_token). Nunca conclua um total a partir da
   * primeira página — use isto.
   */
  async getAll<Item = unknown>(
    op: OperationName,
    opts: CallOptions = {},
    hardLimit = 5_000
  ): Promise<Item[]> {
    const items: Item[] = [];
    let pageToken: string | undefined;
    do {
      const page = await this.call<{ items?: Item[]; page_info?: PageInfo }>(op, {
        ...opts,
        query: { ...opts.query, max_results: 500, ...(pageToken ? { page_token: pageToken } : {}) },
      });
      items.push(...(page.items ?? []));
      pageToken = page.page_info?.next_page_token;
      if (items.length >= hardLimit) {
        // Cap explícito: quem chamou fica sabendo que há mais.
        break;
      }
    } while (pageToken);
    return items;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
