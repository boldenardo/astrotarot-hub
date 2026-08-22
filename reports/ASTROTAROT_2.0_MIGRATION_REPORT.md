# ASTROTAROT 2.0 — MIGRATION REPORT

Data: 22/08/2026 · Commits: `6784f74` → `7690c57` → `5c47e98` (branch `main`, deploy Vercel automático)
Escopo: plataforma de orientação espiritual pessoal (Rituais · Sonhos · Vidas Passadas) + 4 funis novos + aposentadoria de Prosperidade.

---

## 1. BEFORE (auditoria forense)

| Área | Como estava | Evidência |
|---|---|---|
| Gateway | **Stripe live** (Checkout Session + Payment Element embutido no funil). Hotmart descartada em 20/08. | `src/app/api/checkout`, `src/app/api/quiz/checkout`, webhook em `src/app/api/webhooks/stripe` |
| Oferta | Assinatura Unlimited $9.99/mês · $39.99/6m · $59.99/ano (`SUB_*`). PACK5 legado. | `src/components/quiz/PlanPicker.tsx` |
| Auth / créditos | Clerk → `requireUser()` → `hasReadingsLeft` → IA → `consumeReading` (RPC Supabase) → persist | `src/lib/server/plan-gate.ts` |
| IA | Groq. **Modelo `llama-3.3-70b-versatile` tinha sido APOSENTADO pelo Groq** → *todas* as leituras (tarot, guia, horóscopo) estavam quebradas em produção. | `src/lib/server/groq.ts` |
| Funis | Engine de quiz conversacional `PainFunnel` (config-driven) em `/quiz/{intimacy,body,money,ex}`; VSL em `/quiz/vsl*` | `src/components/pain/PainFunnel.tsx` |
| Legado a aposentar | `/abundance` (Prosperity/Fortune) com "prosperity days" hardcoded; Compatibility na nav principal | `src/app/abundance`, `Navbar.tsx` |
| Analytics | GA4 via `window.gtag` + Meta Pixel, eventos `pain_*` por funil | `src/lib/analytics.ts` |

## 2. LEGACY REMOVED / DEMOTED

- **Prosperity/Fortune**: `/abundance` → **redirect 308 permanente** para `/rituals/luck` (`next.config.js`). Página e API antigas permanecem no código (rollback = remover o redirect). Nenhuma URL indexada virou 404.
- **Compatibility**: removida da Navbar e do dashboard; rota `/compatibility` mantida (SEO) e ainda listada no sitemap.
- Navbar nova: Tarot · Soulmate · Rituals · Dreams · Past Lives · Horoscope · Lucky Numbers · Guide · Plans.
- Dashboard: cards Rituals / Dreams / Past Lives (ícones Flame/Moon/Hourglass) no lugar de Fortune / Compatibility.
- Copy de preço unificada: todos os `$14.99` → `$9.99`, `$79` → `$59.99` (`plans.ts`, `cart`, `about`, `AlsoIncluded`, etc.).

## 3. NEW EXPERIENCES (produto)

Todas usam a **camada conversacional Master Aura** (`AuraChat`: mensagem → pergunta → resposta → reação curta → próxima; 3–6 perguntas; nunca formulário).

| Pilar | Rota | O que faz | Endpoint |
|---|---|---|---|
| Rituais (hub) | `/rituals` | Escolha do ritual; Luck em destaque, Cord Cutting em alta prioridade | — |
| Luck Ritual | `/rituals/luck` | Intenção (Luck/Money/Love/Career/New Beginning/Protection) → conversa → `RitualPlayer` interativo (acender vela, carta, escrever, liberar, respirar) → resultado | `POST /api/experiences/ritual` |
| Cord Cutting | `/rituals/cord-cutting` | Liberação **simbólica** (nunca "cordão energético" literal); fio SVG que se solta; resultado inclui `connection` (leitura do vínculo) | idem, `type=cord-cutting` |
| Outros rituais | `/rituals/{money,love,career,new-beginning,protection}` | Mesmo engine, passos genéricos | idem |
| Dreams | `/dreams` | Texto livre do sonho → Aura identifica símbolos → 2–4 perguntas → Dream Reading estruturada (+ 3 cartas opcionais) | `POST /api/experiences/dream` · preview público `POST /api/experiences/dream-preview` |
| Past Lives | `/past-lives` (`?mode=connection`) | Past Life Reading (arquétipo, não história factual) e Past Life Connection ("por que essa pessoa pareceu familiar?") → ponte para Soulmate | `POST /api/experiences/past-life` |

