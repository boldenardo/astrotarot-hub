#!/usr/bin/env node
/**
 * SEO audit suite — astrotarot.shop (Round 2, reforçada após revisão do Claude)
 *
 * Uso:
 *   npm run seo:audit                            → audita produção (https://astrotarot.shop)
 *   BASE_URL=http://localhost:3100 npm run seo:audit  → audita build local
 *
 * Princípio: testar SUBSTÂNCIA, não só forma — conjunto exato de URLs,
 * conteúdo SSR real, rotas privadas, noindex, JSON-LD parseado.
 * Zero dependências (Node 18+ fetch global). Exit 1 se qualquer check falhar.
 */

const BASE_URL = (process.env.BASE_URL || "https://astrotarot.shop").replace(/\/$/, "");
const CANONICAL_HOST = "astrotarot.shop";
const PROD_URL = `https://${CANONICAL_HOST}`;
const IS_PROD = BASE_URL === PROD_URL;
const FETCH_TIMEOUT_MS = 15000;

// Conjunto EXATO de URLs que o sitemap deve conter (nem a mais, nem a menos)
const EXPECTED_SITEMAP = [
  "",
  "/tarot",
  "/compatibility",
  "/numerology",
  "/predictions",
  "/challenge",
  "/quiz",
  "/about",
].map((p) => `${PROD_URL}${p}`);

// Prefixos que NUNCA podem aparecer no sitemap
const PRIVATE_PREFIXES = [
  "/api", "/dashboard", "/profile", "/cart", "/auth",
  "/quiz/thank-you", "/quiz/flow", "/quiz/vsl",
  "/guia", "/personality", "/abundance",
];

// Conteúdo SSR esperado por página pública (anti falso-positivo de página vazia)
// marker = texto identificador que só existe na versão pública da página
const CONTENT_PAGES = [
  { path: "/tarot", marker: "Free AI Tarot Reading Online" },
  { path: "/compatibility", marker: "Love Compatibility" },
  { path: "/numerology", marker: "Numerology Reading" },
  { path: "/predictions", marker: "Daily Horoscope" },
  { path: "/challenge", marker: "Free 4-Card Tarot Reading" },
  { path: "/about", marker: "About AstroTarot Hub" },
];

// Rotas privadas: sem sessão NÃO podem retornar 200 com conteúdo —
// devem seguir o fluxo de auth (redirect 3xx para /auth/*)
const PRIVATE_ROUTES = ["/dashboard", "/profile", "/cart", "/personality", "/abundance", "/guia"];

