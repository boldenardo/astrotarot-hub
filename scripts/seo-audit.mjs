#!/usr/bin/env node
/**
 * SEO audit suite — astrotarot.shop
 *
 * Uso:
 *   npm run seo:audit                       → audita produção (https://astrotarot.shop)
 *   BASE_URL=http://localhost:3000 npm run seo:audit  → audita ambiente local
 *
 * Zero dependências (Node 18+ fetch global). Exit code 1 se qualquer check falhar.
 */

const BASE_URL = (process.env.BASE_URL || "https://astrotarot.shop").replace(/\/$/, "");
const CANONICAL_HOST = "astrotarot.shop";

// Rotas que NUNCA podem aparecer no sitemap
const PRIVATE_PREFIXES = [
  "/api",
  "/dashboard",
  "/profile",
  "/cart",
  "/auth",
  "/quiz/thank-you",
  "/quiz/flow",
  "/quiz/vsl",
  "/guia",
  "/personality",
  "/abundance",
];

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchRaw(url, opts = {}) {
  const res = await fetch(url, { redirect: "manual", ...opts });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

async function main() {
  console.log(`\nSEO audit → ${BASE_URL}\n`);

  // --- 1/2/13. robots.txt ---
  const robots = await fetchRaw(`${BASE_URL}/robots.txt`);
  check("robots.txt retorna 200", robots.status === 200, `HTTP ${robots.status}`);
  check(
    "robots.txt referencia o sitemap canônico",
    robots.body.includes(`Sitemap: https://${CANONICAL_HOST}/sitemap.xml`),
  );

  // --- 1/3. sitemap ---
  const sitemap = await fetchRaw(`${BASE_URL}/sitemap.xml`);
  check("sitemap.xml retorna 200", sitemap.status === 200, `HTTP ${sitemap.status}`);
  const isXml =
    sitemap.body.trim().startsWith("<?xml") &&
    sitemap.body.includes("<urlset") &&
    sitemap.body.includes("</urlset>");
  check("sitemap.xml é XML com urlset válido", isXml);

  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  check("sitemap contém URLs", locs.length > 0, `${locs.length} URLs`);

  // --- 4/12. sem URLs privadas ---
  const privateInSitemap = locs.filter((u) =>
    PRIVATE_PREFIXES.some((p) => new URL(u).pathname.startsWith(p)),
  );
  check(
    "nenhuma URL privada no sitemap",
    privateInSitemap.length === 0,
    privateInSitemap.join(", ") || undefined,
  );

  // --- 5. sem www ---
  const wwwInSitemap = locs.filter((u) => new URL(u).hostname.startsWith("www."));
  check("nenhuma URL www no sitemap", wwwInSitemap.length === 0);

  // --- duplicatas ---
  check(
    "sitemap sem URLs duplicadas",
    new Set(locs).size === locs.length,
  );

  // --- 6/7. cada URL do sitemap: 200 direto, sem redirect/erro ---
  // O fetch vai para BASE_URL (pode ser localhost), mas o canonical esperado
  // é sempre a URL absoluta de produção que consta no sitemap.
  for (const url of locs) {
    const path = new URL(url).pathname || "/";
    const pageUrl = `${BASE_URL}${path === "/" ? "/" : path}`;
    const r = await fetchRaw(pageUrl);
    check(
      `${path} retorna 200 sem redirect`,
      r.status === 200,
      `HTTP ${r.status}${r.headers.get("location") ? ` → ${r.headers.get("location")}` : ""}`,
    );

    // --- 8/9/10/11/14/15. canonical + robots meta ---
    if (r.status === 200 && r.headers.get("content-type")?.includes("text/html")) {
      const canonical = r.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
      check(`${path} tem canonical`, !!canonical, canonical || "AUSENTE");
      if (canonical) {
        check(
          `${path} canonical idêntico à URL do sitemap`,
          canonical === url,
          `${canonical} (esperado ${url})`,
        );
        check(
          `${path} canonical não aponta para *.vercel.app`,
          !canonical.includes(".vercel.app"),
        );
      }
      check(
        `${path} não tem noindex`,
        !/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(r.body),
      );
      check(
        `${path} metadata sem URL *.vercel.app`,
        !r.body.includes(".vercel.app"),
      );
    }
  }

  // --- www → non-www (consolidação canônica) ---
  try {
    const www = await fetchRaw(`https://www.${CANONICAL_HOST}/`);
    const loc = www.headers.get("location") || "";
    check(
      "www redireciona para non-www (308)",
      [301, 307, 308].includes(www.status) && loc.startsWith(`https://${CANONICAL_HOST}/`),
      `HTTP ${www.status} → ${loc || "(sem Location)"}`,
    );
  } catch {
    check("www redireciona para non-www (308)", false, "host www inacessível deste ambiente");
  }

  // --- resumo ---
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
