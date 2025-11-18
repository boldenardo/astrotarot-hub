# 🚀 Deploy na Vercel - AstroTarot Hub

## ✅ Status Atual

- ✅ Código no GitHub: `https://github.com/boldenardo/astrotarot-hub`
- ✅ Branch: `main`
- ✅ Último commit: `8e8eb2f` - Análise de Abundância
- ✅ Build funcionando localmente
- ✅ Prisma configurado com `postinstall`

## 📋 Passo a Passo para Deploy

### 1️⃣ Acessar Vercel

1. Acesse: https://vercel.com
2. Faça login com sua conta GitHub
3. Clique em **"Add New..."** → **"Project"**

### 2️⃣ Importar Repositório

1. Selecione **"Import Git Repository"**
2. Procure por: `boldenardo/astrotarot-hub`
3. Clique em **"Import"**

### 3️⃣ Configurar Projeto

**Framework Preset:** Next.js (detectado automaticamente)

**Build Settings (deixar padrão):**

- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4️⃣ **IMPORTANTE: Configurar Variáveis de Ambiente**

Clique em **"Environment Variables"** e adicione:

#### 🔐 Essenciais (obrigatórias):

```bash
# Database
DATABASE_URL=mongodb+srv://seu-usuario:senha@cluster.mongodb.net/astrotarot

# JWT Authentication
JWT_SECRET=seu-secret-super-seguro-minimo-32-caracteres-aleatorios
JWT_EXPIRES_IN=7d

# GROQ AI (já configurada)
GROQ_API_KEY=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

# RapidAPI (Astrologia)
RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9

# PixUp Payment Gateway
PIXUP_CLIENT_ID=seu-client-id-real
PIXUP_CLIENT_SECRET=9237b2e061cb412ea6c5f751071f31debe33fb9ac04c73387c2b7ad21e24df7d
PIXUP_WEBHOOK_SECRET=seu-webhook-secret
PIXUP_BASE_URL=https://api.pixupbr.com/v1

# App Configuration
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NODE_ENV=production
```

#### ⚠️ **Ações Necessárias:**

1. **MongoDB Atlas** (obrigatório):

   - Criar cluster gratuito em: https://cloud.mongodb.com
   - Obter connection string
   - Substituir `DATABASE_URL`

2. **JWT_SECRET** (obrigatório):

   - Gerar com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Ou use: `openssl rand -hex 32`

3. **PIXUP_CLIENT_ID** (obrigatório para pagamentos):

   - Obter client_id real da conta PixUp
   - Substituir na variável

4. **NEXT_PUBLIC_APP_URL**:
   - Após deploy, atualizar com URL da Vercel

### 5️⃣ Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (3-5 minutos)
3. ✅ Pronto! Seu site estará no ar

### 6️⃣ Pós-Deploy

#### Atualizar Webhook PixUp:

```
URL do Webhook: https://seu-dominio.vercel.app/api/payment/webhook
```

#### Testar Funcionalidades:

- ✅ `/` - Landing page
- ✅ `/auth/register` - Registro
- ✅ `/auth/login` - Login
- ✅ `/dashboard` - Mapa astral
- ✅ `/predictions` - Previsões diárias
- ✅ `/abundance` - Análise de abundância ⭐ NOVO
- ✅ `/tarot` - Leitura de tarot
- ✅ `/compatibility` - Compatibilidade

## 🔧 Troubleshooting

### Erro: "Module not found: @prisma/client"

**Solução:** Já resolvido! O `postinstall` script gera o Prisma Client automaticamente.

### Erro: "Invalid JWT_SECRET"

**Solução:** Certifique-se que JWT_SECRET tem no mínimo 32 caracteres.

### Erro: "Database connection failed"

**Solução:** Verifique se:

1. MongoDB Atlas está ativo
2. IP da Vercel está na whitelist (use `0.0.0.0/0` para permitir todos)
3. Connection string está correta

### Erro: "GROQ API Key invalid"

**Solução:** A chave já está configurada. Se der erro, verifique se não há espaços extras.

## 📊 Monitoramento

### Logs da Vercel:

1. Acesse seu projeto na Vercel
2. Vá em **"Deployments"**
3. Clique no deployment atual
4. Veja **"Function Logs"** para erros

### Teste de APIs:

```bash
# Testar previsões
curl https://seu-dominio.vercel.app/api/predictions

# Testar abundância
curl https://seu-dominio.vercel.app/api/abundance
```

## 🎯 Checklist Final

- [ ] MongoDB Atlas configurado
- [ ] JWT_SECRET gerado (32+ caracteres)
- [ ] GROQ_API_KEY configurada
- [ ] RAPIDAPI_KEY configurada
- [ ] PixUp credentials configuradas
- [ ] Deploy realizado com sucesso
- [ ] Site acessível
- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] APIs respondem corretamente

## 🚀 Deploy Automático

Após configuração inicial, todo `git push` para a branch `main` irá:

1. ✅ Acionar build automático na Vercel
2. ✅ Executar testes
3. ✅ Fazer deploy automaticamente
4. ✅ Notificar no GitHub

## 📞 Suporte

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

**Versão:** 1.0.0  
**Última atualização:** 18/11/2025  
**Commit:** 8e8eb2f
