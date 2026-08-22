// Fase da lua — cálculo determinístico (mês sinódico), nunca pela LLM.
// A LLM interpreta; o código calcula. Precisão de ~1 dia, suficiente para
// "tonight the moon is waxing" sem jamais envelhecer como o antigo
// "próximos dias de prosperidade".

export type MoonPhaseKey =
  | "new"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

export interface MoonContext {
  key: MoonPhaseKey;
  label: string;
  emoji: string;
  /** 0–1, fração iluminada aproximada. */
  illumination: number;
  /** Idade da lua em dias desde a lua nova. */
  ageDays: number;
  /** O que a fase favorece, em linguagem de ritual (não de fato). */
  guidance: string;
  /** Data ISO usada no cálculo — para cache/invalidação. */
  date: string;
}

const SYNODIC = 29.530588853;
// Lua nova de referência: 2000-01-06 18:14 UTC.
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASES: Array<{ key: MoonPhaseKey; label: string; emoji: string; guidance: string }> = [
  { key: "new", label: "New Moon", emoji: "🌑", guidance: "beginnings, quiet intentions, planting what isn't visible yet" },
  { key: "waxing_crescent", label: "Waxing Crescent", emoji: "🌒", guidance: "first steps, building momentum, saying yes to small openings" },
  { key: "first_quarter", label: "First Quarter", emoji: "🌓", guidance: "decisions, pushing through resistance, choosing a direction" },
  { key: "waxing_gibbous", label: "Waxing Gibbous", emoji: "🌔", guidance: "refining, adjusting, trusting what's already in motion" },
  { key: "full", label: "Full Moon", emoji: "🌕", guidance: "clarity, release, seeing the whole picture at once" },
  { key: "waning_gibbous", label: "Waning Gibbous", emoji: "🌖", guidance: "gratitude, sharing, letting what's done be done" },
  { key: "last_quarter", label: "Last Quarter", emoji: "🌗", guidance: "cutting ties, forgiveness, clearing space" },
  { key: "waning_crescent", label: "Waning Crescent", emoji: "🌘", guidance: "rest, surrender, closing a chapter before the next begins" },
];

export function moonContext(at: Date = new Date()): MoonContext {
  const days = (at.getTime() - REF_NEW_MOON) / 86_400_000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const idx = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
  const phase = PHASES[idx];
  const illumination = (1 - Math.cos((age / SYNODIC) * 2 * Math.PI)) / 2;
  return {
    key: phase.key,
    label: phase.label,
    emoji: phase.emoji,
    illumination: Number(illumination.toFixed(2)),
    ageDays: Number(age.toFixed(1)),
    guidance: phase.guidance,
    date: at.toISOString().slice(0, 10),
  };
}

/** Frase curta pronta para copy: "Tonight the moon is waxing crescent — first steps, building momentum…" */
export function moonLine(at: Date = new Date()): string {
  const m = moonContext(at);
  return `Tonight the moon is ${m.label.toLowerCase()} ${m.emoji} — ${m.guidance}`;
}
