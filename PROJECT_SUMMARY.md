# Projeto AstroTarot Hub - Estrutura Completa

## 📁 Estrutura de Arquivos Criados

```
astrologia-saas/
├── .env                          # Variáveis de ambiente (não commitado)
├── .env.example                  # Template de variáveis
├── .gitignore                    # Arquivos ignorados pelo Git
├── package.json                  # Dependências do projeto
├── tsconfig.json                 # Configuração TypeScript
├── next.config.js                # Configuração Next.js
├── tailwind.config.ts            # Configuração Tailwind CSS
├── postcss.config.js             # Configuração PostCSS
├── README.md                     # Documentação principal
├── GETTING_STARTED.md            # Guia de início rápido
├── PRD                           # Documento de Requisitos
├── Schema_prisma                 # Schema original (backup)
├── Flowchart                     # Flowchart em Mermaid
│
├── prisma/
│   ├── schema.prisma             # Schema do banco de dados
│   └── seed.ts                   # Script para popular dados teste
│
└── src/
    ├── app/
    │   ├── layout.tsx            # Layout global
    │   ├── page.tsx              # Landing page
    │   ├── globals.css           # Estilos globais
    │   │
    │   └── api/
    │       ├── auth/
    │       │   ├── register/
    │       │   │   └── route.ts  # POST - Registro
    │       │   └── login/
    │       │       └── route.ts  # POST - Login
    │       │
    │       ├── tarot/
    │       │   ├── reading/
    │       │   │   └── route.ts  # POST - Criar tiragem
    │       │   └── unlock/
    │       │       └── route.ts  # POST - Desbloquear interpretação
    │       │
    │       ├── astrology/
    │       │   └── chart/
    │       │       └── route.ts  # GET - Mapa astral
    │       │
    │       └── user/
    │           └── readings/
    │               └── route.ts  # GET - Histórico
    │
    ├── lib/
    │   ├── prisma.ts             # Cliente Prisma
    │   ├── auth.ts               # Utilitários JWT/bcrypt
    │   ├── middleware.ts         # Middleware autenticação
    │   ├── tarot-data.ts         # Dados cartas de tarot
    │   ├── astroseek.ts          # Serviço AstroSeek API
    │   └── groq.ts               # Serviço Groq IA
    │
    └── types/
        └── index.ts              # Tipos TypeScript
```

## ✅ Funcionalidades Implementadas

### 🔐 Autenticação

- Sistema completo de registro e login
- JWT tokens com expiração configurável
- Hash de senhas com bcrypt
- Middleware de proteção de rotas

### 🎴 Sistema de Tarot

- 2 decks: Rider-Waite (22 cartas) e Egípcio (5 cartas base)
- 3 tipos de spread: 1 carta, 3 cartas, Cruz Celta
- Embaralhamento server-side (Fisher-Yates)
- Sistema freemium com teasers

### 🌟 Integrações

- **AstroSeek**: Mapas astrais e trânsitos (com fallback mock)
- **Groq AI**: Interpretações personalizadas (com fallback mock)
- Cruzamento de cartas com dados astrológicos

### 🗄️ Banco de Dados

- Schema Prisma completo
- Modelos: User, TarotReading, BirthChart, Subscription, Payment
- Índices otimizados
- Relacionamentos configurados

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar MongoDB

**Opção A - Local:**

```bash
# Instale MongoDB Community
# Windows: https://www.mongodb.com/try/download/community
# Inicie o serviço MongoDB
```

**Opção B - Cloud (Atlas):**

1. Crie conta em https://www.mongodb.com/cloud/atlas
2. Crie cluster gratuito (M0)
3. Configure IP whitelist (0.0.0.0/0 para dev)
4. Copie connection string
5. Cole no `.env` como `DATABASE_URL`

### 3. Sincronizar Banco

```bash
npm run prisma:push
```

### 4. Popular Dados de Teste (Opcional)

```bash
npx tsx prisma/seed.ts
```

### 5. Iniciar Servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🧪 Testando as APIs

### Registro

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "name": "Seu Nome"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

**Resposta:**

