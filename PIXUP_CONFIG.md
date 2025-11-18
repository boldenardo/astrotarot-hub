# 🔧 Guia de Configuração das APIs do PixUp

## 📋 Visão Geral

Este guia explica como verificar e configurar as APIs do PixUp no AstroTarot Hub.

## ✅ Status da Implementação

O sistema de pagamentos PixUp está **100% implementado** e pronto para uso. Todos os componentes necessários estão funcionando:

- ✅ Cliente PixUp (`/src/lib/pixup/client.ts`)
- ✅ API de criação de pagamentos (`/api/payment/create`)
- ✅ Webhook de notificações (`/api/payment/webhook`)
- ✅ Script de validação de configuração (`/src/lib/pixup/validate.ts`)
- ✅ Suporte a pagamentos únicos (R$ 9,90)
- ✅ Suporte a assinaturas recorrentes (R$ 29,90/mês)

## 🔍 Como Verificar a Configuração

### Método 1: Usando o Script de Validação

Execute o comando no terminal:

```bash
npm run check:pixup
```

Este comando irá:
- ✅ Verificar se todas as variáveis de ambiente necessárias estão configuradas
- ⚠️ Identificar avisos de configurações opcionais
- ❌ Listar erros críticos que impedem o funcionamento

### Método 2: Testar a Conexão com o PixUp

Para verificar se as credenciais são válidas e se há conexão com a API:

```bash
npm run test:pixup
```

Este comando irá:
- Validar a configuração
- Tentar conectar com a API do PixUp
- Informar se a conexão foi bem-sucedida

### Método 3: Verificação Manual

Verifique se o arquivo `.env` existe na raiz do projeto e contém:

```env
PIXUP_API_KEY="sua-api-key-aqui"
PIXUP_API_SECRET="seu-api-secret-aqui"
PIXUP_WEBHOOK_SECRET="seu-webhook-secret-aqui"
PIXUP_BASE_URL="https://api.pixupbr.com/v1"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

## 🚀 Como Configurar (Se Ainda Não Configurado)

### Passo 1: Copiar o Arquivo de Exemplo

```bash
cp .env.example .env
```

### Passo 2: Obter Credenciais do PixUp

1. Acesse o site oficial: **[http://pixupbr.com/](http://pixupbr.com/)**
2. Crie uma conta ou faça login
3. Acesse o painel de desenvolvedor/API
4. Anote suas credenciais:
   - `API Key`
   - `API Secret`
   - `Webhook Secret`

### Passo 3: Configurar Variáveis de Ambiente

Edite o arquivo `.env` e substitua os valores:

```env
# PixUp Gateway (Pagamento PIX)
PIXUP_API_KEY="pk_live_abc123..." # Sua API Key do PixUp
PIXUP_API_SECRET="sk_live_xyz789..." # Seu API Secret do PixUp
PIXUP_WEBHOOK_SECRET="whsec_def456..." # Seu Webhook Secret
PIXUP_BASE_URL="https://api.pixupbr.com/v1" # URL base da API (geralmente não precisa mudar)

# URL do App (necessário para webhooks)
NEXT_PUBLIC_APP_URL="https://seu-dominio.com" # Em produção
# NEXT_PUBLIC_APP_URL="http://localhost:3000" # Em desenvolvimento local
```

### Passo 4: Configurar Webhook no Painel PixUp

1. Acesse o painel do PixUp
2. Vá em Configurações > Webhooks
3. Configure a URL do webhook para:
   ```
   https://seu-dominio.com/api/payment/webhook
   ```
4. Ative os seguintes eventos:
   - `payment.paid` - Pagamento confirmado
   - `payment.expired` - Pagamento expirado
   - `payment.cancelled` - Pagamento cancelado
   - `subscription.renewed` - Assinatura renovada
   - `subscription.failed` - Falha na renovação
   - `subscription.cancelled` - Assinatura cancelada

### Passo 5: Validar a Configuração

Execute o script de validação:

```bash
npm run check:pixup
```

Se tudo estiver correto, você verá:

```
============================================================
📋 RELATÓRIO DE CONFIGURAÇÃO DO PIXUP
============================================================

🔑 Variáveis de Ambiente:
  PIXUP_API_KEY: ✅ Configurada
  PIXUP_API_SECRET: ✅ Configurada
  PIXUP_WEBHOOK_SECRET: ✅ Configurada
  PIXUP_BASE_URL: https://api.pixupbr.com/v1

