# 🌟 AstroTarot Hub - Plataforma Místico-Digital SaaS

> **Status:** ✅ Pronto para Produção | **Versão:** 2.0.0 | **Backend:** Supabase

Plataforma completa de astrologia e tarot com IA, pagamentos PIX e backend serverless.

---

## 🚀 Quick Start

### Para Lançar Hoje (Produção):

**Siga:** `DEPLOY_FINAL.md` (guia completo de 5 minutos)

### Para Desenvolvimento Local:

```bash
npm install
npm run dev
```

---

## 🏗️ Arquitetura

### Backend (Supabase - 100% Serverless)

- **Auth:** Supabase Auth (JWT nativo)
- **Database:** PostgreSQL com RLS
- **Edge Functions:**
  - `create-tarot-reading` - Leitura de Tarot com GROQ AI
  - `create-payment` - Pagamento PIX com PixUp

### Frontend (Next.js 15)

- **Framework:** Next.js 15.5.6 + React 18
- **Styling:** TailwindCSS + Framer Motion
- **Auth:** Supabase Client Library

---

## 📂 Estrutura Essencial

```
src/
├── app/
│   ├── auth/          # Login e Registro
│   ├── dashboard/     # Dashboard principal
│   ├── tarot/         # Leituras de Tarot
│   └── cart/          # Pagamentos
├── lib/
│   ├── auth-client.ts     # Funções de autenticação
│   ├── tarot-client.ts    # Funções de tarot
│   ├── payment-client.ts  # Funções de pagamento
│   └── supabase.ts        # Cliente Supabase
supabase/
├── schema.sql         # Schema do banco
└── functions/         # Edge Functions
    ├── create-tarot-reading/
    └── create-payment/
```

---

## 🔑 Variáveis de Ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://workzjugpmwbbbkxdgtu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
GROQ_API_KEY=gsk_r3eR...
RAPIDAPI_KEY=e8c7dd...
PIXUP_CLIENT_ID=666ba...
PIXUP_CLIENT_SECRET=...
```

---

## 🎯 Funcionalidades

### ✨ Gratuitas (4 leituras)

- Tarot das 4 Cartas
- Interpretação com IA (GROQ)
- Histórico de leituras

### 💎 Premium (R$ 29,90/mês)

- Leituras ilimitadas
- Tarot Egípcio completo
- Mapa Astral
- Compatibilidade Amorosa
- Previsões personalizadas

### 💰 Leitura Avulsa (R$ 9,90)

- 1 leitura completa
- Sem compromisso

---

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React 18, TypeScript, TailwindCSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth (JWT)
- **IA:** GROQ (Llama 3.3 70B)
- **Astrologia:** RapidAPI AstroSeek
- **Pagamento:** PixUp (PIX)
- **Deploy:** Vercel

---

## 📖 Documentação

- **Deploy:** `DEPLOY_FINAL.md` - Guia completo de deploy
- **Schema:** `EXECUTE_SCHEMA_PASSO_A_PASSO.md` - Executar banco de dados
- **Supabase:** `SUPABASE_QUICK_START.md` - Comandos rápidos

---

## 🚀 Deploy

### 1. Deploy Edge Functions:

```bash
supabase login
supabase link --project-ref workzjugpmwbbbkxdgtu
supabase functions deploy create-tarot-reading
supabase functions deploy create-payment
```

### 2. Configurar Secrets:

```bash
supabase secrets set GROQ_API_KEY=...
supabase secrets set PIXUP_CLIENT_ID=...
```

### 3. Deploy Vercel:

```bash
git push origin main  # Autodeploy habilitado
```

**Documentação completa:** `DEPLOY_FINAL.md`

---

## 📊 Status do Projeto

- ✅ Backend 100% Supabase (serverless)
- ✅ Autenticação Supabase Auth
- ✅ Edge Functions criadas
- ✅ Frontend Next.js 15
- ✅ Pagamento PIX (PixUp)
- ✅ IA para interpretações (GROQ)
- ✅ RLS habilitado (segurança)
- ✅ Código limpo e otimizado

---

## 🎉 Lançamento

**Siga:** `DEPLOY_FINAL.md` para lançar em 5 minutos!

---

## 📝 Licença

Propriedade de **boldenardo**

---

**🔮 Conecte o místico ao digital. Lance seu portal espiritual hoje!**
