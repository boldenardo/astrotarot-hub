# 🔮 AstroTarot Hub - SaaS de Astrologia & Tarot

Plataforma completa de tarot egípcio, mapa astral personalizado e guia espiritual com IA. Sistema freemium com planos de assinatura e pagamento via PIX (PixUp).

## 🌟 Funcionalidades

### Para Usuários Free (Gratuito)

- ✅ Jogo do Tarot 4 Cartas (sem cadastro)
- ✅ Cadastro e login
- ✅ Dashboard personalizado
- ✅ Mapa astral básico (signo solar + 10 planetas)

### Para Usuários Pagantes

- 💎 **Plano R$ 9,90** (pagamento único): 1 tiragem completa do Tarot Egípcio
- 👑 **Plano R$ 29,90/mês** (Premium): Acesso ilimitado a tudo
  - Tarot Egípcio ilimitado
  - Mapa Astral completo
  - Compatibilidade amorosa
  - Previsões diárias
  - Rituais de abundância
  - Guia espiritual com IA

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: TailwindCSS, Framer Motion
- **Autenticação**: JWT + bcrypt
- **Banco de Dados**: MongoDB + Prisma ORM
- **Pagamentos**: PixUp (Gateway PIX brasileiro)
- **APIs**:
  - GROQ (IA para interpretações)
  - AstroSeek (dados astrológicos)

## 📋 Pré-requisitos

