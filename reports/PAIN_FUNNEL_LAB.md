# Pain Funnel Lab — Experimento de Dor vs Dor

> Laboratório de Direct Response ao lado do funil de produção.
> Hipótese: **qual dor + quiz + LP gera mais compradores** — sem VSL.

## CONTROL_BASELINE (registrado antes de qualquer alteração)

- **Git**: árvore limpa, branch `main`, HEAD `0f7a0ba` ("Price the funnel in rand")
- **Testes**: não existe suíte automatizada; baseline = `next build` ✓ (verde em `0f7a0ba`)

### Rotas do Control (INTOCADAS por este experimento)

| Rota | Papel |
|---|---|
| `/quiz` | porta do funil (retrato borrado, bilíngue EN/ES) |
| `/quiz/flow` | conversa de 15 passos com a Master Aura (chat DM, carta manuscrita, voice note) |
| `/quiz/vsl` | página de venda V1 (controle do experimento VSL) |
| `/quiz/vsl-v2` | página de venda ativa (hero galáxia, oferta aberta) |
| `/quiz/thank-you` | pós-compra + upsell retrato one-click |

### Backend compartilhado (reutilizado, não modificado na lógica)

- `POST /api/quiz/checkout` — guest checkout PACK5 $9.99 embedded + order bump retrato + fallback hospedado. *Única mudança: +3 caminhos na allowlist de `cancelPath` (aditivo).*
- `POST /api/stripe/webhook` — fonte da verdade da compra (assinatura verificada, idempotente, guest por e-mail, `grant_readings(+5)`, bump por line items)
- `src/lib/analytics.ts` — *mudança aditiva: eventos `pain_*` novos; nenhum evento existente alterado*
- E-mails Resend (leitura/boas-vindas/recuperação/cartão recusado) — intocados

### Comportamento de referência (produção, 19/08)

- Lead→checkout do Control: ~25–39% conforme janela; decisão em ≤2 min
- Moedas localizadas ativas: USD, EUR, AUD (+BRL/GBP/CAD/NZD/MXN/ZAR configuradas)

## MATRIZ DO EXPERIMENTO

| VARIANTE | DOR | QUIZ | LP | VSL | PRODUTO | PREÇO | CHECKOUT |
|---|---|---|---|---|---|---|---|
| Control | atual (soulmate) | atual | atual (vsl-v2) | atual | 5-Reading Pack | $9.99 | atual |
| A `/quiz/intimacy` | intimidade/autoconfiança | novo (7 interações, chat Aura) | LP Copywriter | NÃO | igual | igual | igual (embedded) |
| B `/quiz/body` | corpo/ciclo de hábitos | novo | LP Copywriter | NÃO | igual | igual | igual |
| C `/quiz/money` | insegurança financeira/ciclos | novo | LP Copywriter | NÃO | igual | igual | igual |

## ARQUITETURA (engine + config, sem copy/paste de apps)

```
src/lib/pain-funnels/
  types.ts        ← contratos + dominantPattern()
  intimacy.ts     ← config A (copy do Ignite)
  body.ts         ← config B
  money.ts        ← config C
src/components/pain/
  PainFunnel.tsx  ← engine único: hook → chat quiz → transição → carta
                    → micro-reveal → open loop → LP (10 etapas) → checkout
src/app/quiz/{intimacy,body,money}/page.tsx  ← rotas finas, noindex
```

Isolamento: o Control não importa nada de `pain-funnels/`; o engine só
consome primitives pré-existentes (EmbeddedCheckoutPanel, analytics,
CardBack, cartas egípcias, avatar da Aura, funnel-session).

## ANALYTICS (dropoff por pergunta obrigatório)

`pain_funnel_view → pain_quiz_started → pain_quiz_answered(question_id,
answer_id, q_index) → pain_quiz_completed(pattern) → pain_tarot_started →
pain_card_selected → pain_card_revealed(card, pattern) → pain_lp_viewed →
pain_offer_viewed → pain_checkout_clicked(cta_position)` — depois entra na
esteira existente: `checkout_session_created → purchase_completed` +
webhook. Propriedades comuns: `segment`, `funnel_session_id`, UTMs.
Receita por braço: metadata `page_variant = pain_<segment>` na Stripe.

## IGNITE EXECUTION

