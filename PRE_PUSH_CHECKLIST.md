# 🚀 Comandos para Push no GitHub

Execute estes comandos **NESTA ORDEM** antes de fazer push:

## 1️⃣ Regenerar Prisma Client (OBRIGATÓRIO)

```bash
npx prisma generate
```

Isso corrige os 25 erros TypeScript.

## 2️⃣ Verificar Build

```bash
npm run build
```

Se houver erros, corrija antes de continuar.

## 3️⃣ Inicializar Git (se ainda não fez)

```bash
git init
git add .
git commit -m "Initial commit: AstroTarot Hub - Sistema completo de pagamentos e autenticação"
```

## 4️⃣ Verificar se .env NÃO está commitado

```bash
git ls-files | grep ".env$"
```

**Não deve retornar nada!** Se retornar, execute:

```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

## 5️⃣ Criar repositório no GitHub

1. Vá em https://github.com/new
2. Nome: `astrotarot-hub`
3. Descrição: "SaaS de Astrologia e Tarot com pagamentos PIX"
4. **NÃO** adicione README, .gitignore ou licença (já temos)
5. Clique em "Create repository"

## 6️⃣ Conectar e fazer Push

```bash
git remote add origin https://github.com/SEU-USUARIO/astrotarot-hub.git
git branch -M main
git push -u origin main
```

## 7️⃣ Configurar Secrets no GitHub (para CI/CD futuro)

No repositório GitHub, vá em:

- Settings → Secrets and variables → Actions
- Add repository secret:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `PIXUP_API_KEY`
  - `PIXUP_API_SECRET`
  - `PIXUP_WEBHOOK_SECRET`

---

## ✅ Checklist Pré-Push

Marque quando completar:

- [ ] `npx prisma generate` executado
- [ ] `npm run build` sem erros
- [ ] `.env` no `.gitignore`
- [ ] `.env` NÃO está no git tracking
- [ ] `README.md` atualizado
- [ ] `SECURITY_CHECKLIST.md` revisado
- [ ] Repositório GitHub criado
- [ ] Push realizado com sucesso

---

## 🔐 IMPORTANTE - Segurança

**NUNCA commite:**

- ❌ `.env` (contém senhas reais)
- ❌ `node_modules/` (muito grande)
- ❌ `.next/` (build artifacts)
- ❌ Chaves de API hardcoded no código

**Está tudo no .gitignore?**

```bash
cat .gitignore | grep -E ".env|node_modules|.next"
```

---

## 📞 Problemas?

Se algo der errado:

**Erro: "Prisma Client não atualizado"**

```bash
npx prisma generate --force
rm -rf .next
npm run build
```

**Erro: ".env commitado por engano"**

```bash
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Remove .env and update .gitignore"
```

**Erro: "Build falhou"**

```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 🎉 Após o Push

1. Configure GitHub Pages (opcional)
2. Adicione badges ao README (CI/CD status)
3. Configure Dependabot (segurança)
4. Adicione CONTRIBUTING.md
5. Configure issues templates

**Seu webapp está pronto para o mundo! 🌟**
