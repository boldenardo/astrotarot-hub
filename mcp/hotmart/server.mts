// Hotmart MCP Server — provider financeiro operacional do Claude.
//
// Transport: stdio (registrado em .mcp.json na raiz do projeto; roda via
// tsx para importar o client/service TS únicos do projeto — NENHUMA request
// HTTP vive aqui: tudo passa pelo HotmartClient allowlistado).
//
// Camadas: Read tools (execução direta) · Analytics tools · Write tools
// (preflight → confirmação → execução → read-after-write) · kill switches
// (HOTMART_WRITES_ENABLED / HOTMART_BULK_WRITES_ENABLED) · journal local.
//
// PII: por padrão e-mails saem MASCARADOS (jo***@gmail.com). reveal_pii=true
// existe para quando identificar o comprador for necessário à tarefa.
// O token OAuth nunca aparece em resposta de tool.

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// .env da raiz do projeto, independente do cwd com que o host nos spawnou.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadEnv({ path: join(ROOT, ".env") });

import { HotmartService, periodRange, type Period } from "../../src/lib/hotmart/service";
import { PROVIDER_CAPABILITIES } from "../../src/lib/payments/provider";
import { maskEmail } from "../../src/lib/hotmart/journal";
import { HotmartError } from "../../src/lib/hotmart/errors";

const service = new HotmartService();

const PERIODS = ["today", "yesterday", "last_24h", "last_7d", "this_month", "prev_month"] as const;
const periodSchema = z.enum(PERIODS).describe("Named period in the configured timezone (HOTMART_TZ)");

/** Mascara e-mails recursivamente, a menos que reveal_pii=true. */
function maskDeep(value: unknown, reveal: boolean): unknown {
  if (reveal) return value;
  if (Array.isArray(value)) return value.map((v) => maskDeep(v, reveal));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "email" && typeof v === "string") out[k] = maskEmail(v);
      else out[k] = maskDeep(v, reveal);
    }
    return out;
  }
  return value;
}

function ok(data: unknown, reveal = false) {
  return { content: [{ type: "text" as const, text: JSON.stringify(maskDeep(data, reveal), null, 1) }] };
}

function fail(e: unknown) {
  const code = e instanceof HotmartError ? e.code : "HOTMART_API_ERROR";
  const message = e instanceof Error ? e.message : String(e);
  return {
    isError: true,
    content: [{ type: "text" as const, text: JSON.stringify({ error: code, message }) }],
  };
}

/** Range a partir de period nomeado OU start/end explícitos (epoch ms). */
function rangeOf(args: { period?: Period; start_date?: number; end_date?: number }) {
  if (args.period) {
    const r = periodRange(args.period);
    return { start_date: r.start_date, end_date: r.end_date };
  }
  return {
    start_date: args.start_date ?? periodRange("last_7d").start_date,
    end_date: args.end_date ?? Date.now(),
  };
}

const server = new McpServer({ name: "hotmart", version: "1.0.0" });

/* ═══════════════════ READ TOOLS (execução direta) ═══════════════════ */

