// HotmartService — operações de negócio sobre o HotmartClient.
//
// READS: consultas diretas + agregações (paginação completa sempre —
// nunca "20 vendas" porque a primeira página tinha 20).
//
// WRITES: coreografia obrigatória
//   READ → VALIDATE → (dry_run para aqui) → WRITE → READ → VERIFY
// com kill switches (HOTMART_WRITES_ENABLED / HOTMART_BULK_WRITES_ENABLED),
// journal de mutação e resultado honesto: success | failed | unconfirmed.
// Reativação NUNCA vira "feito": a Hotmart exige aceite do assinante por
// e-mail (link de 3 dias) → o resultado é REACTIVATION_REQUESTED.

import { HotmartClient, type PageInfo } from "./client";
import { HotmartError } from "./errors";
import { journal, maskEmail, newOperationId } from "./journal";

// ── Timezone (fase 18): datas centralizadas, configuráveis por env ─────

const TZ = () => process.env.HOTMART_TZ || "America/Sao_Paulo";

/** Epoch ms da meia-noite (00:00) de hoje na timezone configurada. */
function zonedMidnightMs(daysAgo = 0): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  // Meia-noite local ≈ meia-noite UTC do mesmo dia, corrigida pelo offset
  // da timezone naquele instante.
  const utcGuess = Date.UTC(y, m - 1, d - daysAgo);
  const offsetMs = tzOffsetMs(new Date(utcGuess));
  return utcGuess - offsetMs;
}

function tzOffsetMs(at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ(),
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - at.getTime();
}

export type Period =
  | "today"
  | "yesterday"
  | "last_24h"
  | "last_7d"
  | "this_month"
  | "prev_month";

export function periodRange(period: Period): { start_date: number; end_date: number; label: string } {
  const now = Date.now();
  switch (period) {
    case "today":
      return { start_date: zonedMidnightMs(0), end_date: now, label: "today" };
    case "yesterday":
      return { start_date: zonedMidnightMs(1), end_date: zonedMidnightMs(0) - 1, label: "yesterday" };
    case "last_24h":
      return { start_date: now - 24 * 3600_000, end_date: now, label: "last 24h" };
    case "last_7d":
      return { start_date: zonedMidnightMs(7), end_date: now, label: "last 7 days" };
    case "this_month": {
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ(), year: "numeric", month: "2-digit" })
        .formatToParts(new Date());
      const y = Number(parts.find((p) => p.type === "year")?.value);
      const m = Number(parts.find((p) => p.type === "month")?.value);
      const utcGuess = Date.UTC(y, m - 1, 1);
      return { start_date: utcGuess - tzOffsetMs(new Date(utcGuess)), end_date: now, label: "this month" };
    }
    case "prev_month": {
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ(), year: "numeric", month: "2-digit" })
        .formatToParts(new Date());
      const y = Number(parts.find((p) => p.type === "year")?.value);
      const m = Number(parts.find((p) => p.type === "month")?.value);
      const startGuess = Date.UTC(y, m - 2, 1);
      const endGuess = Date.UTC(y, m - 1, 1);
      return {
        start_date: startGuess - tzOffsetMs(new Date(startGuess)),
        end_date: endGuess - tzOffsetMs(new Date(endGuess)) - 1,
        label: "previous month",
      };
    }
  }
}

// ── Shapes documentados (campos que usamos) ────────────────────────────

export interface HotmartSale {
  product?: { name?: string; id?: number };
  buyer?: { name?: string; ucode?: string; email?: string };
  purchase?: {
    transaction?: string;
    order_date?: number;
    approved_date?: number;
    status?: string;
    is_subscription?: boolean;
    recurrency_number?: number;
    price?: { value?: number; currency_code?: string };
    payment?: { method?: string; type?: string; installments_number?: number };
    tracking?: { source_sck?: string; source?: string; external_code?: string };
    offer?: { code?: string; payment_mode?: string };
    warranty_expire_date?: number;
  };
}

