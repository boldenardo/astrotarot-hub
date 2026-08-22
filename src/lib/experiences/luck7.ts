// O RITUAL DOS 7 DIAS DA SORTE — o infoproduto do pilar Luck.
//
// Formato: um programa guiado de 7 dias, ~5 minutos por dia, dentro do
// site (progresso salvo em experiences). Dias 2–6 são roteiros fixos —
// escritos aqui, nunca pela LLM. Dias 1 e 7 têm uma leitura pessoal da
// Aura (endpoint /api/experiences/ritual, crédito/premium como sempre).
// A lua de cada dia vem do código (moonLine), nunca do modelo.
//
// Regras de copy: simbólico e honesto — um ritual é um momento feito de
// propósito, não uma promessa de resultado. Nada de "energia garantida",
// nada de estatística inventada.

export const LUCK7_STORAGE_KEY = "astro_luck7";

export interface Luck7Step {
  title: string;
  text: string;
}

export interface Luck7Day {
  day: number;
  key: string;
  title: string;
  /** Uma linha para a landing e para o card do dia. */
  tagline: string;
  needs: string[];
  intro: string;
  steps: Luck7Step[];
  /** Frase dita em voz alta — o gesto central do dia. */
  say: string;
  reflection: string;
  /** Dia com leitura pessoal da Aura (consome crédito como toda leitura). */
  aura?: "opening" | "sealing";
}

export const LUCK7_DAYS: Luck7Day[] = [
  {
    day: 1,
    key: "door",
    title: "Name the door",
    tagline: "Choose the one area where \"almost\" keeps happening — and say it out loud.",
    needs: ["A candle (or any small light)", "Paper and a pen"],
    intro:
      "Luck that isn't named has nowhere to land. Tonight you pick one door — not five — and Master Aura opens the week with a reading written for it.",
    steps: [
      { title: "Light", text: "Light the candle. Phone face down. This is five minutes that belong to you." },
      { title: "Choose", text: "Pick the one area this week is for: luck, money, love, career, a new beginning, or protection. One. The others can wait seven days." },
      { title: "Write", text: "Write a single sentence: \"This week I am making room for ___.\" Keep the paper — it comes back on day 7." },
    ],
    say: "I have named the door. This week, I hold it open.",
    reflection: "What did you almost choose instead — and why?",
    aura: "opening",
  },
  {
    day: 2,
    key: "surface",
    title: "Clear one surface",
    tagline: "Luck lands on cleared ground. Make one small space ready.",
    needs: ["Five minutes", "One cluttered surface — a desk corner, a shelf, a nightstand"],
    intro:
      "Not the whole house. One surface, cleared on purpose, is a message to yourself: something new has somewhere to arrive.",
    steps: [
      { title: "Pick", text: "Choose one small surface you see every day." },
      { title: "Clear", text: "Take everything off it. Wipe it. Put back only what belongs." },
      { title: "Place", text: "Set yesterday's folded sentence on the cleared space. It now has an address." },
    ],
    say: "I am making room, not waiting for it.",
    reflection: "What did you remove that had been there the longest?",
  },
  {
    day: 3,
    key: "almost",
    title: "The almost list",
    tagline: "Write down the near-misses. Patterns lose power when they're named.",
    needs: ["Paper and a pen", "Honesty"],
    intro:
      "\"Almost\" is where your luck keeps living — the callback that didn't come, the money that arrived a day late. Tonight it goes on paper, where you can finally look at it.",
    steps: [
      { title: "List", text: "Write three moments from the last year that went almost right." },
      { title: "Circle", text: "Circle the one that repeats. That's not a curse — it's a pattern, and patterns can be worked with." },
      { title: "Fold", text: "Fold the list once and put it under the day-1 sentence. The pattern now sits beneath the intention, not above it." },
    ],
    say: "I see the pattern. It does not see me.",
    reflection: "What do the three moments have in common?",
  },
  {
    day: 4,
    key: "hand",
    title: "The open hand",
    tagline: "A coin, a gesture, a habit: practice receiving something small.",
    needs: ["One coin — any coin"],
    intro:
      "Most people ask for luck with closed fists. Today's gesture is small and almost silly, and that's exactly why it works as a reminder: receiving is a posture.",
    steps: [
      { title: "Hold", text: "Put the coin in your left hand and close it. Name one thing you were given this year that you didn't ask for." },
      { title: "Open", text: "Open the hand slowly. Leave it open for three breaths. This is the posture of the week." },
      { title: "Keep", text: "Put the coin where you'll see it daily — the cleared surface, your pocket, your desk. Every time you notice it: one breath, open hand." },
    ],
    say: "What is coming does not need my fists. It needs my hands.",
    reflection: "When did you last accept help without apologizing for it?",
  },
  {
    day: 5,
    key: "move",
    title: "One door on purpose",
    tagline: "Send the message you've been postponing. Luck meets movement halfway.",
    needs: ["Your phone — once, on purpose"],
    intro:
      "No ritual replaces the one step you already know. Today the practice leaves the candle and touches the world: one small, concrete move toward the door you named.",
    steps: [
      { title: "Name", text: "Say out loud the one message, application, call or question you've been circling for weeks. You know which one." },
      { title: "Send", text: "Do it now — imperfect and short beats polished and unsent. Two sentences are enough." },
      { title: "Close", text: "Then put the phone down. The move was yours; the answer isn't. Tonight you don't check." },
    ],
    say: "I did my half. The rest has room to move.",
    reflection: "What story kept this postponed — too soon, too late, too much?",
  },
  {
    day: 6,
    key: "circle",
    title: "The circle",
    tagline: "Count what already went right, and draw a line around what you're protecting.",
    needs: ["A candle (or any small light)", "The day-1 paper", "A pen"],
    intro:
      "The night before the seal is for two old gestures: gratitude, because luck grows where it's noticed — and a circle, because what matters deserves a boundary.",
    steps: [
      { title: "Count", text: "Light the candle. Name three things — small counts — that went right since day 1. Out loud." },
      { title: "Draw", text: "On the day-1 paper, draw one unbroken circle around your sentence." },
      { title: "Guard", text: "Name one thing you will not give energy to this week — the doubt, the comparison, the person who shrinks you. It stays outside the circle." },
    ],
    say: "What is mine is circled. What drains me stays outside.",
    reflection: "Which of the three things that went right surprised you most?",
  },
  {
    day: 7,
    key: "seal",
    title: "The seal",
    tagline: "One card, one reading, one release — Master Aura closes your week.",
    needs: ["The day-1 paper", "The coin", "A candle"],
    intro:
      "Seven days ago you named a door. Tonight you re-read your own sentence, pull one Egyptian card, and Master Aura writes the closing reading of your week — what to keep, what to release, what to watch for.",
    steps: [
      { title: "Return", text: "Light the candle. Read your day-1 sentence out loud, slowly. Notice what changed in seven days — in the door, or in you." },
      { title: "Draw", text: "Ask Master Aura for the sealing reading below. One card comes with it." },
      { title: "Release", text: "Tear the almost-list from day 3 and throw it away. Keep the sentence and the coin — the pattern goes, the intention stays." },
    ],
    say: "The week is sealed. I keep the door, not the almost.",
    reflection: "If next week only one thing carried over from this ritual, what should it be?",
    aura: "sealing",
  },
];

