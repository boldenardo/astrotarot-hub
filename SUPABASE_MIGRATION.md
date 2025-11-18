# 🗄️ Migração MongoDB → Supabase

## ✅ Migração Concluída

O projeto foi completamente migrado de **MongoDB + Prisma** para **Supabase (PostgreSQL)**.

---

## 📋 O Que Foi Feito

### 1. ✅ Desinstalação do Prisma

```bash
npm uninstall @prisma/client prisma
```

- Removidos 7 pacotes do Prisma
- `prisma/` diretório deletado
- `src/lib/prisma.ts` deletado

### 2. ✅ Instalação do Supabase

```bash
npm install @supabase/supabase-js
```

- Adicionados 9 pacotes do Supabase
- Cliente Supabase configurado

### 3. ✅ Criação do Cliente Supabase

**Arquivo:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interfaces TypeScript
export interface User { id, email, password, subscription_plan, ... }
export interface Payment { id, user_id, amount, status, ... }
export interface TarotReading { id, user_id, cards, interpretation, ... }
export interface BirthChart { id, user_id, birth_date, chart_data, ... }

// Helper functions
export const getUserByEmail = async (email: string) => { ... }
export const createUser = async (userData: Partial<User>) => { ... }
export const updateUser = async (userId: string, updates: Partial<User>) => { ... }
export const createPayment = async (paymentData: Partial<Payment>) => { ... }
export const createTarotReading = async (reading: Partial<TarotReading>) => { ... }
export const getUserReadings = async (userId: string) => { ... }
```

### 4. ✅ Schema SQL do Supabase

**Arquivo:** `supabase/schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  subscription_plan TEXT DEFAULT 'FREE' CHECK (subscription_plan IN ('FREE', 'SINGLE_READING', 'PREMIUM_MONTHLY')),
  subscription_status TEXT DEFAULT 'active',
  readings_left INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments, Tarot Readings, Birth Charts tables...
-- Row Level Security policies
-- Indexes for performance
-- Triggers for updated_at
```

### 5. ✅ Rotas de Autenticação Atualizadas

**`src/app/api/auth/register/route.ts`:**

```typescript
import { getUserByEmail, createUser } from "@/lib/supabase";

// Verifica se usuário existe
const existingUser = await getUserByEmail(validatedData.email);

// Cria novo usuário
const user = await createUser({
  email: validatedData.email,
  password: passwordHash,
  subscription_plan: "FREE",
  readings_left: 4,
});
```

**`src/app/api/auth/login/route.ts`:**

```typescript
import { getUserByEmail } from "@/lib/supabase";

// Busca usuário
const user = await getUserByEmail(validatedData.email);

// Verifica senha e gera token
```

### 6. ✅ Middleware de Autenticação Atualizado

**`src/lib/authMiddleware.ts`:**

```typescript
import { supabase } from "@/lib/supabase";

export async function requireAuth(req: NextRequest) {
  // Busca usuário no Supabase
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", decoded.userId)
    .single();

  return { user };
}

export async function consumeReading(userId: string) {
  // Consome uma tiragem
  await supabase
    .from("users")
    .update({ readings_left: user.readings_left - 1 })
    .eq("id", userId);
}
```

### 7. ✅ Webhooks de Pagamento Atualizados

**`src/app/api/payment/webhook/route.ts`:**

```typescript
import { supabase } from "@/lib/supabase";

async function handlePaymentPaid(data: any) {
  // Busca pagamento
  const { data: payment } = await supabase
    .from("payments")
    .select("*, users(*)")
    .eq("pixup_payment_id", data.id)
    .single();

  // Atualiza status
  await supabase
    .from("payments")
    .update({ status: "COMPLETED" })
    .eq("id", payment.id);

  // Adiciona tiragem ou ativa premium
  await supabase
    .from("users")
    .update({
      subscription_plan: "PREMIUM_MONTHLY",
      subscription_status: "active",
    })
    .eq("id", payment.user_id);
}
```

### 8. ✅ Arquivos de Configuração Limpos

**`package.json`:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", // Removido "prisma generate"
    "start": "next start",
    "lint": "next lint"
    // Removidos: prisma:*, postinstall
  }
}
```

**`vercel.json`:**

```json
{
  "buildCommand": "next build" // Removido "prisma generate"
}
```

**`.env.example`:**

```bash
# Supabase (substituiu DATABASE_URL)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Removido: DATABASE_URL, STRIPE_* (legacy)
```

---

## 🚀 Próximos Passos

### 1. Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Configure:
   - **Organization:** Crie ou selecione uma
   - **Name:** `astrotarot-hub`
   - **Database Password:** (salve em local seguro)
   - **Region:** South America (São Paulo) - `sa-east-1`
   - **Pricing Plan:** Free

### 2. Executar o Schema SQL

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique em **"New Query"**
3. Copie todo o conteúdo de `supabase/schema.sql`
4. Cole no editor e clique em **"Run"**
5. Verifique se todas as tabelas foram criadas em **Table Editor**

### 3. Configurar Variáveis de Ambiente

No Supabase Dashboard, vá para **Settings → API**:

