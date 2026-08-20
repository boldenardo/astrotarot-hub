// Testes do HotmartTokenManager — rodam com `npm run test:hotmart`
// (node --test; sem framework novo). fetch é mockado: nenhum teste toca a
// API real da Hotmart.

import { test } from "node:test";
import assert from "node:assert/strict";

// Módulos TS importados extensionless (mesmo specifier que o código usa):
// o runner é `tsx --test`. Misturar "./errors" e "./errors.ts" criaria DUAS
// instâncias do módulo e o instanceof entre elas falharia.
import { HotmartTokenManager } from "../../src/lib/hotmart/token-manager";

function okTokenResponse(token = "tok_" + Math.random().toString(36).slice(2), expiresIn = 3600) {
  return new Response(JSON.stringify({ access_token: token, expires_in: expiresIn }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("auth header usa o token e cacheia entre chamadas", async () => {
  let calls = 0;
  const mgr = new HotmartTokenManager("id", "secret", async () => {
    calls++;
    return okTokenResponse("tok_abc");
  });
  const h1 = await mgr.authHeader();
  const h2 = await mgr.authHeader();
  assert.equal(h1, "Bearer tok_abc");
  assert.equal(h2, "Bearer tok_abc");
  assert.equal(calls, 1, "segunda chamada deve vir do cache");
});

test("refreshes concorrentes compartilham UMA request (lock)", async () => {
  let calls = 0;
  const mgr = new HotmartTokenManager("id", "secret", async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 30));
    return okTokenResponse();
  });
  await Promise.all([mgr.authHeader(), mgr.authHeader(), mgr.authHeader()]);
  assert.equal(calls, 1);
});

test("token expirado renova sozinho", async () => {
  let calls = 0;
  const mgr = new HotmartTokenManager("id", "secret", async () => {
    calls++;
    // expires_in menor que a folga de 5min => expira imediatamente
    return okTokenResponse("tok_" + calls, 1);
  });
  await mgr.authHeader();
  const h2 = await mgr.authHeader();
  assert.equal(calls, 2);
  assert.equal(h2, "Bearer tok_2");
});

test("invalidate() derruba o cache (caminho do retry pós-401)", async () => {
  let calls = 0;
  const mgr = new HotmartTokenManager("id", "secret", async () => {
    calls++;
    return okTokenResponse("tok_" + calls);
  });
  await mgr.authHeader();
  mgr.invalidate();
  const h = await mgr.authHeader();
  assert.equal(calls, 2);
  assert.equal(h, "Bearer tok_2");
});

test("credencial inválida vira HOTMART_AUTH_FAILED sem vazar body", async () => {
  const mgr = new HotmartTokenManager("id", "bad", async () =>
    new Response(JSON.stringify({ error: "invalid_client", secret_echo: "X" }), { status: 401 })
  );
  await assert.rejects(
    () => mgr.authHeader(),
    (e) => {
      assert.equal(e.name, "HotmartError");
      assert.equal(e.code, "HOTMART_AUTH_FAILED");
      assert.ok(!JSON.stringify(e.detail ?? "").includes("secret_echo"), "body cru não propaga");
      return true;
    }
  );
});

test("sem credenciais configuradas falha explícito", async () => {
  const mgr = new HotmartTokenManager("", "", async () => okTokenResponse());
  await assert.rejects(
    () => mgr.authHeader(),
    (e) => e.name === "HotmartError" && e.code === "HOTMART_AUTH_FAILED"
  );
});
