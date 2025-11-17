# 🔐 Checklist de Segurança - AstroTarot Hub

## ✅ PRONTO PARA GITHUB

### 1. Variáveis de Ambiente

- ✅ `.env` no `.gitignore`
- ✅ `.env.example` criado sem valores sensíveis
- ⚠️ **CRÍTICO**: Remover `.env` do controle de versão se já foi commitado:
  ```bash
  git rm --cached .env
  git commit -m "Remove .env from tracking"
  ```

### 2. Autenticação JWT

- ✅ Implementado com bcrypt (hash de senhas)
- ✅ Tokens JWT com expiração configurável (7 dias)
- ✅ Verificação de token em todas as rotas protegidas
- ✅ Fallback para quando MongoDB não está disponível
- ⚠️ **PRODUÇÃO**: Trocar `JWT_SECRET` por valor forte (min 32 caracteres)

### 3. Sistema de Pagamentos (PixUp)

- ✅ Cliente PixUp implementado
- ✅ Webhook com verificação de assinatura HMAC SHA256
- ✅ Plano FREE, SINGLE_READING (R$ 9,90), PREMIUM_MONTHLY (R$ 29,90)
- ✅ Gestão de leituras disponíveis (`readingsLeft`)
- ✅ Auto-renovação de assinaturas
- ⚠️ **PRODUÇÃO**: Adicionar credenciais PixUp reais no `.env`
- ⚠️ **TESTE**: Implementar testes para webhook antes de produção

### 4. Proteção de Rotas

- ✅ Middleware `authMiddleware.ts` implementado
- ✅ Rotas FREE: `/`, `/challenge`, `/auth/*`
- ✅ Rotas PREMIUM: `/tarot`, `/compatibility`, `/predictions`, `/abundance`, `/personality`, `/guia`
- ⚠️ **FALTA**: Middleware global no `middleware.ts` para proteção automática

### 5. Banco de Dados (MongoDB + Prisma)

- ✅ Schema Prisma completo com todos os campos necessários
- ✅ Relacionamentos: User → Subscription, User → Payments, User → TarotReadings
- ⚠️ **ERRO ATUAL**: Prisma Client desatualizado (25 erros TypeScript)
- ⚠️ **SOLUÇÃO**: Executar `npx prisma generate` antes de commitar
- ⚠️ **PRODUÇÃO**: Configurar MongoDB Atlas (cloud)

### 6. Validação de Dados

- ✅ Zod implementado em todas as rotas de API
- ✅ Validação de email, senha, campos obrigatórios
- ✅ Mensagens de erro apropriadas

### 7. Segurança de Senhas

- ✅ Bcrypt com 10 rounds de salt
- ✅ Senhas nunca retornadas nas APIs
- ✅ Verificação segura com timing-safe comparison

---

## ⚠️ ISSUES A CORRIGIR ANTES DA PRODUÇÃO

### Críticas (Bloqueia Deploy)

1. **Regenerar Prisma Client**:

   ```bash
   npx prisma generate
   ```

2. **Trocar JWT_SECRET**: Mínimo 32 caracteres aleatórios

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **MongoDB não está rodando localmente**:

   - Opção 1: Instalar MongoDB localmente
   - Opção 2: Usar MongoDB Atlas (recomendado)
   - Opção 3: Manter fallback mock (apenas dev)

4. **Configurar PixUp**:
   - Criar conta em http://pixupbr.com/
   - Obter: API Key, API Secret, Webhook Secret
   - Atualizar `.env` com credenciais reais
   - Configurar URL do webhook no painel PixUp

### Médias (Recomendado)

5. **Adicionar Rate Limiting**:

   ```typescript
   // Prevenir ataques de força bruta
   import rateLimit from "express-rate-limit";
   ```

6. **CORS configurado**:

   ```typescript
   // next.config.js - adicionar headers CORS apropriados
   ```

7. **Logs estruturados**:

   - Usar Winston ou Pino para logs
   - Não logar informações sensíveis

8. **Testes automatizados**:
   - Jest para APIs
   - Cypress para E2E
   - Cobertura mínima: 70%

### Baixas (Melhorias)

9. **Documentação API**: Swagger/OpenAPI
10. **Monitoramento**: Sentry ou similar
11. **CI/CD**: GitHub Actions
12. **Backup automático**: MongoDB Atlas backup

---

## 📋 CHECKLIST PRÉ-COMMIT

Antes de fazer `git push`, verificar:

- [ ] `.env` NÃO está no repositório
- [ ] `.env.example` está atualizado
- [ ] `JWT_SECRET` não é o valor padrão
- [ ] Nenhuma credencial hardcoded no código
- [ ] `npx prisma generate` executado
- [ ] Testes passando (`npm test`)
- [ ] Build sem erros (`npm run build`)
- [ ] ESLint sem warnings críticos

---

## 🚀 DEPLOY CHECKLIST

Quando for para produção:

- [ ] MongoDB Atlas configurado
- [ ] Variáveis de ambiente configuradas na Vercel/Railway
- [ ] PixUp webhook apontando para domínio de produção
- [ ] SSL/HTTPS ativado
- [ ] CORS configurado para domínio específico
- [ ] Rate limiting ativado
- [ ] Monitoramento (Sentry) configurado
- [ ] Backup automático ativado

---

## 📊 AUDITORIA DE CÓDIGO

### ✅ Pontos Fortes

- Arquitetura limpa (separação de concerns)
- Validação robusta com Zod
- Autenticação JWT segura
- Sistema de pagamentos completo
- Fallbacks para desenvolvimento

### ⚠️ Pontos de Atenção

- Erros TypeScript do Prisma (não bloqueia, mas incomoda)
- MongoDB local não configurado (usar Atlas)
- Sem testes automatizados ainda
- Sem rate limiting implementado

### 💡 Recomendações

1. Migrar para MongoDB Atlas imediatamente
2. Adicionar testes unitários para auth e payment
3. Implementar rate limiting nas rotas de login/register
4. Configurar CI/CD com GitHub Actions
5. Adicionar monitoring (Sentry)

---

## 📞 SUPORTE

Em caso de dúvidas:

- Documentação PixUp: http://pixupbr.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Auth: https://nextjs.org/docs/authentication

**Status Atual**: ✅ Pronto para GitHub (com ressalvas)  
**Pronto para Produção**: ⚠️ Precisa correções críticas acima
