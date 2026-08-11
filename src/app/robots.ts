import type { MetadataRoute } from "next";

// Política de crawl — lembrando: robots.txt NÃO é segurança nem mecanismo
// anti-indexação (URL bloqueada pode aparecer no Google sem descrição).
// - /api, /dashboard, /profile, /cart: Disallow (áreas de app sem valor de crawl;
//   as três últimas também redirecionam para login e têm noindex no layout).
// - /auth/* e /quiz/thank-you: NÃO bloquear — o Google precisa rastreá-las
//   para ler o meta noindex que elas servem (bloquear esconderia o noindex).
// - /quiz/flow e /quiz/vsl: rastreáveis, com noindex via metadata.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/profile", "/cart", "/admin"],
      },
    ],
    sitemap: "https://astrotarot.shop/sitemap.xml",
  };
}