server.tool(
  "hotmart_get_sales",
  "List sales (Payments API /sales/history). Default status filter on Hotmart's side is APPROVED+COMPLETE. Paginates fully when all_pages=true.",
  {
    period: periodSchema.optional(),
    start_date: z.number().optional().describe("epoch ms UTC"),
    end_date: z.number().optional(),
    transaction_status: z
      .enum(["APPROVED", "BLOCKED", "CANCELLED", "CHARGEBACK", "COMPLETE", "EXPIRED", "NO_FUNDS", "OVERDUE", "PARTIALLY_REFUNDED", "PRE_ORDER", "PRINTED_BILLET", "PROCESSING_TRANSACTION", "PROTESTED", "REFUNDED", "STARTED", "UNDER_ANALISYS", "WAITING_PAYMENT"])
      .optional(),
    buyer_email: z.string().optional(),
    transaction: z.string().optional(),
    product_id: z.number().optional(),
    offer_code: z.string().optional(),
    sales_source: z.string().optional(),
    max_results: z.number().max(500).optional(),
    page_token: z.string().optional(),
    all_pages: z.boolean().optional(),
    reveal_pii: z.boolean().optional(),
  },
  async ({ all_pages, reveal_pii, period, start_date, end_date, ...rest }) => {
    try {
      const range = period || start_date || end_date ? rangeOf({ period, start_date, end_date }) : {};
      return ok(await service.getSales({ ...range, ...rest }, Boolean(all_pages)), Boolean(reveal_pii));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_sale",
  "Get ONE sale by its transaction code (e.g. HP17715690036014).",
  { transaction: z.string(), reveal_pii: z.boolean().optional() },
  async ({ transaction, reveal_pii }) => {
    try {
      const sale = await service.getSale(transaction);
      return sale ? ok(sale, Boolean(reveal_pii)) : fail(new HotmartError("HOTMART_RESOURCE_NOT_FOUND", `No sale ${transaction}.`));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_sales_summary",
  "Commission totals per currency (Payments API /sales/summary).",
  {
    period: periodSchema.optional(),
    start_date: z.number().optional(),
    end_date: z.number().optional(),
    transaction_status: z.string().optional(),
    product_id: z.number().optional(),
  },
  async ({ period, start_date, end_date, ...rest }) => {
    try {
      const range = period || start_date || end_date ? rangeOf({ period, start_date, end_date }) : {};
      return ok(await service.getSalesSummary({ ...range, ...rest }));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_sales_participants",
  "Participants (buyer/producer/affiliate) of sales — heavy PII (address, documents). Returns MASKED unless reveal_pii=true.",
  {
    transaction: z.string().optional(),
    buyer_email: z.string().optional(),
    period: periodSchema.optional(),
    start_date: z.number().optional(),
    end_date: z.number().optional(),
    reveal_pii: z.boolean().optional(),
  },
  async ({ period, start_date, end_date, reveal_pii, ...rest }) => {
    try {
      const range = period || start_date || end_date ? rangeOf({ period, start_date, end_date }) : {};
      return ok(await service.getSalesParticipants({ ...range, ...rest }), Boolean(reveal_pii));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_sales_commissions",
  "Commission breakdown per sale (Payments API /sales/commissions).",
  { transaction: z.string().optional(), period: periodSchema.optional(), start_date: z.number().optional(), end_date: z.number().optional() },
  async ({ period, start_date, end_date, ...rest }) => {
    try {
      const range = period || start_date || end_date ? rangeOf({ period, start_date, end_date }) : {};
      return ok(await service.getSalesCommissions({ ...range, ...rest }));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_sales_price_details",
  "Price breakdown (base, fees, taxes) per sale (Payments API /sales/price/details).",
  { transaction: z.string().optional(), period: periodSchema.optional(), start_date: z.number().optional(), end_date: z.number().optional() },
  async ({ period, start_date, end_date, ...rest }) => {
    try {
      const range = period || start_date || end_date ? rangeOf({ period, start_date, end_date }) : {};
      return ok(await service.getSalesPriceDetails({ ...range, ...rest }));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_subscriptions",
  "List subscriptions (real-time). Filter by status, email, code. all_pages=true paginates fully.",
  {
    status: z
      .enum(["ACTIVE", "INACTIVE", "DELAYED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_SELLER", "CANCELLED_BY_ADMIN", "STARTED", "OVERDUE"])
      .optional(),
    subscriber_email: z.string().optional(),
    subscriber_code: z.string().optional(),
    product_id: z.number().optional(),
    trial: z.boolean().optional(),
    max_results: z.number().max(500).optional(),
    page_token: z.string().optional(),
    all_pages: z.boolean().optional(),
    reveal_pii: z.boolean().optional(),
  },
  async ({ all_pages, reveal_pii, trial, ...rest }) => {
    try {
      return ok(
        await service.getSubscriptions(
          { ...rest, ...(trial !== undefined ? { trial: String(trial) } : {}) },
          Boolean(all_pages)
        ),
        Boolean(reveal_pii)
      );
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_subscription",
  "Get ONE subscription by subscriber_code.",
  { subscriber_code: z.string(), reveal_pii: z.boolean().optional() },
  async ({ subscriber_code, reveal_pii }) => {
    try {
      const sub = await service.getSubscription(subscriber_code);
      return sub ? ok(sub, Boolean(reveal_pii)) : fail(new HotmartError("HOTMART_RESOURCE_NOT_FOUND", `No subscription ${subscriber_code}.`));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_subscription_purchases",
  "Recurrence payments of ONE subscription (includes under_warranty flag per purchase).",
  { subscriber_code: z.string(), reveal_pii: z.boolean().optional() },
  async ({ subscriber_code, reveal_pii }) => {
    try {
      return ok(await service.getSubscriptionPurchases(subscriber_code), Boolean(reveal_pii));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_subscription_summary",
  "Subscription summary incl. unpaid recurrences (data may lag up to 24h — use hotmart_get_subscriptions for real-time).",
  { subscriber_code: z.string().optional(), product_id: z.number().optional(), max_results: z.number().optional(), page_token: z.string().optional(), reveal_pii: z.boolean().optional() },
  async ({ reveal_pii, ...rest }) => {
    try {
      return ok(await service.getSubscriptionSummary(rest), Boolean(reveal_pii));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool("hotmart_get_products", "List products of this account (Products API).", {}, async () => {
  try {
    return ok(await service.getProducts());
  } catch (e) {
    return fail(e);
  }
});

server.tool(
  "hotmart_get_refunds",
  "Sales with REFUNDED / PARTIALLY_REFUNDED / CHARGEBACK status in a period.",
  { period: periodSchema.optional(), start_date: z.number().optional(), end_date: z.number().optional(), reveal_pii: z.boolean().optional() },
  async ({ reveal_pii, ...args }) => {
    try {
      return ok(await service.getRefunds(rangeOf(args)), Boolean(reveal_pii));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_get_cancelled_sales",
  "Sales with CANCELLED status in a period.",
  { period: periodSchema.optional(), start_date: z.number().optional(), end_date: z.number().optional(), reveal_pii: z.boolean().optional() },
  async ({ reveal_pii, ...args }) => {
    try {
      return ok(await service.getCancelledSales(rangeOf(args)), Boolean(reveal_pii));
    } catch (e) {
      return fail(e);
    }
  }
);

/* ═══════════════════ ANALYTICS TOOLS ═══════════════════ */

server.tool(
  "hotmart_revenue_summary",
  "Revenue aggregation for a period: totals, by currency, avg ticket, by product. Full pagination, timezone-aware (HOTMART_TZ).",
  { period: periodSchema.optional(), start_date: z.number().optional(), end_date: z.number().optional() },
  async (args) => {
    try {
      return ok(await service.revenueSummary(args.period ?? rangeOf(args)));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_compare_periods",
  "Compare revenue between two named periods (growth % per currency). Ex: a=today, b=yesterday.",
  { a: periodSchema, b: periodSchema },
  async ({ a, b }) => {
    try {
      return ok(await service.comparePeriods(a, b));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_product_performance",
  "Sales count and gross per product for a period.",
  { period: periodSchema.optional(), start_date: z.number().optional(), end_date: z.number().optional() },
  async (args) => {
    try {
      const summary = await service.revenueSummary(args.period ?? rangeOf(args));
      return ok({ label: summary.label, by_product: summary.by_product, total_sales: summary.total_sales });
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool("hotmart_capabilities", "Capability matrix of the active provider (and Stripe, preserved but disabled).", {}, async () =>
  ok({
    active_provider: "hotmart",
    env: process.env.HOTMART_ENV === "sandbox" ? "sandbox" : "production",
    writes_enabled: process.env.HOTMART_WRITES_ENABLED === "true",
    bulk_writes_enabled: process.env.HOTMART_BULK_WRITES_ENABLED === "true",
    capabilities: PROVIDER_CAPABILITIES,
  })
);

/* ═══════ WRITE TOOLS (preflight → confirm → execute → verify) ═══════
   Sem confirm=true a tool devolve o PRE-FLIGHT e aguarda; dry_run=true
   valida sem executar. Kill switches aplicam por cima de tudo.           */

server.tool(
  "hotmart_refund_sale",
  "HIGH RISK — refund a sale (PUT /sales/{transaction}/refund). Without confirm=true returns a PRE-FLIGHT summary and waits. dry_run=true validates only. Requires HOTMART_WRITES_ENABLED=true.",
  { transaction: z.string(), dry_run: z.boolean().optional(), confirm: z.boolean().optional() },
  async (args) => {
    try {
      return ok(await service.refundSale(args));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_cancel_subscription",
  "HIGH RISK — cancel ONE subscription (POST /subscriptions/{code}/cancel). send_mail defaults true. Preflight without confirm=true.",
  { subscriber_code: z.string(), send_mail: z.boolean().optional(), dry_run: z.boolean().optional(), confirm: z.boolean().optional() },
  async (args) => {
    try {
      return ok(await service.cancelSubscription(args));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_cancel_subscriptions",
  "BULK HIGH RISK — cancel a LIST of subscriptions. Requires explicit subscriber_codes (never 'all'), confirm=true AND both kill switches (HOTMART_WRITES_ENABLED + HOTMART_BULK_WRITES_ENABLED).",
  { subscriber_codes: z.array(z.string()).min(1).max(100), send_mail: z.boolean().optional(), dry_run: z.boolean().optional(), confirm: z.boolean().optional() },
  async (args) => {
    try {
      return ok(await service.cancelSubscriptionList(args));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_reactivate_subscription",
  "Reactivate ONE INACTIVE subscription. Hotmart emails the subscriber a 3-day acceptance link — result is REACTIVATION_REQUESTED / CUSTOMER_CONFIRMATION_REQUIRED, never instant. charge=true is a HIGH-RISK FINANCIAL variant (distinct confirmation).",
  { subscriber_code: z.string(), charge: z.boolean().optional(), dry_run: z.boolean().optional(), confirm: z.boolean().optional() },
  async (args) => {
    try {
      return ok(await service.reactivateSubscription(args));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_reactivate_subscriptions",
  "BULK reactivation request (same subscriber-acceptance rule). Requires confirm=true and BOTH kill switches.",
  { subscriber_codes: z.array(z.string()).min(1).max(100), charge: z.boolean().optional(), dry_run: z.boolean().optional(), confirm: z.boolean().optional() },
  async (args) => {
    try {
      return ok(await service.reactivateSubscriptionList(args));
    } catch (e) {
      return fail(e);
    }
  }
);

server.tool(
  "hotmart_change_subscription_due_day",
  "MEDIUM RISK — change billing day (PATCH /subscriptions/{code}, due_day 1..31). Only ACTIVE/OVERDUE, never in trial. Preflight without confirm=true.",
  { subscriber_code: z.string(), due_day: z.number().int().min(1).max(31), dry_run: z.boolean().optional(), confirm: z.boolean().optional() },
  async (args) => {
    try {
      return ok(await service.changeDueDay(args));
    } catch (e) {
      return fail(e);
    }
  }
);

await server.connect(new StdioServerTransport());
console.error("[hotmart-mcp] ready (env=" + (process.env.HOTMART_ENV ?? "production") + ", writes=" + (process.env.HOTMART_WRITES_ENABLED === "true") + ")");
