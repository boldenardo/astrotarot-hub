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
       * Luna's spoken reaction per option value. Strings may contain {name}
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
export const LUNA = { name: "Luna", role: "Your cosmic guide" } as const;

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
    reactions: {
      love: "Matters of the heart — I sensed that pull the moment you arrived. Love is where your chart carries the most unread pages.",
      money:
        "Abundance work. Good — the 2026 transits are unusually generous to people who ask direct questions about money.",
      energy:
        "Your energy is the foundation everything else stands on. Restoring it first is the wisest order — most people learn that too late.",
      purpose:
        "The deepest question of all. When purpose comes into focus, love and money tend to follow it home.",
    },
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
    reactions: {
      Aries:
        "First fire of the zodiac. You were built to begin things — and 2026 finally hands you something worth finishing.",
      Taurus:
        "Steady earth. You build slowly and lose nothing — your reading will show you where that patience is about to pay.",
      Gemini:
        "A mind with two windows open at once. Your gift is seeing both sides — we'll find the moment you're meant to choose one.",
      Cancer:
        "You feel the tide before it turns. That protective heart of yours is due some protecting of its own.",
      Leo: "There's a warmth in you that other people navigate by. 2026 asks you to shine for yourself first — the rest will follow.",
      Virgo:
        "You notice what everyone else misses. Pointed at your own path, that precision becomes a compass.",
      Libra:
        "You weigh everything — beauty, fairness, hearts. This year the scales tip in your favor, and you'll want to be ready.",
      Scorpio:
        "Depth recognizes depth. You transform or you don't bother — and a transformation is exactly what sits on your horizon.",
      Sagittarius:
        "The arrow is already in the bow. Your restlessness isn't a flaw — it's your chart insisting there's somewhere you're meant to be.",
      Capricorn:
        "You climb quietly and arrive anyway. The summit waiting in 2026 is closer than your patience assumes.",
      Aquarius:
        "You've never fit the mold — that was never the assignment. The current ahead favors exactly your kind of different.",
      Pisces:
        "Deep waters. You feel everything before it happens — that sensitivity is the exact channel your reading will use.",
    },
    reactionDefault:
      "Noted. Your sign sets the tone — your exact birth date will sharpen it into something precise.",
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
    reactions: {
      daily:
        "That heaviness isn't a flaw in you, {name}. It's friction between your effort and your timing — and friction can be mapped.",
      weekly:
        "A few times a week is your intuition tapping the glass. Something in your rhythm is slightly out of phase, and we can find where.",
      occasionally:
        "Occasional resistance is normal — the pattern behind when it appears is what matters. Your chart will show it clearly.",
      rarely:
        "You move with unusual flow. That tells me your instincts are already close to aligned — imagine what happens when we sharpen them.",
    },
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
    reactions: {
      leaking:
        "Money that arrives but never stays is almost never about discipline. It's about timing — and yours has been off by just a little.",
      ceiling:
        "That ceiling isn't made of effort — you've given plenty. It's a cycle, and cycles have end dates. We'll find yours.",
      scarcity:
        "That quiet fear is old energy, not prophecy. Naming where it entered your pattern is the first step to closing it out.",
      ready:
        "I love this answer. Readiness is rare — and 2026 rewards the prepared more than any year in the last decade.",
    },
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
    reactions: {
      attracting:
        "You keep meeting almosts instead of answers. Your energy is broadcasting one thing while your heart asks for another — we can retune that.",
      spark:
        "A dimmed spark isn't a dying fire. It's usually two rhythms drifting apart — and rhythms can be brought back into step.",
      letting_go:
        "Release is the hardest work the heart does. Your chart can show what this bond came to teach — closure comes easier once the lesson is named.",
      trust:
        "The guard you built kept you safe once. Now it may be screening out the very thing you want — we'll look at when it's safe to lower it.",
    },
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
      photo: "/testimonials/t4.jpg",
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
    reactions: {
      often:
        "I felt that before you answered. Unfinished energy keeps a door open — your chart will show us how to close it gently.",
      sometimes:
        "Those returning thoughts arrive on a schedule — they usually track a transit. Once you see the pattern, it loses its grip.",
      letting_go:
        "Trying to let go is already letting go. You're mid-release — the reading can show you which thread is still holding.",
      no: "A clear rearview is a quiet superpower. It means your energy is fully available for what's ahead.",
    },
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
    reactions: {
      timing:
        "You're more right than you know. Timing is the one force astrology reads best — and your {sign} windows are closer than they feel.",
      others:
        "Sensitive people absorb what others leave behind, {name}. Learning where your energy ends and theirs begins changes everything.",
      doubts:
        "The fact that you can name your doubts means they're not in charge — they're just loud. Your chart holds the counter-evidence.",
      unknown:
        "An honest answer — and the most powerful one. What you can't see from inside the pattern, the stars see from above it.",
    },
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
    reactions: {
      love: "Deep, secure love — not fireworks, foundations. That desire says you've outgrown the lessons that used to repeat.",
      money:
        "A real breakthrough, not a lucky month. Hold that intention — the reading will show you which weeks to move in.",
      peace:
        "A quiet mind is the rarest wish people bring me — and the most telling. You've been carrying more than your share.",
      clarity:
        "Total clarity is the master key. Choose that, and the other doors tend to unlock on their own.",
    },
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
    reactions: {
      very: "Then you already know how this works — guidance meets you where your attention goes. Yours is wide open.",
      curious:
        "Skepticism is welcome here. The strongest readings happen when a sharp mind checks every line — bring that with you.",
      new: "Everyone starts exactly where you are. Come as you are — the chart does the talking, not the jargon.",
    },
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
 * Analyzing-stage titles, personalized with the visitor's first name when
 * available (the last stage becomes "Compiling {name}'s Cosmic Plan").
 * Falls back to the generic ANALYZING_STAGES.
 */
export function getAnalyzingStages(name?: string): string[] {
  const trimmed = name?.trim();
  if (!trimmed) return ANALYZING_STAGES;
  const stages = [...ANALYZING_STAGES];
  stages[stages.length - 1] = `Compiling ${trimmed}'s Cosmic Plan`;
  return stages;
}

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
