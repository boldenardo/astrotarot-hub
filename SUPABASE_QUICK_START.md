# 🚀 Comandos Rápidos - Deploy do Backend no Supabase

## 📋 PRÉ-REQUISITOS

```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalação
supabase --version
```

---

## 🔑 PASSO 1: Login e Configuração

```bash
# 1. Login no Supabase
supabase login

# 2. Vincular com projeto
supabase link --project-ref workzjugpmwbbbkxdgtu

# 3. Verificar conexão
supabase status
```

---

## 🗄️ PASSO 2: Executar Schema SQL

### Opção A: Via Dashboard (RECOMENDADO)

1. Abra: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/sql/new
2. Cole todo o conteúdo de `supabase/schema.sql`
3. Clique em "Run" (Ctrl+Enter)
4. Verifique "Success. No rows returned"

### Opção B: Via CLI

```bash
supabase db push
```

### Verificar Tabelas Criadas:

```bash
# Ver todas as tabelas
supabase db diff

# Ou acesse:
# https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/editor
```

---

## ⚡ PASSO 3: Configurar Variáveis de Ambiente (Secrets)

```bash
# GROQ API
supabase secrets set GROQ_API_KEY=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

# RapidAPI (AstroSeek)
supabase secrets set RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9

# PixUp Payment Gateway
supabase secrets set PIXUP_CLIENT_ID=666ba0275e971f9045fee8e6e03499f5715a04f2753e52f79172faef5b05bb05
supabase secrets set PIXUP_CLIENT_SECRET=seu_secret_aqui

# Verificar secrets configurados
supabase secrets list
```

---

## 🚀 PASSO 4: Deploy das Edge Functions

```bash
# Navegar para pasta do projeto
cd "c:\Users\luiss\OneDrive\Área de Trabalho\Astrologia saas"

# Deploy função de leitura do Tarot
supabase functions deploy create-tarot-reading

# Deploy função de pagamento
supabase functions deploy create-payment

# Verificar functions deployadas
supabase functions list
```

### URLs das Functions (após deploy):

- **Tarot Reading**: `https://workzjugpmwbbbkxdgtu.supabase.co/functions/v1/create-tarot-reading`
- **Payment**: `https://workzjugpmwbbbkxdgtu.supabase.co/functions/v1/create-payment`

---

## 🔐 PASSO 5: Configurar Autenticação

### 5.1 - Habilitar Email/Password:

1. Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/providers
2. Em "Email", certifique-se que está **habilitado**
3. **Desabilite** "Confirm email" (para testes rápidos)
4. Salvar

### 5.2 - Configurar URL do Site:

1. Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/url-configuration
2. Site URL: `http://localhost:3000` (desenvolvimento) ou `https://seu-dominio.vercel.app` (produção)
3. Redirect URLs:
   - `http://localhost:3000/**`
   - `https://seu-dominio.vercel.app/**`

### 5.3 - Testar Autenticação:

```bash
# Via Dashboard
# https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/users

# Criar usuário de teste manualmente
```

---

## 🧪 PASSO 6: Testar Edge Functions

### Teste 1: Registro de Usuário (via Supabase Auth SDK)

```javascript
// No navegador ou em um arquivo de teste
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://workzjugpmwbbbkxdgtu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvcmt6anVncG13YmJia3hkZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzU3OTAsImV4cCI6MjA1MjU1MTc5MH0.qXw0kKe3aKBJd5_m7dOHnfDLvtQWvM8xUvW9CjNXeYM"
);

// Registrar
const { data, error } = await supabase.auth.signUp({
  email: "teste@example.com",
  password: "senha123",
  options: {
    data: {
      name: "Teste User",
    },
  },
});

console.log("User:", data.user);
console.log("Session:", data.session);
```

### Teste 2: Criar Leitura de Tarot

```javascript
// Depois de fazer login
const { data, error } = await supabase.functions.invoke(
  "create-tarot-reading",
  {
    body: {
      selectedCards: [
        { name: "A Sacerdotisa", number: 2, meaning: "Intuição e mistério" },
        { name: "O Mago", number: 1, meaning: "Manifestação e poder" },
      ],
      question: "Qual o meu propósito?",
    },
  }
);

console.log("Reading:", data);
```

### Teste 3: Criar Pagamento

```javascript
const { data, error } = await supabase.functions.invoke("create-payment", {
  body: {
    type: "SINGLE_READING",
    customerName: "Teste User",
  },
});

console.log("Payment:", data);
console.log("QR Code:", data.payment.qrCode);
```

---

## 📊 PASSO 7: Monitoramento

### Ver Logs das Functions:

```bash
# Logs em tempo real
supabase functions logs create-tarot-reading
supabase functions logs create-payment

# Ou via Dashboard:
# https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/logs/edge-functions
```

### Ver Logs do Database:

```bash
# https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/logs/postgres-logs
```

### Ver Usuários Cadastrados:

```bash
# https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/users
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Supabase CLI instalado e logado
- [ ] Projeto vinculado (workzjugpmwbbbkxdgtu)
- [ ] Schema SQL executado (4 tabelas criadas)
- [ ] Secrets configurados (GROQ, RAPIDAPI, PIXUP)
- [ ] Edge Functions deployadas (create-tarot-reading, create-payment)
- [ ] Auth Email/Password habilitado
- [ ] Trigger `on_auth_user_created` funcionando
- [ ] Teste de registro funcionando
- [ ] Teste de leitura funcionando
- [ ] Teste de pagamento funcionando

---

## 🔄 COMANDOS ÚTEIS

```bash
# Redeploy rápido de uma function
supabase functions deploy create-tarot-reading --no-verify-jwt

# Ver status do projeto
supabase status

# Reset do database (CUIDADO!)
supabase db reset

# Executar migrations
supabase db push

# Ver diff do database
supabase db diff

# Testar function localmente
supabase functions serve create-tarot-reading
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Function not found"

```bash
# Verificar se function foi deployada
supabase functions list

# Redeploy
supabase functions deploy create-tarot-reading
```

### Erro: "Row Level Security policy violation"

```bash
# Verificar se trigger foi criado
# Ir no SQL Editor e executar:
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Erro: "GROQ_API_KEY not set"

```bash
# Verificar secrets
supabase secrets list

# Reconfigurar
supabase secrets set GROQ_API_KEY=sua_chave
```

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Executar todos os comandos acima
2. ✅ Testar registro, login e leituras
3. ✅ Atualizar frontend para usar `supabase.auth` e `supabase.functions`
4. ✅ Remover rotas `/api/*` locais
5. ✅ Deploy na Vercel
6. ✅ Configurar domínio customizado

---

**🎯 Status:** Pronto para executar! Comece pelo PASSO 1.
