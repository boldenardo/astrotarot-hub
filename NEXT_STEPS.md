# 🚀 Próximos Passos - Supabase Setup

## ✅ O que já foi feito:

- [x] Todas as rotas de API migradas para Supabase
- [x] Stripe removido (usando apenas PixUp)
- [x] Credenciais do Supabase configuradas no `.env`
- [x] Schema SQL criado em `supabase/schema.sql`
- [x] Código commitado no GitHub

---

## 📋 O QUE FAZER AGORA:

### 1. Executar o Schema SQL no Supabase (OBRIGATÓRIO)

**Acesse:** https://supabase.com/dashboard/project/workzjugpmwbbkxdgtu

1. No menu lateral, clique em **SQL Editor**
2. Clique em **"New Query"**
3. Abra o arquivo `supabase/schema.sql` no VS Code
4. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** (ou Ctrl+Enter)
7. Verifique se apareceu **"Success. No rows returned"**

**Verificação:**

- Vá em **Table Editor** no menu lateral
- Você deve ver 4 tabelas: `users`, `payments`, `tarot_readings`, `birth_charts`

---

### 2. Testar o Backend Localmente

```bash
# Iniciar servidor
npm run dev

# Acessar no navegador
http://localhost:3000
```

**Testes a fazer:**

#### A. Criar Nova Conta

1. Acesse `/auth/register`
2. Crie uma conta
3. Verifique no Supabase Table Editor se o usuário foi criado

#### B. Fazer Login

1. Acesse `/auth/login`
2. Faça login com a conta criada
3. Verifique se recebeu o token JWT

#### C. Fazer Tiragem de Tarot

1. Acesse `/tarot` (autenticado)
2. Faça uma tiragem
3. Verifique se foi salvo em `tarot_readings`

#### D. Criar Pagamento

1. Acesse `/cart`
2. Tente criar um pagamento
3. Verifique se apareceu QR Code do PIX
4. Verifique se foi salvo em `payments`

---

### 3. Atualizar Variáveis no Vercel (Para Deploy)

**Acesse:** https://vercel.com/seu-time/astrotarot-hub/settings/environment-variables

Adicione as seguintes variáveis:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://workzjugpmwbbkxdgtu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvcmt6anVncG13YmJia3hkZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTk1NDksImV4cCI6MjA3ODk5NTU0OX0.JHNbPakQ3hX14wM1h9HWhzYa8dpHEdgNxbOJBvxhIdc

# JWT (mesmo do .env local)
JWT_SECRET=astrotarot-super-secret-key-change-in-production-2025
JWT_EXPIRES_IN=7d

# APIs
RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9
GROQ_API_KEY=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

# PixUp
PIXUP_API_KEY=666ba0275e971f9045fee8e6e03499f5715a04f2753e52f79172faef5b05bb05
PIXUP_API_SECRET=seu_secret_key_aqui
PIXUP_WEBHOOK_SECRET=seu_webhook_secret_aqui
PIXUP_BASE_URL=https://api.pixupbr.com/v1

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NODE_ENV=production
```

**Importante:**

- Marque todas como **"Production"**, **"Preview"** e **"Development"**
- Clique em **"Save"**

---

### 4. Deploy no Vercel

```bash
# Push para GitHub (se ainda não fez)
git push origin main
```

O Vercel vai detectar automaticamente e fazer o deploy.

**Ou deploy manual:**

```bash
npm run build
vercel --prod
```

---

### 5. Configurar Webhook do PixUp

**Quando o site estiver no ar:**

1. Acesse o dashboard do PixUp
2. Configure webhook URL: `https://seu-dominio.vercel.app/api/payment/webhook`
3. Ative os eventos:
   - `payment.paid`
   - `payment.expired`
   - `payment.cancelled`
   - `subscription.renewed`
   - `subscription.failed`
   - `subscription.cancelled`

---

## 🔍 Verificação Final (Checklist)

### Backend (Supabase)

- [ ] Schema SQL executado com sucesso
- [ ] 4 tabelas criadas (users, payments, tarot_readings, birth_charts)
- [ ] RLS policies ativas
- [ ] Indexes criados

### Testes Locais

- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Tiragem de tarot salva no banco
- [ ] Pagamento cria registro no Supabase
- [ ] Histórico de leituras carrega

### Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build passa sem erros
- [ ] Site acessível
- [ ] Testes em produção funcionam

### Integração PixUp

- [ ] Webhook configurado
- [ ] Pagamento real testado
- [ ] Notificação de pagamento recebida
- [ ] Assinatura ativa após pagamento

---

## 🐛 Troubleshooting

### Erro: "relation 'users' does not exist"

**Causa:** Schema SQL não foi executado.  
**Solução:** Execute o arquivo `supabase/schema.sql` no SQL Editor.

### Erro: "Invalid API key"

**Causa:** Usando Service Role Key ao invés de Anon Key.  
**Solução:** Use a **Anon Key** (pública) nas variáveis NEXT*PUBLIC*\*.

### Erro: Build falha no Vercel

**Causa:** Variáveis de ambiente não configuradas.  
**Solução:** Configure todas as variáveis no Vercel Settings.

### Erro: Webhook não recebe notificações

**Causa:** URL do webhook incorreta ou eventos não configurados.  
**Solução:** Verifique URL e eventos ativos no dashboard do PixUp.

---

## 📊 Estrutura do Banco (Supabase)

```
users (tabela principal)
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── password (TEXT, hashed)
├── subscription_plan (FREE | SINGLE_READING | PREMIUM_MONTHLY)
├── subscription_status (active | pending | suspended | cancelled)
├── readings_left (INTEGER, default 4)
└── timestamps (created_at, updated_at)

payments (pagamentos)
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── amount (DECIMAL)
├── status (PENDING | COMPLETED | FAILED | CANCELLED)
├── payment_type (SINGLE_READING | SUBSCRIPTION)
├── pixup_payment_id (TEXT)
└── timestamps

tarot_readings (leituras)
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── deck_type (NORMAL | EGIPCIO)
├── spread_type (SINGLE | THREE_CARD | CELTIC_CROSS)
├── cards (JSONB)
├── interpretation (TEXT)
├── is_premium (BOOLEAN)
└── timestamps

birth_charts (mapas astrais)
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── birth_date, birth_time, birth_location
├── chart_data (JSONB)
├── transits (JSONB)
└── timestamps
```

---

## 🎯 Status do Projeto

**Migração:** ✅ 100% Completa  
**Stripe:** ❌ Removido  
**PixUp:** ✅ Integrado  
**Supabase:** ✅ Configurado (precisa executar schema)  
**Deploy:** ⏳ Pendente (após executar schema)

---

## 📞 Suporte

- **Supabase Docs:** https://supabase.com/docs
- **PixUp Docs:** https://pixupbr.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

**🚀 PRÓXIMO PASSO IMEDIATO:** Executar `supabase/schema.sql` no Supabase Dashboard!
