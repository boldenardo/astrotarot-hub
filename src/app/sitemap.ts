import type { MetadataRoute } from "next";

const BASE_URL = "https://astrotarot.shop";

// Apenas URLs públicas, indexáveis, HTTP 200, sem auth e sem redirect.
// Verificado em produção (Googlebot UA) em 2026-08-09.
//
// Fora daqui — e por quê:
//   /personality, /abundance, /guia  → exigem login (307 para /auth/login)
//   /quiz/flow, /quiz/vsl            → etapas do funil (noindex), sem valor de busca
//   /quiz/thank-you                  → pós-conversão, bloqueada no robots
//   /dashboard, /profile, /cart      → área privada
//   /auth/*                          → autenticação, bloqueada no robots
//
// Sem <lastmod>: não temos data confiável de mudança de conteúdo por URL —
// preferimos omitir a enviar timestamp de build (Google ignora lastmod não confiável).
// Sem <priority>/<changefreq>: Google já declarou que ignora ambos.
// Nota: a home entra como "" (sem barra) porque o Next.js normaliza o
// canonical renderizado para "https://astrotarot.shop" (sem trailing slash)
// — sitemap e canonical precisam ser byte-idênticos.
const PUBLIC_ROUTES = [
  "",
  "/tarot",
  "/rituals",
  "/rituals/luck",
  "/rituals/luck-7",
  "/rituals/cord-cutting",
  "/dreams",
  "/past-lives",
  "/compatibility",
  "/numerology",
  "/predictions",
  "/challenge",
  "/quiz",
  "/about",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
  }));
}
