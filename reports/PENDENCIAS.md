# Pendências — estado real, verificado hoje

Conferi o banco direto pela API (não é chute) e o código no repositório.
Meta Pixel saiu da lista: você roda orgânico.

---

## O que JÁ está pronto (não precisa mexer)

Você achou que tinha rodado tudo no Supabase — **rodou quase tudo**. Está
aplicado e confirmado:

| Migration | Como confirmei |
|---|---|
| `20260721_stripe_new_plans` | `users.stripe_customer_id`, `readings_left`, `payments.stripe_payment_intent_id` existem |
| `20260722_clerk_auth` | `users.clerk_user_id` existe |
| `20260722_webhook_idempotency` | tabela `stripe_events` existe |
| `20260812_affiliates` | `affiliates`, `affiliate_clicks`, `affiliate_sales` existem |
| `20260814_leads` + `lead_source` | `leads.email`, `converted_at`, `source` existem |
| `20260814_entitlements` | `user_entitlements` e `soulmate_portraits` existem |
| `20260814_streaks` | `user_streaks`, `daily_checkins` existem |
| `20260815_soulmate_private_bucket` | bucket `soulmate` está com **`public: false`** |

Também confirmado: Stripe live com os 5 preços, webhook apontando certo,
GA rodando, funil em EN/ES pelo idioma do navegador, upsell do retrato de
$24.99 no checkout, 3 leads no banco.

---

## ~~PENDÊNCIA 1 — SQL do lead_emails~~ ✅ FEITO

Verificado no banco: `reading_email_sent_at` e `recovery_email_sent_at`
existem. As 3 linhas de lead voltam com as colunas novas vazias.

## ~~PENDÊNCIA 2 — variáveis na Vercel~~ ✅ FEITO

Testado contra produção, não contra a tela de configuração:

- `CRON_SECRET` — bate. Segredo errado leva 401; o certo passa.
- `RESEND_API_KEY` — presente. A rota passou do portão
  `NOT_CONFIGURED`, o que só acontece com a chave lá.
- Descadastro — recusa token falsificado (400).
- `/`, `/quiz`, `/quiz/flow`, `/quiz/vsl` — todas 200.

**O e-mail da leitura já está funcionando** — ele não depende da coluna
que falta abaixo. Quem preencher o funil agora recebe.

## ~~PENDÊNCIA 1b — SQL do descadastro~~ ✅ FEITO

Coluna `unsubscribed_at` existe. E o disparo real rodou:
**3 enviados, 3 `delivered`** (confirmado nos logs do Resend, não só
aceito). Rodando de novo agora dá `candidates: 0` — a trava de envio
único funciona.

### Se você clicar no "Unsubscribe" para testar

O link é real: ele tira o endereço da lista de verdade. Para desfazer:

```sql
UPDATE leads SET unsubscribed_at = NULL WHERE email = 'seu@email.com';
```

E para poder receber o de carrinho abandonado outra vez:

```sql
UPDATE leads SET recovery_email_sent_at = NULL WHERE email = 'seu@email.com';
```

## ~~PENDÊNCIA 1b — falta UMA SQL nova~~ (histórico) 🔴

`20260815_lead_unsubscribe.sql`. Ela apareceu depois: ao renderizar os
e-mails para conferir, vi que o de carrinho abandonado sairia **sem
link de descadastro** — e disparo em massa sem saída é o caminho curto
para o domínio inteiro cair em spam. Já corrigi no código; falta a coluna.

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

DROP INDEX IF EXISTS idx_leads_recovery_pending;
CREATE INDEX IF NOT EXISTS idx_leads_recovery_pending
  ON leads (created_at)
  WHERE converted_at IS NULL
    AND recovery_email_sent_at IS NULL
    AND unsubscribed_at IS NULL;
