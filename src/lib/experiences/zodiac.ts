// Signo solar a partir de birth_date (YYYY-MM-DD) — cálculo por faixas,
// sem API externa. Usado só para contextualizar leituras (nunca obrigatório).

const RANGES: Array<[string, number, number, number, number]> = [
  ["Capricorn", 12, 22, 1, 19],
  ["Aquarius", 1, 20, 2, 18],
  ["Pisces", 2, 19, 3, 20],
  ["Aries", 3, 21, 4, 19],
  ["Taurus", 4, 20, 5, 20],
  ["Gemini", 5, 21, 6, 20],
  ["Cancer", 6, 21, 7, 22],
  ["Leo", 7, 23, 8, 22],
  ["Virgo", 8, 23, 9, 22],
  ["Libra", 9, 23, 10, 22],
  ["Scorpio", 10, 23, 11, 21],
  ["Sagittarius", 11, 22, 12, 21],
];

export function zodiacFromBirthDate(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  const m = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  for (const [sign, m1, d1, m2, d2] of RANGES) {
    if ((month === m1 && day >= d1) || (month === m2 && day <= d2)) return sign;
  }
  return null;
}
