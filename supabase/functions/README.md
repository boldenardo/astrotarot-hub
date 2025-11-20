# Edge Functions - Ignorar erros do TypeScript

Os arquivos nesta pasta são **Edge Functions do Supabase** que rodam em **Deno runtime**, não Node.js.

## ⚠️ Erros do TypeScript são normais

Os erros que aparecem no VS Code (como `Cannot find module 'https://deno.land/...'` ou `Cannot find name 'Deno'`) são **NORMAIS** e **NÃO AFETAM** a execução.

Isso acontece porque:

1. VS Code usa TypeScript para Node.js por padrão
2. Edge Functions usam Deno (runtime diferente)
3. Deno importa módulos via HTTPS URLs
4. O código funciona perfeitamente quando deployado no Supabase

## ✅ Código está correto

Não precisa corrigir nada. Quando você fizer:

```bash
supabase functions deploy create-payment
```

O código vai compilar e rodar sem problemas no ambiente Deno do Supabase.

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Manual](https://deno.land/manual)
- [Deno Deploy](https://deno.com/deploy)