Agentes originais lidos do zip e aplicados: `01-icp.md`,
`03-validador-de-ideia.md`, `05-slo-builder.md` (refinamento da proposta,
sem criar produto novo), `06-hook-writer.md`, `08-lp-copywriter.md`
(source of truth da LP). Execução por 3 agentes de estratégia + 3
revisores adversariais (workflow `wf_0156dcd3-26a`).

### Desvios do LP Copywriter exigidos pelos fatos (regra: números reais > verossímil)

1. **Garantia**: framework pede 30 dias; a oferta real tem **7 dias** → o
   bloco usa 7 dias. Para compliance total, a decisão comercial de
   estender para 30 é do operador.
2. **Bônus**: exige exatamente 3 reais; **não existem 3 confirmados** → LP
   publicada SEM bloco de bônus; sugestões implementáveis no relatório.
3. **Tabela com percentuais**: sem dado quantitativo verificável → 5
   critérios com contrastes concretos qualitativos, sem estatística
   fabricada.
4. **CTA A (urgência)**: sem escassez real → indisponível; só CTA B.
5. **Autoridade**: sem depoimentos com consentimento → bloco usa apenas
   os fatos públicos do produto (120.000+ leituras, nota 4.9, mecanismo).

## VALIDAÇÃO (03-validador-de-idea, por segmento)

| Segmento | Score | Veredito | Elo fraco declarado |
|---|---|---|---|
| intimacy | 7.5 | AVANÇA COM AJUSTES | ponte "padrão mental → carta" carrega 100% da conversão; medir drop-off na transição |
| body | 7.5 | AVANÇA COM AJUSTES | promessa travada em VER/NOMEAR o padrão (nunca resultado corporal); transição justifica o Tarô |
| money | 7.5 | AVANÇA COM AJUSTES | Roda da Fortuna = congruência rara com "ciclo que se repete"; nunca prometer dinheiro |

Ajustes obrigatórios dos três vereditos: **aplicados** na copy final
(promessa = leitura/nomeação do padrão; transição carrega a ponte inteira;
zero claims de resultado).

## CLAIM REVIEW (regex final sobre os 3 configs publicados)

- Varredura: cure/heal/treatment/diagnos*/guarantee results/will happen/
  lose weight/get rich/make money/erection/impotence/scientifically proven/
  astral map/birth details/second card/third card/thousands of/most men|women
- Resultado: **body limpo · money limpo · intimacy = 1 hit documentado**:
  o hook "carrying the fear that it will happen again" descreve o MEDO do
  lead (estado atual), não promete resultado — mantido por decisão.
- Correções adversariais aplicadas: 13 exatas do revisor + 5 manuais
  (quantificadores de coorte "most men/women" removidos; headline do money
  corrompida por nota do revisor → mecanismo literal "one card and seven
  honest answers"; "birth chart" removido da autoridade; FAQ de privacidade
  substituiu a FAQ de mapa astral no intimacy; open loops reformulados de
  "segunda/terceira carta" literal para "camadas da sua leitura completa").
- Método nomeado: intimacy = Quiet Pattern (recorre no open loop CTA);
  body = Pattern Mirror (recorre no value stack); money = sem método nomeado
  (revisor: dissonância pós-compra) → desvio nº 6 do LP Copywriter.

## DADOS COMERCIAIS FALTANTES (decisão do operador)

1. **Garantia 30 dias** — framework pede 30; hoje é 7. Estender?
2. **3 bônus reais** — sugestões implementáveis do workflow (custo ~zero):
   (a) Pattern Recap: PDF/página com padrão dominante + respostas-chave,
   entregue com a leitura #1 (dados já existem no funil);
   (b) Spiritual Guide 24/7 reposicionado como bônus "a linha direta para
   a pergunta das 2h da manhã" (já existe no produto);
   (c) Histórico permanente de leituras na conta (já existe).
   Aprovando os 3 → bloco de bônus entra na LP.
3. **Escassez real** para CTA A (ex.: preço de lançamento com data) — sem
   ela, só CTA B.

## URLS DE TESTE

- https://astrotarot.shop/quiz/intimacy · /quiz/body · /quiz/money
- Todas noindex; Control intocado em /quiz, /quiz/flow, /quiz/vsl-v2.

## PRÓXIMO JOGO DE DADOS (uma variável por vez)

1º: tráfego igual nos 3 braços → comparar `pain_quiz_completed →
pain_checkout_clicked` e compra real (Stripe metadata `page_variant`).
O validador previu que a transição quiz→tarô é o elo fraco: o primeiro
número a olhar é o drop entre `pain_quiz_completed` e `pain_card_revealed`.
