# Deploy — AstroTarot Hub (Stripe + novos planos)

Migração concluída: PixUp → **Stripe**, novos planos, APIs reais ligadas (astrologyapi.com + Groq).
Faltam só **credenciais** e **2 passos manuais** (SQL + webhook). Siga na ordem.

## 1. Preencher `.env` (e as mesmas variáveis na Vercel)

Já preenchidos por mim:
- `ASTROLOGY_API_KEY=ak-…` (testada, funcionando; autentica via header `x-astrologyapi-key`)
- `GROQ_API_KEY` (a sua)
- `STRIPE_PRICE_READINGS_PACK=price_1Tvg2V07YF1LaBzhBH3h9Tqm` (Pacote 5 Leituras US$ 9,99 — one-time)
- `STRIPE_PRICE_PREMIUM_MONTHLY=price_1Tvg2m07YF1LaBzhNgaskmBn` (Premium Ilimitado US$ 29,90/mês)

Clerk (autenticação) — chaves de **teste** já preenchidas:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…`
- `CLERK_SECRET_KEY=sk_test_…`
- URLs de login/cadastro já configuradas (`/auth/login`, `/auth/register`).

**Você precisa colar:**
- `STRIPE_SECRET_KEY` = sua `sk_live_…` (os produtos já foram criados em modo **live**).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = sua `pk_live_…`.
- `STRIPE_WEBHOOK_SECRET` = `whsec_…` (gerado no passo 3).
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase → Settings → API → **service_role** (obrigatória: sem ela o webhook, o login e o controle de leituras não funcionam).

> **Clerk em produção:** as chaves `pk_test_/sk_test_` funcionam em qualquer domínio para testes. Quando for pro ar de verdade, crie uma **instância de produção** no Clerk (Dashboard → produção), gere as chaves `pk_live_/sk_live_`, adicione seu domínio, e troque na Vercel. Para login com Google/Apple, ative os provedores em Clerk → User & Authentication → Social Connections.

## 2. Rodar o SQL no Supabase (SQL Editor → RUN, nesta ordem)

- Banco **já existente** (é o seu caso): rode
  1. `supabase/migrations/20260721_stripe_new_plans.sql`
  2. `supabase/migrations/20260722_webhook_idempotency.sql`
  3. `supabase/migrations/20260722_clerk_auth.sql`  ← **novo** (coluna `clerk_user_id`, auth via Clerk)
- Banco **novo/do zero**: rode apenas `supabase/schema-stripe.sql` (já inclui tudo).

Isso troca colunas PixUp→Stripe, restringe os planos a `FREE`/`PREMIUM_MONTHLY`, cria as funções atômicas `consume_reading`/`grant_readings`, revoga UPDATE de plano/saldo do cliente e cria a tabela `stripe_events` + índices únicos de idempotência.

## 3. Criar o webhook no Stripe

Stripe Dashboard → Developers → Webhooks → **Add endpoint**
- URL: `https://SEU_DOMINIO/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copie o **Signing secret** (`whsec_…`) para `STRIPE_WEBHOOK_SECRET`.

## 4. Deploy

`npm run build` já passa localmente. Suba na Vercel com todas as variáveis do passo 1 configuradas no projeto.

---

### Variáveis de ambiente na Vercel (lista completa)
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_READINGS_PACK`, `STRIPE_PRICE_PREMIUM_MONTHLY`, `ASTROLOGY_API_KEY`, `ASTROLOGY_API_BASE_URL`, `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`. (Copie os valores do seu `.env` local.)

### Como os planos funcionam
- **Grátis:** 4 leituras de tarot + guia espiritual + desafio.
- **Pacote 5 Leituras (US$ 9,99, avulso):** credita +5 leituras (`readings_left`). Não vira assinante.
- **Premium Ilimitado (US$ 29,90/mês):** leituras ilimitadas + desbloqueia horóscopo, numerologia, mapa astral, prosperidade e compatibilidade amorosa.

### Notas
- O plano/saldo só muda pelo **webhook** (service role). O cliente não consegue se auto-promover (RLS revogado).
- Créditos e cobranças são **idempotentes** (dedup por `event.id` + índices únicos), então reentregas do Stripe não duplicam.
- Se as chaves da AstrologyAPI ou Groq faltarem, as rotas retornam erro honesto (503/502) — nunca dado inventado.
- `RAPIDAPI_KEY` e `JWT_SECRET` não são mais usados pelo fluxo principal (pode remover do `.env`).
