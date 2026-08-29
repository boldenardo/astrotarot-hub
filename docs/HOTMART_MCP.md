# HOTMART MCP — Provider financeiro operacional

> Migração temporária (2026-08-20): Hotmart é o provider ATIVO; a Stripe está
> PRESERVADA no código e DESLIGADA do runtime. Sem fallback entre providers.

## Arquitetura

```
Claude ──► MCP Server (mcp/hotmart/server.mts, stdio via tsx)
                │  23 tools: read / analytics / write (confirmation-gated)
                ▼
        HotmartService (src/lib/hotmart/service.ts)
                │  reads, agregações, coreografia de writes
                ▼
        HotmartClient (src/lib/hotmart/client.ts)
                │  ALLOWLIST de operações · retry 401 · backoff 429 ·
                │  paginação cursor · timeout 30s · erro tipificado
                ▼
        HotmartTokenManager (src/lib/hotmart/token-manager.ts)
                │  OAuth client_credentials · cache · lock · renovação
                ▼
        Hotmart API (developers.hotmart.com | sandbox.hotmart.com)
```

Runtime do app (Next):
- `src/lib/payments/provider.ts` — `PAYMENT_PROVIDER` / `STRIPE_ENABLED` +
  modelo normalizado (`PaymentTransaction`) + `PROVIDER_CAPABILITIES`.
- `/api/quiz/checkout` — com `PAYMENT_PROVIDER=hotmart` devolve
  `{url}` do checkout hospedado (oferta criada no painel) com e-mail
  pré-preenchido e `sck=<variante>`; os funis já sabem redirecionar.
- `/api/hotmart/webhook` — Webhook 2.0: valida `X-HOTMART-HOTTOK`, limita
  payload, idempotente por transação, credita 5 leituras, boas-vindas.

## Variáveis de ambiente

| Var | Valor | Função |
|---|---|---|
| `PAYMENT_PROVIDER` | `hotmart` \| `stripe` (default) | provider do runtime |
| `STRIPE_ENABLED` | `false` | corta cobranças novas na Stripe |
| `HOTMART_CLIENT_ID` / `HOTMART_CLIENT_SECRET` | painel → Ferramentas → Credenciais | OAuth (Basic é derivado, não armazenado) |
| `HOTMART_ENV` | `production` \| `sandbox` | base da API |
| `HOTMART_WRITES_ENABLED` | `false` (default) | **kill switch** de mutações |
| `HOTMART_BULK_WRITES_ENABLED` | `false` (default) | kill switch de operações em lote |
| `HOTMART_HOTTOK` | token do painel de webhook | autenticidade do webhook |
| `HOTMART_CHECKOUT_URL_PACK5` | `https://pay.hotmart.com/...?off=...` | oferta do 5-Reading Pack |
| `HOTMART_TZ` | `America/Sao_Paulo` (default) | períodos das analytics |

Credenciais NUNCA em código/git/logs/resposta de tool. O token OAuth vive
só no TokenManager (redigido em erros).

## Tools

**Read (execução direta)**: get_sales, get_sale, get_sales_summary,
get_sales_participants (PII mascarada por padrão; `reveal_pii=true` expõe),
get_sales_commissions, get_sales_price_details, get_subscriptions,
get_subscription, get_subscription_purchases, get_subscription_summary,
get_products, get_refunds, get_cancelled_sales, capabilities.

**Analytics**: revenue_summary, compare_periods, product_performance —
paginação completa, timezone configurável, períodos nomeados
(today/yesterday/last_24h/last_7d/this_month/prev_month).

**Write (modelo de confirmação)** — fluxo obrigatório de cada tool:

```
call sem confirm  → PRE-FLIGHT (resumo do impacto; nada executa)
call dry_run=true → valida elegibilidade; nada executa
call confirm=true → kill switch → WRITE → read-after-write → resultado
```

