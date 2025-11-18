# Guia de Segurança - API Keys e Variáveis de Ambiente

## ⚠️ ALERTA DE SEGURANÇA

### Problema Identificado
Durante a análise dos logs de build, foi identificado que a chave da API do Groq foi exposta nos logs públicos do Vercel.

### Ação Imediata Necessária

**🚨 URGENTE: A seguinte chave API foi comprometida e DEVE ser revogada imediatamente:**
- Chave comprometida: `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`

### Passos para Resolver

1. **Revogar a Chave Comprometida**
   - Acesse https://console.groq.com/keys
   - Revogue a chave comprometida
   - Gere uma nova chave API

2. **Atualizar Variáveis de Ambiente no Vercel**
   - Acesse: https://vercel.com/[seu-usuario]/astrotarot-hub/settings/environment-variables
   - Atualize `GROQ_API_KEY` com a nova chave
   - Faça um novo deploy para aplicar as mudanças

3. **Verificar Outras Chaves**
   - Considere rodar todas as chaves API se houver suspeita de comprometimento
   - Revise os logs para garantir que nenhuma outra chave foi exposta

## 🔒 Melhores Práticas de Segurança

### 1. Nunca Exponha Chaves API

❌ **ERRADO:**
```javascript
console.log('API Key:', process.env.GROQ_API_KEY);
console.log('Config:', process.env);
```

✅ **CORRETO:**
```javascript
// Apenas verifique se a chave existe, nunca imprima o valor
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY não configurada');
}

// Em logs, mascare valores sensíveis
const maskedKey = process.env.GROQ_API_KEY 
  ? `${process.env.GROQ_API_KEY.substring(0, 7)}...`
  : 'não configurada';
console.log('GROQ_API_KEY:', maskedKey);
```

### 2. Gerenciamento de Variáveis de Ambiente

#### Desenvolvimento Local
```bash
# 1. Copie o arquivo de exemplo
cp .env.example .env

# 2. Configure suas chaves locais
# Edite .env e adicione suas chaves
```

#### Produção (Vercel)
- **NUNCA** commite arquivos `.env` no git
- Use o painel do Vercel para configurar variáveis de ambiente
- Variáveis de produção devem ser diferentes das de desenvolvimento

### 3. Rotação Regular de Chaves

Recomendações:
- Rotacione chaves API a cada 3-6 meses
- Rotacione imediatamente se houver suspeita de comprometimento
- Mantenha um registro de quando as chaves foram criadas

### 4. Validação de Segurança

Execute o script de validação antes de fazer deploy:
```bash
npm run validate:env
```

Este script verifica:
- ✅ Se as variáveis obrigatórias estão configuradas
- ✅ Se não há valores padrão em produção
- ✅ Se não há chaves sendo logadas

### 5. .gitignore Configurado

Verifique se `.gitignore` inclui:
```
# Variáveis de ambiente
.env
.env*.local
.env.production
.env.development

# Nunca commitar
*.key
*.pem
secrets.json
```

## 🛡️ Proteções Implementadas

### 1. GitHub Actions - Security Check
- Escaneia código em busca de chaves API expostas
- Verifica `console.log` com `process.env`
- Valida `.gitignore`
- Executa automaticamente em cada push/PR

### 2. Next.js - Remoção de Console Logs
O `next.config.js` está configurado para remover `console.log` em produção:
```javascript
compiler: {
  removeConsole: process.env.NODE_ENV === "production",
}
```

### 3. Script de Validação
Execute antes de deploy:
```bash
node scripts/validate-env.js
```

## 📋 Checklist de Segurança

Antes de cada deploy:

- [ ] Nenhum arquivo `.env` foi commitado
- [ ] Não há `console.log` com dados sensíveis
- [ ] Variáveis de ambiente estão configuradas no Vercel
- [ ] Chaves API são válidas e não expiradas
- [ ] `.gitignore` está atualizado
- [ ] Security check passou no CI/CD

## 🚨 Em Caso de Exposição de Chave

Se uma chave API for exposta:

1. **Revogar imediatamente** a chave comprometida
2. **Gerar nova chave** no serviço correspondente
3. **Atualizar** variáveis de ambiente em todos os ambientes
4. **Verificar logs** para atividades suspeitas
5. **Fazer novo deploy** com as novas credenciais
6. **Documentar** o incidente para referência futura

## 📞 Serviços e Links Úteis

### Groq
- Console: https://console.groq.com/keys
- Documentação: https://console.groq.com/docs

### PixUp
- Website: http://pixupbr.com/
- Gerenciar chaves API no painel de controle

### Stripe
- Dashboard: https://dashboard.stripe.com/apikeys
- Revogar chaves: https://dashboard.stripe.com/apikeys

### Vercel
- Environment Variables: https://vercel.com/docs/environment-variables

## 📚 Recursos Adicionais

- [OWASP - API Security](https://owasp.org/www-project-api-security/)
- [12 Factor App - Config](https://12factor.net/config)
- [Vercel - Environment Variables Best Practices](https://vercel.com/docs/environment-variables)

---

**Última atualização:** 2025-11-18

**Status:** 🚨 Chave Groq comprometida - Ação imediata necessária