export interface HotmartSubscription {
  subscriber_code?: string;
  subscription_id?: number;
  status?: string;
  accession_date?: number;
  date_next_charge?: number;
  trial?: boolean;
  transaction?: string;
  plan?: { name?: string; id?: number; recurrency_period?: number };
  product?: { id?: number; name?: string };
  price?: { value?: number; currency_code?: string };
  subscriber?: { name?: string; email?: string; ucode?: string };
}

// ── Kill switches (fases 29/30) ────────────────────────────────────────

function writesEnabled(): boolean {
  return process.env.HOTMART_WRITES_ENABLED === "true";
}
function bulkWritesEnabled(): boolean {
  return process.env.HOTMART_BULK_WRITES_ENABLED === "true";
}

export interface WriteOutcome<T = unknown> {
  operation_id: string;
  action: string;
  resource_id: string;
  /** preflight = aguardando confirmação; dry_run = validado sem executar. */
  result: "success" | "failed" | "unconfirmed" | "dry_run" | "preflight" | "blocked";
  previous_state?: string | null;
  new_state?: string | null;
  /** Resumo legível para o gate de confirmação. */
  summary?: Record<string, unknown>;
  detail?: string;
  data?: T;
}

export class HotmartService {
  readonly client: HotmartClient;
  constructor(client?: HotmartClient) {
    this.client = client ?? new HotmartClient();
  }

  // ═══════════════════════ READS ═══════════════════════

  async getSales(query: Record<string, string | number | undefined>, allPages = false) {
    if (allPages) {
      const items = await this.client.getAll<HotmartSale>("salesHistory", { query });
      return { items, page_info: { total_results: items.length } as PageInfo };
    }
    return this.client.call<{ items?: HotmartSale[]; page_info?: PageInfo }>("salesHistory", { query });
  }

  /** Uma venda pelo transaction code (ex.: HP17715690036014). */
  async getSale(transaction: string): Promise<HotmartSale | null> {
    const res = await this.client.call<{ items?: HotmartSale[] }>("salesHistory", {
      query: { transaction },
    });
    return res.items?.[0] ?? null;
  }

  async getSalesSummary(query: Record<string, string | number | undefined>) {
    return this.client.call("salesSummary", { query });
  }

  async getSalesParticipants(query: Record<string, string | number | undefined>) {
    return this.client.call("salesUsers", { query });
  }

  async getSalesCommissions(query: Record<string, string | number | undefined>) {
    return this.client.call("salesCommissions", { query });
  }

  async getSalesPriceDetails(query: Record<string, string | number | undefined>) {
    return this.client.call("salesPriceDetails", { query });
  }

  async getSubscriptions(query: Record<string, string | number | undefined>, allPages = false) {
    if (allPages) {
      const items = await this.client.getAll<HotmartSubscription>("subscriptions", { query });
      return { items, page_info: { total_results: items.length } as PageInfo };
    }
    return this.client.call<{ items?: HotmartSubscription[]; page_info?: PageInfo }>(
      "subscriptions",
      { query }
    );
  }

  async getSubscription(subscriberCode: string): Promise<HotmartSubscription | null> {
    const res = await this.client.call<{ items?: HotmartSubscription[] }>("subscriptions", {
      query: { subscriber_code: subscriberCode },
    });
    return res.items?.[0] ?? null;
  }

  async getSubscriptionPurchases(subscriberCode: string) {
    return this.client.call("subscriptionPurchases", {
      pathParams: { subscriber_code: subscriberCode },
    });
  }

  async getSubscriptionSummary(query: Record<string, string | number | undefined>) {
    return this.client.call("subscriptionSummary", { query });
  }

  async getProducts() {
    return this.client.call("products");
  }

  // ═══════════════════════ ANALYTICS ═══════════════════════

