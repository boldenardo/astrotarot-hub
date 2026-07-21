# 🌟 AstroTarot Hub — Mystic Digital SaaS Platform

> **Status:** ✅ Production-ready | **Version:** 3.0.0 | **Backend:** Next.js API routes + Supabase

A complete AI-powered astrology and tarot platform, with Stripe payments, Clerk authentication, and a Supabase database.

---

## 🚀 Quick Start

### Local development:

```bash
npm install
npm run dev
```

---

## 🏗️ Architecture

### Backend (Next.js API routes)

All server logic lives in Next.js `/api/*` routes (the Supabase Edge Functions were removed):

- `POST /api/checkout` — creates the Stripe checkout session (5-Reading Pack or Premium)
- `POST /api/stripe/webhook` — receives Stripe events and updates plan/balance
- `POST /api/tarot/reading` — AI tarot reading (consumes the reading balance)
- `POST /api/birth-chart` — full birth chart (AstrologyAPI + AI)
- `POST /api/predictions` — personalized daily forecasts
- `POST /api/compatibility` — love compatibility
- `POST /api/abundance` — prosperity guide
- `POST /api/personality` — personality profile
- `POST /api/numerology` — full numerology
- `POST /api/spiritual-guide` — chat with the spiritual guide (Luna)
- `GET  /api/me`, `/api/me/readings`, `POST /api/me/profile` — current user's data (Clerk-authenticated)

### Data & Auth

- **Auth:** Clerk (sign-in/sign-up, sessions, social login). Users are provisioned into the `users` table on first request, keyed by `clerk_user_id`.
- **Database:** Supabase PostgreSQL with RLS. The client never queries the DB directly — all reads/writes go through the API routes (service role). Plan/balance can only be changed server-side.

### Frontend (Next.js 15)

- **Framework:** Next.js 15 (App Router) + React 18
- **Styling:** TailwindCSS + Framer Motion (dark mystic premium theme)
- **Auth UI:** Clerk components (`<SignIn>`, `<SignUp>`, `<UserButton>`, `useUser`)

---

## 📂 Key Structure

```
src/
├── app/
│   ├── api/           # Server routes (checkout, webhook, readings, me, etc.)
│   ├── auth/          # Clerk sign-in and sign-up
│   ├── dashboard/     # Main dashboard + full birth chart
│   ├── tarot/         # Tarot readings
│   └── cart/          # Plans and checkout
├── lib/
│   ├── plans.ts           # Single source of plans, prices and features
│   ├── client/me.ts       # Client helpers for the current user (/api/me)
│   ├── payment-client.ts  # Stripe checkout starter (client)
│   ├── astrology/         # AstrologyAPI client
│   └── server/            # Server helpers (plan-gate, groq, supabase-admin, timezone)
supabase/
├── schema-stripe.sql                          # Full schema (new database)
└── migrations/                                # Migrations (existing database)
```

---

## 🔑 Environment Variables

Create `.env.local` (see `.env.example`):

```env
# Clerk (authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_READINGS_PACK=price_...      # $9.99 (one-time)
STRIPE_PRICE_PREMIUM_MONTHLY=price_...    # $29.90/month (recurring)

# AI & Astrology
GROQ_API_KEY=gsk_...
ASTROLOGY_API_KEY=ak-...                  # authenticates via the x-astrologyapi-key header

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 💰 Plans & Pricing

### ✨ Free
- 4 free tarot readings
- AI interpretation (Groq)
- Reading history

### 🃏 5-Reading Pack — $9.99 (one-time)
- +5 Egyptian Tarot readings
- One-time payment, no subscription

### 💎 Unlimited Premium — $29.90/month
- Unlimited tarot readings
- Personalized daily horoscope
- Full numerology
- Complete birth chart
- Prosperity guide
- Love compatibility

---

## 🗄️ Database

- **Existing database:** run the files in `supabase/migrations/` in the Supabase SQL Editor, in order.
- **New database:** run `supabase/schema-stripe.sql`.

---

## 💳 Stripe Webhook

In the Stripe dashboard, create a webhook pointing to:

```
https://yourdomain.com/api/stripe/webhook
```

With the events:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the generated signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript, TailwindCSS, Framer Motion
- **Backend:** Next.js API routes + Supabase (PostgreSQL)
- **Auth:** Clerk
- **AI:** Groq (Llama 3.3 70B)
- **Astrology:** AstrologyAPI
- **Payments:** Stripe (checkout + subscriptions)
- **Deploy:** Vercel

---

## 🚀 Deploy

1. Set the environment variables in Vercel (same as `.env.local`).
2. Run the database SQL (migration or full schema — see Database).
3. Configure the Stripe webhook (see above).
4. Deploy:

```bash
git push origin main  # Auto-deploy enabled
```

See `DEPLOY.md` for the full step-by-step checklist.

---

## 📊 Project Status

- ✅ Backend on Next.js `/api` routes
- ✅ Clerk authentication (with lazy user provisioning)
- ✅ Stripe payments (one-off pack + monthly subscription)
- ✅ Stripe webhook with atomic, idempotent plan/balance updates
- ✅ AI interpretations (Groq)
- ✅ Real birth charts via AstrologyAPI
- ✅ RLS enabled (plan/balance protected from client writes)

---

## 📝 License

Property of **boldenardo**

---

**🔮 Where the mystic meets the digital. Launch your spiritual portal today!**
