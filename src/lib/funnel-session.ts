// Identificador pseudônimo da passagem pelo funil.
//
// Serve para amarrar a mesma pessoa em quiz → VSL → clique → Stripe →
// compra. Sem ele, "49 pessoas viram a VSL" e "3 sessões de checkout" são
// dois números soltos: não dá para saber se são as mesmas pessoas, e foi
// exatamente isso que atrasou o diagnóstico do vídeo fora do ar.
//
// NÃO é identidade: não carrega e-mail, nome nem nada do quiz. É um número
// aleatório do browser, e é o que vai no metadata do Stripe — PII ali
// significaria dado pessoal espalhado num sistema que não precisa dele.

const KEY = "astro_funnel_sid";

function randomId(): string {
  try {
    const c = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const b = new Uint8Array(16);
      c.getRandomValues(b);
      return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // sem crypto — cai no fallback abaixo
  }
  // Último recurso: colisão aqui só embaralha um relatório, não quebra venda.
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Id desta passagem pelo funil. Cria na primeira chamada e mantém pelo
 * resto da jornada — inclusive na volta do Stripe, que é quando ele
 * precisa bater com o que foi enviado no checkout.
 */
export function getFunnelSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const id = randomId();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Modo privado / storage bloqueado: devolve um id volátil em vez de
    // vazio, para o evento ainda ser agrupável dentro da mesma página.
    return randomId();
  }
}

/** UTMs da URL atual, quando houver. Só as cinco padrão. */
export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const q = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      const v = q.get(k)?.trim().slice(0, 80);
      if (v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}
