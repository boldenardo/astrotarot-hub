// Prova social — FONTE ÚNICA dos números exibidos no site e no funil.
// Antes, home/quiz diziam "40,000+" e o passo proof dizia "74,000+" na
// mesma jornada — inconsistência que mina a confiança exatamente onde o
// funil pede o email. Qualquer atualização de número acontece SÓ aqui.
export const PROOF_STATS = {
  /** Total de leituras entregues (ex.: "40,000+"). */
  readings: "40,000+",
  /** Nota média exibida (ex.: "4.9"). */
  rating: "4.9",
} as const;
