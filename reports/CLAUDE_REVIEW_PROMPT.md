# REVISÃO ADVERSARIAL — prompt pronto para colar no Claude

Cole o texto abaixo na sessão do Claude Code aberta neste projeto:

---

Você é o segundo revisor técnico deste projeto (Next.js 15 + Clerk + Vercel, produção em https://astrotarot.shop). O Kimi Code acabou de implementar um overhaul de SEO/AEO/GEO. Sua missão é TENTAR REPROVAR a implementação — não quero validação superficial.

Primeiro leia `AI_SYNC.md` na raiz (protocolo de dupla + log do que foi feito). Depois rode `git diff d78bdca..HEAD` (ou `git status` se ainda não houver commit final) para ver exatamente o que mudou.

Contexto das decisões tomadas:
1. Middleware (`src/middleware.ts`): redirect 308 www→non-www restrito a `host === "www.astrotarot.shop"`; /tarot, /compatibility, /numerology, /predictions removidas das rotas protegidas → viraram páginas híbridas: `<SignedOut>` = landing pública de SEO (SSR), `<SignedIn>` = ferramenta original intocada. Mesma URL, sem migração.
2. `src/app/sitemap.ts` reescrito: apenas 8 URLs públicas (/ /tarot /compatibility /numerology /predictions /challenge /quiz /about), sem lastmod/priority/changefreq.
3. JSON-LD novo: Organization + WebSite + WebApplication no layout raiz (sem aggregateRating, sem SearchAction — decisões documentadas no AI_SYNC.md), FAQPage na home e nas 4 landings, BreadcrumbList nas rotas públicas.
4. Metadata/canonical absoluto por rota via layout.tsx; noindex nas áreas privadas (dashboard/profile/cart/auth) e nas etapas do funil (quiz/flow, quiz/vsl, quiz/thank-you).
5. Novos: /about, public/llms.txt, scripts/seo-audit.mjs (`npm run seo:audit`).

Procure ESPECIFICAMENTE (liste cada um como OK/FALHA com evidência):
1. Regressões no auth (login, signup, redirect pós-login, sessão)
2. Regressões no checkout (cart, Stripe, success, planos)
3. Redirects incorretos ou em cadeia (www→non-www, trailing slash, quiz subdomain)
4. Redirect loops (middleware: ordem das regras www vs quiz.* vs proteção)
5. Canonical conflitante ou ausente em alguma rota pública
6. Páginas privadas indexáveis (dashboard, profile, cart, auth)
7. Páginas públicas acidentalmente bloqueadas (robots.txt, noindex, middleware)
8. URLs privadas ou com auth no sitemap
9. Metadata duplicada entre rotas (titles/descriptions iguais)
10. JSON-LD inválido (sintaxe, @type errado, URLs com www, IDs inconsistentes)
11. Problemas SSR/CSR: o conteúdo SignedOut realmente aparece no HTML pré-renderizado para o Googlebot? (teste com curl, não só leitura de código)
12. Comportamento diferente entre browser e Googlebot
13. URL de preview Vercel (*.vercel.app) vazando em canonical/OG/JSON-LD
14. Problemas de trailing slash
15. www/non-www inconsistentes em qualquer lugar (links internos, JSON-LD, sitemap)
16. Sitemap com timestamps falsos (lastmod de build)
17. Landings com conteúdo artificial/clonado entre si (doorway pages) ou claims falsos de preço
18. Impactos de performance/Core Web Vitals (scripts novos, peso das landings)

Comandos sugeridos: `npm run build`, `BASE_URL=http://localhost:3000 npm run seo:audit` (com `npm run start` rodando), e curl com UA do Googlebot contra as rotas públicas.

Ao terminar, registre no `AI_SYNC.md` (seção "Revisão Claude"): cada item OK/FALHA com evidência, e abra itens em "Discordâncias abertas" para tudo que precisar de correção. NÃO reverta nada diretamente — discordância se resolve por teste.

---

(Depois que o Claude responder, me diga o resultado — eu corrijo o que ele apontar e re-rodo os testes.)