Engine de ritual escalável: `RitualType` (8 tipos) + `ritual-steps.ts` (passos) + `prompts.ts` (sistema por tipo) + `RitualPlayer` (gestos). Runas / Pêndulo / Angel Numbers / Aura Reading entram como novos `kind`/`subtype` sem tocar no fluxo de crédito.

**Fase da lua** calculada em código (`src/lib/experiences/moon.ts`, mês sinódico 29.530588853 d, referência 2000-01-06 18:14 UTC) — nunca pela LLM, sem datas hardcoded.

## 4. NEW FUNNELS (CONTROL vs VARIANT)

Rota única `/f/<funnel>/<variant>` (`src/app/f/[funnel]/[variant]/page.tsx`), **noindex,follow**, registro em `src/lib/funnels/registry.ts`. Kill-switch: `NEXT_PUBLIC_FUNNELS_OFF=1` devolve 404 em todas as variantes. Controle (`/quiz/ex`, `/quiz/vsl*`) intocado.

| Funil | Variante | Fluxo | Dimensão analytics `variant` |
|---|---|---|---|
| F1 Cord Cutting / Ex | `/f/cord-cutting/v1` | Landing (foto 2AM) → gênero → quiz com fotos → 4 cartas → padrão → LP → PlanPicker | `cord-cutting_v1` |
| F1 Cord Cutting / Ex | `/f/cord-cutting/v2` | **Direto na conversa** (sem landing) → idem | `cord-cutting_v2` |
| F2 Luck | `/f/luck/v1` | Landing curta → área da vida → quiz → carta → ritual preview → LP | `luck_v1` |
| F3 Past Life Connection | `/f/past-life/v1` | Landing → quiz → 4 cartas → arquétipo → LP | `past-life_v1` |
| F4 Dream Decoder | `/f/dreams/v1` | **Texto livre do sonho primeiro** (preview IA público) → quiz → LP | `dreams_v1` |

Sem VSL no fluxo primário. LP de cada funil termina no mesmo `PlanPicker` (SUB_MONTHLY/SEMIANNUAL/ANNUAL) → `/api/quiz/checkout` (Payment Element) — a implementação Stripe não foi alterada.

## 5. IGNITE DECISIONS

Workflow Ignite rodado em 3 etapas por funil (dossiê ICP/benchmark/validação → config → revisão adversarial). Dossiês em `src/lib/funnels/configs/*.dossier.json`. Decisões que sobreviveram à revisão:

- **Cord Cutting**: ICP = pessoa que ainda olha o perfil do ex às 2h; dor "ainda está aberto", não "quero ele de volta". Pergunta de gênero primeiro (pronomes `{he}/{his}` via `genderizeDeep`). Promessa = nomear o que ficou aberto, não reconquistar.
- **Luck**: dor = "a porta meio aberta que nunca abre"; mecanismo = intenção + ritual na fase lunar atual (token `{moon}` vem do código).
- **Past Life**: gancho "familiar rápido demais"; arquétipos com nomes próprios (ex.: *The One Who Left First*) e disclaimer de simbolismo.
- **Dreams**: o sonho vira o primeiro input (valor antes de pedir qualquer coisa); preview real da IA sem login, limitado por rate-limit.
- **Proibições aplicadas**: nenhuma estatística, depoimento, contador ou escassez inventados. Única prova permitida no copy: "120,000+ readings" e "4.9".

## 6. IMAGES

- Integradas (geradas via ChatGPT na sessão anterior, 960×1280 webp): `public/funnel/ex/*` — reutilizadas no Cord Cutting (hook 2AM, doorway, awake, mirror, bedside, bar, cards-velvet).
- **Pendentes**: 14 slots (cord/2, luck/4, past-life/4, dreams/4) com prompt final, proporção, alt e ponto de encaixe documentados em `public/funnel/ASSET_MANIFEST.md`. A geração travou por congelamento repetido do renderer do Chrome durante a geração de imagem no ChatGPT; os funis rodam sem essas fotos (nenhuma imagem quebrada).

