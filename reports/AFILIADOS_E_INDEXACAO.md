# Afiliados + Indexação — guia de ativação

## PARTE 1 — Ligar o sistema de afiliados (3 passos, ~10 min)

### Passo 1 — Criar as tabelas no Supabase
Abra o Supabase → **SQL Editor** → cole o conteúdo de
[supabase/migrations/20260812_affiliates.sql](../supabase/migrations/20260812_affiliates.sql) → **RUN**.

Cria: `affiliates`, `affiliate_clicks`, `affiliate_sales`, a coluna
`users.affiliate_code` e a view `affiliate_stats`. Nenhuma delas é acessível
publicamente — só o servidor (service role) lê e escreve.

### Passo 2 — Liberar seu acesso ao painel
Vercel → Project → Settings → **Environment Variables** → adicionar:

| Nome | Valor |
|---|---|
| `ADMIN_EMAILS` | `saasescola01@gmail.com` (vírgula separa vários) |

Depois **Redeploy**. Sem essa variável ninguém entra no painel (falha fechada
de propósito).

### Passo 3 — Cadastrar um afiliado
Supabase → SQL Editor:

```sql
INSERT INTO affiliates (code, name, email, commission_pct)
VALUES ('maria30', 'Maria Silva', 'maria@exemplo.com', 30.00);
```

O link dela passa a ser: `https://astrotarot.shop/?ref=maria30`
(funciona em qualquer página pública — `/quiz?ref=maria30`, `/tarot?ref=maria30`…).

Painel: **https://astrotarot.shop/admin/affiliates**

---

## Como o tracking funciona

1. Visitante abre qualquer página com `?ref=CODIGO`
2. O código é gravado no navegador por **90 dias** (first-touch: o primeiro
   código vence; um `?ref=` novo não rouba a indicação enquanto a atribuição
   estiver viva)
3. O clique é registrado uma única vez por visitante (refresh não infla)
4. No checkout, o código viaja como metadata da sessão Stripe
5. O webhook grava a venda em `affiliate_sales` **e** carimba
   `users.affiliate_code` — é isso que credita **renovações** da assinatura
   automaticamente, mês após mês
6. O painel mostra: cliques, vendas, conversão, receita, **comissão devida**
   e as últimas 50 vendas atribuídas

Pagamento de comissão é manual por enquanto (você olha o painel e paga por
Pix/PayPal). Quando passar de ~10 afiliados ativos pedindo painel próprio,
migrar para Rewardful (~US$49/mês) sem perder o histórico.

### Teste antes de divulgar
1. Cadastre um código de teste (`teste10`)
2. Abra `https://astrotarot.shop/?ref=teste10` numa aba anônima
3. O painel deve mostrar **1 clique** em segundos
4. Faça uma compra de teste no funil → a venda aparece atribuída

---

## PARTE 2 — Páginas para indexar no Google Search Console

Método: GSC → **Inspeção de URL** (barra do topo) → cole a URL → **Solicitar
indexação**. Faça ~5 por dia para não bater na cota.

### Prioridade 1 — fazer hoje
| # | URL | Por quê |
|---|---|---|
| 1 | `https://astrotarot.shop/` | Home — entrada principal |
| 2 | `https://astrotarot.shop/tarot` | Maior volume de busca do nicho |
| 3 | `https://astrotarot.shop/challenge` | Único conteúdo sem login — melhor página para linkar |
| 4 | `https://astrotarot.shop/compatibility` | Ângulo soulmate (foco atual do funil) |
| 5 | `https://astrotarot.shop/about` | E-E-A-T: reforça a entidade da marca |

### Prioridade 2 — amanhã
| # | URL |
|---|---|
| 6 | `https://astrotarot.shop/predictions` |
| 7 | `https://astrotarot.shop/numerology` |
| 8 | `https://astrotarot.shop/quiz` |

**São essas 8 — o sitemap inteiro.** Também envie o sitemap em GSC →
**Sitemaps** → `sitemap.xml` (uma vez só; depois o Google revisita sozinho).

### NÃO indexar (já bloqueadas de propósito)
`/quiz/flow`, `/quiz/vsl`, `/quiz/thank-you` (etapas do funil, noindex),
`/dashboard`, `/profile`, `/cart`, `/admin` (privadas), `/auth/*` (noindex),
`/personality`, `/abundance`, `/guia` (exigem login → o Google veria só o
redirect de login).

### Acompanhamento (5 min/semana)
- `site:astrotarot.shop` no Google → o número de páginas deve subir até 8
- GSC → **Páginas** → confirmar "Indexada" e investigar qualquer "Descoberta,
  não indexada" que persista mais de 3 semanas
- GSC → **Desempenho** → quando surgirem impressões, filtrar consultas na
  posição 5–30: são os termos onde um backlink ou uma página dedicada faz
  você entrar na primeira página
