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

## 3. Virar a chave — UMA variável

O provider padrão do código já é a Hotmart. Mas ela só assume de verdade
quando consegue **entregar**, e a entrega inteira depende do webhook:

```
HOTMART_HOTTOK=<o token do painel>
```

Enquanto essa variável não estiver na Vercel, o runtime **continua na
Stripe de propósito**. Um deploy com a Hotmart ligada e o token faltando
venderia e não entregaria — quem pagasse ficaria sem acesso, que é pior
que não vender.

Então a ordem é: **webhook criado no painel → `HOTMART_HOTTOK` na Vercel →
está virado.** Não precisa mexer em mais nada.

`NEXT_PUBLIC_PAYMENT_PROVIDER` virou opcional. As duas páginas que
importam já perguntam ao servidor: `/quiz/reveal` recebe o gateway como
prop do server component, e `/quiz/checkout` reencaminha sozinho se
alguém chegar nele com a Hotmart ativa. Setá-la só economiza um salto.

### Conferir se virou

```
https://astrotarot.shop/api/health
```

No bloco `payments`:

- `active` — `"hotmart"` ou `"stripe"`, o que está valendo agora
- `hotmart.blocked` — `null` quando está tudo certo; com texto, é o motivo
  de a troca ter sido pedida e não ter acontecido
- `hotmart.plans` — os planos com oferta cadastrada
- `clientHintMatches` — `false` só custa um salto a mais no pagamento

### Voltar para a Stripe

```
PAYMENT_PROVIDER=stripe
```

Sem deploy de código. O webhook da Stripe fica ativo de qualquer forma,
para honrar compras feitas antes da troca.

## O que se perde na troca

O checkout próprio (`/quiz/checkout`) sai do caminho, e com ele:

- os **order bumps ao vivo** (Cord e Vibes recalculando o total)
- o **preço em rand** montado por nós

As **cartas de desconto** não entram nesta conta: foram removidas em 29/08
por decisão do dono ("o desconto ficou carregado demais"), e não voltariam
de qualquer forma — na Hotmart o preço vive na oferta cadastrada no
painel, então um desconto escolhido no nosso site não teria como chegar
lá. Prometer 30% e cobrar cheio seria pior que não descontar.

E o preço em rand não se perde de verdade: a **conversão automática de
moeda** está ligada nas seis ofertas, e é a Hotmart que faz esse trabalho
agora. Conferido ao vivo — as páginas de US$ 27 e US$ 9 abrem em real para
IP brasileiro.

A Hotmart trabalha com página de oferta fixa criada no painel. Em troca ela
é *merchant of record*, processa com adquirência própria em vários países e
oferece **PayPal** — a saída de quem tem cartão bloqueado para e-commerce
internacional, que é o `transaction_not_allowed` que derrubou a venda de
29/08.

## Divergência conhecida e aceita

O painel está com **7 dias** de reembolso; o funil promete **30**. Decisão
do dono (29/08): fica assim, e reembolso fora do prazo é estornado à mão.