## 7. ROUTES

| Rota | Status | SEO |
|---|---|---|
| `/rituals`, `/rituals/[type]`, `/dreams`, `/past-lives` | novas, SSR | index, canonical, breadcrumb JSON-LD, no sitemap |
| `/f/[funnel]/[variant]` | nova | noindex, follow |
| `/abundance` | **308 → `/rituals/luck`** | URL preservada |
| `/compatibility` | mantida | index (fora da nav) |
| `/quiz/*`, `/tarot`, `/soulmate`, `/cart`, `/dashboard` | intactas | — |

## 8. DATABASE

- Nova tabela `experiences` (`supabase/migrations/20260821_experiences.sql`): `id, user_id, kind CHECK(ritual|dream|past_life), subtype, input jsonb, result jsonb, completed_at, created_at`; RLS com revoke para `anon`/`authenticated` (só service_role). Persistência é **best-effort** (`persist.ts`): se a tabela não existir, a leitura é entregue mesmo assim.
- **Pendência do operador**: rodar a migration no Supabase de produção (o projeto não está no MCP).
- Crédito continua via RPC `consume_reading` existente — nenhum schema de pagamento/perfil mudou.

## 9. AI

- `GROQ_MODEL` configurável; default `openai/gpt-oss-120b` (o llama 3.3 foi aposentado). Modelos de raciocínio recebem `reasoning_effort:"low"` + piso de 1200 tokens (sem isso devolviam vazio).
- Saídas **estruturadas** (`groqChatJson<T>` + `shape()` defensivo em `run.ts`): a UI nunca parseia markdown. Cartas e lua entram pelo código, não pela LLM.
- Voz Master Aura centralizada em `prompts.ts` (simbólico, sem promessas, sem linguagem clínica/medo, inglês, JSON-only).
- Sem cobrança em falha de IA (ordem: gate → saldo → IA → consume → persist).

## 10. CHECKOUT

- Inalterado no núcleo. `/api/checkout` (cart) agora usa os **mesmos price ids** da oferta do funil (`STRIPE_PRICE_SUB_MONTHLY|ANNUAL` com fallback hardcoded — price id não é segredo).
- Verificado em produção: `POST /api/quiz/checkout` devolve `clientSecret` ao vivo; webhook intacto.
- Nenhuma chave ou secret no bundle client (`grep` por `sk_`/`whsec_` em `.next/static` = 0).

## 11. ANALYTICS

Novos eventos em `src/lib/analytics.ts`: `experience_view/start/step/complete_chat/result/gate/error`, `ritual_start`, `ritual_complete`, `dream_submitted`. Funis novos reusam `pain_funnel_view → pain_quiz_started → pain_quiz_answered → pain_quiz_completed → pain_card_* → pain_lp_viewed → pain_offer_viewed → pain_checkout_clicked → checkout_*` com `funnel_id`, `variant_id` e `variant=<funnel>_<variant>` em todos os params — relatório por braço sem ambiguidade.

## 12. SEO

- Redirect permanente de `/abundance`; canonical + breadcrumb nas páginas novas; variantes de funil `noindex`; sitemap atualizado (páginas novas incluídas, `/abundance` removida).
- Structured-data de oferta já apontava para a assinatura (commit anterior).

## 13. TEST RESULTS

