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

export const USD_GRID: CurrencyGrid = {
  code: "usd",
  symbol: "$",
  front: Number(process.env.NEXT_PUBLIC_FRONT_PRICE_USD || 29),
  list: Number(process.env.NEXT_PUBLIC_FRONT_LIST_PRICE_USD || 58),
  cord: 9,
  vibes: 19,
  downsell: 19.99,
  oto: 27,
};

export const ZAR_GRID: CurrencyGrid = {
  code: "zar",
  symbol: "R",
  front: 549,
  list: 1099,
  cord: 169,
  vibes: 349,
  downsell: 379,
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
