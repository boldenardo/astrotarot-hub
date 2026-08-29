// Ofertas do funil no produto AstroTarot.
//
// ⚠️ A CRIAÇÃO POR API NÃO EXISTE. Verificado empiricamente em 29/08, não
// suposto: o GET de /products/api/v1/products/{ucode}/offers responde 200,
// e POST/PUT na MESMA url — e em mais quatro variantes — respondem 404
// "not_found". A sondagem usou corpo vazio de propósito, para um endpoint
// que existisse recusar por validação em vez de criar lixo na conta.
//
// (Páginas de terceiros afirmam que a Products API "cria ofertas". Não
// cria. Só o painel cria.)
//
// O que este script AINDA serve para: listar as ofertas existentes com
// seus códigos, que é o que o webhook precisa para mapear cada compra ao
// direito certo. Rode sem argumento para ver.
//
// Feito por API e não pelo painel a pedido do dono: cinco formulários numa
// SPA que parou de renderizar no meio da sessão é como se deixa uma oferta
// pela metade — e oferta pela metade cobra o valor errado de alguém.
//
// USO:
//   node scripts/hotmart-create-offers.mjs            # só mostra o que faria
//   node scripts/hotmart-create-offers.mjs --confirm  # cria de verdade
//
// Precisa de HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET no .env
// (painel > Ferramentas > Credenciais / Hotmart Developers).

import fs from "fs";

const env = {};
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
}

const CLIENT_ID = env.HOTMART_CLIENT_ID;
const CLIENT_SECRET = env.HOTMART_CLIENT_SECRET;
// O endpoint de ofertas quer o UCODE, não o id numérico — com o id ele
// devolve 500 "não foi possível obter as ofertas", que parece erro do
// servidor e é só o identificador errado.
const UCODE = env.HOTMART_PRODUCT_UCODE || "669b1fca-03df-423b-ba8f-0758060d04af";
const CONFIRM = process.argv.includes("--confirm");

// As cinco ofertas que faltam. Preços iguais aos que o funil já anuncia —
// mudar aqui sem mudar src/lib/pricing.ts faria a página prometer um valor
// e o checkout cobrar outro.
const OFFERS = [
  { key: "DOWNSELL", name: "Downsell", price: 9.99 },
  { key: "PORTRAIT", name: "Portrait", price: 9.0 },
  { key: "CORD", name: "Cord Reading", price: 9.0 },
  { key: "VIBES", name: "Vibes & Meditations", price: 9.0 },
  { key: "OTO", name: "Past Life Connection", price: 27.0 },
];

async function token() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const url =
    "https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials" +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&client_secret=${encodeURIComponent(CLIENT_SECRET)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`token ${r.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body).access_token;
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(
      "FALTA CREDENCIAL. Adicione ao .env:\n" +
        "  HOTMART_CLIENT_ID=...\n  HOTMART_CLIENT_SECRET=...\n" +
        "(painel > Ferramentas > Credenciais / Hotmart Developers)"
    );
    process.exit(1);
  }

  const tk = await token();
  console.log("autenticado. produto:", UCODE);

  // O que já existe — para nunca criar oferta duplicada.
  const listUrl = `https://developers.hotmart.com/products/api/v1/products/${UCODE}/offers`;
  const cur = await fetch(listUrl, { headers: { Authorization: `Bearer ${tk}` } });
  const curBody = await cur.text();
  console.log(`GET offers -> ${cur.status}`);
  let existing = [];
  if (cur.ok) {
    try {
      const j = JSON.parse(curBody);
      existing = j.items ?? j.offers ?? (Array.isArray(j) ? j : []);
    } catch {}
    console.log(
      "ofertas atuais:",
      existing.map((o) => `${o.name ?? o.description ?? "?"} (${o.code ?? o.offer_code ?? "?"})`)
    );
  } else {
    console.log("corpo:", curBody.slice(0, 400));
  }

  const jaTem = new Set(
    existing.map((o) => String(o.name ?? o.description ?? "").toLowerCase())
  );

  for (const off of OFFERS) {
    if (jaTem.has(off.name.toLowerCase())) {
      console.log(`- ${off.name}: JA EXISTE, pulando`);
      continue;
    }
    // payment_mode PAY_IN_FULL e conversão de moeda ligada: os dois valores
    // foram lidos da oferta base que já existe, não supostos. Conversão
    // ligada é o que faz um comprador na África do Sul ver o preço na
    // moeda dele em vez de dólar.
    const payload = {
      name: off.name,
      price: { value: off.price, currency_code: "USD" },
      payment_mode: "PAY_IN_FULL",
      is_currency_conversion_enabled: true,
    };
    if (!CONFIRM) {
      console.log(`- ${off.name} US$ ${off.price} -> ${JSON.stringify(payload)} (DRY RUN)`);
      continue;
    }
    const r = await fetch(listUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const b = await r.text();
    console.log(`- ${off.name}: HTTP ${r.status} ${b.slice(0, 300)}`);
  }

  if (!CONFIRM) console.log("\nnada foi criado. rode com --confirm para valer.");
}

main().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
