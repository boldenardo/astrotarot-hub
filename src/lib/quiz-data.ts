// Quiz funnel configuration — drives /quiz/flow.
// Shared contract: state persists in localStorage under "astro_quiz_v1" as
// { answers, email?, name?, birthDate?, sign?, score? }.

export const QUIZ_STORAGE_KEY = "astro_quiz_v1";

export type QuizScore = "LOW" | "MEDIUM" | "HIGH";

export interface QuizState {
  answers: Record<string, string>;
  email?: string;
  name?: string;
  birthDate?: string;
  sign?: string;
  score?: QuizScore;
}

export interface QuizOption {
  value: string;
  label: string;
  /** Unicode zodiac glyph with U+FE0E (text presentation, never emoji). */
  symbol?: string;
}

export type QuizStep = { id: string } & (
  | {
      kind: "question";
      question: string;
      subtitle?: string;
      options: QuizOption[];
      /**
       * Master Aura's spoken reaction per option value. Strings may contain {name}
       * and {sign} placeholders — resolve with resolveReactionText() at
       * render time (missing values degrade gracefully, never rendering
       * a raw "{sign}").
       */
      reactions?: Record<string, string>;
      /** Fallback reaction when the chosen option has no entry in `reactions`. */
      reactionDefault?: string;
    }
  | {
      kind: "interstitial";
      title: string;
      body: string;
      testimonial?: {
        quote: string;
        author: string;
        stars: number;
        photo?: string;
      };
    }
  | { kind: "birthdate" }
  | { kind: "email" }
);

export interface ZodiacSign {
  name: string;
  /** Glyph + U+FE0E variation selector to force text (non-emoji) rendering. */
  symbol: string;
}

/** The guide persona that reacts to answers throughout the quiz. */
export const MASTER_AURA = {
  name: "Master Aura",
  role: "Your cosmic guide",
} as const;

/**
 * Resolve {name} and {sign} placeholders in a reaction string.
 * Missing values degrade gracefully: vocative forms like ", {name}" are
 * dropped whole, adjective forms like "your {sign} windows" collapse to
 * "your windows" — a raw "{name}"/"{sign}" is never rendered.
 */
export function resolveReactionText(
  text: string,
  vars: { name?: string; sign?: string }
): string {
  let out = text;
  const entries: [string, string | undefined][] = [
    ["name", vars.name],
    ["sign", vars.sign],
  ];
  for (const [key, rawValue] of entries) {
    const token = `{${key}}`;
    const value = rawValue?.trim();
    if (value) {
      out = out.split(token).join(value);
    } else {
      // Drop a vocative ", {name}" (comma included), then any bare token.
      out = out.replace(new RegExp(`,\\s*\\{${key}\\}`, "g"), "");
      out = out.split(token).join("");
    }
  }
  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: "Aries", symbol: "A" },
  { name: "Taurus", symbol: "T" },
  { name: "Gemini", symbol: "G" },
  { name: "Cancer", symbol: "C" },
  { name: "Leo", symbol: "L" },
  { name: "Virgo", symbol: "V" },
  { name: "Libra", symbol: "L" },
  { name: "Scorpio", symbol: "S" },
  { name: "Sagittarius", symbol: "S" },
  { name: "Capricorn", symbol: "C" },
  { name: "Aquarius", symbol: "A" },
  { name: "Pisces", symbol: "P" },
];

/** Tropical zodiac boundaries: [startMonth, startDay] of each sign, in year order. */
const SIGN_RANGES: { name: string; from: [number, number]; to: [number, number] }[] = [
  { name: "Capricorn", from: [12, 22], to: [1, 19] },
  { name: "Aquarius", from: [1, 20], to: [2, 18] },
  { name: "Pisces", from: [2, 19], to: [3, 20] },
  { name: "Aries", from: [3, 21], to: [4, 19] },
  { name: "Taurus", from: [4, 20], to: [5, 20] },
  { name: "Gemini", from: [5, 21], to: [6, 20] },
  { name: "Cancer", from: [6, 21], to: [7, 22] },
  { name: "Leo", from: [7, 23], to: [8, 22] },
  { name: "Virgo", from: [8, 23], to: [9, 22] },
  { name: "Libra", from: [9, 23], to: [10, 22] },
  { name: "Scorpio", from: [10, 23], to: [11, 21] },
  { name: "Sagittarius", from: [11, 22], to: [12, 21] },
];

