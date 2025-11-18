# PixUp - Configuração de Autenticação

## 🔐 Basic Authentication

O PixUp utiliza **HTTP Basic Authentication** para autenticação de suas APIs.

### Credenciais

- **Client ID**: Seu identificador único (ex: `usuarioteste_63c4ff6423765as`)
- **Client Secret**: `9237b2e061cb412ea6c5f751071f31debe33fb9ac04c73387c2b7ad21e24df7d`
- **Base URL**: `https://api.pixupbr.com/v1`

### Como Funciona

1. **Concatenar credenciais** com o símbolo `:` (dois pontos)
   ```
   client_id:client_secret
   ```

2. **Codificar em Base64**
   ```
   Base64(client_id:client_secret)
   ```

3. **Enviar no header Authorization**
   ```
   Authorization: Basic {base64_credentials}
   ```

### Exemplo em Node.js

```typescript
const clientId = "usuarioteste_63c4ff6423765as";
const clientSecret = "9237b2e061cb412ea6c5f751071f31debe33fb9ac04c73387c2b7ad21e24df7d";

// Concatena e codifica
const credentials = `${clientId}:${clientSecret}`;
const base64Credentials = Buffer.from(credentials).toString('base64');

// Header pronto
const authHeader = `Basic ${base64Credentials}`;
```

### Configuração no .env

```bash
PIXUP_CLIENT_ID="seu-client-id"
PIXUP_CLIENT_SECRET="9237b2e061cb412ea6c5f751071f31debe33fb9ac04c73387c2b7ad21e24df7d"
PIXUP_BASE_URL="https://api.pixupbr.com/v1"
```

### Implementação no Projeto

O arquivo `src/lib/pixup/client.ts` já implementa a autenticação corretamente:

```typescript
function generateBasicAuthHeader(clientId: string, clientSecret: string): string {
  const credentials = `${clientId}:${clientSecret}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}
```

### Responses

#### ✅ 200 - Sucesso
```json
{
  "success": true,
  "data": { ... }
}
```

#### ❌ 401 - Não Autorizado
```json
{
  "error": "Invalid credentials",
  "message": "Client ID ou Client Secret inválidos"
}
```

## 📝 Próximos Passos

1. ✅ Obtenha seu `client_id` real da PixUp
2. ✅ Configure as variáveis no `.env`
3. ✅ Teste a autenticação com `npm run check:pixup`
4. ✅ Implemente webhooks para receber notificações de pagamento