| Teste | Resultado |
|---|---|
| `tsc --noEmit` / `next build` | ✅ 0 erros |
| `/abundance` | ✅ 308 → `/rituals/luck` (produção) |
| `/rituals`, `/rituals/luck`, `/dreams`, `/past-lives` | ✅ 200 em produção |
| `/f/*/v1`, `/f/cord-cutting/v2` | ✅ 200, `noindex` |
| `POST /api/experiences/*` sem login | ✅ 401 (gate) |
| `POST /api/experiences/dream-preview` | ✅ leitura real da IA; 7ª chamada em 10 min → 429 |
| Groq readings (tarot/guia/horóscopo) | ✅ restauradas (~1.6 s) |
| Funil Luck v1 ponta a ponta (dev+prod) | ✅ landing → quiz → carta → LP → PlanPicker |
| Funil Cord Cutting v1 ponta a ponta | ✅ |
| Funil Cord Cutting **v2** | ✅ abre direto na conversa (1º balão em ~60 ms) → LP → PlanPicker. Dois bugs corrigidos nesta rodada (ver §15) |
| Funil Past Life v1 ponta a ponta | ✅ arquétipo + LP com oferta |
| Funil Dreams v1 | ✅ preview IA do sonho no 1º passo |
| Experiências logadas (ritual/dream/past-life completos) | ⚠️ backend verificado por API; UI logada não exercitada no browser (sessão Clerk não disponível para automação) |
| Mobile 375/390/430 | ✅ layout dos funis/experiências em `max-w-lg`, sem scroll horizontal (checado em 375) |

## 14. FILES CHANGED (54 arquivos, +4839 / −76)

Novos: `src/lib/experiences/{moon,types,prompts,run,persist,zodiac,ritual-steps}.ts`, `src/app/api/experiences/{ritual,dream,past-life,dream-preview}/route.ts`, `src/app/{rituals,rituals/[type],dreams,past-lives}/page.tsx`, `src/components/experiences/{AuraChat,RitualPlayer,RitualExperience,DreamDecoder,PastLifeExperience,shell}.tsx`, `src/lib/funnels/registry.ts`, `src/lib/funnels/configs/{cord-cutting,luck,past-life,dreams}.v1.ts` (+ dossiês JSON), `src/app/f/layout.tsx`, `src/app/f/[funnel]/[variant]/page.tsx`, `supabase/migrations/20260821_experiences.sql`, `public/funnel/ASSET_MANIFEST.md`.

Modificados: `PainFunnel.tsx`, `pain-funnels/types.ts`, `Navbar.tsx`, `dashboard/page.tsx`, `AlsoIncluded.tsx`, `sitemap.ts`, `next.config.js`, `plans.ts`, `plan-gate.ts`, `groq.ts`, `analytics.ts`, `api/checkout`, `api/quiz/checkout`, `api/tarot/reading`, `cart`, `cart/success`, `about`, `compatibility`, `personality`, `predictions`.

## 15. RISKS & ROLLBACK

- **Variante B (skipHook)** — causa raiz encontrada: renderizar o estágio "quiz" no SSR quebrava a hidratação da rota `/f`. Fix: SSR renderiza a landing invisível (mesmo caminho do v1) e a primeira pergunta entra após hidratar; guard por instância evita a duplicata vista em produção. Rollback: `variant: "v2"` pode ser removido do registro.
- **Tabela `experiences` não migrada** → leituras funcionam, histórico não é gravado.
- **Clerk em modo DEV em produção** (pendência anterior) — trocar chaves.
- **Gemini quota 429** → retrato da alma gêmea pago pode falhar até a quota voltar.
- **Imagens pendentes** (§6) — funis rodam sem elas.
- Kill-switches: `NEXT_PUBLIC_FUNNELS_OFF=1` (funis), remover redirect em `next.config.js` (Prosperity), `git revert 6784f74` (plataforma inteira, sem tocar Stripe).

## 16. NEXT TESTS (ordem de prioridade)

1. **Cord Cutting** — A/B v1 vs v2 com tráfego real; métrica: `pain_quiz_started → pain_offer_viewed → checkout_form_loaded`.
2. **Luck** — `/f/luck/v1` vs Control `/quiz/ex`; após compra, medir `ritual_complete` em `/rituals/luck`.
3. **Past Life** — `/f/past-life/v1`; observar `experience_result` e a ponte para Soulmate.
4. **Dreams** — taxa de `dream_submitted` no 1º passo (preview sem login) → `pain_lp_viewed`.
5. Pendências de operação: migration `experiences`; `ADMIN_EMAILS` + `STRIPE_PRICE_SUB_*` na Vercel; chaves Clerk de produção; rotacionar o Client Secret da Hotmart que passou pelo chat; gerar as 14 imagens do manifesto quando o Chrome estiver estável.
