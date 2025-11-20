# 🚀 Setup Final do Backend Supabase

> **STATUS:** ✅ Código pronto | ⚠️ Aguardando deploy de Edge Functions

---

## 🎯 COMANDOS FINAIS (EXECUTAR AGORA)

### 1️⃣ Deploy das Edge Functions

```bash
cd "c:\Users\luiss\OneDrive\Área de Trabalho\Astrologia saas"

# Login no Supabase
supabase login

# Vincular ao projeto
supabase link --project-ref workzjugpmwbbbkxdgtu

# Deploy das 3 Edge Functions
supabase functions deploy create-tarot-reading
supabase functions deploy create-payment
supabase functions deploy spiritual-guide

# Verificar
supabase functions list
```

### 2️⃣ Configurar Secrets

```bash
supabase secrets set GROQ_API_KEY=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
supabase secrets set RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9
supabase secrets set PIXUP_CLIENT_ID=666ba0275e971f9045fee8e6e03499f5715a04f2753e52f79172faef5b05bb05
supabase secrets set PIXUP_CLIENT_SECRET=SEU_SECRET_AQUI
supabase secrets set PIXUP_BASE_URL=https://api.pixupbr.com/v2

# Verificar
supabase secrets list
```

### 3️⃣ Configurar Variáveis de Ambiente na Vercel

Acesse: https://vercel.com/seu-projeto/settings/environment-variables

```env
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://workzjugpmwbbbkxdgtu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Google Analytics (OPCIONAL - para tracking)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Meta Pixel (OPCIONAL - para tracking Facebook/Instagram)
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXX
```

### 4️⃣ Configurar Redirect URLs no Supabase Auth

1. Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/url-configuration
2. Adicione em "Redirect URLs":
   - `http://localhost:3000/**`
   - `https://astrotarot-hub.vercel.app/**`
   - `https://seu-dominio-custom.com/**` (se tiver)

---

## ✅ O QUE JÁ FOI FEITO

### Backend

- ✅ Schema SQL executado no Supabase
- ✅ Tabelas criadas (users, payments, tarot_readings, birth_charts)
- ✅ RLS Policies configuradas
- ✅ Triggers de auto-criação de perfil
- ✅ Edge Functions criadas (código pronto, aguardando deploy)

### Frontend

- ✅ `src/lib/auth-client.ts` - signUp, signIn, signOut, getCurrentUser
- ✅ `src/lib/tarot-client.ts` - createTarotReading, getUserReadings
- ✅ `src/lib/payment-client.ts` - createPayment, getUserPayments
- ✅ `src/lib/analytics.ts` - Sistema completo de tracking
- ✅ `middleware.ts` - Proteção de rotas com @supabase/ssr
- ✅ `src/app/layout.tsx` - Google Analytics + Meta Pixel
- ✅ `src/app/dashboard/page.tsx` - Dashboard com dados reais do Supabase
- ✅ Login/Register com tracking de eventos
- ✅ Cart com tracking de pagamentos
- ✅ Todas as páginas atualizadas para Supabase

### Edge Functions (Código pronto)

- ✅ `create-tarot-reading` (215 linhas) - GROQ + Tarot
- ✅ `create-payment` (160 linhas) - PixUp PIX
- ✅ `spiritual-guide` (112 linhas) - Chat com IA Luna

### Analytics

- ✅ Google Analytics 4 integrado
- ✅ Meta Pixel (Facebook) integrado
- ✅ Vercel Analytics integrado
- ✅ Tracking de eventos:
  - sign_up, login, logout
  - tarot_reading_started, tarot_reading_completed
  - payment_initiated, payment_completed, payment_failed
  - spiritual_guide_message
  - compatibility_check, personality_analysis
  - predictions_viewed, subscription_upgrade_clicked

---

## 🧪 TESTE APÓS DEPLOY

### 1. Teste Básico

```bash
# 1. Registro
http://localhost:3000/auth/register

# 2. Verificar no Supabase:
# - Authentication → Users (deve ter o usuário)
# - Table Editor → users (deve ter criado perfil automaticamente)

# 3. Login
http://localhost:3000/auth/login

# 4. Dashboard
http://localhost:3000/dashboard
# Deve mostrar:
# - Nome do usuário
# - Signo solar (se tiver data de nascimento)
# - Leituras anteriores (vazio inicialmente)
# - Ações rápidas
```