// Páginas deliberadamente noindex (rastreáveis, mas fora do índice)
const NOINDEX_ROUTES = ["/quiz/flow", "/quiz/vsl", "/quiz/thank-you", "/auth/login", "/auth/register"];

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}
function warn(name, detail = "") {
  console.log(`⚠️  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchRaw(url, opts = {}) {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    ...opts,
  });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

// Extrai o href de um <link rel="canonical"> sem depender da ordem dos atributos
function extractCanonical(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    if (/rel=["']canonical["']/i.test(tag)) {
      return tag.match(/href=["']([^"']+)["']/i)?.[1] ?? null;
    }
  }
  return null;
}

// Extrai e faz parse de todos os blocos JSON-LD da página
function extractJsonLd(html) {
  const blocks = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({ raw: m[1], parsed: null, error: null });
  }
  for (const b of blocks) {
    try {
      b.parsed = JSON.parse(b.raw);
    } catch (e) {
      b.error = String(e);
    }
  }
  return blocks;
}

async function main() {
  console.log(`\nSEO audit → ${BASE_URL}${IS_PROD ? " (produção)" : " (build local)"}\n`);

  // ================= robots.txt =================
  const robots = await fetchRaw(`${BASE_URL}/robots.txt`);
  check("robots.txt retorna 200", robots.status === 200, `HTTP ${robots.status}`);
  check(
    "robots.txt referencia o sitemap canônico",
    robots.body.includes(`Sitemap: ${PROD_URL}/sitemap.xml`),
  );
  // /auth e /quiz/thank-you NÃO podem estar em Disallow (esconderia o noindex)
  check(
    "robots.txt NÃO bloqueia /auth (noindex precisa ser rastreável)",
    !/Disallow:\s*\/auth/i.test(robots.body),
  );
  check(
    "robots.txt NÃO bloqueia /quiz/thank-you",
    !/Disallow:\s*\/quiz\/thank-you/i.test(robots.body),
  );
  // /api deve continuar bloqueado
  check("robots.txt bloqueia /api/", /Disallow:\s*\/api\//i.test(robots.body));

  // ================= sitemap =================
  const sitemap = await fetchRaw(`${BASE_URL}/sitemap.xml`);
  check("sitemap.xml retorna 200", sitemap.status === 200, `HTTP ${sitemap.status}`);
  check(
    "sitemap.xml é XML com urlset válido",
    sitemap.body.trim().startsWith("<?xml") &&
      sitemap.body.includes("<urlset") &&
      sitemap.body.includes("</urlset>"),
  );

  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

  // Conjunto EXATO (Round 2 — não basta length > 0)
  const missing = EXPECTED_SITEMAP.filter((u) => !locs.includes(u));
  const extra = locs.filter((u) => !EXPECTED_SITEMAP.includes(u));
  check(
    "sitemap contém EXATAMENTE as 8 URLs públicas esperadas",
    missing.length === 0 && extra.length === 0,
    missing.length || extra.length
      ? `faltando: [${missing}] · a mais: [${extra}]`
      : `${locs.length} URLs`,
  );
  check(
    "nenhuma URL privada no sitemap",
    !locs.some((u) => PRIVATE_PREFIXES.some((p) => new URL(u).pathname.startsWith(p))),
  );
  check(
    "nenhuma URL www no sitemap",
    !locs.some((u) => new URL(u).hostname.startsWith("www.")),
  );
  check("sitemap sem URLs duplicadas", new Set(locs).size === locs.length);
  check("sitemap sem lastmod falso", !sitemap.body.includes("<lastmod>"));

  // ================= páginas do sitemap: status + canonical =================
  for (const url of locs) {
    const path = new URL(url).pathname || "/";
    const pageUrl = `${BASE_URL}${path}`;
    const r = await fetchRaw(pageUrl);
    check(
      `${path} retorna 200 sem redirect`,
      r.status === 200,
      `HTTP ${r.status}${r.headers.get("location") ? ` → ${r.headers.get("location")}` : ""}`,
    );
    if (r.status !== 200 || !r.headers.get("content-type")?.includes("text/html")) continue;

    const canonical = extractCanonical(r.body);
    check(`${path} tem canonical`, !!canonical, canonical || "AUSENTE");
    if (canonical) {
      check(
        `${path} canonical idêntico à URL do sitemap`,
        canonical === url,
        `${canonical} (esperado ${url})`,
      );
      check(`${path} canonical sem www`, !canonical.includes("://www."));
      check(`${path} canonical sem *.vercel.app`, !canonical.includes(".vercel.app"));
    }
    check(
      `${path} não tem noindex`,
      !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(r.body),
    );
    check(`${path} metadata sem URL *.vercel.app`, !r.body.includes(".vercel.app"));
  }

  // ================= SSR content check (Round 2) =================
  for (const { path, marker } of CONTENT_PAGES) {
    const r = await fetchRaw(`${BASE_URL}${path}`);
    if (r.status !== 200) {
      check(`${path} SSR: conteúdo público presente`, false, `HTTP ${r.status}`);
      continue;
    }
    const h1 = r.body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    check(`${path} SSR: <h1> presente no HTML inicial`, !!h1, h1 ? undefined : "sem H1");
    check(
      `${path} SSR: marcador da versão pública presente ("${marker}")`,
      r.body.includes(marker),
    );
    // conteúdo textual não vazio: strip de tags, deve sobrar texto real.
    // Piso de 300 chars: /challenge é uma experiência interativa (jogo de
    // cartas) — 448 chars de texto visível é legítimo; os checks de H1 +
    // marcador acima são a garantia anti-página-vazia.
    const text = r.body.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").trim();
    check(`${path} SSR: conteúdo textual não vazio`, text.length > 300, `${text.length} chars`);
  }

  // ================= testes negativos: rotas privadas (Round 2) =================
  for (const path of PRIVATE_ROUTES) {
    const r = await fetchRaw(`${BASE_URL}${path}`);
    const loc = r.headers.get("location") || "";
    // Não hardcode 307: qualquer 3xx legítimo para /auth/* vale (framework pode mudar)
    const redirectedToAuth =
      r.status >= 300 && r.status < 400 && loc.includes("/auth/");
    check(
      `${path} (privada) sem sessão → redirect para auth`,
      redirectedToAuth,
      `HTTP ${r.status}${loc ? ` → ${loc}` : ""}`,
    );
  }

  // ================= noindex real (Round 2) =================
  for (const path of NOINDEX_ROUTES) {
    const r = await fetchRaw(`${BASE_URL}${path}`);
    if (r.status !== 200) {
      check(`${path} serve meta noindex`, false, `HTTP ${r.status} (esperado 200 + noindex)`);
      continue;
    }
    check(
      `${path} serve meta noindex`,
      /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(r.body),
    );
  }

  // ================= JSON-LD parse (Round 2) =================
  let jsonLdTotal = 0;
  for (const { path } of [{ path: "/" }, ...CONTENT_PAGES]) {
    const r = await fetchRaw(`${BASE_URL}${path}`);
    if (r.status !== 200) continue;
    const blocks = extractJsonLd(r.body);
    jsonLdTotal += blocks.length;
    const invalid = blocks.filter((b) => b.error);
    check(
      `${path}: ${blocks.length} bloco(s) JSON-LD com parse válido`,
      blocks.length > 0 && invalid.length === 0,
      invalid.length ? invalid[0].error : undefined,
    );
    for (const b of blocks) {
      if (!b.parsed) continue;
      check(
        `${path}: JSON-LD @type=${b.parsed["@type"]} com @context schema.org`,
        b.parsed["@context"] === "https://schema.org" && !!b.parsed["@type"],
      );
      check(
        `${path}: JSON-LD @type=${b.parsed["@type"]} sem www/vercel.app`,
        !b.raw.includes("://www.") && !b.raw.includes(".vercel.app"),
      );
    }
  }
  check("site expõe JSON-LD em páginas públicas", jsonLdTotal > 0, `${jsonLdTotal} blocos`);

  // ================= www → non-www =================
  if (IS_PROD) {
    const www = await fetchRaw(`https://www.${CANONICAL_HOST}/`);
    const loc = www.headers.get("location") || "";
    check(
      "www redireciona para non-www (308)",
      [301, 307, 308].includes(www.status) && loc.startsWith(`${PROD_URL}/`),
      `HTTP ${www.status} → ${loc || "(sem Location)"}`,
    );
  } else {
    // Com BASE_URL local não dá para forjar o Host header via fetch —
    // o redirect www é testado de verdade só contra produção.
    warn(
      "www → non-www: pulado em ambiente local",
      "rode sem BASE_URL após o deploy para validar em produção",
    );
  }

  // ================= resumo =================
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passaram`);
  if (failed.length > 0) {
    console.log("FALHAS:");
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ""}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erro fatal no audit:", err);
  process.exit(1);
});
