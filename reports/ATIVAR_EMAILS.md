# Ativar os e-mails (Resend) — 4 passos

O código está no ar. Enquanto não houver `RESEND_API_KEY`, **nada é
enviado** e o funil funciona exatamente como hoje — nada quebra.

## 1. Criar conta e verificar o domínio

1. [resend.com](https://resend.com) → criar conta (grátis até 3.000
   e-mails/mês, 100/dia)
2. **Domains** → **Add Domain** → `astrotarot.shop`
3. O Resend mostra 3 registros DNS (SPF, DKIM, e um MX de retorno).
   Adicione-os no painel do seu domínio — **é o mesmo lugar onde você
   criou o CNAME do quiz**
4. Espere ficar **Verified** (costuma levar de minutos a algumas horas)

> Sem domínio verificado, o Resend só entrega para o seu próprio e-mail de
> cadastro. Não pule este passo.

## 2. Pegar a chave

**API Keys** → **Create API Key** → permissão *Sending access* → copie o
valor `re_...` (só aparece uma vez).

## 3. Variáveis na Vercel

Settings → Environment Variables → **Production** → Redeploy:

```
RESEND_API_KEY=re_...
EMAIL_FROM=AstroTarot <hello@astrotarot.shop>
CRON_SECRET=<invente uma senha longa e aleatória>
```

`EMAIL_FROM` precisa usar o **domínio verificado** no passo 1.
`CRON_SECRET` protege o disparo em massa — sem ele a rota fica bloqueada.

## 4. SQL no Supabase

```
supabase/migrations/20260815_lead_emails.sql
```

Cria as colunas de controle (`reading_email_sent_at`,
`recovery_email_sent_at`). **Sem ela o e-mail da leitura seria reenviado
a cada vez que a pessoa reenviasse o formulário** — spam, e a reputação
do domínio vai junto.

---

# O que passa a acontecer

| Quando | E-mail | Idioma |
|---|---|---|
| Pessoa dá o e-mail no quiz | **A leitura prometida** + link para a revelação | EN ou ES (o do funil) |
| Compra confirmada (webhook) | **Boas-vindas** com o passo de criar conta | EN ou ES |
| 4h+ depois, sem comprar | **Carrinho abandonado** (via cron) | EN |

Cada um é enviado **uma única vez por pessoa**, controlado por carimbo no
banco.

## Agendar o carrinho abandonado

Vercel → Settings → **Cron Jobs** → novo job:

- **Path:** `/api/email/recover`
- **Schedule:** `0 15 * * *` (uma vez por dia)

Se o cron da Vercel não permitir header customizado no seu plano, use um
serviço externo (cron-job.org, EasyCron) apontando para:

```bash
curl -X POST https://astrotarot.shop/api/email/recover -H "x-cron-secret: SEU_CRON_SECRET"
```

Resposta: `{"ok":true,"candidates":N,"sent":N}`

## Testar depois de configurar

Faça o quiz até o passo do e-mail com um endereço seu. O e-mail da
leitura deve chegar em segundos. Se não chegar:

- **Resend → Logs** mostra cada tentativa e o motivo da recusa
- Erro comum: `EMAIL_FROM` com domínio não verificado

## Já na fila (seus 3 leads atuais)

`askglobalmci@gmail.com`, `pandatv712@gmail.com` e
`luisfpsegalla@gmail.com` não compraram e nunca receberam nada. Assim que
o cron rodar, os três recebem o e-mail de recuperação automaticamente —
inclusive o `pandatv712`, que abriu o checkout 4 vezes sem concluir.