/** Intenções do dia 1 — mesmas áreas do Luck Ritual avulso. */
export const LUCK7_INTENTIONS = [
  "Luck",
  "Money",
  "Love",
  "Career",
  "New beginning",
  "Protection",
] as const;

export interface Luck7Progress {
  /** Dias completados: { "1": "2026-08-22", ... } (data local YYYY-MM-DD). */
  done: Record<string, string>;
  intention?: string;
  sentence?: string;
  startedAt?: string;
}

export function readLuck7(): Luck7Progress {
  if (typeof window === "undefined") return { done: {} };
  try {
    const raw = window.localStorage.getItem(LUCK7_STORAGE_KEY);
    const p = raw ? (JSON.parse(raw) as Luck7Progress) : null;
    return p && typeof p === "object" && p.done ? p : { done: {} };
  } catch {
    return { done: {} };
  }
}

export function saveLuck7(p: Luck7Progress) {
  try {
    window.localStorage.setItem(LUCK7_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // localStorage indisponível: o progresso do servidor ainda existe
  }
}

/** Data local YYYY-MM-DD — o "um dia por dia" respeita o fuso da pessoa. */
export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Estado de cada dia. Regra do infoproduto: um dia por dia de calendário —
 * o dia N+1 abre no dia seguinte ao check-in do dia N. `preview` (QA/
 * demonstração) destrava tudo.
 */
export function dayState(
  day: number,
  progress: Luck7Progress,
  preview = false
): "done" | "open" | "locked" | "tomorrow" {
  if (progress.done[String(day)]) return "done";
  if (preview) return "open";
  if (day === 1) return "open";
  const prev = progress.done[String(day - 1)];
  if (!prev) return "locked";
  return prev < localDay() ? "open" : "tomorrow";
}
