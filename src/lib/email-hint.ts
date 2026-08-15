// Detecção de erro de digitação em e-mail.
//
// Motivo: apareceram no Stripe checkouts com "gmail.l.com" — sintaticamente
// válidos, então o regex aceita, mas a pessoa nunca recebe nada e o lead
// morre. Aqui só SUGERIMOS a correção; nunca bloqueamos o envio.

/** Domínios reais mais comuns na base. */
const KNOWN = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "msn.com",
  "comcast.net",
  "me.com",
];

/** Erros de digitação frequentes que o Levenshtein sozinho não pega bem. */
const EXACT_FIXES: Record<string, string> = {
  "gmail.l.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.cm": "gmail.com",
  "hotmail.con": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "yahoo.con": "yahoo.com",
  "icloud.con": "icloud.com",
};

function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

/**
 * Retorna o e-mail corrigido quando o domínio parece ter erro de digitação,
 * ou null quando está tudo bem (ou quando não dá para ter certeza).
 */
export function suggestEmailFix(email: string): string | null {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at <= 0) return null;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!domain || KNOWN.includes(domain)) return null;

  const exact = EXACT_FIXES[domain];
  if (exact) return `${local}@${exact}`;

  // Distância 1 de um domínio conhecido = quase certamente typo.
  for (const known of KNOWN) {
    if (distance(domain, known) === 1) return `${local}@${known}`;
  }
  return null;
}
