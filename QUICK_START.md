# ⚡ Checklist de Inicialização - AstroTarot Hub

Execute estes comandos na ordem para garantir que tudo funcione perfeitamente:

## 1️⃣ Verificar Instalação (✅ Já feito)

```bash
cd "c:\Users\luiss\OneDrive\Área de Trabalho\Astrologia saas"
npm install
```

## 2️⃣ Gerar Prisma Client (✅ Já feito)

```bash
npm run prisma:generate
```

## 3️⃣ Configurar MongoDB

### Opção A: MongoDB Local

1. Baixe: https://www.mongodb.com/try/download/community
2. Instale e inicie o serviço
3. O `.env` já está configurado para `mongodb://localhost:27017/astrotarot`

### Opção B: MongoDB Atlas (Cloud - Recomendado)

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie conta gratuita
3. Clique em "Create" para novo cluster
4. Escolha FREE tier (M0)
5. Selecione região mais próxima (ex: São Paulo)
6. Clique "Create Cluster"
7. Aguarde 3-5 minutos
8. Clique em "Connect"
9. Adicione seu IP atual ou use `0.0.0.0/0` (para dev)
10. Crie usuário do banco (salve senha!)
11. Escolha "Connect your application"
12. Copie a connection string
13. Cole no `.env` substituindo `<password>` pela senha:
    ```env
    DATABASE_URL="mongodb+srv://usuario:SENHA_AQUI@cluster0.xxxxx.mongodb.net/astrotarot?retryWrites=true&w=majority"
    ```

## 4️⃣ Sincronizar Schema com Banco

```bash
npm run prisma:push
```

Você deve ver:

```
✔ Generated Prisma Client
The database is now in sync with your Prisma schema.
```

## 5️⃣ Popular Dados de Teste (Opcional)

```bash
npx tsx prisma/seed.ts
```

Isso cria:

- Usuário: `teste@astrotarot.com` / senha: `senha123`
- Mapa astral de exemplo
- Tiragem de tarot de exemplo

## 6️⃣ Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Deve aparecer:

```
▲ Next.js 14.x
- Local:        http://localhost:3000
✓ Ready in 2s
```

## 7️⃣ Testar no Navegador

Abra: http://localhost:3000

Você deve ver a landing page do AstroTarot Hub.

## 8️⃣ Testar APIs

### Via VS Code REST Client (Recomendado)

Instale extensão: "REST Client" (humao.rest-client)

Crie arquivo `test.http`:

```http
### Registro
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "senha123",
  "name": "Seu Nome",
  "birthDate": "1995-03-20",
  "birthTime": "15:45",
  "birthLocation": "Rio de Janeiro, BR"
}

### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "senha123"
}

### Criar Tiragem (cole o token do login acima)
POST http://localhost:3000/api/tarot/reading
Content-Type: application/json
Authorization: Bearer COLE_SEU_TOKEN_AQUI

{
  "deckType": "NORMAL",
  "spreadType": "THREE_CARD"
}

### Histórico
GET http://localhost:3000/api/user/readings
Authorization: Bearer COLE_SEU_TOKEN_AQUI

### Mapa Astral
GET http://localhost:3000/api/astrology/chart
Authorization: Bearer COLE_SEU_TOKEN_AQUI
```

Clique em "Send Request" acima de cada linha `###`.

### Via cURL (Alternativa)

```bash
# 1. Registrar
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"teste2@exemplo.com","password":"senha123","name":"Teste"}'

# 2. Login (copie o token da resposta)
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"teste2@exemplo.com","password":"senha123"}'

# 3. Criar tiragem (substitua TOKEN)
curl -X POST http://localhost:3000/api/tarot/reading -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"deckType":"NORMAL","spreadType":"SINGLE"}'
```

## 9️⃣ Visualizar Banco de Dados (Opcional)

```bash
npm run prisma:studio
```

Acesse: http://localhost:5555

Você verá todos os dados em interface visual.

## 🔟 Configurar APIs Externas (Opcional)

### Groq AI (Para interpretações de IA)

1. Acesse: https://console.groq.com
2. Crie conta (gratuita)
3. Vá em "API Keys"
4. Crie nova key
5. Copie e cole no `.env`:
   ```env
   GROQ_API_KEY="gsk_..."
   ```
6. Reinicie o servidor

Sem essa key, o sistema usa interpretações mock (funciona normalmente).

### Stripe (Para pagamentos)

1. Acesse: https://dashboard.stripe.com/register
2. Crie conta
3. Ative modo de teste
4. Vá em "Developers" > "API Keys"
5. Copie "Secret key" e "Publishable key"
6. Cole no `.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

## ✅ Checklist Final

- [ ] MongoDB rodando (local ou Atlas)
- [ ] `npm install` executado
- [ ] `npm run prisma:generate` executado
- [ ] `npm run prisma:push` executado com sucesso
- [ ] `.env` configurado (pelo menos DATABASE_URL e JWT_SECRET)
- [ ] `npm run dev` rodando sem erros
- [ ] http://localhost:3000 acessível
- [ ] APIs testadas e funcionando

## 🐛 Problemas Comuns

### "Cannot find module 'next/server'"

```bash
npm install
```

### "Prisma Client is not generated"

```bash
npm run prisma:generate
```

### "Connection refused MongoDB"

- **Local**: Verifique se MongoDB está rodando (Services > MongoDB)
- **Atlas**: Verifique connection string e whitelist de IPs

### "Invalid token" nas APIs

- Token expirou (7 dias): faça login novamente
- Token copiado errado: copie novamente do response do login

### Porta 3000 já em uso

```bash
# Opção 1: Feche outro processo na porta 3000
# Opção 2: Use outra porta
npm run dev -- -p 3001
```

## 📚 Próximos Passos

Agora que tudo está funcionando:

1. **Crie páginas de autenticação**

   - `src/app/auth/register/page.tsx`
   - `src/app/auth/login/page.tsx`

2. **Crie dashboard**

   - `src/app/dashboard/page.tsx`

3. **Crie página de tiragem**

   - `src/app/tarot/page.tsx`

4. **Adicione componentes de UI**
   - `src/components/cards/TarotCard.tsx`
   - `src/components/ui/Button.tsx`

Veja `GETTING_STARTED.md` para mais detalhes!

## 🎉 Parabéns!

Seu projeto AstroTarot Hub está configurado e rodando! 🌟🔮

Se tiver dúvidas, consulte:

- `PROJECT_SUMMARY.md` - Resumo completo
- `GETTING_STARTED.md` - Guia detalhado
- `README.md` - Documentação principal
- `PRD` - Requisitos do produto