### 2. Teste de Leitura de Tarot

```bash
# 1. Ir para /challenge
# 2. Selecionar 4 cartas
# 3. Adicionar pergunta (opcional)
# 4. Clicar em "Ver Interpretação"
# 5. Verificar:
#    - Interpretação apareceu (GROQ funcionando)
#    - Leitura salva no banco
#    - Aparece no dashboard em "Minhas Últimas Leituras"
```

### 3. Teste de Pagamento

```bash
# 1. Ir para /cart
# 2. Clicar em "Finalizar Compra"
# 3. Verificar:
#    - QR Code PIX apareceu
#    - Código PIX em texto apareceu
#    - Tempo de expiração apareceu
#    - Pagamento salvo no banco
```

### 4. Teste de Guia Espiritual

```bash
# 1. Ir para /guia
# 2. Enviar mensagem
# 3. Verificar:
#    - Resposta da Luna apareceu
#    - Personalidade maternal e emojis (💜, ✨, 🌙, 💫)
```

### 5. Teste de Analytics (OPCIONAL)

```bash
# Se configurou GA_MEASUREMENT_ID e META_PIXEL_ID:

# 1. Fazer registro
# 2. Verificar evento "CompleteRegistration" em:
#    - Google Analytics → Realtime → Events
#    - Meta Pixel → Events Manager

# 3. Fazer pagamento
# 4. Verificar evento "Purchase" em:
#    - Google Analytics → Realtime → Events
#    - Meta Pixel → Events Manager
```

---

## 📊 INFORMAÇÕES IMPORTANTES

### PixUp API

- **URL Base:** `https://api.pixupbr.com/v2/`
- **Webhook:** Configure em https://pixupbr.com/dashboard
- **Webhook URL:** `https://astrotarot-hub.vercel.app/api/payment/webhook`
- **Documentação:** https://docs.pixupbr.com

### GROQ API

- **URL:** `https://api.groq.com/openai/v1/chat/completions`
- **Modelo:** `llama-3.3-70b-versatile`
- **Documentação:** https://console.groq.com/docs

### Supabase

- **Project ID:** `workzjugpmwbbbkxdgtu`
- **URL:** `https://workzjugpmwbbbkxdgtu.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu

---

## 🐛 TROUBLESHOOTING

### "Function not found"

```bash
supabase functions deploy create-tarot-reading
supabase functions deploy create-payment
supabase functions deploy spiritual-guide
```

### "GROQ_API_KEY not set"

```bash
supabase secrets set GROQ_API_KEY=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
```

### "Cannot connect to Supabase"

Criar/atualizar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://workzjugpmwbbbkxdgtu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### "Redirect URL not allowed"

1. Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/url-configuration
2. Adicione: `http://localhost:3000/**` e `https://astrotarot-hub.vercel.app/**`

---

## 📊 MONITORAMENTO

### Supabase

- **Logs:** https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/logs/edge-functions
- **Database:** https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/editor
- **Auth:** https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/users

### Vercel

- **Deployments:** https://vercel.com/seu-projeto/deployments
- **Analytics:** https://vercel.com/seu-projeto/analytics
- **Logs:** https://vercel.com/seu-projeto/logs

### Google Analytics (se configurado)

- **Realtime:** https://analytics.google.com/analytics/web/#/realtime
- **Events:** https://analytics.google.com/analytics/web/#/report/content-event-events

### Meta Pixel (se configurado)

- **Events Manager:** https://business.facebook.com/events_manager
- **Test Events:** https://business.facebook.com/events_manager/test-events

---

## 🎉 RESULTADO FINAL

Após executar os comandos acima, você terá:

✅ **Backend 100% no Supabase**

- PostgreSQL com RLS
- Supabase Auth (JWT nativo)
- Edge Functions para lógica de negócio

✅ **Frontend Otimizado**

- Next.js 15 com App Router
- Middleware de autenticação
- Dashboard com dados reais

✅ **Analytics Completo**

- Google Analytics 4
- Meta Pixel (Facebook/Instagram)
- Vercel Analytics

✅ **Funcionalidades**

- Registro e login funcionando
- Tarot com interpretação IA (GROQ)
- Pagamentos PIX (PixUp)
- Guia espiritual com IA Luna
- Dashboard personalizado
- Histórico de leituras

**🚀 Seu SaaS está pronto para receber usuários!**
