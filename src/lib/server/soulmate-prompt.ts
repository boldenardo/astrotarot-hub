// O prompt do dossiê de alma gêmea — UM só, usado pelas duas rotas.
//
// A prévia grátis (/api/quiz/soulmate-preview) e a entrega paga
// (/api/soulmate/generate) precisam produzir o MESMO texto a partir dos
// MESMOS dados. Dois prompts em dois arquivos divergiriam na primeira
// alteração, e a diferença apareceria para quem já tinha lido a prévia.

import type { DrawnCard, SolarWindow } from "@/lib/soulmate-reading";
import { POSITIONS, humanDate } from "@/lib/soulmate-reading";

/**
 * O que cada resposta do quiz significa em linguagem de leitura.
 *
 * Sem isto o dossiê sairia SÓ do mapa natal — e o funil inteiro promete o
 * contrário: a Master Aura passa quinze passos dizendo que está lendo as
 * respostas, e a oferta vende "who they are, in the words the cards used".
 */
export const ANSWER_MEANING: Record<string, Record<string, string>> = {
  q_status: {
    searching: "is actively looking for love and tired of near-misses",
    complicated: "is in something undefined that keeps her guessing",
    healing: "is recovering from a relationship that ended badly",
    taken: "is with someone but questions whether they are the one",
    unsure: "is with someone and not sure they are the one",
  },
  q_met: {
    yes: "believes she has already crossed paths with this person",
    maybe: "suspects they have already met but is not sure",
    no: "does not think they have met yet",
    unsure: "would not know how to tell if they had met",
  },
  q_past: {
    often: "feels déjà vu about a specific person very often",
    sometimes: "occasionally feels a pull she cannot explain",
    no: "has not felt that kind of recognition",
    letting_go: "is still letting go of someone",
  },
  q_ready: {
    yes: "says she is ready for it now",
    unsure: "wants it but is afraid of being hurt again",
    no: "is still putting herself back together first",
    scared: "wants it and is scared of it at the same time",
    work: "is ready but her life is full right now",
  },
};

export function describeAnswers(
  answers: Record<string, string> | null | undefined
): string {
  if (!answers) return "";
  const lines: string[] = [];
  for (const [key, value] of Object.entries(answers)) {
    const meaning = ANSWER_MEANING[key]?.[value];
    if (meaning) lines.push(`She ${meaning}.`);
  }
  return lines.join(" ");
}

/**
 * Instruções fixas do dossiê.
 *
 * As duas travas do fim são o que impede a prévia grátis de virar o
 * produto: `obstacle` e `meeting_window` são as cartas que a pessoa lê sem
 * pagar, então elas não podem conter UM adjetivo sequer sobre a outra
 * pessoa. Um "he is tall and warm" vazado ali entrega de graça exatamente
 * o que as três cartas trancadas vendem.
 */
export const DOSSIER_SYSTEM =
  "You are Master Aura, an astrologer writing a soulmate reading. " +
  "Always respond in English (US). Return ONLY valid JSON with keys: " +
  "appearance, traits (array of 4 short strings), meeting_window, " +
  "how_to_recognize, obstacle, next_step, closing. " +
  "obstacle is one short paragraph on what the cards say may be " +
  "standing between them — a pattern or fear on her side, never a " +
  "flaw in the other person and never a warning of harm. " +
  "next_step is one short paragraph with what the cards suggest she " +
  "does next — one concrete, doable thing in the coming weeks, framed " +
  "as guidance and never as an instruction with a promised outcome. " +
  "appearance must be a single vivid paragraph describing a real " +
  "adult person's face and presence (hair, eyes, build, style, age " +
  "range 28-45) with no names and no celebrity references. " +
  "Never promise certainty about the future; write as interpretation. " +
  // Travas da prévia grátis:
  "obstacle and meeting_window are shown to her before she pays, so " +
  "they must contain NO physical or personality description of the other " +
  "person — not one adjective about them. Write those two about HER: her " +
  "pattern, her timing, her circumstances. " +
  "Keep obstacle and meeting_window under 90 words each. " +
  "If a meeting window is given below, meeting_window must use exactly " +
  "that house and those dates — never invent a different date.";

/** Descrição das cartas tiradas, por posição. O modelo NUNCA sorteia. */
function describeCards(cards: DrawnCard[]): string {
  if (!cards.length) return "";
  const lines = cards.map((c) => {
    const pos = POSITIONS.find((p) => p.id === c.position);
    return `${c.position}. ${pos?.title ?? ""} — the card drawn is ${c.name}.`;
  });
  return `The five cards were drawn for these positions: ${lines.join(" ")}`;
}

function describeWindow(w: SolarWindow | null): string {
  if (!w) return "";
  const when = w.open
    ? `The Sun is crossing it right now and leaves on ${humanDate(w.until)}.`
    : `The Sun enters it on ${humanDate(w.from)} and leaves on ${humanDate(w.until)}.`;
  return (
    `Her meeting window is her solar ${w.house}th house (${w.theme}), ` +
    `which the Sun crosses as it passes through ${w.sunSign}. ${when} ` +
    `Use this house and these dates verbatim in meeting_window.`
  );
}

export function buildDossierPrompt(input: {
  name: string | null;
  birthDate: string | null;
  birthLocation: string | null;
  sign: string | null;
  answers: Record<string, string> | null;
  cards?: DrawnCard[];
  window?: SolarWindow | null;
}): string {
  const said = describeAnswers(input.answers);
  return [
    `Person: ${input.name ?? "the seeker"}.`,
    input.birthDate ? `Born on ${input.birthDate}.` : "",
    input.birthLocation ? `Birth place: ${input.birthLocation}.` : "",
    input.sign ? `Sun sign: ${input.sign}.` : "",
    said ? `What she told you in the reading: ${said}` : "",
    input.cards?.length ? describeCards(input.cards) : "",
    describeWindow(input.window ?? null),
    "Read their chart and describe the soulmate their Venus and 7th house point to.",
    said
      ? "Weave what she told you into the reading so she recognizes her own " +
        "words — especially in obstacle and closing. Never quote the questions back."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}
