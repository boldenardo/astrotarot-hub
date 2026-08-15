// Origem do tráfego orgânico, sem depender de pixel.
//
// O link da bio vai direto pro quiz, então basta marcar a plataforma na
// URL (quiz.astrotarot.shop/?src=tt) para saber qual conta traz gente e,
// depois, quem dela comprou. First-touch: a primeira origem vista fica,
// para não perder o crédito quando a pessoa volta por outro caminho.

export const SOURCE_PARAM = "src";
export const SOURCE_KEY = "astro_src";

/** Plataformas conhecidas. Qualquer outra vira "other". */
export const KNOWN_SOURCES = ["ig", "fb", "tt", "yt", "bio", "direct"] as const;
export type TrafficSource = (typeof KNOWN_SOURCES)[number] | "other";

export const SOURCE_LABELS: Record<TrafficSource, string> = {
  ig: "Instagram",
  fb: "Facebook",
  tt: "TikTok",
  yt: "YouTube",
  bio: "Link in bio",
  direct: "Direct",
  other: "Other",
};

export function normalizeSource(raw: string | null | undefined): TrafficSource | null {
  const value = raw?.trim().toLowerCase().slice(0, 20);
  if (!value) return null;
  return (KNOWN_SOURCES as readonly string[]).includes(value)
    ? (value as TrafficSource)
    : "other";
}

/** Guarda a origem na primeira visita e devolve a que vale. */
export function captureSource(): TrafficSource | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(SOURCE_KEY);
    if (stored) return normalizeSource(stored);

    const fromUrl = normalizeSource(
      new URLSearchParams(window.location.search).get(SOURCE_PARAM)
    );
    if (fromUrl) {
      window.localStorage.setItem(SOURCE_KEY, fromUrl);
      return fromUrl;
    }
    return null;
  } catch {
    return null;
  }
}

/** Origem já guardada (sem gravar nada). */
export function getStoredSource(): TrafficSource | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeSource(window.localStorage.getItem(SOURCE_KEY));
  } catch {
    return null;
  }
}
