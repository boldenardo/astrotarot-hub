# 🌟 AstroTarot Hub - Plataforma Místico-Digital SaaS

> **Status:** ✅ Pronto para Produção | **Versão:** 3.0.0 | **Backend:** Rotas API do Next.js + Supabase

Plataforma completa de astrologia e tarot com IA, pagamentos via Stripe e banco de dados Supabase.

---

## 🚀 Quick Start

### Desenvolvimento local:

```bash
npm install
npm run dev
```

---

## 🏗️ Arquitetura

### Backend (Rotas API do Next.js)

Toda a lógica de servidor vive em rotas `/api/*` do Next.js (as Edge Functions do Supabase foram removidas):

- `POST /api/checkout` — cria a sessão de checkout do Stripe (Pacote 5 Leituras ou Premium)
- `POST /api/stripe/webhook` — recebe os eventos do Stripe e atualiza plano/saldo
- `POST /api/tarot/reading` — leitura de tarot com IA (consome saldo de leituras)
- `POST /api/birth-chart` — mapa astral completo (AstrologyAPI + IA)
- `POST /api/predictions` — previsões diárias personalizadas
- `POST /api/compatibility` — compatibilidade amorosa
- `POST /api/abundance` — guia de prosperidade
- `POST /api/personality` — perfil de personalidade
- `POST /api/numerology` — numerologia completa
- `POST /api/spiritual-guide` — chat com a guia espiritual (Luna)

### Dados e Auth (Supabase)

- **Auth:** Supabase Auth (JWT nativo)
- **Database:** PostgreSQL com RLS (o cliente anônimo não consegue alterar plano/saldo; escritas sensíveis passam pelo service role nas rotas de API)

### Frontend (Next.js 15)

- **Framework:** Next.js 15 (App Router) + React 18
- **Styling:** TailwindCSS + Framer Motion
- **Auth:** Supabase Client Library

---

## 📂 Estrutura Essencial

```
src/
├── app/
│   ├── api/           # Rotas de servidor (checkout, webhook, leituras, etc.)
│   ├── auth/          # Login e Registro
│   ├── dashboard/     # Dashboard principal + mapa astral completo
│   ├── tarot/         # Leituras de Tarot
│   └── cart/          # Planos e checkout
├── lib/
│   ├── plans.ts           # Fonte única de planos, preços e features
│   ├── auth-client.ts     # Funções de autenticação (client)
│   ├── supabase.ts        # Cliente Supabase (browser) + tipos
│   ├── astrology/         # Cliente da AstrologyAPI
│   └── server/            # Helpers de servidor (plan-gate, groq, supabase-admin)
supabase/
├── schema-stripe.sql                          # Schema completo (banco novo)
└── migrations/20260721_stripe_new_plans.sql   # Migração (banco existente)
```

---

## 🔑 Variáveis de Ambiente

Crie `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_READINGS_PACK=price_...      # US$ 9,99 (pagamento único)
STRIPE_PRICE_PREMIUM_MONTHLY=price_...    # US$ 29,90/mês (recorrente)

# IA e Astrologia
GROQ_API_KEY=gsk_...
ASTROLOGY_API_KEY=ak-...          # autentica via header x-astrologyapi-key

# App
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

---

## 💰 Planos e Preços

### ✨ Gratuito

- 4 leituras de tarot grátis
- Interpretação com IA (Groq)
- Histórico de leituras

### 🃏 Pacote 5 Leituras — US$ 9,99 (avulso)

- +5 leituras de Tarot Egípcio
- Pagamento único, sem assinatura

### 💎 Premium Ilimitado — US$ 29,90/mês

- Leituras de tarot ilimitadas
- Horóscopo diário personalizado
- Numerologia completa
- Mapa astral completo
- Guia de prosperidade
- Compatibilidade amorosa

---

## 🗄️ Banco de Dados

- **Banco existente:** execute `supabase/migrations/20260721_stripe_new_plans.sql` no SQL Editor do Supabase.
- **Banco novo:** execute `supabase/schema-stripe.sql`.

---

## 💳 Webhook do Stripe

No dashboard do Stripe, crie um webhook apontando para:

```
https://seudominio.com/api/stripe/webhook
```

Com os eventos:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copie o signing secret gerado para `STRIPE_WEBHOOK_SECRET`.

---

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React 18, TypeScript, TailwindCSS, Framer Motion
- **Backend:** Rotas API do Next.js + Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **IA:** Groq (Llama 3.3 70B)
- **Astrologia:** AstrologyAPI (Vedic Rishi)
- **Pagamento:** Stripe (checkout + assinaturas)
- **Deploy:** Vercel

---

## 🚀 Deploy

1. Configure as variáveis de ambiente na Vercel (as mesmas do `.env.local`).
2. Rode o SQL do banco (migração ou schema completo — ver seção Banco de Dados).
3. Configure o webhook do Stripe (ver seção acima).
4. Deploy:

```bash
git push origin main  # Autodeploy habilitado
```

---

## 📊 Status do Projeto

- ✅ Backend em rotas `/api` do Next.js
- ✅ Autenticação Supabase Auth
- ✅ Pagamentos Stripe (pacote avulso + assinatura mensal)
- ✅ Webhook Stripe com atualização atômica de plano/saldo
- ✅ IA para interpretações (Groq)
- ✅ Mapa astral real via AstrologyAPI
- ✅ RLS habilitado (plano/saldo protegidos contra escrita do cliente)

---

## 📝 Licença

Propriedade de **boldenardo**

---

**🔮 Conecte o místico ao digital. Lance seu portal espiritual hoje!**
