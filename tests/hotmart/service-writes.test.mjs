// Testes da coreografia de WRITES do HotmartService — client falso, zero
// chamadas reais. Cobrem: preflight sem confirm, dry_run, kill switches,
// estado inválido, read-after-write e refund duplicado.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { HotmartService } from "../../src/lib/hotmart/service";

function fakeClient(state) {
  return {
    isWrite: () => true,
    async call(op, opts) {
      state.calls.push({ op, opts });
      if (op === "salesHistory") {
        return { items: state.sale ? [state.sale] : [] };
      }
      if (op === "subscriptions") {
        return { items: state.sub ? [state.sub] : [] };
      }
      if (op === "refundSale") {
        if (state.refundFails) throw Object.assign(new Error("nope"), { code: "HOTMART_VALIDATION_ERROR" });
        state.sale.purchase.status = "REFUNDED";
        return undefined;
      }
      if (op === "cancelSubscription") {
        state.sub.status = "CANCELLED_BY_SELLER";
        return undefined;
      }
      if (op === "changeDueDay") return undefined;
      if (op === "reactivateSubscription") return undefined;
      return {};
    },
    async getAll() {
      return [];
    },
  };
}

let state;
beforeEach(() => {
  state = {
    calls: [],
    sale: {
      product: { name: "Pack" },
      buyer: { email: "buyer@x.com" },
      purchase: { transaction: "HP1", status: "APPROVED", price: { value: 9.99, currency_code: "USD" }, payment: { type: "CREDIT_CARD" } },
    },
    sub: {
      subscriber_code: "SUB1",
      status: "ACTIVE",
      trial: false,
      product: { name: "Premium" },
      subscriber: { email: "s@x.com" },
      price: { value: 29.9, currency_code: "USD" },
    },
  };
  delete process.env.HOTMART_WRITES_ENABLED;
  delete process.env.HOTMART_BULK_WRITES_ENABLED;
});

const svc = () => new HotmartService(fakeClient(state));

test("refund sem confirm → preflight, nenhuma mutação", async () => {
  const out = await svc().refundSale({ transaction: "HP1" });
  assert.equal(out.result, "preflight");
  assert.ok(!state.calls.some((c) => c.op === "refundSale"));
  assert.equal(out.summary.customer, "bu***@x.com", "email mascarado no preflight");
});

test("refund dry_run → valida e não executa", async () => {
  const out = await svc().refundSale({ transaction: "HP1", dry_run: true });
  assert.equal(out.result, "dry_run");
  assert.ok(!state.calls.some((c) => c.op === "refundSale"));
});

test("refund confirmado SEM kill switch → blocked", async () => {
  const out = await svc().refundSale({ transaction: "HP1", confirm: true });
  assert.equal(out.result, "blocked");
  assert.match(out.detail, /HOTMART_WRITES_DISABLED/);
  assert.ok(!state.calls.some((c) => c.op === "refundSale"));
});

test("refund confirmado COM switch → executa e verifica (read-after-write)", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  const out = await svc().refundSale({ transaction: "HP1", confirm: true });
  assert.equal(out.result, "success");
  assert.equal(out.new_state, "REFUNDED");
});

test("refund de venda já REFUNDED → INVALID_STATE (idempotência)", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  state.sale.purchase.status = "REFUNDED";
  const out = await svc().refundSale({ transaction: "HP1", confirm: true });
  assert.equal(out.result, "failed");
  assert.match(out.detail, /HOTMART_INVALID_STATE/);
});

test("refund de transação inexistente → RESOURCE_NOT_FOUND", async () => {
  state.sale = null;
  const out = await svc().refundSale({ transaction: "HPX", confirm: true });
  assert.equal(out.result, "failed");
  assert.match(out.detail, /HOTMART_RESOURCE_NOT_FOUND/);
});

test("cancel de assinatura já cancelada → INVALID_STATE", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  state.sub.status = "CANCELLED_BY_CUSTOMER";
  const out = await svc().cancelSubscription({ subscriber_code: "SUB1", confirm: true });
  assert.equal(out.result, "failed");
  assert.match(out.detail, /HOTMART_INVALID_STATE/);
});

test("cancel confirmado → success com novo estado", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  const out = await svc().cancelSubscription({ subscriber_code: "SUB1", confirm: true });
  assert.equal(out.result, "success");
  assert.equal(out.new_state, "CANCELLED_BY_SELLER");
});

test("bulk cancel exige o SEGUNDO kill switch", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  const out = await svc().cancelSubscriptionList({ subscriber_codes: ["SUB1"], confirm: true });
  assert.equal(out.result, "blocked");
  assert.match(out.detail, /HOTMART_BULK_WRITES_DISABLED/);
});

test("reactivate nunca vira 'feito': REACTIVATION_REQUESTED", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  state.sub.status = "INACTIVE";
  const out = await svc().reactivateSubscription({ subscriber_code: "SUB1", confirm: true });
  assert.equal(out.result, "success");
  assert.equal(out.new_state, "REACTIVATION_REQUESTED");
  assert.match(out.detail, /CUSTOMER_CONFIRMATION_REQUIRED/);
});

test("reactivate de assinatura ATIVA falha", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  const out = await svc().reactivateSubscription({ subscriber_code: "SUB1", confirm: true });
  assert.equal(out.result, "failed");
  assert.match(out.detail, /ALREADY_ACTIVE/);
});

test("change due day valida 1..31 localmente", async () => {
  const out = await svc().changeDueDay({ subscriber_code: "SUB1", due_day: 32, confirm: true });
  assert.equal(out.result, "failed");
  assert.match(out.detail, /1\.\.31/);
});

test("change due day em trial falha com estado documentado", async () => {
  process.env.HOTMART_WRITES_ENABLED = "true";
  state.sub.trial = true;
  const out = await svc().changeDueDay({ subscriber_code: "SUB1", due_day: 15, confirm: true });
  assert.equal(out.result, "failed");
  assert.match(out.detail, /trial/);
});
