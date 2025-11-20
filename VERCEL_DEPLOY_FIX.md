# 🚀 Fix Deploy Vercel - Configuração Correta

## ❌ ERRO IDENTIFICADO

**URL do Supabase estava ERRADA** no arquivo `.env` e provavelmente na Vercel também!

```
❌ ERRADO:  https://workzjugpmwbbkxdgtu.supabase.co  (2 'b's)
✅ CORRETO: https://workzjugpmwbbbkxdgtu.supabase.co (3 'b's)
```

---

## ✅ VARIÁVEIS DE AMBIENTE NA VERCEL (COPIAR E COLAR)

Acesse: https://vercel.com/seu-usuario/astrotarot-hub/settings/environment-variables

### 🔑 Variáveis OBRIGATÓRIAS

```env
NEXT_PUBLIC_SUPABASE_URL=https://workzjugpmwbbbkxdgtu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvcmt6anVncG13YmJia3hkZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NDM1MTUsImV4cCI6MjA0NzUxOTUxNX0.B_5K_x5V4qKLdkrQhj2Rrq7vqNFr7ZDiTqL8Q4Hx0yM
```

### 🎯 Variáveis OPCIONAIS (Analytics)

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXX
```

### 💰 Variáveis INTERNAS (não usar na Vercel - apenas Edge Functions)

Estas vão como **Secrets no Supabase**, NÃO na Vercel:

```bash
# Configurar no Supabase CLI:
supabase secrets set GROQ_API_KEY=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
supabase secrets set RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9
supabase secrets set PIXUP_CLIENT_ID=666ba0275e971f9045fee8e6e03499f5715a04f2753e52f79172faef5b05bb05
supabase secrets set PIXUP_CLIENT_SECRET=SEU_SECRET_AQUI
supabase secrets set PIXUP_BASE_URL=https://api.pixupbr.com/v2
supabase secrets set PIXUP_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET_AQUI
```

---

## 📝 PASSO A PASSO PARA CORRIGIR

### 1. Atualizar Variáveis na Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione projeto `astrotarot-hub`
3. Vá em **Settings → Environment Variables**
4. **PROCURE E DELETE** as variáveis antigas:
   - `NEXT_PUBLIC_SUPABASE_URL` (com URL errada)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (com key antiga)
5. **ADICIONE AS NOVAS** (copie do bloco acima):
   - Nome: `NEXT_PUBLIC_SUPABASE_URL`
     - Valor: `https://workzjugpmwbbbkxdgtu.supabase.co`
     - Aplicar a: `Production`, `Preview`, `Development`
   - Nome: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvcmt6anVncG13YmJia3hkZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NDM1MTUsImV4cCI6MjA0NzUxOTUxNX0.B_5K_x5V4qKLdkrQhj2Rrq7vqNFr7ZDiTqL8Q4Hx0yM`
     - Aplicar a: `Production`, `Preview`, `Development`

### 2. Fazer Redeploy

```bash
# Commit das correções locais
git add .
git commit -m "fix: corrigir URL Supabase (3 b's) e atualizar anon key"
git push origin main
```

Ou pelo painel:

1. Vá em **Deployments**
2. Clique nos 3 pontos do último deploy
3. Clique em **Redeploy**

### 3. Verificar Build

Aguarde o build completar e procure por:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

---

## 🔍 PROBLEMAS COMUNS E SOLUÇÕES

### Erro: "Module not found" ou "Cannot find module"

```bash
# Verificar package.json tem todas as dependências
npm install
```

### Erro: "Invalid URL" ou "Failed to fetch"

```
Causa: URL do Supabase errada (2 'b's ao invés de 3)
Solução: Verificar NEXT_PUBLIC_SUPABASE_URL na Vercel
```

### Erro: "Unauthorized" ou "Invalid API key"

```
Causa: ANON_KEY desatualizada
Solução: Usar a key correta (veja acima)
```

### Erro 404 nas Edge Functions (create-payment, etc)

```
Causa: Edge Functions não deployadas no Supabase
Solução: Ver OPÇÃO 2 no arquivo anterior (deploy via painel web)
```

---

## ✅ CHECKLIST FINAL

- [ ] Arquivo `.env` local corrigido (URL com 3 'b's)
- [ ] Variáveis atualizadas na Vercel
- [ ] Push do commit para main
- [ ] Build da Vercel passou com sucesso
- [ ] Site abrindo sem erros 500/404
- [ ] Login/Register funcionando
- [ ] Dashboard carregando dados do Supabase

---

## 🆘 SE O BUILD CONTINUAR FALHANDO

Envie o LOG COMPLETO do build (não só o início). Procure por:

- `Error:`
- `Failed to compile`
- `Module not found`
- Linhas em vermelho

Copie TODA a saída do terminal de build e me envie.

---

## 📞 PRÓXIMOS PASSOS APÓS DEPLOY OK

1. ✅ Deploy Edge Functions (create-payment, etc)
2. ✅ Configurar webhook PixUp
3. ✅ Testar fluxo completo de pagamento
4. ✅ Configurar GA4 e Meta Pixel (opcional)