| Tool | Endpoint oficial | Risco | Regras |
|---|---|---|---|
| hotmart_refund_sale | PUT /payments/api/v1/sales/{transaction}/refund | HIGH/FINANCIAL | só APPROVED/COMPLETE; não-trial; não BACS/SEPA |
| hotmart_cancel_subscription | POST /payments/api/v1/subscriptions/{code}/cancel | HIGH | body `send_mail` (não send_email) |
| hotmart_cancel_subscriptions | POST /payments/api/v1/subscriptions/cancel | HIGH/BULK | lista explícita 1..100; nunca "todas" |
| hotmart_reactivate_subscription | POST /payments/api/v1/subscriptions/{code}/reactivate | HIGH (charge=true: FINANCIAL) | só INACTIVE; assinante ACEITA por e-mail (3 dias) → resultado é sempre `REACTIVATION_REQUESTED` |
| hotmart_reactivate_subscriptions | POST /payments/api/v1/subscriptions/reactivate | HIGH/BULK | idem |
| hotmart_change_subscription_due_day | PATCH /payments/api/v1/subscriptions/{code} | MEDIUM | due_day 1..31; só ACTIVE/OVERDUE; nunca em trial |

Resultados possíveis: `success` (confirmado por releitura) · `failed` (com
motivo) · `unconfirmed` (HTTP aceito mas estado não confirmado — NUNCA
repetir às cegas) · `preflight` · `dry_run` · `blocked` (kill switch).

## Journal de mutação

`mcp/hotmart/journal.jsonl` (gitignored): operation_id, action, recurso,
estado anterior/novo, timestamps, resultado. Sem secrets; e-mails mascarados.

## Sandbox

Base `https://sandbox.hotmart.com` (mesmos paths). EXIGE credencial criada
com o tipo **sandbox** marcado (painel → Ferramentas → Credenciais; o tipo
não muda depois de criada). Com ela: `HOTMART_ENV=sandbox` + as novas
`HOTMART_CLIENT_ID/SECRET`. Dados são fictícios; a conta real nunca é
afetada.

## Produção (writes)

Só após: OAuth PASS ✓ · Reads PASS ✓ · Sandbox writes PASS (pendente de
credencial sandbox) · MCP PASS ✓ · Tests PASS ✓. Então:
`HOTMART_ENV=production` + `HOTMART_WRITES_ENABLED=true`
(e `HOTMART_BULK_WRITES_ENABLED=true` apenas quando precisar de lote).
Para bloquear tudo imediatamente: `HOTMART_WRITES_ENABLED=false`.

## Webhook

Painel Hotmart → Ferramentas → Webhook (versão 2.0.0): URL
`https://astrotarot.shop/api/hotmart/webhook`, eventos PURCHASE_APPROVED,
PURCHASE_COMPLETE, PURCHASE_REFUNDED, PURCHASE_CHARGEBACK. Copiar o hottok
da conta para `HOTMART_HOTTOK` na Vercel. Idempotência: referência única
`hotmart_<transaction>` na coluna única de payments (reuso deliberado do
índice que já protege o webhook Stripe — sem migration nova).

## Rate limit

500 req/min (documentado). O client respeita `RateLimit-Reset` em 429 com
backoff + jitter; `getAll` pagina com `max_results=500`.

## Rollback / reativação da Stripe

1. Vercel: `PAYMENT_PROVIDER=stripe` (ou remover) e `STRIPE_ENABLED`
   removida (ou `true`). Nada de código.
2. Todo o código Stripe está intacto: rotas, webhook, upsells, testes.
3. O webhook Stripe NUNCA foi desligado (honra compras antigas).

## Troubleshooting

- `HOTMART_AUTH_FAILED` → credenciais/env; token renova sozinho em 401.
- `HOTMART_OPERATION_UNAVAILABLE` → operação fora da allowlist (não existe
  endpoint público) — NUNCA cai para a Stripe.
- `unconfirmed` → consultar o recurso antes de qualquer retry.
- Webhook 401 → HOTMART_HOTTOK ausente/errado na Vercel.
- Testes: `npm run test:hotmart` (30 testes, fetch mockado).
