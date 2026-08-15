# Preços do Stripe — modelo novo (criados em 14/08/2026, modo LIVE)

## Cole isto na Vercel → Settings → Environment Variables → Redeploy

```
STRIPE_PRICE_PREMIUM_MONTHLY=price_1U4Vqh07YF1LaBzhq5nVOypv
STRIPE_PRICE_PREMIUM_YEARLY=price_1U4Vqh07YF1LaBzh0vT7RR7w
STRIPE_PRICE_SOULMATE_PORTRAIT=price_1U4Vra07YF1LaBzhrWLpDzEk
STRIPE_PRICE_VIBES_MONTHLY=price_1U4Vrb07YF1LaBzhbDjdir7l
STRIPE_PRICE_READINGS_PACK=price_1Tvg2V07YF1LaBzhBH3h9Tqm
```

## O que cada um é

| Env var | Valor | Produto no Stripe |
|---|---|---|
| `STRIPE_PRICE_PREMIUM_MONTHLY` | **$14,99/mês** | AstroTarot — Unlimited Premium (agora é o preço padrão) |
| `STRIPE_PRICE_PREMIUM_YEARLY` | **$79/ano** | AstroTarot — Unlimited Premium |
| `STRIPE_PRICE_SOULMATE_PORTRAIT` | **$24,99 avulso** | AstroTarot — Draw Your Soulmate *(produto novo)* |
| `STRIPE_PRICE_VIBES_MONTHLY` | **$9,99/mês** | AstroTarot — Vibes & Meditations *(produto novo)* |
| `STRIPE_PRICE_READINGS_PACK` | $9,99 avulso | AstroTarot — 5-Reading Pack *(já existia)* |

## Preços antigos — mantidos ativos de propósito

`price_1Tvg2m...` ($29,90/mês) e `price_1U4KR3...` ($19,99/mês) continuam **ativos**.
Não desative: quem já assina neles seria interrompido na próxima renovação.
Arquive só quando não houver mais nenhum assinante nesses valores.

## Ainda pendente

**Modo de teste (sandbox):** os preços acima existem apenas em **live**. Para
testar checkout sem cobrar de verdade, é preciso criar os mesmos 4 preços no
modo de teste e usar as chaves `sk_test_`/`pk_test_` num ambiente de preview.
Isso exige a chave de teste, que não está no `.env` local.
