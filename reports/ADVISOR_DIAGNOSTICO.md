# Diagnóstico do funil e plano de conversão — AstroTarot Hub

Preparado por Brenno (advisor) em 14/08/2026. Escopo do mandato: converter mais os leads que chegam e aumentar LTV, via branding, UI/UX e funil de vendas.

Versão visual (compartilhável): artifact "Diagnóstico AstroTarot" no Claude.

---

## 1. Resumo executivo

O produto está no ar (astrotarot.shop + quiz.astrotarot.shop), o checkout Stripe funciona e o backend é sólido (webhook idempotente, RLS, gating server-side). Mas o funil rodava CEGO e VAZANDO:

- Nenhuma venda chegava ao Meta Pixel nem ao GA4 (evento Purchase nunca disparava; o GA descartava todos os eventos por bug de inicialização do react-ga4).
- O e-mail capturado no passo 13 do quiz morria no localStorage. Quem não comprava na hora era perdido para sempre.
- Oferta única sem escada de preço: sem downsell, sem upsell, sem plano anual.
- CTAs de compra da home caíam em tela de login antes de mostrar preço.

Nesta rodada tudo isso foi corrigido em código (commits neste repositório). Restam ações operacionais da seção 5.

## 2. Entregas desta rodada (Bloco 1)

Fase 1 — Medição
- `src/lib/analytics.ts` reescrito: eventos GA via `window.gtag` direto (react-ga4 removido; nunca era inicializado e descartava tudo em silêncio). Novos eventos: `quiz_step_viewed`, `lead_captured` (vira fbq `Lead`), `downsell_viewed/clicked`, `challenge_cta_clicked`. Nova `trackPurchase` com dedup por session e `eventID` preparado para CAPI.
- `GET /api/quiz/session`: valida a sessão no Stripe e devolve valor/plano/email. Usado pelas thank-you para disparar `Purchase` com valor REAL (gtag `purchase` + fbq `Purchase`).
- `InitiateCheckout`/`begin_checkout` no CTA da VSL.
- Tabela `leads` (migration `supabase/migrations/20260814_leads.sql`) + `POST /api/quiz/lead` (upsert idempotente por email). Chamado no passo de e-mail do quiz e no modal da VSL. O webhook do Stripe marca `leads.converted_at` na compra: taxa lead->venda direto no banco.

Fase 2 — Vazamentos
- Prova social unificada em `src/lib/proof-stats.ts` (120.000+ / 4.9). Antes: home dizia 120k e o passo proof dizia 74k na MESMA jornada. "8 quick questions" corrigido (eram 5). Foto da "Jessica L." não é mais a mesma da "Brittany W.".
- `computeScore` consertado: lia `q_block`, pergunta que não existe; quase todo mundo caía no mesmo resultado. Recalibrado para o máximo real de 6 pontos.
- Poster da VSL criado (frame 3s, 1080x1080 webp 74KB) + `preload="metadata"`. O player abria PRETO até o play.
- CTAs frios da home ("Unlock Premium", card Premium do pricing) agora vão para `/quiz` em vez do `/cart` protegido por login.
- `/challenge` deixou de ser beco sem saída: CTA para o quiz no modal de resultado e no rodapé. Imagens hotlinkadas de Pinterest/Pixabay substituídas por assets locais (`public/cards/egyptian` + componente `CardBack`).
- Downsell pós-recusa: `cancel_url` do Stripe volta com `?canceled=1` e a VSL mostra card do PACK5 US$ 9,99 (só para quem já recusou o premium; não canibaliza).

Fase 3 — LTV
- Plano anual `PREMIUM_YEARLY` US$ 79/ano em `plans.ts`, nos dois checkouts, no webhook (365 dias) e como opção secundária no `/cart`. Migration `20260814_premium_yearly.sql` amplia o CHECK de `users.subscription_plan`.
- Upsell one-click na thank-you (`POST /api/quiz/upgrade-yearly`): `stripe.subscriptions.update` no cartão salvo, `always_invoice` credita os US$ 19,99 recém-pagos, disclosure explícita de cobrança, erro esconde o card sem quebrar o fluxo.
- Ativação: thank-you passa o e-mail para `/auth/register?email=...` e o Clerk pré-preenche (`initialValues`). Menos risco de acesso órfão por e-mail digitado errado.

Fase 4 — Marca
- OG image 1200x630 (`public/brand/og-1200x630.jpg`) ligada no metadata.
- Mensagens de erro do `/api/checkout` traduzidas para EN (estavam em PT-BR num produto 100% inglês).

Verificação: `npm run build` verde, `npm run seo:audit` 168/168, typecheck limpo, zero hotlinks restantes.

## 3. Riscos que pedem decisão dos sócios

1. CRÍTICO — Preço divergente no Stripe. Site inteiro anuncia US$ 19,99/mês; DEPLOY.md e a migration de julho registram o price a US$ 29,90. Se o price não foi trocado, o cliente vê um valor e é cobrado outro (chargeback + risco de conta). Verificar no dashboard do Stripe ANTES de escalar.
2. CRÍTICO — Sem Termos de Uso, Política de Privacidade e Reembolso. Pré-requisito do Stripe para assinatura e do Meta/Google para anúncios.
3. Prova social não verificável: depoimentos com resultados específicos + fotos de banco. Exposição FTC e motivo de bloqueio de conta de anúncios. Suavizar para experiência subjetiva.
4. Nicho sensível na Meta (previsão de alma gêmea) + barra de progresso da VSL distorcida de propósito (`VSL_PROGRESS_EXPONENT = 0.45`). Decisão de apetite a risco; recomendo criativos que vendam o quiz, não a previsão.