  /**
   * Receita por moeda no período (status APPROVED+COMPLETE, todas as páginas).
   * price.value = preço cheio da venda.
   */
  async revenueSummary(period: Period | { start_date: number; end_date: number; label?: string }) {
    const range = typeof period === "string" ? periodRange(period) : { label: "custom", ...period };
    const items = await this.client.getAll<HotmartSale>("salesHistory", {
      query: { start_date: range.start_date, end_date: range.end_date },
    });
    const byCurrency: Record<string, { count: number; gross: number }> = {};
    const byProduct: Record<string, { count: number; gross: number; currency: string }> = {};
    for (const s of items) {
      const cur = s.purchase?.price?.currency_code ?? "?";
      const val = s.purchase?.price?.value ?? 0;
      byCurrency[cur] ??= { count: 0, gross: 0 };
      byCurrency[cur].count++;
      byCurrency[cur].gross += val;
      const prod = s.product?.name ?? "?";
      byProduct[prod] ??= { count: 0, gross: 0, currency: cur };
      byProduct[prod].count++;
      byProduct[prod].gross += val;
    }
    const totalCount = items.length;
    const avgTicket: Record<string, number> = {};
    for (const [cur, v] of Object.entries(byCurrency)) {
      avgTicket[cur] = v.count ? Number((v.gross / v.count).toFixed(2)) : 0;
    }
    return {
      label: range.label ?? "custom",
      timezone: TZ(),
      start_date: range.start_date,
      end_date: range.end_date,
      total_sales: totalCount,
      by_currency: byCurrency,
      avg_ticket: avgTicket,
      by_product: byProduct,
    };
  }

  async comparePeriods(a: Period, b: Period) {
    const [pa, pb] = await Promise.all([this.revenueSummary(a), this.revenueSummary(b)]);
    const growth: Record<string, { count_pct: number | null; gross_pct: number | null }> = {};
    for (const cur of new Set([...Object.keys(pa.by_currency), ...Object.keys(pb.by_currency)])) {
      const ca = pa.by_currency[cur] ?? { count: 0, gross: 0 };
      const cb = pb.by_currency[cur] ?? { count: 0, gross: 0 };
      growth[cur] = {
        count_pct: cb.count ? Number((((ca.count - cb.count) / cb.count) * 100).toFixed(1)) : null,
        gross_pct: cb.gross ? Number((((ca.gross - cb.gross) / cb.gross) * 100).toFixed(1)) : null,
      };
    }
    return { period_a: pa, period_b: pb, growth_a_vs_b: growth };
  }

  /** Vendas com status de reembolso/chargeback no período. */
  async getRefunds(range: { start_date: number; end_date: number }) {
    const statuses = ["REFUNDED", "PARTIALLY_REFUNDED", "CHARGEBACK"] as const;
    const out: Record<string, HotmartSale[]> = {};
    for (const st of statuses) {
      out[st] = await this.client.getAll<HotmartSale>("salesHistory", {
        query: { ...range, transaction_status: st },
      });
    }
    return out;
  }

  async getCancelledSales(range: { start_date: number; end_date: number }) {
    return this.client.getAll<HotmartSale>("salesHistory", {
      query: { ...range, transaction_status: "CANCELLED" },
    });
  }

  // ═══════════════════════ WRITES ═══════════════════════