✅ Status: Configuração válida!
ℹ️ Para testar a conexão, execute: npm run test:pixup

============================================================
```

## 🧪 Testar o Sistema

### Teste Local (Desenvolvimento)

Para testar webhooks localmente, você precisará expor seu servidor local:

1. Instale o [ngrok](https://ngrok.com/):
   ```bash
   npm install -g ngrok
   ```

2. Execute seu servidor:
   ```bash
   npm run dev
   ```

3. Em outro terminal, exponha a porta 3000:
   ```bash
   ngrok http 3000
   ```

4. Configure o webhook no PixUp com a URL do ngrok:
   ```
   https://abc123.ngrok.io/api/payment/webhook
   ```

5. Teste um pagamento através da aplicação

### Teste em Produção

1. Faça o deploy da aplicação
2. Configure o webhook com sua URL de produção
3. Execute um pagamento de teste (R$ 9,90)
4. Verifique os logs do webhook

## 📊 Variáveis de Ambiente Detalhadas

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PIXUP_API_KEY` | ✅ Sim | Chave de API pública do PixUp |
| `PIXUP_API_SECRET` | ✅ Sim | Chave secreta de API do PixUp |
| `PIXUP_WEBHOOK_SECRET` | ⚠️ Recomendado | Segredo para validar assinatura dos webhooks |
| `PIXUP_BASE_URL` | ❌ Opcional | URL base da API (padrão: https://api.pixupbr.com/v1) |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Recomendado | URL pública da aplicação (para webhooks) |

## 🔐 Segurança

### ✅ Boas Práticas Implementadas

1. **Validação de Webhook**: O sistema verifica a assinatura do webhook usando HMAC-SHA256
2. **Variáveis de Ambiente**: Credenciais nunca são expostas no código
3. **Autenticação JWT**: Todas as rotas de pagamento exigem autenticação
4. **HTTPS**: Recomendado usar HTTPS em produção

### ⚠️ Avisos de Segurança

- ❌ **NUNCA** commite o arquivo `.env` no Git
- ❌ **NUNCA** exponha suas credenciais publicamente
- ✅ Use variáveis de ambiente diferentes para desenvolvimento e produção
- ✅ Rotacione suas credenciais regularmente

## 🐛 Troubleshooting

### Erro: "PixUp credentials not configured"

**Causa**: As variáveis `PIXUP_API_KEY` ou `PIXUP_API_SECRET` não estão configuradas.

**Solução**:
1. Verifique se o arquivo `.env` existe
2. Verifique se as variáveis estão definidas no `.env`
3. Reinicie o servidor após editar o `.env`

### Erro: "Webhook signature invalid"

**Causa**: A assinatura do webhook não corresponde à esperada.

**Solução**:
1. Verifique se `PIXUP_WEBHOOK_SECRET` está configurado corretamente
2. Verifique se o valor corresponde ao configurado no painel do PixUp
3. Certifique-se de que não há espaços extras nas variáveis

### Webhook não está sendo chamado

**Causa**: URL do webhook não está configurada corretamente no PixUp.

**Solução**:
1. Acesse o painel do PixUp
2. Verifique a URL configurada
3. Certifique-se de que a URL está acessível publicamente
4. Em desenvolvimento, use ngrok para expor seu localhost

### Erro: "Error connecting to PixUp API"

**Causa**: Credenciais inválidas ou API do PixUp indisponível.

**Solução**:
1. Verifique se suas credenciais estão corretas
2. Teste com `npm run test:pixup`
3. Verifique o status da API do PixUp
4. Entre em contato com o suporte do PixUp se necessário

## 📚 Recursos Adicionais

- **Documentação do PixUp**: [http://pixupbr.com/docs](http://pixupbr.com/docs)
- **Sistema de Pagamentos (Interno)**: Veja `PAYMENT_SYSTEM.md`
- **Checklist de Segurança**: Veja `SECURITY_CHECKLIST.md`

## 📞 Suporte

Se você encontrou problemas não cobertos neste guia:

1. Verifique a documentação oficial do PixUp
2. Execute `npm run check:pixup` para diagnóstico
3. Verifique os logs da aplicação
4. Entre em contato com o suporte do PixUp

---

**Última atualização**: Novembro 2025
**Versão do Cliente PixUp**: 1.0.0
