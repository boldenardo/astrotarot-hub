// Saneamento de e-mail digitado em webview/mobile.
//
// Caso real (21/08): um lead entrou como "nome@gmail.commessenger" — o
// autocomplete do Messenger colou um sufixo depois do TLD. O regex genérico
// aceitava, a sessão da Stripe nascia com e-mail morto e, se a pessoa
// pagasse, a conta e o e-mail de boas-vindas iriam para o nada.
//
// Estratégia conservadora (zero falso positivo): só corrige quando o
// domínio COMEÇA com um provedor de consumo conhecido e sobra lixo
// alfabético colado — e os typos clássicos de TLD desses mesmos
// provedores (gmail.con, hotmail.cm...). Domínios desconhecidos passam
// intactos pela validação normal. Hosts curtos/genéricos (mail.com, me.com)
// ficam FORA da lista: "mail.community" é um domínio legítimo.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i;

const KNOWN_HOSTS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.com.au",
  "yahoo.ca",
  "yahoo.fr",
  "yahoo.es",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "outlook.com",
  "outlook.co.uk",
  "live.com",
  "live.co.uk",
  "msn.com",
  "icloud.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "web.de",
  "bigpond.com",
];

const TLD_TYPOS: Record<string, string> = {
  con: "com",
  cm: "com",
  co: "com",
  comm: "com",
  vom: "com",
  xom: "com",
  om: "com",
  cpm: "com",
  ocm: "com",
  "com.": "com",
};

const TYPO_HOSTS = ["gmail", "yahoo", "hotmail", "outlook", "icloud", "aol", "live"];

/**
 * Normaliza e valida. Retorna o e-mail corrigido ou null se, mesmo após
 * as correções seguras, não for um endereço plausível.
 */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let e = raw.trim().toLowerCase().replace(/\s+/g, "");
  // Alguns teclados colam "mailto:" ou aspas.
  e = e.replace(/^mailto:/, "").replace(/^["']|["']$/g, "");
  const at = e.lastIndexOf("@");
  if (at < 1 || at === e.length - 1) return null;
  const local = e.slice(0, at);
  let domain = e.slice(at + 1);

  // 1) Sufixo colado por autocomplete: "gmail.commessenger" → "gmail.com".
  for (const host of KNOWN_HOSTS) {
    if (domain !== host && domain.startsWith(host)) {
      const tail = domain.slice(host.length);
      if (/^[a-z]{1,20}$/.test(tail)) {
        domain = host;
        break;
      }
    }
  }

  // 2) Typo de TLD em provedor conhecido: "gmail.con" → "gmail.com".
  const m = domain.match(/^([a-z]+)\.([a-z.]+)$/);
  if (m && TYPO_HOSTS.includes(m[1]) && TLD_TYPOS[m[2]]) {
    domain = `${m[1]}.${TLD_TYPOS[m[2]]}`;
  }

  const fixed = `${local}@${domain}`;
  return EMAIL_RE.test(fixed) ? fixed : null;
}
