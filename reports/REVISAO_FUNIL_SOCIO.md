# Revisão do funil do sócio — 14/08/2026

Método: 4 revisores independentes (pagamentos, banco, segurança, funil) sobre
o código real, e **cada achado passou por um verificador cético** encarregado
de refutá-lo. **32 achados brutos → 17 refutados → 15 confirmados.**

> Lacuna honesta: a dimensão **segurança/autorização** foi bloqueada por um
> filtro de segurança do ambiente e **não rodou**. As APIs novas
> (`/api/streak/checkin`, `/api/vibes`, `/api/soulmate/generate`) não tiveram
> revisão dedicada de abuso/rate-limit. Recomendo rodar antes de escalar tráfego.

O trabalho dele é bom: achou bugs reais que eu não tinha visto (GA4 nunca
inicializava; `computeScore` lendo `q_block`, pergunta que eu havia removido;
"8 questions" quando são 5; foto repetida). Os pontos abaixo são o que sobrou.

---

## ALTO — corrigir antes de escalar tráfego

### 1. Assinante que refaz o funil ganha uma SEGUNDA assinatura
`src/app/api/quiz/checkout/route.ts` (37-82)

`/api/checkout` bloqueia com `if (isSubscription && (isPremium || stripe_subscription_id))`.
O checkout do quiz **não tem essa trava**: não consulta `users`, e passa
`customer_email` em vez de reaproveitar `stripe_customer_id`. Um assinante que
volta pelo anúncio e refaz o quiz gera um Customer novo e uma segunda
assinatura ativa — **duas cobranças no mesmo cartão**.

Pior: o webhook sobrescreve `users.stripe_customer_id`/`stripe_subscription_id`
com os da nova. A primeira vira órfã — `findUserByCustomerId` deixa de achá-la,
e seus eventos caem em `if (!user) break`. **Não existe cancelamento in-app**
(não há `billing_portal` em lugar nenhum do projeto), então o cliente é cobrado
indefinidamente sem forma de parar pelo produto.

**Correção:** consultar `users` por e-mail antes de criar a sessão; se já houver
`stripe_subscription_id`, devolver 409 com link de login; se houver
`stripe_customer_id`, passar `customer:` em vez de `customer_email`.

### 2. Qualquer reembolso revoga o retrato de $24,99
`src/app/api/stripe/webhook/route.ts` (525-541)

```
if (PORTRAIT_PRICE || charge.description?.includes("Portrait"))
```
`PORTRAIT_PRICE` é a env var — **sempre truthy** quando o produto está
configurado. Logo o segundo termo nunca é avaliado: reembolsar um PACK5 de
$9,99 revoga o retrato de $24,99 que continua pago.

**Correção:** comparar `charge.payment_intent` com o `stripe_reference` gravado
no entitlement; só revogar o charge correspondente.

### 3. O add-on de $24,99 não protege nada
`supabase/migrations/20260814_entitlements.sql` (78)

Bucket `soulmate` criado com `public = true`, e `preview_url` recebe a **mesma
URL** de `image_url`. Quem paga $14,99 já recebe a imagem completa — o upsell
de $24,99 é cosmético.

**Correção:** bucket privado + URL assinada, e gerar uma prévia real (borrada/
baixa resolução) separada do arquivo final.

### 4. A VSL vende como incluso o que exige segundo pagamento
`src/app/quiz/vsl/page.tsx` (72-73, 324) vs `src/app/soulmate/page.tsx` (281-296)

A oferta de $14,99 lista "seu retrato" e "janela do encontro" — exatamente o que
o produto só entrega mediante os $24,99. É a receita de reembolso e chargeback
que o próprio relatório dele alerta.

**Correção:** a oferta do plano deve dizer *prévia*; o retrato completo aparece
como upsell claro.

### 5. Upsell anual cobra ~$64 e não registra nada no banco
`src/app/api/quiz/upgrade-yearly/route.ts` (70-107)

`proration_behavior: "always_invoice"` cobra de verdade, mas nenhuma linha entra
em `payments`. A receita do upsell não existe no banco nem no relatório de
afiliados.

### 6. `schema-stripe.sql` está defasado como "banco novo"
README e DEPLOY apontam esse arquivo como fonte única para banco do zero, mas
ele não cria `user_entitlements`, `soulmate_portraits`, `daily_checkins`,
`user_streaks`, nem o bucket. Um ambiente novo (staging) sobe quebrado.

---

## MÉDIO

7. `/cart` oferece o plano anual a quem já assina, mas `/api/checkout` rejeita
   qualquer assinante — **não existe caminho mensal → anual no app**.
8. Carrossel intitulado "perguntaram sobre a alma gêmea" exibe depoimentos
   sobre **dinheiro e carreira** (`quiz/vsl/page.tsx:665`).
9. Upgrade anual reporta `value: 79` ao GA4/Meta, mas a fatura real é ~$64,01.

## BAIXO

10. `/api/soulmate/checkout` não insere linha PENDING em `payments`.
11. `claim_milestone()` existe no SQL e **nunca é chamada** — `claimed_milestones`
    fica `{}` para sempre.
12. `upgrade-yearly` faz update por e-mail sem checar linhas afetadas.
13. Mesma foto (`t3.jpg`) como "Emily R./Portland" e "Jessica L./Miami".
14. Fallback de rede dispara Purchase com `14.99` fixo (mesmo p/ $9,99 e $79).
15. `page_view`/`PageView` duplicados (layout + `trackPageView`).

---

## Já executado por mim nesta rodada

- **4 preços criados no Stripe (live)** — ver `reports/STRIPE_PRICES_NOVOS.md`
  (o risco nº 1 do relatório dele está resolvido do lado do Stripe; falta colar
  as env vars na Vercel).
- **Chave do Gemini** validada (modelo `gemini-2.5-flash-image` disponível) e
  gravada no `.env` local.
- **Bug do `computeScore`** corrigido também no repo principal.

## Ainda com você

1. **Vercel:** colar as 5 env vars de price + `GEMINI_API_KEY` + redeploy.
2. **Supabase:** rodar as 5 migrations na ordem (leads → lead_source →
   premium_yearly → entitlements → streaks).
3. **Vídeo do retrato:** ele está certo, mas o problema é maior — a Aura diz
   "preparando o retrato" e o vídeo mostra um **casal se encontrando num
   parque**, não um retrato sendo desenhado. Não bate com a fala em nenhum
   dos casos.
4. **Termos, privacidade e reembolso** — pré-requisito de Stripe e Meta.
