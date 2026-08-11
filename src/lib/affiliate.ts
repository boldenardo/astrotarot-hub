// Afiliados — captura e persistência do código de indicação no browser.
//
// Fluxo: o afiliado divulga https://astrotarot.shop/?ref=CODIGO (funciona em
// qualquer página pública). O código é guardado por ATTRIBUTION_DAYS e viaja
// junto no checkout; o webhook do Stripe grava a venda atribuída.
//
// First-touch: o primeiro código válido dentro da janela vence — um ?ref=
// novo não sobrescreve enquanto a atribuição anterior estiver viva.

export const AFFILIATE_PARAM = "ref";
export const AFFILIATE_KEY = "astro_ref";
export const VISITOR_KEY = "astro_visitor";
export const ATTRIBUTION_DAYS = 90;

const MAX_CODE_LEN = 40;
// Código é sempre alfanumérico simples — evita lixo/injeção vindo da URL.
const CODE_RE = /^[a-zA-Z0-9_-]{2,40}$/;

interface StoredRef {
  code: string;
  /** epoch ms da primeira atribuição */
  at: number;
}

export function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().slice(0, MAX_CODE_LEN);
  return CODE_RE.test(code) ? code.toLowerCase() : null;
}

function isFresh(entry: StoredRef): boolean {
  const ageMs = Date.now() - entry.at;
  return ageMs >= 0 && ageMs < ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;
}

/** Código de afiliado ativo (ou null). Client-only. */
export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AFFILIATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRef>;
    if (typeof parsed?.code !== "string" || typeof parsed?.at !== "number") {
      return null;
    }
    const entry = { code: parsed.code, at: parsed.at };
    if (!isFresh(entry)) {
      window.localStorage.removeItem(AFFILIATE_KEY);
      return null;
    }
    return normalizeCode(entry.code);
  } catch {
    return null;
  }
}

/**
 * Guarda o código se ainda não houver atribuição válida (first-touch).
 * Retorna o código quando ESTA chamada criou a atribuição — assim o
 * caller sabe que deve registrar o clique.
 */
export function storeRef(rawCode: string): string | null {
  const code = normalizeCode(rawCode);
  if (!code || typeof window === "undefined") return null;
  if (getStoredRef()) return null; // já atribuído — first-touch vence
  try {
    const entry: StoredRef = { code, at: Date.now() };
    window.localStorage.setItem(AFFILIATE_KEY, JSON.stringify(entry));
    return code;
  } catch {
    return null; // storage indisponível: o funil segue normal, sem tracking
  }
}

/** ID anônimo e estável do visitante — só para não contar cliques repetidos. */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return "";
  }
}