/**
 * Derive the zodiac sign from an ISO date string ("YYYY-MM-DD").
 * Returns undefined for unparseable input.
 */
export function signFromDate(isoDate: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return undefined;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;

  for (const range of SIGN_RANGES) {
    const [fm, fd] = range.from;
    const [tm, td] = range.to;
    if (fm === 12 && tm === 1) {
      // Capricorn wraps the year boundary.
      if ((month === 12 && day >= fd) || (month === 1 && day <= td)) return range.name;
    } else if (
      (month === fm && day >= fd) ||
      (month === tm && day <= td)
    ) {
      return range.name;
    }
  }
  return undefined;
}

// Funil 100% focado em ALMA GÊMEA: cada pergunta alimenta a leitura de
// soulmate (quem é, quando chega, o que bloqueia o encontro).
export const STEPS: QuizStep[] = [
  {
    id: "q_status",
    kind: "question",
    question: "Where are you in love right now?",
    subtitle: "Be honest — the cards read the truth, not the answer you wish were true.",
    options: [
      { value: "searching", label: "Single and searching for my person" },
      { value: "unsure", label: "With someone — but unsure they're the one" },
      { value: "complicated", label: "In something complicated" },
      { value: "healing", label: "Healing from a love that ended" },
    ],
    reactions: {
      searching:
        "Searching means your heart is open — and an open heart is the only doorway a soulmate can walk through. The cards can show you which one they're standing behind.",
      unsure:
        "That doubt isn't disloyalty. It's your intuition asking a question you haven't answered yet — and your chart holds the answer.",
      complicated:
        "Complicated usually means two souls with real pull and wrong timing. There's a name for that in the cards, and we'll find it.",
      healing:
        "An ending is often the last obstacle before the right one arrives. Your chart can tell you how close you already are.",
    },
  },
  {
    id: "q_sign",
    kind: "question",
    question: "What's your zodiac sign?",
    subtitle: "Your sign shapes who your soul is drawn to — and who's drawn to you.",
    options: ZODIAC_SIGNS.map((sign) => ({
      value: sign.name,
      label: sign.name,
      symbol: sign.symbol,
    })),
    reactions: {
      Aries:
        "Fire falls in love fast and hard. Your soulmate isn't the one who slows you down — it's the one who can keep pace.",
      Taurus:
        "You love once and completely. That loyalty is rare, and it's exactly the frequency your person is looking for.",
      Gemini:
        "Your soulmate will be the one conversation you never get tired of. That's how you'll know — not fireworks, curiosity that never ends.",
      Cancer:
        "You love with your whole chest and hide it behind a shell. The right person won't knock — they'll wait until you open.",
      Leo: "You give warmth freely and rarely ask who's warming you. Your soulmate is the one who arrives already carrying light of their own.",
      Virgo:
        "You notice every detail except how much you deserve. Your person will be the one whose flaws feel like home instead of a project.",
      Libra:
        "Ruled by Venus — you were literally born for partnership. Your chart is one of the most readable I work with for soulmate timing.",
      Scorpio:
        "You don't do shallow. Your soulmate is someone who can meet you at the depth that scares everyone else away.",
      Sagittarius:
        "You need a companion, not a cage. The right person won't ask you to stay — they'll ask where you're going next.",
      Capricorn:
        "You build love the way you build everything: to last. Your person is the one worth the patience you've been holding.",
      Aquarius:
        "You need to be understood more than you need to be adored. The one who does both is closer than you think.",
      Pisces:
        "You sense a connection before it announces itself. That intuition is the exact instrument this reading will use.",
    },
    reactionDefault:
      "Noted. Your sign sets the frequency — your exact birth date sharpens it into a name, a face, a timing.",
  },
  {
    id: "i_soulmate",
    kind: "interstitial",
    title: "Your soulmate already exists — and your chart knows them",
    body: "In astrology, a soulmate connection leaves marks on both birth charts: matching Venus placements, mirrored houses, the same karmic axis. Your answers let the cards read those marks — and describe the person on the other side of them.",
  },
  {
    id: "q_met",
    kind: "question",
    question: "Do you feel you've already met your soulmate?",
    options: [
      { value: "yes", label: "Yes — and I think about them constantly" },
      { value: "maybe", label: "Maybe... someone comes to mind" },
      { value: "no", label: "No, not yet" },
      { value: "unsure", label: "I don't know how I'd even tell" },
    ],
    reactions: {
      yes: "When someone occupies that much of your mind, it's rarely one-sided. The cards can show whether that pull is memory — or a thread still connected.",
      maybe:
        "A face just came to you as you read that, didn't it? Hold it. Your reading will tell you whether your intuition is right.",
      no: "Then the most important question isn't who — it's when. And that's exactly what your transits can date.",
      unsure:
        "Most people can't tell, {name} — because the signs feel like coincidence until someone shows you the pattern.",
    },
  },
  {
    id: "q_signs",
    kind: "question",
    question: "Have you noticed any of these lately?",
    subtitle: "These are the classic signs a soulmate connection is activating.",
    options: [
      { value: "numbers", label: "Repeating numbers — 11:11, 222, 333" },
      { value: "dreams", label: "Dreaming of the same person" },
      { value: "deja_vu", label: "Meeting someone who felt instantly familiar" },
      { value: "none", label: "None that I've noticed" },
    ],
    reactions: {
      numbers:
        "11:11 and its siblings show up most often when two charts are moving toward each other. Your reading will tell you how close.",
      dreams:
        "Recurring dreams of one person are the oldest soulmate signal there is. Dreams don't invent faces — they remember them.",
      deja_vu:
        "That instant familiarity has a name: recognition. Souls that have met before don't need an introduction — they need timing.",
      none: "Then we start clean, with no noise in the signal. Sometimes the clearest readings come from the quietest charts.",
    },
  },
  {
    id: "q_past",
    kind: "question",
    question: "Is there someone from your past you still think about?",
    options: [
      { value: "often", label: "Yes — almost every day" },
      { value: "sometimes", label: "Sometimes, out of nowhere" },
      { value: "letting_go", label: "I'm trying to let go" },
      { value: "no", label: "No, that chapter is closed" },
    ],
    reactions: {
      often:
        "I felt that before you answered. When someone stays in your mind that long, there's usually unfinished energy between the charts — and it can be read.",
      sometimes:
        "Those thoughts arrive on a schedule — they track a transit. Once you see the pattern, you'll know if it's a door or an echo.",
      letting_go:
        "Trying to let go is already letting go. The cards can show which thread is still holding — and whether it's meant to.",
      no: "A closed chapter means your energy is fully available. That's the state in which soulmates arrive fastest.",
    },
  },
  {
    id: "i_proof",
    kind: "interstitial",
    title: "She almost skipped this quiz",
    body: "120,000+ readings delivered — thousands of them about one question: who is my person?",
    testimonial: {
      quote:
        "The reading described him before we met — his work, the gray at his temples, even the month. Six months later he walked into my life and I recognized him.",
      author: "Amanda R.",
      stars: 5,
      photo: "/testimonials/t4.jpg",
    },
  },
  {
    id: "q_block",
    kind: "question",
    question: "What do you think keeps love from working out for you?",
    options: [
      { value: "timing", label: "The timing is always wrong" },
      { value: "wrong_people", label: "I attract the wrong people" },
      { value: "walls", label: "I don't let people get close" },
      { value: "unknown", label: "I don't know — that's why I'm here" },
    ],
    reactions: {
      timing:
        "You're more right than you know. Timing is the one force astrology reads best — and your {sign} windows are closer than they feel.",
      wrong_people:
        "Attracting the wrong people is almost never bad luck. It's a pattern written in the chart — and patterns can be rewritten.",
      walls:
        "The walls kept you safe once, {name}. Now they may be screening out the exact person you're asking for. We'll look at when it's safe to lower them.",
      unknown:
        "The most honest answer — and the most powerful. What you can't see from inside the pattern, the cards see from above it.",
    },
  },
  {
    id: "q_know",
    kind: "question",
    question: "What do you most want the cards to reveal?",
    options: [
      { value: "who", label: "Who they are — their traits, their look" },
      { value: "when", label: "When we'll meet" },
      { value: "already", label: "Whether they're already in my life" },
      { value: "last", label: "Whether this love will last" },
    ],
    reactions: {
      who: "Physical traits, temperament, even their line of work — a soulmate reading gets more specific than most people expect.",
      when: "Timing is the hardest question and the one the transits answer best. We'll narrow it to a window, not a vague someday.",
      already:
        "That's the question that changes everything. The cards can tell you if the person you're picturing is the one — or a lesson on the way to them.",
      last: "Longevity is written in the synastry between two charts. If it's built to last, your reading will show you why.",
    },
  },
  {
    id: "q_ready",
    kind: "question",
    question: "If your soulmate walked in tomorrow, would you be ready?",
    options: [
      { value: "yes", label: "Yes — I've been ready for a while" },
      { value: "scared", label: "Yes, but honestly? It scares me" },
      { value: "work", label: "I have some healing left to do" },
      { value: "unsure", label: "I'm not sure I'd even recognize them" },
    ],
    reactions: {
      yes: "Readiness is the loudest signal a chart can send. Yours is already broadcasting — the reading tells you where it's landing.",
      scared:
        "Wanting it and fearing it at the same time is the most human answer there is. It doesn't disqualify you — it means it matters.",
      work: "Honest. And healing rarely has to finish before love arrives — often the right person is part of how it finishes.",
      unsure:
        "Then let's fix that first. The reading gives you the specific markers to recognize them by — so you don't walk past them.",
    },
  },
  { id: "birthdate", kind: "birthdate" },
  { id: "email", kind: "email" },
  {
    // Special-cased in the flow page: staged "analyzing" animation, then → /quiz/vsl.
    id: "analyzing",
    kind: "interstitial",
    title: "Reading your soulmate signature",
    body: "Hold on — this takes a few seconds.",
  },
];