```bash
# Copie estas informações:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Arquivo `.env.local` (criar):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon"

# JWT
JWT_SECRET="seu-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="7d"

# APIs
RAPIDAPI_KEY="sua-rapidapi-key"
GROQ_API_KEY="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"

# PixUp
PIXUP_CLIENT_ID="seu-client-id"
PIXUP_CLIENT_SECRET="9237b2e061cb412ea6c5f751071f31debe33fb9ac04c73387c2b7ad21e24df7d"
PIXUP_WEBHOOK_SECRET="seu-webhook-secret"
PIXUP_BASE_URL="https://api.pixupbr.com/v1"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Testar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

**Testes a fazer:**

1. ✅ Criar nova conta (registro)
2. ✅ Fazer login
3. ✅ Acessar dashboard
4. ✅ Fazer tiragem de tarot
5. ✅ Verificar contador de leituras

### 5. Deploy no Vercel

1. Commit e push das mudanças:

```bash
git add .
git commit -m "feat: migração completa para Supabase"
git push origin main
```

2. No Vercel Dashboard:

   - Vá para **Settings → Environment Variables**
   - Adicione todas as variáveis de `.env.local`
   - Clique em **"Redeploy"**

3. Configure Webhook do PixUp:
   - URL: `https://seu-dominio.vercel.app/api/payment/webhook`
   - Events: `payment.paid`, `subscription.renewed`, etc.

---

## 📊 Comparação: Antes vs Depois

| Aspecto             | MongoDB + Prisma              | Supabase                       |
| ------------------- | ----------------------------- | ------------------------------ |
| **Setup**           | MongoDB Atlas + Prisma Client | Apenas Supabase                |
| **Schema**          | `prisma/schema.prisma`        | `supabase/schema.sql`          |
| **Queries**         | Prisma ORM                    | Supabase Client (SQL-like)     |
| **Auth**            | JWT manual                    | JWT + Supabase Auth (opcional) |
| **Deploy**          | `prisma generate` necessário  | Zero configuração extra        |
| **Latência**        | Variável                      | Otimizada (edge)               |
| **Custo Free Tier** | 512MB storage                 | 500MB DB + 1GB storage         |
| **Real-time**       | ❌ Não disponível             | ✅ Built-in                    |
| **RLS**             | ❌ Manual                     | ✅ Nativo                      |

---

## 🔒 Segurança Row Level Security (RLS)

O schema inclui políticas de segurança que garantem que:

```sql
-- Usuários só podem ver seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Usuários só podem atualizar seus próprios dados
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Pagamentos só podem ser visualizados pelo dono
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id::text);
```

**Nota:** Como estamos usando JWT customizado, as políticas RLS estão configuradas mas não são aplicadas automaticamente. Para ativar, seria necessário migrar para Supabase Auth.

---

## 🐛 Troubleshooting

### Erro: "SUPABASE_URL is not defined"

**Causa:** Variáveis de ambiente não configuradas.

**Solução:**

1. Copie `.env.example` para `.env.local`
2. Preencha com suas credenciais do Supabase
3. Reinicie o servidor: `npm run dev`

### Erro: "relation 'users' does not exist"

**Causa:** Schema SQL não foi executado no Supabase.

**Solução:**

1. Acesse Supabase Dashboard → SQL Editor
2. Execute todo o conteúdo de `supabase/schema.sql`
3. Verifique em Table Editor se as tabelas foram criadas

### Erro: "Invalid API key"

**Causa:** Usando Service Role Key ao invés de Anon Key.

**Solução:**

- Use a **Anon Key** (pública) para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- A Service Role Key é secreta e só deve ser usada no backend

### Erro de CORS no Supabase

**Causa:** Domínio não autorizado.

**Solução:**

1. Supabase Dashboard → Authentication → URL Configuration
2. Adicione seus domínios:
   - `http://localhost:3000` (desenvolvimento)
   - `https://seu-dominio.vercel.app` (produção)

---

## 📚 Referências

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## ✅ Checklist de Migração

- [x] Desinstalar Prisma
- [x] Instalar Supabase
- [x] Criar cliente Supabase
- [x] Criar schema SQL
- [x] Atualizar rotas de autenticação
- [x] Atualizar middleware
- [x] Atualizar webhooks de pagamento
- [x] Remover arquivos do Prisma
- [x] Atualizar package.json
- [x] Atualizar vercel.json
- [x] Atualizar .env.example
- [ ] **Criar projeto no Supabase**
- [ ] **Executar schema SQL**
- [ ] **Configurar variáveis de ambiente**
- [ ] **Testar localmente**
- [ ] **Deploy no Vercel**

---

## 🎉 Benefícios da Migração

1. **✅ Simplicidade:** Menos configuração, menos dependências
2. **✅ Performance:** Queries otimizadas, conexões pooling
3. **✅ Real-time:** Suporte nativo para subscriptions
4. **✅ Segurança:** RLS nativo, auth integrado
5. **✅ Escalabilidade:** Auto-scaling no PostgreSQL
6. **✅ Custo:** Free tier mais generoso
7. **✅ DX:** Dashboard visual, SQL editor, logs em tempo real

---

**🚀 Status:** Migração de código completa. Aguardando configuração do projeto Supabase.
