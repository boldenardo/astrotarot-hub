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

## PENDÊNCIA 1 — SQL no Supabase (2 min) 🔴

**Só uma migration ficou de fora: `20260815_lead_emails`.** Confirmei o
erro exato: `column leads.reading_email_sent_at does not exist`.

Sem ela **os e-mails não funcionam** — a rota tenta gravar o carimbo,
falha, e o mesmo e-mail seria reenviado a cada re-submit do formulário.

Cole isso no **SQL Editor do Supabase** e clique **RUN**. É idempotente:
rodar de novo não quebra nada (por isso incluí junto o `premium_yearly`,
que é a única que não consigo verificar por fora — ela só mexe numa
constraint, e re-rodar é de graça).

```sql
-- ============================================================
-- 1) CONTROLE DE ENVIO DE E-MAIL (a que está faltando)
-- ============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reading_email_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_recovery_pending
  ON leads (created_at)
  WHERE converted_at IS NULL AND recovery_email_sent_at IS NULL;

-- ============================================================
-- 2) PLANO ANUAL (seguro re-rodar; sem isto o webhook falha ao
--    gravar PREMIUM_YEARLY na compra de $79/ano)
-- ============================================================
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_plan_check;
ALTER TABLE public.users ADD CONSTRAINT users_subscription_plan_check
  CHECK (subscription_plan IN ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY'));
```

**Como saber que deu certo:** rode em seguida

```sql
SELECT email, reading_email_sent_at, recovery_email_sent_at FROM leads;
```

Tem que retornar as 3 linhas com as colunas novas vazias. Se der erro de
coluna, o passo acima não rodou.

---

## PENDÊNCIA 2 — 3 variáveis na Vercel (5 min) 🔴

Domínio no Resend você já adicionou. Falta a chave e o resto.
Vercel → Settings → Environment Variables → **Production**:

```
RESEND_API_KEY=re_...
EMAIL_FROM=AstroTarot <hello@astrotarot.shop>
CRON_SECRET=<senha longa aleatória, você inventa>
```

- A chave sai em **resend.com → API Keys → Create** (permissão *Sending
  access*). Só aparece uma vez.
- `EMAIL_FROM` tem que usar o domínio que você verificou. Se ele ainda
  estiver *Pending*, o envio falha calado.
- `CRON_SECRET` é qualquer string longa. Ela protege o disparo em massa.

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

1. **SQL no Supabase** (Pendência 1) — 2 min, destrava os e-mails
2. **3 variáveis + Redeploy** (Pendência 2) — 5 min
3. **Testar:** faça o funil com um e-mail seu; a leitura tem que chegar
   em segundos. Se não chegar, **Resend → Logs** diz o motivo
4. **Cron** (Pendência 3) — 2 min, recupera os 3 leads parados
5. Me dá o ok para **espanhol na oferta** + **páginas legais** (4 e 5)
6. Vídeo do retrato e chave do Gemini quando der (6 e 7)

Os passos 1 a 4 são seus e dão menos de 15 minutos. O 5 é meu.