```json
{
  "user": {
    "id": "...",
    "email": "usuario@exemplo.com",
    "name": "Seu Nome"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Criar Tiragem (Autenticado)

```bash
curl -X POST http://localhost:3000/api/tarot/reading \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "deckType": "NORMAL",
    "spreadType": "THREE_CARD"
  }'
```

### Histórico de Tiragens

```bash
curl http://localhost:3000/api/user/readings \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Mapa Astral

```bash
curl http://localhost:3000/api/astrology/chart \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📊 Visualizar Banco de Dados

```bash
npm run prisma:studio
```

Acesse: http://localhost:5555

## 🔑 Configuração de APIs Externas

### AstroSeek (Opcional)

```env
ASTROSEEK_API_KEY="sua-chave-aqui"
```

Sem chave, usa dados mock automaticamente.

### Groq AI (Opcional)

1. Acesse: https://console.groq.com
2. Crie conta gratuita
3. Gere API key (500k tokens/dia grátis)
4. Adicione no `.env`:

```env
GROQ_API_KEY="gsk_..."
```

### Stripe (Para Pagamentos)

1. Crie conta: https://dashboard.stripe.com/register
2. Use chaves de teste no `.env`:

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 📝 Próximas Etapas

### Frontend (Prioridade)

1. **Páginas de Autenticação**

   - `/auth/register` - Formulário de registro
   - `/auth/login` - Formulário de login

2. **Dashboard**

   - `/dashboard` - Visão geral
   - Histórico de tiragens
   - Link para nova tiragem

3. **Página de Tiragem**

   - `/tarot` - Interface interativa
   - Seleção de deck e spread
   - Animações de embaralhamento
   - Revelação de cartas

4. **Componentes UI**
   - TarotCard (com flip animation)
   - CardDeck (seleção visual)
   - Modal de pagamento
   - Layout responsivo

### Integrações

- [ ] Stripe Checkout
- [ ] Webhooks de pagamento
- [ ] Sistema de notificações
- [ ] Upload de imagens de cartas reais

### Melhorias

- [ ] Adicionar 56 cartas faltantes (Arcanos Menores)
- [ ] Completar deck Egípcio
- [ ] Geocoding para birth location
- [ ] Cache Redis para APIs
- [ ] Testes unitários

## 🐛 Troubleshooting

**Erro: Cannot find module 'next/server'**

```bash
npm install
```

**Erro: Prisma Client not found**

```bash
npm run prisma:generate
```

**Erro: Connection refused MongoDB**

```bash
# Verifique se MongoDB está rodando
# Windows: Services -> MongoDB Server
# Ou use MongoDB Atlas (cloud)
```

## 📚 Documentação

- **PRD Completo**: `PRD`
- **Flowchart**: `Flowchart`
- **Guia de Início**: `GETTING_STARTED.md`
- **Schema DB**: `prisma/schema.prisma`

## 🎯 Arquitetura

```
Cliente (Browser)
    ↓
Next.js Frontend (React)
    ↓
API Routes (Next.js)
    ↓
├─→ Prisma ORM → MongoDB
├─→ AstroSeek API (Astrologia)
├─→ Groq AI (Interpretações)
└─→ Stripe (Pagamentos)
```

## 📈 Progresso MVP

- ✅ Backend: 90%
- ✅ Database: 100%
- ✅ APIs: 80%
- ⏳ Frontend: 10%
- ⏳ Pagamentos: 0%
- ⏳ Animações: 0%

## 💡 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build
npm run start

# Prisma
npm run prisma:generate    # Gera cliente
npm run prisma:push        # Sync schema
npm run prisma:studio      # Interface visual

# Lint
npm run lint
```

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm i -g vercel
vercel
```

### Variáveis de Ambiente (Vercel)

Adicione no dashboard:

- `DATABASE_URL`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

## 🤝 Contribuindo

Este é um projeto pessoal, mas ideias são bem-vindas!

## 📧 Suporte

Se precisar de ajuda com:

- Criação de componentes React
- Integração de animações
- Configuração de APIs
- Debug de erros
- Dúvidas técnicas

**Pergunte diretamente!** Estou aqui para ajudar. 🌟

---

**Criado com ❤️ para AstroTarot Hub**
