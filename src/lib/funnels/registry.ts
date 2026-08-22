// Registro de funis experimentais (AstroTarot 2.0).
//
//   /f/<funnel>/<variant>  →  config do engine <PainFunnel>
//
// Cada variante carrega funnelId/variantId (eventos), copy config, flag de
// desligamento por env e rollback trivial (remover do mapa = 404; o legado
// /quiz/* não é tocado). Nunca crie "/quiz2-final-new-final": crie uma
// variante aqui.
//
// Flag: NEXT_PUBLIC_FUNNELS_OFF="cord-cutting/v2,dreams/v1" desliga variantes
// sem deploy de código.

import type { PainFunnelConfig, PainImage } from "@/lib/pain-funnels/types";
import { CORDCUTTING_V1 as CORD_CUTTING_V1 } from "./configs/cord-cutting.v1";
import { LUCK_V1 } from "./configs/luck.v1";
import { PASTLIFE_V1 as PAST_LIFE_V1 } from "./configs/past-life.v1";
import { DREAMS_V1 } from "./configs/dreams.v1";

const EX = (file: string, alt: string): PainImage => ({ src: `/funnel/ex/${file}.webp`, alt });

/** Injeta fotos por id de pergunta (só arquivos que existem em /public). */
function withImages(
  cfg: PainFunnelConfig,
  map: Record<string, PainImage>,
  extra?: { hook?: PainImage; transition?: PainImage }
): PainFunnelConfig {
  return {
    ...cfg,
    hook: extra?.hook ? { ...cfg.hook, image: extra.hook } : cfg.hook,
    ...(extra?.transition ? { transitionImage: extra.transition } : {}),
    quiz: cfg.quiz.map((q) => (map[q.id] ? { ...q, image: map[q.id] } : q)),
  };
}

function variant(
  cfg: PainFunnelConfig,
  funnelId: string,
  variantId: string,
  patch: Partial<PainFunnelConfig> = {}
): PainFunnelConfig {
  return { ...cfg, ...patch, funnelId, variantId };
}

// ── F1 — Cord Cutting / Ex ────────────────────────────────────────────
// Reaproveita os assets já produzidos para o segmento ex (mesmos momentos
// emocionais: telefone às 2h, porta, insônia, espelho, homem na cama, bar).
const CORD_BASE = withImages(
  CORD_CUTTING_V1,
  {
    w_ending: EX("w-doorway", "A woman in a doorway with a suitcase at dusk"),
    w_symptom: EX("w-awake", "A woman awake at night, phone light on her face"),
    w_status: EX("w-mirror", "A woman alone in front of a mirror"),
    m_time: EX("m-bedside", "A man on the edge of a bed at night, phone in hand"),
    m_symptom: EX("m-bar", "Two men talking at a dim bar"),
  },
  {
    hook: EX("hook-phone-2am", "A phone glowing on a nightstand at 2 AM"),
    transition: EX("cards-velvet", "Four Egyptian tarot cards face down on velvet"),
  }
);

// ── F4 — Dreams: a primeira interação é o relato livre (IA lê os símbolos) ──
const DREAMS_BASE: PainFunnelConfig = {
  ...DREAMS_V1,
  quiz: [
    {
      id: "dream_text",
      stage: "dream",
      kind: "text",
      aura: [
        "Before anything else — tell me what you dreamed. Just as you remember it, even the parts that don't make sense.",
      ],
      question: "What happened in the dream?",
      placeholder: "It started in a house I didn't recognize…",
      aiEndpoint: "/api/experiences/dream-preview",
      options: [],
    },
    ...DREAMS_V1.quiz,
  ],
};

export const FUNNELS: Record<string, Record<string, PainFunnelConfig>> = {
  "cord-cutting": {
    // Variante A: landing curta → conversa → LP
    v1: variant(CORD_BASE, "cord-cutting", "v1"),
    // Variante B: direto na conversa (sem landing)
    v2: variant(CORD_BASE, "cord-cutting", "v2", { skipHook: true }),
  },
  luck: {
    v1: variant(LUCK_V1, "luck", "v1"),
  },
  "past-life": {
    v1: variant(PAST_LIFE_V1, "past-life", "v1"),
  },
  dreams: {
    v1: variant(DREAMS_BASE, "dreams", "v1"),
  },
};

export function getFunnel(funnel: string, variant: string): PainFunnelConfig | null {
  const off = (process.env.NEXT_PUBLIC_FUNNELS_OFF ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (off.includes(`${funnel}/${variant}`) || off.includes(funnel)) return null;
  return FUNNELS[funnel]?.[variant] ?? null;
}

/** Lista para sitemap/QA. Funis são noindex; isto é só inventário. */
export function listFunnels(): Array<{ funnel: string; variant: string; path: string }> {
  const out: Array<{ funnel: string; variant: string; path: string }> = [];
  for (const [f, vs] of Object.entries(FUNNELS)) {
    for (const v of Object.keys(vs)) out.push({ funnel: f, variant: v, path: `/f/${f}/${v}` });
  }
  return out;
}
