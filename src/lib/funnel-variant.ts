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