## 4. Ações operacionais pendentes (30 min)

1. Supabase SQL Editor: rodar `20260814_leads.sql` e `20260814_premium_yearly.sql`.
2. Stripe: conferir o price mensal (item crítico) e criar o price anual US$ 79/ano (live + test) -> `STRIPE_PRICE_PREMIUM_YEARLY` na Vercel.
3. Vercel: confirmar `NEXT_PUBLIC_META_PIXEL_ID` e `NEXT_PUBLIC_GA_MEASUREMENT_ID` em produção.
4. Deploy: esta pasta agora é a fonte de verdade com git próprio, mas o repo ligado à Vercel está com o Luís. Definir sincronização (recomendo apontar a Vercel para este repositório).
5. Teste ponta a ponta em Stripe test mode: quiz -> lead na tabela -> compra mensal -> upgrade anual -> downsell. Validar no GA4 DebugView e Meta Pixel Helper.

## 5. Próximo bloco sugerido (Bloco 2)

1. E-mail/ESP (maior alavanca): entrega da leitura prometida, carrinho abandonado, boas-vindas, dunning. O funil promete "vou te enviar sua leitura" e hoje não envia nada.
2. Meta CAPI no webhook do Stripe (eventID por sessão já preparado).
3. Captura de UTM até o metadata do Stripe (hoje é impossível atribuir venda a campanha no próprio banco).
4. Ativar afiliados (painel pronto; falta migration + parceiros).
5. A/B no gate da VSL (90s vs aberto) quando houver volume.

## 6. KPIs quando os eventos rodarem

- Conclusão do quiz: `quiz_started` -> `lead_captured`, queda por tela via `quiz_step_viewed`.
- Lead -> compra: `leads.converted_at` / total de leads (direto no banco).
- Destrave da VSL: `vsl_play` -> `offer_unlocked` (custo real do gate de 90s).
- Checkout -> pagamento: `InitiateCheckout` -> `Purchase` (abaixo de ~40% = atrito).
- Aceite do upgrade anual: cada aceite multiplica o LTV imediato por ~4.
- Resgate do downsell: `downsell_viewed` -> `Purchase` PACK5.


---

# ATUALIZACAO 14/08/2026 (tarde) — novo modelo de monetizacao

Brenno definiu: trafego 100% ORGANICO (IG e FB postando, TikTok e YouTube entrando; contas com menos de 5k). Link da bio vai DIRETO pro quiz. Sem trial.

## Modelo novo
- Assinatura base **$14.99/mes** (era $19.99). Barreira menor porque o quiz + VSL ja aquecem.
- **Draw Your Soulmate $24.99 avulso**: retrato gerado por IA (a partir do mapa astral real) + dossie escrito. O assinante recebe a PREVIA (o quiz promete o retrato; cobrar de novo por ele quebraria a promessa). O avulso revela imagem nitida, 4 tracos, janela do encontro, como reconhecer e o download.
- **Vibes & Meditations +$9.99/mes**: cobrado como subscription item DENTRO da assinatura (uma fatura so).
- **Streak de login** estilo Tinder/Duolingo, com recompensas de custo marginal zero.

## O que foi construido (commits de 14/08)
- Preco $14.99 em todo o projeto; conta do anual corrigida ($179.88/ano -> $79 economiza $100).
- `user_entitlements` + `soulmate_portraits` + helpers `hasEntitlement`/`requireEntitlement`; webhook concede o retrato, sincroniza Vibes pelos itens da assinatura e revoga em cancelamento/reembolso/disputa.
- `/soulmate` com 3 estados + `image-gen.ts` (interface unica, Gemini hoje, trocavel) + geracao idempotente por usuario.
- `/vibes` + rotas de assinar/cancelar o add-on. Catalogo VAZIO de proposito: a cobranca nao aparece sem faixas.
- Streak: `daily_checkins` + `user_streaks` + funcao SQL `record_checkin` (atomica) + `StreakCard` no topo do dashboard.
- Origem organica sem pixel: `?src=ig|fb|tt|yt` no link da bio, first-touch, gravada no lead e levada ao metadata do Stripe.
- UI do funil no mobile: grid de signos 3 colunas (os 12 cabem numa tela; antes so 5), elenco feminino na prova social, telas de chat alinhadas ao topo, selos falsos de "verified" removidos.

## Migrations a rodar (nesta ordem)
1. `20260814_leads.sql`
2. `20260814_lead_source.sql`
3. `20260814_premium_yearly.sql`
4. `20260814_entitlements.sql`
5. `20260814_streaks.sql`

## Envs a preencher na Vercel
`STRIPE_PRICE_PREMIUM_MONTHLY` ($14.99), `STRIPE_PRICE_PREMIUM_YEARLY` ($79), `STRIPE_PRICE_SOULMATE_PORTRAIT` ($24.99), `STRIPE_PRICE_VIBES_MONTHLY` ($9.99), `GEMINI_API_KEY`.

## Pendencias de conteudo
- Audios do Vibes (a aba nao vende sem eles, por decisao de codigo).
- Biblioteca de wallpapers gerada em lote para as recompensas de streak.
- Video do "retrato" no quiz mostra uma MULHER; o publico e hetero feminino procurando um homem. Trocar o asset.

## Achado de risco
O funil trava na primeira tela se o JavaScript nao hidratar: a primeira fala da Aura vem do SSR, entao a pagina parece viva mas nao avanca. Testar em celular real apos o deploy.
