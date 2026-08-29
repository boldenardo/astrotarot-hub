// Testes do HotmartClient — fetch mockado; nenhuma chamada real.
import { test } from "node:test";
import assert from "node:assert/strict";

import { HotmartClient } from "../../src/lib/hotmart/client";
import { HotmartTokenManager } from "../../src/lib/hotmart/token-manager";

function tokenMgr() {
  return new HotmartTokenManager("id", "sec", async () =>
    new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 })
  );
}

function jsonRes(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

test("operação fora da allowlist é recusada", async () => {
  const c = new HotmartClient({ tokenManager: tokenMgr(), fetchImpl: async () => jsonRes({}) });
  await assert.rejects(
    () => c.call("createProduct"),
    (e) => e.code === "HOTMART_OPERATION_UNAVAILABLE" || e.code === "HOTMART_VALIDATION_ERROR" || e instanceof Error
  );
});

test("query params entram na URL; host é fixo (anti-SSRF)", async () => {
  let seen;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async (url) => {
      seen = new URL(String(url instanceof URL ? url : url));
      return jsonRes({ items: [] });
    },
  });
  await c.call("salesHistory", { query: { transaction: "HP1", max_results: 10 } });
  assert.equal(seen.origin, "https://developers.hotmart.com");
  assert.equal(seen.pathname, "/payments/api/v1/sales/history");
  assert.equal(seen.searchParams.get("transaction"), "HP1");
});

test("path param é substituído e URL-encoded", async () => {
  let seen;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async (url, init) => {
      seen = { url: String(url), method: init?.method };
      return new Response("", { status: 200 });
    },
  });
  await c.call("refundSale", { pathParams: { transaction: "HP 1/2" } });
  assert.ok(seen.url.endsWith("/payments/api/v1/sales/HP%201%2F2/refund"));
  assert.equal(seen.method, "PUT");
});

test("path param faltando falha com VALIDATION antes de qualquer HTTP", async () => {
  let called = false;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async () => {
      called = true;
      return jsonRes({});
    },
  });
  await assert.rejects(
    () => c.call("refundSale"),
    (e) => e.code === "HOTMART_VALIDATION_ERROR"
  );
  assert.equal(called, false);
});

test("429 espera RateLimit-Reset e completa na tentativa seguinte", async () => {
  let n = 0;
  const t0 = Date.now();
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async () => {
      n++;
      if (n === 1) return jsonRes({}, 429, { "RateLimit-Reset": "1" });
      return jsonRes({ items: [{ ok: true }] });
    },
  });
  const res = await c.call("salesHistory");
  assert.equal(n, 2);
  assert.ok(Date.now() - t0 >= 900, "esperou o reset");
  assert.equal(res.items[0].ok, true);
});

test("401 renova token UMA vez e repete", async () => {
  let n = 0;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async () => {
      n++;
      if (n === 1) return jsonRes({ error: "expired" }, 401);
      return jsonRes({ items: [] });
    },
  });
  await c.call("salesHistory");
  assert.equal(n, 2);
});

test("timeout em WRITE nunca repete às cegas — vira MUTATION_UNCONFIRMED", async () => {
  let n = 0;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async () => {
      n++;
      throw Object.assign(new Error("boom"), { name: "TimeoutError" });
    },
  });
  await assert.rejects(
    () => c.call("refundSale", { pathParams: { transaction: "HP1" } }),
    (e) => e.code === "HOTMART_MUTATION_UNCONFIRMED"
  );
  assert.equal(n, 1, "write não é repetido");
});

test("erro de rede em READ tem retry", async () => {
  let n = 0;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async () => {
      n++;
      if (n < 3) throw new Error("net");
      return jsonRes({ items: [] });
    },
  });
  await c.call("salesHistory");
  assert.equal(n, 3);
});

test("getAll percorre todas as páginas via next_page_token", async () => {
  let n = 0;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    fetchImpl: async (url) => {
      n++;
      const u = new URL(String(url));
      const tok = u.searchParams.get("page_token");
      if (!tok) return jsonRes({ items: [1, 2], page_info: { next_page_token: "p2" } });
      if (tok === "p2") return jsonRes({ items: [3], page_info: { next_page_token: "p3" } });
      return jsonRes({ items: [4], page_info: {} });
    },
  });
  const items = await c.getAll("salesHistory");
  assert.deepEqual(items, [1, 2, 3, 4]);
  assert.equal(n, 3);
});

test("404 vira HOTMART_RESOURCE_NOT_FOUND; 403 vira PERMISSION_DENIED", async () => {
  const mk = (status) =>
    new HotmartClient({ tokenManager: tokenMgr(), fetchImpl: async () => jsonRes({}, status) });
  await assert.rejects(() => mk(404).call("salesHistory"), (e) => e.code === "HOTMART_RESOURCE_NOT_FOUND");
  await assert.rejects(() => mk(403).call("salesHistory"), (e) => e.code === "HOTMART_PERMISSION_DENIED");
});

test("sandbox env muda a base para sandbox.hotmart.com", async () => {
  let seen;
  const c = new HotmartClient({
    tokenManager: tokenMgr(),
    env: "sandbox",
    fetchImpl: async (url) => {
      seen = new URL(String(url));
      return jsonRes({ items: [] });
    },
  });
  await c.call("salesHistory");
  assert.equal(seen.origin, "https://sandbox.hotmart.com");
});
