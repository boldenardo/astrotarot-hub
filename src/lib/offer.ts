// Estrutura de oferta do funil de soulmate (24/08).
//
// O funil inteiro constrói desejo por UM objeto — o retrato — e o checkout
// vendia outra coisa: assinatura de leituras. Quem chegava ali tinha vindo
// ver um rosto e recebia acesso a um app. Agora o front vende exatamente o
// que foi prometido (leitura completa + retrato, pagamento único) e a
// assinatura só aparece DEPOIS da compra, como continuidade.
//
// Este arquivo é a fonte única de verdade do que o texto mostra. Os price
// ids ficam no servidor (src/app/api/quiz/checkout), nunca no bundle.

/**
 * Preço do front. Trocável sem deploy pela env NEXT_PUBLIC_FRONT_PRICE_USD
 * (29 ou 37) — o teste que o dono quer rodar. O price id correspondente é
 * escolhido no servidor pelo mesmo número, então texto e cobrança nunca
 * divergem.
 */
export const FRONT_PRICE_USD = Number(
  process.env.NEXT_PUBLIC_FRONT_PRICE_USD || 14.99
);

export const FRONT_PRICE_LABEL = `$${FRONT_PRICE_USD}`;

/**
 * Preço de TABELA (26/08, decisão do dono): $58 é o preço real das
 * páginas diretas (home, /soulmate) — o funil vende os mesmos $58 com
 * 50% de desconto para quem completou o quiz. O desconto riscado é
 * verdadeiro porque o preço cheio EXISTE e é cobrado fora do funil.
 */
export const FRONT_LIST_PRICE_USD = Number(
  process.env.NEXT_PUBLIC_FRONT_LIST_PRICE_USD || 58
);
export const FRONT_LIST_PRICE_LABEL = `$${FRONT_LIST_PRICE_USD}`;
export const LIST_DISCOUNT_PCT = Math.round(
  (1 - FRONT_PRICE_USD / FRONT_LIST_PRICE_USD) * 100
);

/** Janela de garantia, também testável sem deploy (30 ou 60). */
export const GUARANTEE_DAYS = Number(
  process.env.NEXT_PUBLIC_GUARANTEE_DAYS || 30
);

/** Order bump do checkout — a Stripe renderiza como "adicionar ao pedido". */
export const BUMP_PRICE_USD = 9;
export const BUMP_PRICE_LABEL = `$${BUMP_PRICE_USD}`;

/** OTO one-click depois da compra. */
export const OTO_PRICE_USD = 27;
export const OTO_PRICE_LABEL = `$${OTO_PRICE_USD}`;

/**
 * Downsell de quem recusa o front: só o retrato, sem a leitura.
 * Desceu de $17 para $9 em 27/08 junto com o front ($29 → $14.99): um
 * downsell tem de ser mais barato que a oferta recusada, senão é upsell.
 */
export const DOWNSELL_PRICE_USD = 9;
export const DOWNSELL_PRICE_LABEL = `$${DOWNSELL_PRICE_USD}`;

/** Continuidade, oferecida só depois da primeira compra. */
export const CONTINUITY_PRICE_LABEL = "$9.99";

/**
 * O que a compra destrava — as TRÊS cartas ainda viradas para baixo, mais
 * o retrato.
 *
 * Encolheu de 6 para 4 em 28/08: as cartas III (o que está no caminho) e IV
 * (quando os caminhos se cruzam) passaram a ser entregues DE GRAÇA na VSL.
 * Continuar listando as duas aqui seria vender o que a pessoa acabou de
 * ganhar três blocos acima — a objeção que mata a oferta sozinha.
 */
export const FRONT_INCLUDES = [
  "Your soulmate's portrait, unblurred — the face your chart points to",
  "Card I — who the cards point to, in the words they used",
  "Card II — the traits that make them recognizable across a room",
  "Card V — what the cards suggest you do next, inside your window",
] as const;

/** Vai logo abaixo da lista: sem isto a oferta parece cobrar pelo grátis. */
export const FRONT_ALREADY_FREE =
  "Cards III and IV are already yours — buying or not.";
export const FRONT_OFFER_ID = "soulmate_reading_portrait";
