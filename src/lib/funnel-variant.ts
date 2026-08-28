// Qual página comercial a pessoa viu — dimensão do experimento V1 × V2.
//
// O funil tem duas áreas de venda servindo a MESMA oferta (PACK5, $9.99
// avulso) pelo MESMO checkout. Sem esta dimensão, os eventos das duas
// chegam misturados no GA4 e o teste não responde nada.
//
// Fica no localStorage porque a compra é confirmada em OUTRA página
// (/quiz/thank-you), depois de um round-trip pelo Stripe: sem o carimbo
// guardado, o purchase não sabe de qual braço veio e o guardrail
// (checkout start → purchase) fica cego. O valor também viaja no metadata
// da Checkout Session, então o mesmo número existe do lado do servidor.

export const VARIANT_CONTROL = "vsl_v1_control";
export const VARIANT_IGNITE = "vsl_v2_ignite";

export type FunnelVariant = typeof VARIANT_CONTROL | typeof VARIANT_IGNITE;

const KEY = "astro_vsl_variant";

/** Carimba a variante desta passagem. Chamado no mount de cada VSL. */
export function setFunnelVariant(variant: FunnelVariant): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, variant);
  } catch {
    // Modo privado: o evento ainda leva `variant` inline; só a atribuição
    // do purchase (outra página) se perde.
  }
}

/** Variante guardada, quando houver. */
export function getFunnelVariant(): FunnelVariant | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === VARIANT_CONTROL || raw === VARIANT_IGNITE ? raw : null;
  } catch {
    return null;
  }
}

/** "mobile" | "desktop" — corta os relatórios sem depender do UA string. */
export function getDeviceClass(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  try {
    return window.matchMedia("(max-width: 767px)").matches
      ? "mobile"
      : "desktop";
  } catch {
    return "desktop";
  }
}

/** Marca deixada por um travamento — a próxima visita já entra sem animação. */
const LOW_END_KEY = "astro_low_end";

/**
 * Aparelho que não aguenta a animação de transição do quiz.
 *
 * O watchdog do /quiz/flow já desligava as animações, mas só DEPOIS de a
 * transição travar 1,5s — e em 4 sessões o travamento foi o último evento
 * registrado: a pessoa já tinha ido embora quando o socorro chegou. Os
 * aparelhos reais que travaram (Galaxy A03 e A07, Android de entrada)
 * caem em todos os sinais abaixo.
 *
 * Também respeita quem pediu menos movimento no sistema — nesse caso não
 * é performance, é preferência declarada, e vale igual.
 */
export function prefersNoTransitions(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(LOW_END_KEY) === "1") return true;
  } catch {
    // modo privado: segue pelos sinais do aparelho
  }
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
  } catch {
    // sem matchMedia utilizável
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  // deviceMemory só existe no Chrome/Android — que é justamente onde os
  // travamentos aconteceram. Ausente (iOS/Safari) não conta como fraco.
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) {
    return true;
  }
  if (nav.connection?.saveData) return true;
  return false;
}

/** Chamado quando uma transição trava: a próxima visita já nasce sem animação. */
export function rememberLowEndDevice(): void {
  try {
    window.localStorage.setItem(LOW_END_KEY, "1");
  } catch {
    // sem storage: só esta visita fica degradada
  }
}
