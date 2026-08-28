// Preços por moeda — a fonte ÚNICA dos números que o visitante vê e paga.
//
// Regra de ouro (aprendida em 23/08, quando a Stripe adaptava sozinha e a
// página prometia "$9.99" com o checkout abrindo "R179"): moeda local é
// PONTA A PONTA ou nada. O país vem do IP no SERVIDOR (header da Vercel)
// na hora de cobrar, e do /api/geo na hora de exibir — mesmo IP, mesma
// resposta. O client nunca manda valor nem moeda: manda flags, o servidor
// resolve tudo daqui.
//
// Fase 1 (26/08, aprovado pelo dono): só ZA→ZAR (R549 aprovado) — é a
// coorte com massa real: 3 das 5 pessoas que já digitaram cartão são
// sul-africanas. Expandir = adicionar uma linha no grid e a sigla na env
// NEXT_PUBLIC_LOCAL_CURRENCIES (desligar = env vazia).

export interface CurrencyGrid {
  /** Código ISO minúsculo que a Stripe espera. */
  code: string;
  /** Símbolo de exibição. */
  symbol: string;
  front: number;
  list: number;
  cord: number;
  vibes: number;
  downsell: number;
  oto: number;
}

// Front a $14.99 (27/08, decisão do dono): três dias com gente chegando ao
// formulário de cartão e ninguém digitando. ZAR na mesma taxa que ele já
// aprovou (R549 para $29 = 18,9 R/US$): 14,99 × 18,9 = R283 → R279.
//
// A ESCADA TEVE DE DESCER JUNTO. O downsell existe para ser mais barato que
// o front; a $19.99 ele passaria a custar MAIS que o produto que a pessoa
// acabou de recusar, e a página do downsell viraria um upsell disfarçado.
// Mesma coisa com o e-mail de abandono ($17 → ver offer.ts).
export const USD_GRID: CurrencyGrid = {
  code: "usd",
  symbol: "$",
  front: Number(process.env.NEXT_PUBLIC_FRONT_PRICE_USD || 14.99),
  list: Number(process.env.NEXT_PUBLIC_FRONT_LIST_PRICE_USD || 58),
  cord: 9,
  // 27/08: era $19 — mais caro que o próprio produto depois que o front
  // caiu para $14.99. Um bump que custa mais que a compra desmonta a
  // percepção de entrada barata que a queda de preço existe para criar.
  vibes: 9,
  downsell: 9.99,
  oto: 27,
};

export const ZAR_GRID: CurrencyGrid = {
  code: "zar",
  symbol: "R",
  front: 279,
  list: 1099,
  cord: 169,
  vibes: 169,
  downsell: 189,
  oto: 499,
};

/** Países com moeda própria ligada (env desliga/expande sem deploy). */
const LOCAL = (process.env.NEXT_PUBLIC_LOCAL_CURRENCIES ?? "ZA")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

const BY_COUNTRY: Record<string, CurrencyGrid> = {
  ZA: ZAR_GRID,
};

/** Grid da moeda do visitante; USD para todo o resto do mundo. */
export function gridForCountry(country?: string | null): CurrencyGrid {
  const c = (country ?? "").toUpperCase();
  if (LOCAL.includes(c) && BY_COUNTRY[c]) return BY_COUNTRY[c];
  return USD_GRID;
}

/** "R549" / "$29" / "$19.99" — sem decimais fantasma. */
export function fmtMoney(grid: CurrencyGrid, v: number): string {
  return Number.isInteger(v)
    ? `${grid.symbol}${v}`
    : `${grid.symbol}${v.toFixed(2)}`;
}