```

**Rode antes do primeiro disparo do cron.** Confirmei em produção que é
exatamente isso que está travando — a rota devolve:

```
500 {"error":"Query failed.","detail":"column leads.unsubscribed_at does not exist"}
```

## Conferir a fila sem mandar nada

Depois de rodar a SQL, dá para ver quem entraria no disparo **sem enviar
e-mail nenhum** — acrescente `?dry=1`:

```bash
curl -X POST "https://astrotarot.shop/api/email/recover?dry=1" -H "x-cron-secret: SEU_CRON_SECRET"
```

Resposta esperada:
`{"ok":true,"dryRun":true,"candidates":3,"emails":[...]}`

Só depois de ver essa lista certa é que vale rodar sem o `?dry=1`. Envio
não tem botão de desfazer.

---

## PENDÊNCIA 2 — 3 variáveis na Vercel (5 min) 🔴

Conferi a conta Resend pela API: chave **válida**, domínio
`astrotarot.shop` com status **verified**, e os 3 registros (DKIM, SPF
TXT, SPF MX) todos verificados. O `EMAIL_FROM` bate com o domínio. Está
tudo certo do lado do Resend — falta só colar na Vercel.

Vercel → Settings → Environment Variables → **Production**:

```
RESEND_API_KEY=<a chave que você gerou>
EMAIL_FROM=AstroTarot <hello@astrotarot.shop>
CRON_SECRET=8S8g-2oQXooUxUYYPzxnEjJVObRM6_EWE2e1pZXjlVk
```

O `CRON_SECRET` acima eu gerei (32 bytes aleatórios) — pode usar esse ou
trocar por outro, desde que seja o mesmo no cron.

**Depois de salvar: Deployments → ⋯ → Redeploy.** Variável nova não entra
sozinha no deploy que já existe.

---

## PENDÊNCIA 3 — Agendar o carrinho abandonado (2 min) 🟡

Vercel → Settings → **Cron Jobs** → Add:

- **Path:** `/api/email/recover`
- **Schedule:** `0 15 * * *`

Se o seu plano não deixar mandar header no cron, use cron-job.org
apontando para:

```bash
curl -X POST https://astrotarot.shop/api/email/recover -H "x-cron-secret: SEU_CRON_SECRET"
```

Resposta esperada: `{"ok":true,"candidates":3,"sent":3}` na primeira
rodada — seus 3 leads atuais entram nela.

---

## PENDÊNCIA 4 — Página de oferta em espanhol 🔴 (é dinheiro)

**Este é o maior buraco que sobrou.** O funil `/quiz/flow` detecta o
idioma e fala espanhol. Aí a pessoa chega em `/quiz/vsl` — **856 linhas,
zero tradução, tudo em inglês.** Conferi: a página não importa nada do
i18n.

Ou seja: o latino faz o funil inteiro em espanhol, se conecta, e a hora
de pagar aparece em outro idioma. É exatamente onde ele desiste.

Isso é trabalho meu, não seu — é só me dar o ok que eu traduzo a página
inteira usando a mesma estrutura de i18n do funil.

---

## PENDÊNCIA 5 — Páginas legais 🔴 (risco de conta)

Não existe `/terms`, `/privacy` nem `/refund`. Isso é **pré-requisito da
Stripe** para conta live — se cair uma revisão ou um chargeback, a
ausência delas pesa contra, e no limite a conta é suspensa com o dinheiro
retido.

Também é meu trabalho. Ok que eu escreva as três?

---

## PENDÊNCIA 6 — Vídeo do retrato 🟡

O vídeo mostra um casal num parque enquanto a narração diz que o retrato
está sendo preparado. Não bate, e quebra a ilusão bem no momento mais
caro do funil. Você precisa gravar/escolher outro — esse eu não consigo
resolver sozinho.

---

## PENDÊNCIA 7 — Trocar a chave do Gemini 🟡

Você colou a `GEMINI_API_KEY` aqui no chat. Vale trocar por higiene:
[aistudio.google.com](https://aistudio.google.com/apikey) → deletar a
antiga → criar nova → atualizar na Vercel.

---

## Observação — região do servidor

`vercel.json` fixa `regions: ["gru1"]` (São Paulo), mas seu público é
EUA. Cada requisição atravessa o continente à toa. Trocar para `iad1`
(Virgínia) é uma linha e melhora o tempo de resposta do funil inteiro.
Aviso porque é barato de arrumar, não porque está quebrado.

---

## A ordem que eu seguiria

1. **SQL do descadastro** (Pendência 1b) — 1 min
2. **3 variáveis + Redeploy** (Pendência 2) — 5 min
3. **Testar:** faça o funil com um e-mail seu; a leitura tem que chegar
   em segundos. Se não chegar, **Resend → Logs** diz o motivo
4. **Cron** (Pendência 3) — 2 min, recupera os 3 leads parados
5. Me dá o ok para **espanhol na oferta** + **páginas legais** (4 e 5)
6. Vídeo do retrato e chave do Gemini quando der (6 e 7)

Os passos 1 a 4 são seus e dão menos de 10 minutos. O 5 é meu.
