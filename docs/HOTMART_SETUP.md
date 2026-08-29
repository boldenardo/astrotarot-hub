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

## 2. As ofertas — FEITO

As seis já existem, todas dentro do mesmo produto, e os códigos abaixo
foram lidos da **API** depois de criadas (o painel mostra o formulário que
você acabou de preencher; a listagem da API mostra o que de fato existe —
duas ofertas "salvas" não apareceram na primeira listagem).

| Oferta | Valor | Para quê | Código |
|---|---|---|---|
| (base) | US$ 14,99 | oferta principal do funil | `msxqi5zi` |
| Downsell | US$ 9,99 | quem recusou a principal | `bvyxnxxf` |
| Portrait | US$ 9 | e-mail de abandono | `v6eqt5s7` |
| Cord Reading | US$ 9 | venda avulsa | `c7d60z8z` |
| Vibes | US$ 9 | venda avulsa | `uuiqazhu` |
| Past Life | US$ 27 | OTO pós-compra | `r4wq8vzf` |

O link de cada uma é `https://pay.hotmart.com/V107320990D?off=CODIGO`.

**Já estão no código como padrão** (`src/lib/payments/hotmart-offers.ts`),
tanto para montar o link quanto para o webhook decidir qual direito
conceder. Não é preciso colar nada na Vercel: as envs
`HOTMART_CHECKOUT_URL_*` e `HOTMART_OFFER_*` continuam existindo e têm
prioridade, mas só para trocar uma oferta sem deploy.

Todas foram criadas como **pagamento à vista em dólar**, com conversão
automática de moeda ligada — que é o que faz o preço aparecer em rand para
a África do Sul sem o nosso checkout.

### O que ainda NÃO tem oferta

**As assinaturas** (`SUB_MONTHLY`, `SUB_SEMIANNUAL`, `SUB_ANNUAL`) e o
`PACK5` legado. Não existe produto de assinatura na conta Hotmart, e uma
assinatura não é uma oferta a mais dentro de um produto de compra única —
é outro produto. Enquanto não existir, esses planos devolvem **503
explícito** com `PAYMENT_PROVIDER=hotmart`.

Consequência prática: o pós-compra (`/quiz/thank-you`) e a página `/vibes`,
que vendem recorrência, continuam dependendo da Stripe. O **front tem
volume, a recorrência não** — nunca houve venda de assinatura — então isso
não bloqueia virar a chave.

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

As seis ofertas de compra única já existem, então virar a chave leva o
funil inteiro junto. Só a recorrência fica na Stripe (ver acima).

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