/** Checklist lines shown on the analyzing screen, in order. */
export const ANALYZING_STAGES = [
  "Mapping your birth chart",
  "Locating your Venus & 7th house",
  "Drawing your soulmate cards",
  "Compiling your Soulmate Reading",
];

/**
 * Analyzing-stage titles, personalized with the visitor's first name when
 * available (the last stage becomes "Compiling {name}'s Soulmate Reading").
 * Falls back to the generic ANALYZING_STAGES.
 */
export function getAnalyzingStages(name?: string): string[] {
  const trimmed = name?.trim();
  if (!trimmed) return ANALYZING_STAGES;
  const stages = [...ANALYZING_STAGES];
  stages[stages.length - 1] = `Compiling ${trimmed}'s Soulmate Reading`;
  return stages;
}

/**
 * Sinal de conexão de alma gêmea, a partir das respostas de "bloqueio".
 * Quanto mais atrito a pessoa relata, mais BLOCKED (que é também o pitch
 * mais forte): opção mais intensa vale 2, opções intermediárias valem 1.
 *
 *   total >= 5 → LOW (blocked) | 3—4 → MEDIUM (awakening) | else → HIGH (strong)
 */
export function computeScore(answers: Record<string, string>): QuizScore {
  let points = 0;

  // q_status: quanto mais indefinida a situação, mais atrito.
  if (answers.q_status === "complicated") points += 2;
  else if (answers.q_status === "unsure" || answers.q_status === "healing") {
    points += 1;
  }

  // q_past: laço não resolvido bloqueia a chegada de um novo.
  if (answers.q_past === "often") points += 2;
  else if (answers.q_past === "sometimes") points += 1;

  // q_block: barreiras internas pesam mais que timing.
  if (answers.q_block === "walls") points += 2;
  else if (answers.q_block === "timing" || answers.q_block === "wrong_people") {
    points += 1;
  }

  // q_ready: prontidão emocional.
  if (answers.q_ready === "work" || answers.q_ready === "unsure") points += 2;
  else if (answers.q_ready === "scared") points += 1;

  if (points >= 5) return "LOW";
  if (points >= 3) return "MEDIUM";
  return "HIGH";
}

/** Read the persisted quiz state (client only). */
export function loadQuizState(): QuizState {
  if (typeof window === "undefined") return { answers: {} };
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return { answers: {} };
    const parsed = JSON.parse(raw) as Partial<QuizState>;
    return {
      answers:
        parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      birthDate: typeof parsed.birthDate === "string" ? parsed.birthDate : undefined,
      sign: typeof parsed.sign === "string" ? parsed.sign : undefined,
      score:
        parsed.score === "LOW" || parsed.score === "MEDIUM" || parsed.score === "HIGH"
          ? parsed.score
          : undefined,
    };
  } catch {
    return { answers: {} };
  }
}

/** Persist the quiz state (client only). */
export function saveQuizState(state: QuizState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); the funnel still works in memory.
  }
}
