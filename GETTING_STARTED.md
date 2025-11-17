# 🚀 Guia de Início Rápido - AstroTarot Hub

## ✅ Status do Projeto

O projeto foi inicializado com sucesso! Aqui está o que já está implementado:

### 📦 Estrutura Completa

- ✅ Next.js 14 com TypeScript
- ✅ Tailwind CSS configurado
- ✅ Prisma ORM + MongoDB schema
- ✅ Sistema de autenticação JWT
- ✅ APIs REST funcionais

### 🎯 Features Implementadas

#### 1. Autenticação

- `POST /api/auth/register` - Registro de usuários
- `POST /api/auth/login` - Login com JWT

#### 2. Tiragens de Tarot

- `POST /api/tarot/reading` - Criar tiragem (teaser freemium)
- `POST /api/tarot/unlock` - Desbloquear interpretação completa (premium)
- Suporte para 2 decks: Rider-Waite e Egípcio
- 3 tipos de spread: 1 carta, 3 cartas, Cruz Celta

#### 3. Astrologia

- `GET /api/astrology/chart` - Gerar/buscar mapa astral
- Integração com AstroSeek API (com fallback mock)
- Cruzamento de cartas com planetas

#### 4. Dashboard

- `GET /api/user/readings` - Histórico de tiragens

### 🔧 Próximos Passos

#### Passo 1: Configurar MongoDB

```bash
# Opção A: MongoDB Local
# Baixe e instale: https://www.mongodb.com/try/download/community
# Inicie o serviço MongoDB

# Opção B: MongoDB Atlas (Cloud)
# 1. Crie conta em https://www.mongodb.com/cloud/atlas
# 2. Crie cluster gratuito
# 3. Copie connection string
```

Edite `.env`:

```env
DATABASE_URL="mongodb://localhost:27017/astrotarot"
# OU para Atlas:
# DATABASE_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/astrotarot"
```

#### Passo 2: Sincronizar Banco

```bash
npm run prisma:push
```

#### Passo 3: Configurar APIs Externas

**AstroSeek API** (Opcional no início - usa mock):

1. Acesse: https://www.astro-seek.com/api
2. Crie conta e obtenha API key
3. Adicione no `.env`:

```env
ASTROSEEK_API_KEY="sua-chave-aqui"
```

**Groq AI** (Opcional - usa mock):

1. Acesse: https://console.groq.com
2. Crie API key gratuita (500k tokens/dia)
3. Adicione no `.env`:

```env
GROQ_API_KEY="sua-chave-aqui"
```

**Stripe** (Para pagamentos):

1. Acesse: https://dashboard.stripe.com/register
2. Pegue chaves de teste
3. Adicione no `.env`:

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

#### Passo 4: Iniciar Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### 📱 Testando a API

#### Registro:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123",
    "name": "Teste User",
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "birthLocation": "São Paulo, BR"
  }'
```

#### Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123"
  }'
```

Copie o `token` da resposta.

#### Criar Tiragem:

```bash
curl -X POST http://localhost:3000/api/tarot/reading \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "deckType": "NORMAL",
    "spreadType": "THREE_CARD"
  }'
```

### 🎨 Desenvolvimento Frontend

#### Páginas a Criar:

1. **Landing Page** (`src/app/page.tsx`) - ✅ Básica criada
2. **Registro** (`src/app/auth/register/page.tsx`)
3. **Login** (`src/app/auth/login/page.tsx`)
4. **Dashboard** (`src/app/dashboard/page.tsx`)
5. **Tiragem** (`src/app/tarot/page.tsx`)
6. **Mapa Astral** (`src/app/astrology/page.tsx`)

#### Componentes a Criar:

```
src/components/
├── cards/
│   ├── TarotCard.tsx         # Carta animada
│   ├── CardDeck.tsx          # Deck para seleção
│   └── CardFlip.tsx          # Animação flip
├── layouts/
│   ├── DashboardLayout.tsx   # Layout do dashboard
│   └── AuthLayout.tsx        # Layout de auth
├── ui/
│   ├── Button.tsx            # Botões reutilizáveis
│   ├── Card.tsx              # Cards UI
│   └── Modal.tsx             # Modais
└── astrology/
    ├── BirthChart.tsx        # Visualização do mapa
    └── TransitList.tsx       # Lista de trânsitos
```

### 🎭 Animações CodePen

Integre estas animações:

1. **Embaralhamento de Cartas**:
   - https://codepen.io/Hyperplexed/pen/MWXjGpG
2. **Flip de Carta**:

   - https://codepen.io/nelledejones/pen/gOOPWrK

3. **Efeitos de Partículas**:
   - https://codepen.io/jackrugile/pen/BvLHg

### 📊 Banco de Dados

#### Visualizar Dados:

```bash
npm run prisma:studio
```

Acessa interface visual em http://localhost:5555

### 🚀 Deploy

#### Vercel (Recomendado para Next.js):

```bash
npm i -g vercel
vercel
```

Adicione variáveis de ambiente no dashboard Vercel.

#### MongoDB Atlas:

Configure para produção (já configurado no schema).

### 📈 Métricas de Progresso

**MVP Atual**: ~40% completo

- ✅ Backend API (90%)
- ✅ Schema DB (100%)
- ✅ Autenticação (100%)
- ✅ Lógica Tiragens (80%)
- ✅ Integrações API (70% - mock funcionando)
- ⏳ Frontend UI (10%)
- ⏳ Animações (0%)
- ⏳ Pagamentos Stripe (0%)

### 🐛 Troubleshooting

**Erro de módulos não encontrados**:

```bash
npm install
```

**Erro Prisma Client**:

```bash
npm run prisma:generate
```

**Porta 3000 ocupada**:

```bash
# Edite package.json, altere script dev:
"dev": "next dev -p 3001"
```

### 📚 Recursos

- **Documentação Next.js**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Stripe Docs**: https://stripe.com/docs

### 🎯 Roadmap Sugerido

**Semana 1-2** (Você está aqui!):

- [x] Setup projeto
- [x] Backend APIs
- [ ] Frontend: Páginas auth + landing
- [ ] Componentes básicos UI

**Semana 3-4**:

- [ ] Página de tiragem com animações
- [ ] Dashboard com histórico
- [ ] Integração Stripe

**Semana 5-6**:

- [ ] Mapa astral visual
- [ ] Previsões diárias
- [ ] Testes e refinamentos
- [ ] Beta launch

---

## 💡 Dicas

1. **Comece pelo frontend**: Crie páginas de login/registro primeiro
2. **Use as APIs mock**: Não precisa das API keys reais para começar
3. **Teste incremental**: Teste cada feature antes de avançar
4. **Git commits**: Faça commits frequentes
5. **Consulte o PRD**: Sempre valide com os requisitos

## 🆘 Precisa de Ajuda?

Pergunte sobre:

- Como criar componentes específicos
- Integrar animações CodePen
- Configurar Stripe
- Otimizar performance
- Qualquer dúvida técnica!

**Boa sorte com seu projeto AstroTarot Hub!** 🌟🔮✨