- Node.js 18+
- MongoDB (local ou MongoDB Atlas)
- Conta PixUp (http://pixupbr.com/)
- API Keys: GROQ, RapidAPI (AstroSeek)

## 🔧 Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/astrotarot-hub.git
cd astrotarot-hub
npm install
```

2. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o `.env` e adicione suas credenciais:

- `DATABASE_URL`: MongoDB connection string (Atlas recomendado)
- `JWT_SECRET`: Chave forte (min 32 chars) - gere com: `openssl rand -hex 32`
- `PIXUP_API_KEY`: Credencial PixUp
- `PIXUP_API_SECRET`: Secret PixUp
- `PIXUP_WEBHOOK_SECRET`: Secret do webhook
- `GROQ_API_KEY`: Chave API Groq (IA)
- `RAPIDAPI_KEY`: Chave RapidAPI (Astrologia)

3. **Configure o banco de dados**

```bash
npx prisma generate
npx prisma db push
```

4. **Inicie o servidor**

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Login, registro
│   │   │   ├── login/     # POST /api/auth/login
│   │   │   └── register/  # POST /api/auth/register
│   │   ├── payment/       # Sistema de pagamentos
│   │   │   ├── create/    # POST /api/payment/create
│   │   │   └── webhook/   # POST /api/payment/webhook (PixUp)
│   │   ├── tarot/         # Leituras de tarot
│   │   └── ...
│   ├── auth/              # Páginas de autenticação
│   │   ├── login/         # /auth/login
│   │   └── register/      # /auth/register
│   ├── dashboard/         # Dashboard do usuário (protegido)
│   ├── cart/              # Carrinho de compras
│   ├── challenge/         # Jogo grátis (4 cartas)
│   └── page.tsx           # Home (landing page)
├── components/            # Componentes React
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── Navbar.tsx
│   └── ...
├── lib/                   # Bibliotecas e utilitários
│   ├── auth.ts           # Funções JWT + bcrypt
│   ├── authMiddleware.ts # Proteção de rotas
│   ├── prisma.ts         # Cliente Prisma
│   └── pixup/            # Cliente PixUp
│       └── client.ts
└── types/                 # TypeScript types

prisma/
└── schema.prisma          # Schema do banco de dados
```

## 💳 Sistema de Pagamentos

### Planos Disponíveis

```typescript
FREE; // Jogo de 4 cartas grátis
SINGLE_READING; // R$ 9,90 - 1 tiragem do Tarot Egípcio
PREMIUM_MONTHLY; // R$ 29,90/mês - Acesso ilimitado
```

### Fluxo de Pagamento PIX

1. Usuário seleciona plano no `/cart`
2. **POST** `/api/payment/create` → Gera QR Code PIX
3. Usuário escaneia e paga via PIX (30-60min validade)
4. PixUp notifica: **POST** `/api/payment/webhook`
5. Sistema atualiza assinatura automaticamente
6. Usuário tem acesso instantâneo

## 🎯 Features Implementadas

### Autenticação

- ✅ Registro de usuário com validação Zod
- ✅ Login com JWT (7 dias de expiração)
- ✅ Senhas criptografadas (bcrypt, 10 rounds)
- ✅ Middleware de proteção de rotas
- ✅ Fallback mock quando MongoDB offline

### Pagamentos

- ✅ Integração completa com PixUp (PIX)
- ✅ Webhook com verificação HMAC SHA256
- ✅ Planos: Free, R$ 9,90 (único), R$ 29,90 (mensal)
- ✅ Gestão de leituras disponíveis (`readingsLeft`)
- ✅ Auto-renovação de assinaturas

### Dashboard

- ✅ Mapa astral personalizado (MVP)
- ✅ Cálculo automático de signo solar
- ✅ Posições de 10 planetas (Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno, Plutão)
- ✅ Características e significados de cada planeta
- ✅ Banner de upgrade para Premium

### UI/UX

- ✅ Landing page otimizada com CTAs apelativos
- ✅ Navbar com login e carrinho
- ✅ Modal de boas-vindas persuasivo após cadastro
- ✅ Carrinho de compras funcional
- ✅ Animações com Framer Motion (otimizadas)
- ✅ Design responsivo (mobile-first)

## 📝 Comandos Úteis

```bash
npm run dev              # Servidor desenvolvimento (localhost:3000)
npm run build            # Build para produção
npm run start            # Servidor produção
npm run lint             # ESLint
npm run check:pixup      # Verificar configuração do PixUp
npm run test:pixup       # Testar conexão com API do PixUp
npx prisma studio        # Interface visual do banco
npx prisma generate      # Regenerar Prisma Client
npx prisma db push       # Aplicar mudanças no schema
```

## 🔐 Segurança

- ✅ Senhas com bcrypt (10 rounds de salt)
- ✅ JWT com expiração configurável (7 dias)
- ✅ Validação de dados com Zod em todas as APIs
- ✅ Webhook PixUp com HMAC SHA256
- ✅ `.env` no `.gitignore` (não commitado)
- ✅ Fallback seguro quando banco offline
- ⚠️ **Importante**: Veja `SECURITY_CHECKLIST.md` para auditoria completa

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte repositório GitHub no Vercel
2. Configure variáveis de ambiente (`.env.example`)
3. Deploy automático a cada push

### Variáveis Críticas (Produção)

```bash
DATABASE_URL=mongodb+srv://...        # MongoDB Atlas
JWT_SECRET=<64-char-random-hex>       # Gere novo!
PIXUP_API_KEY=<sua-chave-real>
PIXUP_WEBHOOK_SECRET=<webhook-secret>
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 🧪 Testes

```bash
npm test                  # Executar testes (TODO)
npm run test:coverage     # Coverage (TODO)
```

## 📚 Documentação

- **PIXUP_CONFIG.md**: Guia completo de configuração do PixUp
- **SECURITY_CHECKLIST.md**: Auditoria completa de segurança
- **PAYMENT_SYSTEM.md**: Documentação do sistema de pagamentos
- **Prisma Schema**: `prisma/schema.prisma`

## 🔜 Roadmap

- [ ] Testes automatizados (Jest + Cypress)
- [ ] Rate limiting (prevenir ataques)
- [ ] Email notifications (SendGrid)
- [ ] Dashboard admin
- [ ] Métricas e analytics
- [ ] App mobile (React Native)
- [ ] Mais baralhos (Marselha, Rider-Waite)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie branch (`git checkout -b feature/MinhaFeature`)
3. Commit (`git commit -m 'Add MinhaFeature'`)
4. Push (`git push origin feature/MinhaFeature`)
5. Abra Pull Request

## 📄 Licença

MIT License - Veja `LICENSE` para detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/astrotarot-hub/issues)
- **Email**: suporte@astrotarot.com (exemplo)
- **Docs**: Veja `SECURITY_CHECKLIST.md` e `PAYMENT_SYSTEM.md`

---

**Desenvolvido com ✨ e 🌙**

- Senhas hasheadas com bcrypt
- JWT para sessões
- Validação Zod em todas as rotas
- Middleware de autenticação
- HTTPS obrigatório em produção

## 🔒 Segurança

⚠️ **IMPORTANTE**: Veja o [Guia de Segurança](./SECURITY_GUIDE.md) para informações sobre:
- Como proteger suas API keys
- Melhores práticas de segurança
- O que fazer em caso de exposição de chaves
- Validação de variáveis de ambiente

**Scripts de Segurança:**
```bash
# Validar variáveis de ambiente
npm run validate:env
```

## 📄 Documentação

- [PRD Completo](./PRD)
- [Schema Prisma](./Schema_prisma)
- [Flowchart](./Flowchart)
- [**Guia de Segurança**](./SECURITY_GUIDE.md) ⚠️ **LEIA PRIMEIRO**

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas via issues.

## 📧 Contato

Luis - AstroTarot Hub MVP
