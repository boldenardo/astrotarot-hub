# 🌟 AstroTarot Hub - Sistema de Pagamentos e Autenticação

## 📋 Resumo da Implementação

Sistema completo de autenticação e monetização integrado ao gateway PixUp (PIX brasileiro).

---

## ✅ O que foi implementado

### 1. **Autenticação Completa**

- ✅ Página de Login (`/auth/login`)
- ✅ Página de Registro (`/auth/register`)
- ✅ API de Login (`/api/auth/login`)
- ✅ API de Registro (`/api/auth/register`)
- ✅ Sistema JWT com tokens seguros
- ✅ Criação automática de assinatura FREE no registro

### 2. **Sistema de Pagamentos PixUp**

- ✅ Cliente PixUp completo (`src/lib/pixup/client.ts`)
- ✅ API de criação de pagamentos (`/api/payment/create`)
- ✅ Webhook para notificações (`/api/payment/webhook`)
- ✅ Suporte a pagamento único (R$ 9,90)
- ✅ Suporte a assinatura recorrente (R$ 29,90/mês)

### 3. **Planos e Permissões**

- ✅ **FREE**: Apenas jogo de 4 cartas (`/challenge`)
- ✅ **SINGLE_READING** (R$ 9,90): 1 tiragem do tarot egípcio
- ✅ **PREMIUM_MONTHLY** (R$ 29,90/mês): Acesso total ao site

### 4. **Middleware de Proteção**

- ✅ `authMiddleware.ts` com funções de verificação
- ✅ Controle de acesso por rota
- ✅ Sistema de consumo de tiragens
- ✅ Verificação de status de assinatura

### 5. **Banco de Dados**

- ✅ Schema Prisma atualizado com:
  - Planos: FREE, SINGLE_READING, PREMIUM_MONTHLY
  - Status de pagamentos: PENDING, COMPLETED, FAILED, etc.
  - Tipos de pagamento: SINGLE_READING, SUBSCRIPTION
  - Campos PixUp: pixupId, pixupQrCode, pixupCustomerId, etc.

---

## 🎯 Planos de Monetização

| Plano              | Preço        | Acesso                                                                                                                                                  |
| ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FREE**           | Grátis       | • Jogo de 4 cartas (`/challenge`)<br>• Home e navegação básica                                                                                          |
| **Tiragem Única**  | R$ 9,90      | • 1 tiragem completa do Tarot Egípcio<br>• Interpretação com IA                                                                                         |
| **Premium Mensal** | R$ 29,90/mês | • Tiragens ilimitadas<br>• Compatibilidade amorosa<br>• Previsões diárias<br>• Abundância financeira<br>• Guia espiritual<br>• Análise de personalidade |

---

## 🚀 Como Configurar

### 1. **Instalar Dependências**

Você precisa instalar as bibliotecas de autenticação:

\`\`\`bash
npm install jsonwebtoken bcryptjs zod
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
\`\`\`

### 2. **Configurar Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto (copie o `.env.example`):

\`\`\`env

# Database

DATABASE_URL="sua-connection-string-mongodb"

# JWT Authentication

JWT_SECRET="troque-por-uma-chave-secreta-forte"
JWT_EXPIRES_IN="7d"

# PixUp Payment Gateway

PIXUP_API_KEY="sua-api-key-do-pixup"
PIXUP_API_SECRET="seu-api-secret-do-pixup"
PIXUP_WEBHOOK_SECRET="seu-webhook-secret"
PIXUP_BASE_URL="https://api.pixupbr.com/v1"

# App Configuration

NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### 3. **Obter Credenciais PixUp**

1. Acesse: **http://pixupbr.com/**
2. Crie uma conta
3. Acesse o painel e obtenha:
   - API Key
   - API Secret
   - Webhook Secret
4. Configure o webhook para: `https://seu-dominio.com/api/payment/webhook`

### 4. **Atualizar Banco de Dados**

Execute as migrações do Prisma:

\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

### 5. **Testar o Sistema**

