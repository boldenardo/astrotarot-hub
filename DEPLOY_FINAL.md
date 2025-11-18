# 🚀 Guia Final de Deploy - AstroTarot Hub

## ✅ STATUS ATUAL

- [x] Schema SQL executado no Supabase
- [x] Frontend migrado para Supabase Auth
- [x] Clients criados (auth, tarot, payment)
- [x] APIs locais removidas
- [x] Documentação limpa
- [x] Edge Functions criadas (código pronto)

---

## 🔥 DEPLOY DAS EDGE FUNCTIONS (OBRIGATÓRIO)

### 1. Instalar Supabase CLI (se ainda não tiver):
```bash
npm install -g supabase
```

### 2. Login e Vincular Projeto:
```bash
supabase login
supabase link --project-ref workzjugpmwbbbkxdgtu
```

### 3. Deploy das Functions:
```bash
cd "c:\Users\luiss\OneDrive\Área de Trabalho\Astrologia saas"

# Deploy create-tarot-reading
supabase functions deploy create-tarot-reading

# Deploy create-payment
supabase functions deploy create-payment
```

### 4. Configurar Secrets (CRÍTICO):
```bash
supabase secrets set GROQ_API_KEY=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
supabase secrets set RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9
supabase secrets set PIXUP_CLIENT_ID=666ba0275e971f9045fee8e6e03499f5715a04f2753e52f79172faef5b05bb05
supabase secrets set PIXUP_CLIENT_SECRET=SEU_SECRET_AQUI
```

---

## 🌐 HABILITAR AUTENTICAÇÃO EMAIL

1. Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/providers
2. Em "Email", certifique-se que está **habilitado**
3. **Desabilite** "Confirm email" (para testes rápidos)
4. Clique em "Save"

---

## 🧪 TESTAR LOCALMENTE

### 1. Iniciar servidor:
```bash
npm run dev
```

### 2. Testar Registro:
- Acesse: http://localhost:3000/auth/register
- Crie uma conta
- Verifique se redireciona para dashboard

### 3. Testar Login:
- Acesse: http://localhost:3000/auth/login
- Faça login
- Verifique se entra no dashboard

### 4. Testar Leitura de Tarot:
- No dashboard, clique em "Tarot Egípcio"
- Selecione 4 cartas
- Faça uma pergunta
- Verifique se a interpretação aparece

### 5. Verificar no Supabase:
- Table Editor: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/editor
- Veja tabela `users` - deve ter seu usuário
- Veja tabela `tarot_readings` - deve ter sua leitura

---

## 🚀 DEPLOY NA VERCEL

### 1. Conectar ao GitHub:
1. Acesse: https://vercel.com
2. Clique em "New Project"
3. Importe: `boldenardo/astrotarot-hub`

### 2. Configurar Variáveis de Ambiente:
Na Vercel, adicione:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://workzjugpmwbbbkxdgtu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvcmt6anVncG13YmJia3hkZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzU3OTAsImV4cCI6MjA1MjU1MTc5MH0.qXw0kKe3aKBJd5_m7dOHnfDLvtQWvM8xUvW9CjNXeYM

# GROQ (IA para interpretação)
GROQ_API_KEY=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

# RapidAPI (Astrologia)
RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9

# PixUp (Pagamento)
PIXUP_CLIENT_ID=666ba0275e971f9045fee8e6e03499f5715a04f2753e52f79172faef5b05bb05
PIXUP_CLIENT_SECRET=SEU_SECRET_AQUI
```

### 3. Deploy:
- Clique em "Deploy"
- Aguarde build (2-3 minutos)
- Teste no domínio gerado (ex: astrotarot-hub.vercel.app)

---

## 🔧 CONFIGURAR REDIRECT URLs NO SUPABASE

1. Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/url-configuration
2. Em "Redirect URLs", adicione:
   - `http://localhost:3000/**` (desenvolvimento)
   - `https://seu-dominio.vercel.app/**` (produção)
   - `https://astrotarot-hub.vercel.app/**` (se for esse o domínio)

---

## ✅ CHECKLIST FINAL

Antes de lançar, verifique:

- [ ] Schema SQL executado no Supabase (4 tabelas criadas)
- [ ] Edge Functions deployadas (create-tarot-reading, create-payment)
- [ ] Secrets configurados (GROQ, RAPIDAPI, PIXUP)
- [ ] Email auth habilitado no Supabase
- [ ] Teste local: registro funcionando
- [ ] Teste local: login funcionando
- [ ] Teste local: leitura de tarot funcionando
- [ ] Build na Vercel sem erros
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Redirect URLs configuradas no Supabase
- [ ] Teste produção: registro funcionando
- [ ] Teste produção: login funcionando
- [ ] Teste produção: leitura de tarot funcionando

---

## 🎯 COMANDOS RÁPIDOS

```bash
# 1. Deploy Edge Functions
supabase functions deploy create-tarot-reading
supabase functions deploy create-payment

# 2. Configurar Secrets
supabase secrets set GROQ_API_KEY=...
supabase secrets set RAPIDAPI_KEY=...
supabase secrets set PIXUP_CLIENT_ID=...
supabase secrets set PIXUP_CLIENT_SECRET=...

# 3. Build local (teste)
npm run build

# 4. Iniciar local
npm run dev

# 5. Commit e push (autodeploy Vercel)
git add -A
git commit -m "feat: ready for production"
git push origin main
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Function not found"
- Execute: `supabase functions deploy create-tarot-reading`
- Execute: `supabase functions deploy create-payment`

### Erro: "GROQ_API_KEY not set"
- Execute: `supabase secrets set GROQ_API_KEY=...`
- Verifique: `supabase secrets list`

### Erro: "User not found"
- Verifique se o trigger foi criado no SQL Editor
- Execute a Parte 3 do EXECUTE_SCHEMA_PASSO_A_PASSO.md novamente

### Erro de CORS
- Verifique Redirect URLs no Supabase Auth
- Adicione seu domínio Vercel

---

## 🎉 PRONTO PARA LANÇAR!

Após executar todos os passos acima:
1. ✅ Backend 100% no Supabase
2. ✅ Frontend usando Supabase Auth
3. ✅ Edge Functions deployadas
4. ✅ Sistema testado e funcional
5. ✅ Deploy na Vercel com autodeploy

**Seu app está pronto para receber usuários!** 🚀

---

**Última atualização:** Commit `bc18f4b`
**Status:** Pronto para deploy das Edge Functions
