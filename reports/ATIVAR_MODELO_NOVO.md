# Ativar o modelo novo — 2 passos

---

# PASSO 1 — Vercel: variáveis de ambiente

**Onde:** vercel.com → projeto `boldenardo-astrotarot-hub` → **Settings** →
**Environment Variables** → marcar **Production** (e Preview, se usar).

## Editar as que já existem

| Nome | Novo valor |
|---|---|
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_1U4Vqh07YF1LaBzhq5nVOypv` |

## Adicionar as novas

| Nome | Valor |
|---|---|
| `STRIPE_PRICE_PREMIUM_YEARLY` | `price_1U4Vqh07YF1LaBzh0vT7RR7w` |
| `STRIPE_PRICE_SOULMATE_PORTRAIT` | `price_1U4Vra07YF1LaBzhrWLpDzEk` |
| `STRIPE_PRICE_VIBES_MONTHLY` | `price_1U4Vrb07YF1LaBzhbDjdir7l` |
| `GEMINI_API_KEY` | *(a chave que você me passou — gere uma nova depois)* |

**Conferir que já existe** (não mexer): `STRIPE_PRICE_READINGS_PACK` =
`price_1Tvg2V07YF1LaBzhBH3h9Tqm`

## Ainda faltando para medir o funil

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-...` (Google Analytics) |
| `NEXT_PUBLIC_META_PIXEL_ID` | ID do pixel (se for anunciar no Meta) |
| `ADMIN_EMAILS` | `saasescola01@gmail.com` (libera `/admin/affiliates`) |

> ⚠️ **Depois de salvar tudo, clique em Redeploy.** Variáveis só entram no site
> num build novo — sem redeploy nada muda.

---

# PASSO 2 — Supabase: rodar os 5 SQLs

**Pasta no seu computador:**
```
C:\Users\luiss\OneDrive\Área de Trabalho\Astrologia saas\astrotarot-hub-main\supabase\migrations\
```

**Onde rodar:** supabase.com → seu projeto → **SQL Editor** → **New query** →
colar o conteúdo do arquivo → **RUN**. Um de cada vez, **nesta ordem**:

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `20260814_leads.sql` | Tabela `leads` — salva o e-mail do quiz no servidor (hoje ele morre no celular da pessoa) |
| 2 | `20260814_lead_source.sql` | Coluna de origem do lead (orgânico, anúncio…) |
| 3 | `20260814_premium_yearly.sql` | Libera o plano anual no `CHECK` de `users.subscription_plan` |
| 4 | `20260814_entitlements.sql` | Tabelas de acesso pago (retrato $24,99, Vibes) |
| 5 | `20260814_streaks.sql` | Check-in diário e recompensas |

**A ordem importa:** o arquivo 2 altera a tabela que o 1 cria; o 3 precisa
existir antes de qualquer compra anual.

Se algum der erro, **pare e me mande a mensagem** — não siga para o próximo.

## Depois de rodar, confira no SQL Editor

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('leads','user_entitlements','soulmate_portraits','daily_checkins','user_streaks')
order by table_name;
```

Devem aparecer as **5 tabelas**.

---

## Aviso sobre a migration 4 (entitlements)

Ela cria o bucket de imagens como **público** e a "prévia" aponta para a mesma
URL da imagem final — ou seja, **o upsell de $24,99 não fica protegido**: quem
paga $14,99 já consegue a imagem completa. Rode assim mesmo (nada quebra), mas
isso precisa ser corrigido antes de vender o retrato como produto separado.
Detalhes em `reports/REVISAO_FUNIL_SOCIO.md`, item 3.
