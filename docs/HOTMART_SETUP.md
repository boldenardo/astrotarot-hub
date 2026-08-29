# Migração para a Hotmart — o que falta fazer no painel

Estado em 29/08: o código está pronto na branch `hotmart-migracao`, build
passando. O produto **AstroTarot** (ID 8387609, código `V107320990D`) já
existe com a oferta base de **US$ 14,99** (`msxqi5zi`), e o checkout foi
testado ao vivo: converte a moeda por país, chega com o e-mail preenchido e
preserva o rastreio do funil (`sck`).

Falta o que só pode ser feito no painel.

## 1. O webhook — sem isto ninguém recebe o que comprou

Painel → **Ferramentas → Webhook**:

- URL: `https://astrotarot.shop/api/hotmart/webhook`
- Eventos: `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`,
  `PURCHASE_CHARGEBACK`

O token (*hottok*) já está no `.env` local. **Precisa ir para a Vercel**
como `HOTMART_HOTTOK` — o webhook rejeita tudo sem ele, e quem pagar fica
sem acesso.

## 2. As outras ofertas — todas dentro do MESMO produto

Painel → produto AstroTarot → **Precificação e ofertas → Novo preço**.
Uma oferta por linha. Depois de criar, copie o **código** de cada uma
(aparece na coluna "Código", como `msxqi5zi`) e o link de pagamento.

| Nome sugerido | Valor | Para quê | Env do link | Env do código |
|---|---|---|---|---|
| Downsell | US$ 9,99 | quem recusou a oferta principal | `HOTMART_CHECKOUT_URL_DOWNSELL` | `HOTMART_OFFER_DOWNSELL` |
| Portrait | US$ 9 | e-mail de abandono | `HOTMART_CHECKOUT_URL_PORTRAIT` | `HOTMART_OFFER_PORTRAIT` |
| Cord Reading | US$ 9 | order bump / venda avulsa | `HOTMART_CHECKOUT_URL_CORD` | `HOTMART_OFFER_CORD` |
| Vibes | US$ 9 | order bump | `HOTMART_CHECKOUT_URL_VIBES` | `HOTMART_OFFER_VIBES` |
| Past Life | US$ 27 | OTO pós-compra | `HOTMART_CHECKOUT_URL_OTO` | `HOTMART_OFFER_OTO` |

O link tem o formato `https://pay.hotmart.com/V107320990D?off=CODIGO`.

**Enquanto uma oferta não existir, aquele caminho devolve erro em vez de
vender** — de propósito. Mandar a pessoa para a oferta errada cobraria o
valor errado, que é pior que não vender.

## 3. Virar a chave

Na Vercel, depois do webhook configurado:

```
PAYMENT_PROVIDER=hotmart
NEXT_PUBLIC_PAYMENT_PROVIDER=hotmart
HOTMART_HOTTOK=<o token do painel>
```

Voltar para a Stripe é apagar as duas primeiras. Nenhum deploy de código:
o webhook da Stripe continua ligado de qualquer jeito, para honrar compras
antigas (entitlements e reembolsos de quem já comprou).

**Dá para virar só o produto principal agora** e deixar o resto na Stripe
até as outras ofertas existirem — o front é o único caminho com volume.

## O que se perde na troca

O checkout próprio (`/quiz/checkout`) sai do caminho, e com ele:

- as **cartas de desconto** (5% a 30%)
- os **order bumps ao vivo** (Cord e Vibes recalculando o total)
- o **preço em rand** para a África do Sul

A Hotmart trabalha com página de oferta fixa criada no painel. Em troca ela
é *merchant of record*, processa com adquirência própria em vários países e
oferece **PayPal** — a saída de quem tem cartão bloqueado para e-commerce
internacional, que é o `transaction_not_allowed` que derrubou a venda de
29/08.

## Divergência conhecida e aceita

O painel está com **7 dias** de reembolso; o funil promete **30**. Decisão
do dono (29/08): fica assim, e reembolso fora do prazo é estornado à mão.
