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
    }
  | {
      kind: "interstitial";
      title: string;
      body: string;
      testimonial?: { quote: string; author: string; stars: number };
    }
  | { kind: "birthdate" }
  | { kind: "email" }
);

export interface ZodiacSign {
  name: string;
  /** Glyph + U+FE0E variation selector to force text (non-emoji) rendering. */
  symbol: string;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: "Aries", symbol: "♈︎" },
  { name: "Taurus", symbol: "♉︎" },
  { name: "Gemini", symbol: "♊︎" },
  { name: "Cancer", symbol: "♋︎" },
  { name: "Leo", symbol: "♌︎" },
  { name: "Virgo", symbol: "♍︎" },
  { name: "Libra", symbol: "♎︎" },
  { name: "Scorpio", symbol: "♏︎" },
  { name: "Sagittarius", symbol: "♐︎" },
  { name: "Capricorn", symbol: "♑︎" },
  { name: "Aquarius", symbol: "♒︎" },
  { name: "Pisces", symbol: "♓︎" },
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

export const STEPS: QuizStep[] = [
  {
    id: "q_goal",
    kind: "question",
    question: "What do you want to transform first in 2026?",
    subtitle: "Pick the one that pulls at you the most.",
    options: [
      { value: "love", label: "Love & relationships" },
      { value: "money", label: "Money & career" },
      { value: "energy", label: "Energy & wellbeing" },
      { value: "purpose", label: "Life purpose" },
    ],
  },
  {
    id: "q_sign",
    kind: "question",
    question: "What's your zodiac sign?",
    subtitle: "We'll confirm it with your exact birth date later.",
    options: ZODIAC_SIGNS.map((sign) => ({
      value: sign.name,
      label: sign.name,
      symbol: sign.symbol,
    })),
  },
  {
    id: "i_alignment",
    kind: "interstitial",
    title: "2026 is a rare alignment year for your sign",
    body: "Astrologers agree: the 2026 transits open windows that only repeat every 12 years. Most people walk right past them. Your answers let us map YOUR exact windows — down to the week.",
  },
  {
    id: "q_stuck",
    kind: "question",
    question: "How often do you feel stuck — even when you're doing everything right?",
    options: [
      { value: "daily", label: "Almost every day" },
      { value: "weekly", label: "A few times a week" },
      { value: "occasionally", label: "Occasionally" },
      { value: "rarely", label: "Rarely" },
    ],
  },
  {
    id: "q_money",
    kind: "question",
    question: "When it comes to money, which sounds most like you?",
    options: [
      { value: "leaking", label: "I earn, but it slips through my fingers" },
      { value: "ceiling", label: "I keep hitting the same ceiling, no matter what I try" },
      { value: "scarcity", label: "I'm always afraid there won't be enough" },
      { value: "ready", label: "I'm doing okay — I'm ready for the next level" },
    ],
  },
  {
    id: "q_love",
    kind: "question",
    question: "In love, what's the hardest part right now?",
    options: [
      { value: "attracting", label: "Attracting the right person" },
      { value: "spark", label: "Reigniting the spark in my relationship" },
      { value: "letting_go", label: "Letting go of someone" },
      { value: "trust", label: "Trusting again after being hurt" },
    ],
  },
  {
    id: "i_proof",
    kind: "interstitial",
    title: "You're not alone in this",
    body: "120,000+ readings delivered — and counting.",
    testimonial: {
      quote:
        "I almost didn't finish the quiz. Then the reading described my situation so accurately it was scary — I've changed two big decisions because of it.",
      author: "Amanda R.",
      stars: 5,
    },
  },
  {
    id: "q_past",
    kind: "question",
    question: "Do you still think about someone from your past?",
    options: [
      { value: "often", label: "Yes, often" },
      { value: "sometimes", label: "Sometimes" },
      { value: "letting_go", label: "I'm trying to let go" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q_block",
    kind: "question",
    question: "What do you believe blocks you the most?",
    options: [
      { value: "timing", label: "Bad timing" },
      { value: "others", label: "Other people's energy" },
      { value: "doubts", label: "My own doubts" },
      { value: "unknown", label: "I don't know — that's why I'm here" },
    ],
  },
  {
    id: "q_desire",
    kind: "question",
    question: "If ONE thing changed in the next 90 days, which would you choose?",
    options: [
      { value: "love", label: "Deep, secure love" },
      { value: "money", label: "A real breakthrough with money" },
      { value: "peace", label: "Peace — a quiet mind at last" },
      { value: "clarity", label: "Total clarity about my path" },
    ],
  },
  {
    id: "q_open",
    kind: "question",
    question: "How open are you to spiritual guidance?",
    options: [
      { value: "very", label: "Very — it guides my decisions" },
      { value: "curious", label: "Curious but skeptical" },
      { value: "new", label: "New to this" },
    ],
  },
  { id: "birthdate", kind: "birthdate" },
  { id: "email", kind: "email" },
  {
    // Special-cased in the flow page: staged "analyzing" animation, then → /quiz/vsl.
    id: "analyzing",
    kind: "interstitial",
    title: "Reading your cosmic signature",
    body: "Hold on — this takes a few seconds.",
  },
];

/** Checklist lines shown on the analyzing screen, in order. */
export const ANALYZING_STAGES = [
  "Mapping your birth chart",
  "Cross-referencing 2026 transits",
  "Locating your prosperity windows",
  "Compiling your Cosmic Plan",
];

/**
 * Score the quiz from "struggle" answers. Weighted so LOW (the strongest
 * pitch) is the modal outcome: the most intense option of a struggle
 * question scores 2, softer struggle options score 1.
 *
 *   total >= 5 → LOW, 3–4 → MEDIUM, else → HIGH
 */
export function computeScore(answers: Record<string, string>): QuizScore {
  let points = 0;

  // q_stuck: first two options are struggle answers.
  if (answers.q_stuck === "daily") points += 2;
  else if (answers.q_stuck === "weekly") points += 1;

  // q_money: first three options are struggle answers.
  if (answers.q_money === "leaking") points += 2;
  else if (answers.q_money === "ceiling" || answers.q_money === "scarcity") points += 1;

  // q_block: any answer except the last is a struggle answer.
  if (answers.q_block === "timing" || answers.q_block === "others") points += 1;
  else if (answers.q_block === "doubts") points += 2;

  // q_past: first two options are struggle answers.
  if (answers.q_past === "often") points += 2;
  else if (answers.q_past === "sometimes") points += 1;

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
