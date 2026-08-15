# Variáveis de ambiente — estado atual

Marque conforme for conferindo em **Vercel → Settings → Environment
Variables → Production**. Depois de qualquer mudança: **Redeploy**.

## Já configuradas (confirmadas em produção)

| Variável | Situação |
|---|---|
| `STRIPE_PRICE_PREMIUM_MONTHLY` | ✅ `price_1U4Vqh07YF1LaBzhq5nVOypv` ($14,99 — checkout testado) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ `G-L2146BNFT1` (carregando na `/quiz`) |
| `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` | ✅ |
| `STRIPE_PRICE_READINGS_PACK` | ✅ |
| Supabase (3), Clerk (2), Groq, AstrologyAPI, APP_URL | ✅ |

## Confirme que estão lá (você disse ter adicionado)

```
STRIPE_PRICE_PREMIUM_YEARLY=price_1U4Vqh07YF1LaBzh0vT7RR7w
STRIPE_PRICE_SOULMATE_PORTRAIT=price_1U4Vra07YF1LaBzhrWLpDzEk
STRIPE_PRICE_VIBES_MONTHLY=price_1U4Vrb07YF1LaBzhbDjdir7l
GEMINI_API_KEY=<sua chave>
```

Como conferir sem abrir o painel: se `STRIPE_PRICE_PREMIUM_YEARLY` estiver
faltando, o botão do plano anual devolve erro 503 no checkout.

## Ainda faltando

| Variável | Para quê | Urgência |
|---|---|---|
| `ADMIN_EMAILS` | Abre `/admin/affiliates`. Sem ela o painel dá 404 até para você. | Quando for usar afiliados |
| `NEXT_PUBLIC_META_PIXEL_ID` | Eventos de compra no Meta. Sem ela, anúncio no Instagram/Facebook roda sem otimização de conversão. | Antes de anunciar |

Valor sugerido: `ADMIN_EMAILS=saasescola01@gmail.com`

## Opcionais (têm padrão no código)

| Variável | Padrão se ausente |
|---|---|
| `NEXT_PUBLIC_VSL_URL` | URL do R2 embutida no código |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` |

---

# SQL pendente no Supabase

Só falta **um**:

```
supabase/migrations/20260815_soulmate_private_bucket.sql
```

Torna o bucket do retrato **privado**. Sem ele, quem assina por $14,99 já
acessa a imagem completa e o add-on de $24,99 não protege nada.

As outras 6 (5 do sócio + afiliados) você já rodou — confirmei todas as
tabelas por API: `leads`, `user_entitlements`, `soulmate_portraits`,
`daily_checkins`, `user_streaks`, `affiliates`, `affiliate_clicks`,
`affiliate_sales`.