  /**
   * Reembolso de uma venda (PUT /sales/{transaction}/refund).
   * Constraints documentadas: status APPROVED/COMPLETE, não-trial, não
   * BACS/SEPA; janela de reembolso conforme política da oferta.
   */
  async refundSale(opts: {
    transaction: string;
    dry_run?: boolean;
    confirm?: boolean;
  }): Promise<WriteOutcome> {
    const operation_id = newOperationId();
    const action = "REFUND_SALE";
    const requested_at = new Date().toISOString();
    const base = { operation_id, action, resource_id: opts.transaction };

    // 1-6. READ + VALIDATE
    const sale = await this.getSale(opts.transaction);
    if (!sale) {
      return { ...base, result: "failed", detail: "HOTMART_RESOURCE_NOT_FOUND: transaction not found." };
    }
    const status = sale.purchase?.status ?? "?";
    const summary = {
      transaction: opts.transaction,
      product: sale.product?.name,
      amount: sale.purchase?.price?.value,
      currency: sale.purchase?.price?.currency_code,
      customer: maskEmail(sale.buyer?.email),
      current_status: status,
      payment_method: sale.purchase?.payment?.type,
      warranty_expire_date: sale.purchase?.warranty_expire_date
        ? new Date(sale.purchase.warranty_expire_date).toISOString()
        : null,
    };
    const eligible = status === "APPROVED" || status === "COMPLETE";
    if (!eligible) {
      journal({ ...base, requested_at, result: "failed", previous_state: status, detail: "not eligible" });
      return {
        ...base,
        result: "failed",
        previous_state: status,
        summary,
        detail: `HOTMART_INVALID_STATE: refund requires APPROVED/COMPLETE, sale is ${status}.`,
      };
    }
    const blockedMethod = ["BACS", "SEPA"].includes(sale.purchase?.payment?.type ?? "");
    if (blockedMethod) {
      return {
        ...base,
        result: "failed",
        previous_state: status,
        summary,
        detail: "HOTMART_INVALID_STATE: BACS/SEPA refunds must be requested by the buyer's bank.",
      };
    }

    if (opts.dry_run) {
      journal({ ...base, requested_at, result: "dry_run", previous_state: status });
      return { ...base, result: "dry_run", previous_state: status, summary, detail: "eligible=true, execution=false" };
    }
    if (!opts.confirm) {
      journal({ ...base, requested_at, result: "preflight", previous_state: status });
      return {
        ...base,
        result: "preflight",
        previous_state: status,
        summary,
        detail: "HIGH-RISK FINANCIAL ACTION. Waiting for confirmation — call again with confirm=true.",
      };
    }
    if (!writesEnabled()) {
      journal({ ...base, requested_at, result: "blocked", previous_state: status });
      return { ...base, result: "blocked", summary, detail: "HOTMART_WRITES_DISABLED (kill switch)." };
    }

    // 8. WRITE
    try {
      await this.client.call("refundSale", { pathParams: { transaction: opts.transaction } });
    } catch (e) {
      const code = e instanceof HotmartError ? e.code : "HOTMART_MUTATION_FAILED";
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: code === "HOTMART_MUTATION_UNCONFIRMED" ? "unconfirmed" : "failed", previous_state: status, detail: code });
      if (code === "HOTMART_MUTATION_UNCONFIRMED") {
        // timeout: estado desconhecido → verifica antes de reportar
        const after = await this.getSale(opts.transaction).catch(() => null);
        const newStatus = after?.purchase?.status ?? null;
        const refunded = newStatus === "REFUNDED" || newStatus === "PARTIALLY_REFUNDED";
        return {
          ...base,
          result: refunded ? "success" : "unconfirmed",
          previous_state: status,
          new_state: newStatus,
          summary,
          detail: refunded ? "Confirmed by read-after-timeout." : "State unknown — do NOT retry blindly; re-check the sale.",
        };
      }
      return { ...base, result: "failed", previous_state: status, summary, detail: `${code}: ${e instanceof Error ? e.message : ""}` };
    }

    // 9-10. READ-AFTER-WRITE (consistência eventual: até 3 leituras)
    let newStatus: string | null = null;
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      const after = await this.getSale(opts.transaction).catch(() => null);
      newStatus = after?.purchase?.status ?? null;
      if (newStatus && newStatus !== status) break;
    }
    const confirmed = newStatus === "REFUNDED" || newStatus === "PARTIALLY_REFUNDED";
    journal({
      ...base,
      requested_at,
      executed_at: new Date().toISOString(),
      result: confirmed ? "success" : "unconfirmed",
      previous_state: status,
      new_state: newStatus,
    });
    return {
      ...base,
      result: confirmed ? "success" : "unconfirmed",
      previous_state: status,
      new_state: newStatus,
      summary,
      detail: confirmed
        ? "Refund confirmed by read-after-write."
        : `HTTP accepted but status still ${newStatus ?? "unknown"} — Hotmart may take longer; re-check before any retry.`,
    };
  }

  /** Cancela UMA assinatura (POST /subscriptions/{code}/cancel, body send_mail). */
  async cancelSubscription(opts: {
    subscriber_code: string;
    send_mail?: boolean;
    dry_run?: boolean;
    confirm?: boolean;
  }): Promise<WriteOutcome> {
    const operation_id = newOperationId();
    const action = "CANCEL_SUBSCRIPTION";
    const requested_at = new Date().toISOString();
    const base = { operation_id, action, resource_id: opts.subscriber_code };

    const sub = await this.getSubscription(opts.subscriber_code);
    if (!sub) return { ...base, result: "failed", detail: "HOTMART_RESOURCE_NOT_FOUND: subscription not found." };
    const status = sub.status ?? "?";
    const summary = {
      subscriber_code: opts.subscriber_code,
      product: sub.product?.name,
      plan: sub.plan?.name,
      price: sub.price?.value,
      currency: sub.price?.currency_code,
      customer: maskEmail(sub.subscriber?.email),
      current_status: status,
      date_next_charge: sub.date_next_charge ? new Date(sub.date_next_charge).toISOString() : null,
      send_mail: opts.send_mail ?? true,
    };
    if (status !== "ACTIVE" && status !== "DELAYED" && status !== "STARTED") {
      return {
        ...base,
        result: "failed",
        previous_state: status,
        summary,
        detail: `HOTMART_INVALID_STATE: subscription is ${status} (SUBSCRIPTION_ALREADY_CANCELED_OR_OVERDUE).`,
      };
    }
    if (opts.dry_run) {
      journal({ ...base, requested_at, result: "dry_run", previous_state: status });
      return { ...base, result: "dry_run", previous_state: status, summary, detail: "eligible=true, execution=false" };
    }
    if (!opts.confirm) {
      journal({ ...base, requested_at, result: "preflight", previous_state: status });
      return { ...base, result: "preflight", previous_state: status, summary, detail: "HIGH-RISK ACTION. Waiting for confirmation — call again with confirm=true." };
    }
    if (!writesEnabled()) {
      journal({ ...base, requested_at, result: "blocked", previous_state: status });
      return { ...base, result: "blocked", summary, detail: "HOTMART_WRITES_DISABLED (kill switch)." };
    }

    try {
      await this.client.call("cancelSubscription", {
        pathParams: { subscriber_code: opts.subscriber_code },
        body: { send_mail: opts.send_mail ?? true },
      });
    } catch (e) {
      const code = e instanceof HotmartError ? e.code : "HOTMART_MUTATION_FAILED";
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "failed", previous_state: status, detail: code });
      return { ...base, result: "failed", previous_state: status, summary, detail: `${code}: ${e instanceof Error ? e.message : ""}` };
    }

    let newStatus: string | null = null;
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      const after = await this.getSubscription(opts.subscriber_code).catch(() => null);
      newStatus = after?.status ?? null;
      if (newStatus && newStatus !== status) break;
    }
    const confirmed = newStatus !== null && newStatus !== status;
    journal({
      ...base,
      requested_at,
      executed_at: new Date().toISOString(),
      result: confirmed ? "success" : "unconfirmed",
      previous_state: status,
      new_state: newStatus,
    });
    return {
      ...base,
      result: confirmed ? "success" : "unconfirmed",
      previous_state: status,
      new_state: newStatus,
      summary,
      detail: confirmed ? `Now ${newStatus}.` : "HTTP accepted but status unchanged on re-read — re-check before any retry.",
    };
  }

  /** Cancelamento em LOTE — exige lista explícita + kill switch de bulk. */
  async cancelSubscriptionList(opts: {
    subscriber_codes: string[];
    send_mail?: boolean;
    dry_run?: boolean;
    confirm?: boolean;
  }): Promise<WriteOutcome> {
    const operation_id = newOperationId();
    const action = "CANCEL_SUBSCRIPTION_LIST";
    const requested_at = new Date().toISOString();
    const codes = [...new Set(opts.subscriber_codes)].filter(Boolean);
    const base = { operation_id, action, resource_id: `bulk:${codes.length}` };

    if (!codes.length || codes.length > 100) {
      return { ...base, result: "failed", detail: "HOTMART_VALIDATION_ERROR: 1..100 subscriber codes required." };
    }

    // Resolve TODAS antes de qualquer ação (nunca "cancele todas").
    const resolved = await Promise.all(codes.map((c) => this.getSubscription(c).catch(() => null)));
    const rows = codes.map((code, i) => ({
      subscriber_code: code,
      found: Boolean(resolved[i]),
      status: resolved[i]?.status ?? null,
      product: resolved[i]?.product?.name ?? null,
      customer: maskEmail(resolved[i]?.subscriber?.email),
    }));
    const summary = { count: codes.length, subscriptions: rows };

    if (opts.dry_run) {
      journal({ ...base, requested_at, result: "dry_run" });
      return { ...base, result: "dry_run", summary, detail: "execution=false" };
    }
    if (!opts.confirm) {
      journal({ ...base, requested_at, result: "preflight" });
      return { ...base, result: "preflight", summary, detail: "BULK HIGH-RISK ACTION. Waiting for confirmation — call again with confirm=true." };
    }
    if (!writesEnabled()) return { ...base, result: "blocked", summary, detail: "HOTMART_WRITES_DISABLED (kill switch)." };
    if (!bulkWritesEnabled()) {
      journal({ ...base, requested_at, result: "blocked" });
      return { ...base, result: "blocked", summary, detail: "HOTMART_BULK_WRITES_DISABLED (bulk kill switch)." };
    }

    try {
      const res = await this.client.call("cancelSubscriptionList", {
        body: { subscriber_code: codes, send_mail: opts.send_mail ?? true },
      });
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "success" });
      return { ...base, result: "success", summary, data: res, detail: "Check fail_subscriptions in data for per-item failures." };
    } catch (e) {
      const code = e instanceof HotmartError ? e.code : "HOTMART_MUTATION_FAILED";
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "failed", detail: code });
      return { ...base, result: "failed", summary, detail: `${code}: ${e instanceof Error ? e.message : ""}` };
    }
  }

  /**
   * Reativação (POST /subscriptions/{code}/reactivate). Regra documentada:
   * o ASSINANTE precisa aceitar por e-mail (link válido 3 dias) — a chamada
   * DISPARA o pedido; nunca reativa na hora. charge=true é distinto e de
   * risco financeiro alto: só com confirmação própria.
   */
  async reactivateSubscription(opts: {
    subscriber_code: string;
    charge?: boolean;
    dry_run?: boolean;
    confirm?: boolean;
  }): Promise<WriteOutcome> {
    const operation_id = newOperationId();
    const action = opts.charge ? "REACTIVATE_AND_CHARGE" : "REACTIVATE_SUBSCRIPTION";
    const requested_at = new Date().toISOString();
    const base = { operation_id, action, resource_id: opts.subscriber_code };

    const sub = await this.getSubscription(opts.subscriber_code);
    if (!sub) return { ...base, result: "failed", detail: "HOTMART_RESOURCE_NOT_FOUND: subscription not found." };
    const status = sub.status ?? "?";
    const summary = {
      subscriber_code: opts.subscriber_code,
      product: sub.product?.name,
      customer: maskEmail(sub.subscriber?.email),
      current_status: status,
      charge: Boolean(opts.charge),
      note: "Subscriber must ACCEPT via emailed link (valid 3 days) before reactivation takes effect.",
    };
    if (status === "ACTIVE") {
      return { ...base, result: "failed", previous_state: status, summary, detail: "HOTMART_INVALID_STATE: SUBSCRIPTION_ALREADY_ACTIVE." };
    }
    if (opts.dry_run) {
      journal({ ...base, requested_at, result: "dry_run", previous_state: status });
      return { ...base, result: "dry_run", previous_state: status, summary, detail: "eligible, execution=false" };
    }
    if (!opts.confirm) {
      journal({ ...base, requested_at, result: "preflight", previous_state: status });
      return {
        ...base,
        result: "preflight",
        previous_state: status,
        summary,
        detail: `${opts.charge ? "HIGH-RISK FINANCIAL ACTION (reactivate AND charge)" : "Reactivation request"}. Waiting for confirmation — call again with confirm=true.`,
      };
    }
    if (!writesEnabled()) return { ...base, result: "blocked", summary, detail: "HOTMART_WRITES_DISABLED (kill switch)." };

    try {
      await this.client.call("reactivateSubscription", {
        pathParams: { subscriber_code: opts.subscriber_code },
        ...(opts.charge !== undefined ? { body: { charge: Boolean(opts.charge) } } : {}),
      });
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "success", previous_state: status, new_state: "REACTIVATION_REQUESTED" });
      return {
        ...base,
        result: "success",
        previous_state: status,
        new_state: "REACTIVATION_REQUESTED",
        summary,
        detail: "REACTIVATION_REQUESTED / CUSTOMER_CONFIRMATION_REQUIRED — the subscriber received an email (3-day link) and must accept.",
      };
    } catch (e) {
      const code = e instanceof HotmartError ? e.code : "HOTMART_MUTATION_FAILED";
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "failed", previous_state: status, detail: code });
      return { ...base, result: "failed", previous_state: status, summary, detail: `${code}: ${e instanceof Error ? e.message : ""}` };
    }
  }

  /** Reativação em LOTE — mesma regra de aceite do assinante; bulk kill switch. */
  async reactivateSubscriptionList(opts: {
    subscriber_codes: string[];
    charge?: boolean;
    dry_run?: boolean;
    confirm?: boolean;
  }): Promise<WriteOutcome> {
    const operation_id = newOperationId();
    const action = opts.charge ? "REACTIVATE_AND_CHARGE_LIST" : "REACTIVATE_SUBSCRIPTION_LIST";
    const requested_at = new Date().toISOString();
    const codes = [...new Set(opts.subscriber_codes)].filter(Boolean);
    const base = { operation_id, action, resource_id: `bulk:${codes.length}` };

    if (!codes.length || codes.length > 100) {
      return { ...base, result: "failed", detail: "HOTMART_VALIDATION_ERROR: 1..100 subscriber codes required." };
    }
    const resolved = await Promise.all(codes.map((c) => this.getSubscription(c).catch(() => null)));
    const rows = codes.map((code, i) => ({
      subscriber_code: code,
      found: Boolean(resolved[i]),
      status: resolved[i]?.status ?? null,
      product: resolved[i]?.product?.name ?? null,
      customer: maskEmail(resolved[i]?.subscriber?.email),
    }));
    const summary = {
      count: codes.length,
      charge: Boolean(opts.charge),
      subscriptions: rows,
      note: "Each subscriber must ACCEPT via emailed link (valid 3 days).",
    };

    if (opts.dry_run) {
      journal({ ...base, requested_at, result: "dry_run" });
      return { ...base, result: "dry_run", summary, detail: "execution=false" };
    }
    if (!opts.confirm) {
      journal({ ...base, requested_at, result: "preflight" });
      return { ...base, result: "preflight", summary, detail: `BULK ${opts.charge ? "HIGH-RISK FINANCIAL " : ""}ACTION. Waiting for confirmation — call again with confirm=true.` };
    }
    if (!writesEnabled()) return { ...base, result: "blocked", summary, detail: "HOTMART_WRITES_DISABLED (kill switch)." };
    if (!bulkWritesEnabled()) {
      journal({ ...base, requested_at, result: "blocked" });
      return { ...base, result: "blocked", summary, detail: "HOTMART_BULK_WRITES_DISABLED (bulk kill switch)." };
    }

    try {
      const res = await this.client.call("reactivateSubscriptionList", {
        body: { subscriber_code: codes, ...(opts.charge !== undefined ? { charge: Boolean(opts.charge) } : {}) },
      });
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "success", new_state: "REACTIVATION_REQUESTED" });
      return { ...base, result: "success", new_state: "REACTIVATION_REQUESTED", summary, data: res, detail: "REACTIVATION_REQUESTED for eligible items; check fail list in data." };
    } catch (e) {
      const code = e instanceof HotmartError ? e.code : "HOTMART_MUTATION_FAILED";
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "failed", detail: code });
      return { ...base, result: "failed", summary, detail: `${code}: ${e instanceof Error ? e.message : ""}` };
    }
  }

  /** Muda o dia de cobrança (PATCH /subscriptions/{code}, body due_day 1-31). */
  async changeDueDay(opts: {
    subscriber_code: string;
    due_day: number;
    dry_run?: boolean;
    confirm?: boolean;
  }): Promise<WriteOutcome> {
    const operation_id = newOperationId();
    const action = "CHANGE_DUE_DAY";
    const requested_at = new Date().toISOString();
    const base = { operation_id, action, resource_id: opts.subscriber_code };

    if (!Number.isInteger(opts.due_day) || opts.due_day < 1 || opts.due_day > 31) {
      return { ...base, result: "failed", detail: "HOTMART_VALIDATION_ERROR: due_day must be an integer 1..31." };
    }
    const sub = await this.getSubscription(opts.subscriber_code);
    if (!sub) return { ...base, result: "failed", detail: "HOTMART_RESOURCE_NOT_FOUND: subscription not found." };
    const status = sub.status ?? "?";
    const summary = {
      subscriber_code: opts.subscriber_code,
      product: sub.product?.name,
      customer: maskEmail(sub.subscriber?.email),
      current_status: status,
      trial: sub.trial,
      due_day: opts.due_day,
      date_next_charge: sub.date_next_charge ? new Date(sub.date_next_charge).toISOString() : null,
    };
    if (status !== "ACTIVE" && status !== "OVERDUE") {
      return { ...base, result: "failed", previous_state: status, summary, detail: `HOTMART_INVALID_STATE: only ACTIVE/OVERDUE (is ${status}).` };
    }
    if (sub.trial) {
      return { ...base, result: "failed", previous_state: status, summary, detail: "HOTMART_INVALID_STATE: subscription_in_trial_period." };
    }
    if (opts.dry_run) {
      journal({ ...base, requested_at, result: "dry_run", previous_state: status });
      return { ...base, result: "dry_run", previous_state: status, summary, detail: "eligible, execution=false" };
    }
    if (!opts.confirm) {
      // MEDIUM risk: mesmo assim informa o que fará antes de executar.
      journal({ ...base, requested_at, result: "preflight", previous_state: status });
      return { ...base, result: "preflight", previous_state: status, summary, detail: "Waiting for confirmation — call again with confirm=true." };
    }
    if (!writesEnabled()) return { ...base, result: "blocked", summary, detail: "HOTMART_WRITES_DISABLED (kill switch)." };

    try {
      await this.client.call("changeDueDay", {
        pathParams: { subscriber_code: opts.subscriber_code },
        body: { due_day: opts.due_day },
      });
    } catch (e) {
      const code = e instanceof HotmartError ? e.code : "HOTMART_MUTATION_FAILED";
      journal({ ...base, requested_at, executed_at: new Date().toISOString(), result: "failed", previous_state: status, detail: code });
      return { ...base, result: "failed", previous_state: status, summary, detail: `${code}: ${e instanceof Error ? e.message : ""}` };
    }

    const after = await this.getSubscription(opts.subscriber_code).catch(() => null);
    journal({
      ...base,
      requested_at,
      executed_at: new Date().toISOString(),
      result: "success",
      previous_state: status,
      new_state: after?.status ?? status,
    });
    return {
      ...base,
      result: "success",
      previous_state: status,
      new_state: after?.status ?? status,
      summary: {
        ...summary,
        new_date_next_charge: after?.date_next_charge ? new Date(after.date_next_charge).toISOString() : null,
      },
      detail: "Due day updated (applies after the next scheduled charge, per Hotmart docs).",
    };
  }
}
