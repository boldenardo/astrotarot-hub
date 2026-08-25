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
  process.env.NEXT_PUBLIC_FRONT_PRICE_USD || 29
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

/** Downsell de quem recusa o front: só o retrato, sem a leitura. */
export const DOWNSELL_PRICE_USD = 17;
export const DOWNSELL_PRICE_LABEL = `$${DOWNSELL_PRICE_USD}`;

/** Continuidade, oferecida só depois da primeira compra. */
export const CONTINUITY_PRICE_LABEL = "$9.99";

/** Itens da leitura — a mesma lista que o checkout está cobrando. */
export const FRONT_INCLUDES = [
  "Your soulmate's portrait, unblurred — the face your chart points to",
  "Who they are, in the words the cards used",
  "The traits that make them recognizable across a room",
  "What the cards say may be standing between you",
  "When your paths are most likely to cross",
  "What the cards suggest doing next",
] as const;
export const FRONT_OFFER_ID = "soulmate_reading_portrait";