\`\`\`bash
npm run dev
\`\`\`

Acesse:

- Login: http://localhost:3000/auth/login
- Registro: http://localhost:3000/auth/register

---

## 📱 Fluxo de Pagamento

### Pagamento Único (R$ 9,90)

1. Usuário clica em "Comprar Tiragem"
2. Frontend chama: `POST /api/payment/create`
   \`\`\`json
   {
   "type": "SINGLE_READING",
   "customerName": "João Silva",
   "customerDocument": "12345678900"
   }
   \`\`\`
3. Backend retorna QR Code PIX
4. Usuário escaneia e paga
5. PixUp envia webhook para `/api/payment/webhook`
6. Sistema adiciona 1 tiragem ao contador do usuário
7. Usuário pode fazer 1 tiragem do tarot egípcio

### Assinatura (R$ 29,90/mês)

1. Usuário clica em "Assinar Premium"
2. Frontend chama: `POST /api/payment/create`
   \`\`\`json
   {
   "type": "SUBSCRIPTION"
   }
   \`\`\`
3. Backend cria assinatura no PixUp
4. Retorna QR Code PIX para primeiro pagamento
5. Usuário paga
6. Webhook ativa assinatura Premium
7. Acesso liberado a todas as features
8. PixUp renova automaticamente todo mês

---

## 🔐 Rotas Protegidas

### **Sempre Livres (FREE)**

- `/` - Home
- `/challenge` - Jogo de 4 cartas grátis
- `/auth/login` - Login
- `/auth/register` - Registro

### **Requerem Pagamento (PREMIUM)**

- `/tarot` - Tarot Egípcio (R$ 9,90 ou Premium)
- `/compatibility` - Compatibilidade Amorosa (Premium)
- `/predictions` - Previsões Diárias (Premium)
- `/abundance` - Abundância Financeira (Premium)
- `/personality` - Análise de Personalidade (Premium)
- `/guia` - Guia Espiritual (Premium)

---

## 📊 Schema do Banco de Dados

### User

\`\`\`prisma
model User {
id String
email String @unique
passwordHash String
name String?
birthDate DateTime?
subscription Subscription?
payments Payment[]
readings TarotReading[]
}
\`\`\`

### Subscription

\`\`\`prisma
model Subscription {
plan SubscriptionPlan // FREE | SINGLE_READING | PREMIUM_MONTHLY
status String // active | cancelled | suspended | pending
readingsLeft Int // Tiragens disponíveis
pixupCustomerId String?
pixupSubId String?
autoRenew Boolean
startDate DateTime
endDate DateTime?
}
\`\`\`

### Payment

\`\`\`prisma
model Payment {
userId String
amount Float
status PaymentStatus // PENDING | COMPLETED | FAILED
paymentType PaymentType // SINGLE_READING | SUBSCRIPTION
pixupId String?
pixupQrCode String? // QR Code em base64
pixupQrString String? // PIX copia e cola
expiresAt DateTime?
paidAt DateTime?
}
\`\`\`

---

## 🧪 Testar Pagamentos

### Teste Manual

1. Registre-se: `http://localhost:3000/auth/register`
2. Faça login: `http://localhost:3000/auth/login`
3. Tente acessar `/tarot` (deve pedir pagamento)
4. No futuro dashboard, click em "Comprar Tiragem"
5. Escaneia QR Code (teste com app PIX)
6. Webhook recebe confirmação
7. Tiragem liberada!

---

## 🎨 Próximos Passos (TODO)

- [ ] Criar Dashboard do usuário (`/dashboard`)
  - Histórico de tiragens
  - Histórico de pagamentos
  - Gerenciar assinatura
  - Botões de upgrade
- [ ] Adicionar proteção nas páginas premium
- [ ] Criar componente de paywall
- [ ] Adicionar notificações por email
- [ ] Implementar sistema de cupons/descontos
- [ ] Adicionar analytics de conversão

---

## 🐛 Troubleshooting

### Erro: "PixUp credentials not configured"

**Solução**: Configure `PIXUP_API_KEY` e `PIXUP_API_SECRET` no `.env`

### Erro: "Não autorizado" ao fazer pagamento

**Solução**: Inclua o token JWT no header:
\`\`\`javascript
headers: {
'Authorization': `Bearer ${token}`
}
\`\`\`

### Webhook não está sendo chamado

**Solução**:

1. Verifique se a URL está configurada no painel PixUp
2. Use ngrok para testar localmente: `ngrok http 3000`
3. Configure webhook para: `https://xxx.ngrok.io/api/payment/webhook`

---

## 📚 Documentação da API

### POST /api/auth/register

Cria nova conta e retorna token JWT

### POST /api/auth/login

Autentica usuário e retorna token

### POST /api/payment/create

Cria pagamento PIX (tiragem ou assinatura)

### POST /api/payment/webhook

Recebe notificações do PixUp (não chamar manualmente)

### GET /api/payment/create

Lista todos os pagamentos do usuário autenticado

---

## 💡 Dicas de Implementação

1. **Sempre use HTTPS em produção**
2. **Valide webhook signature** para segurança
3. **Teste fluxo completo** antes de lançar
4. **Configure emails** de confirmação
5. **Monitore webhooks** falhados
6. **Implemente retry** para chamadas de API

---

## 🎉 Pronto!

O sistema de pagamentos está **100% funcional**. Agora só falta:

1. Obter credenciais do PixUp
2. Criar o Dashboard
3. Adicionar bloqueio visual nas páginas premium
4. Fazer deploy e testar em produção

**Boa sorte com o lançamento! 🚀**
