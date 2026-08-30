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
  /** Ordem de passos que gerou o `stepIndex` salvo (ver STEPS_VERSION). */
  stepsVersion?: number;
  sign?: string;
  score?: QuizScore;
  /** Passo mais avançado alcançado — usado para retomar após refresh. */
  stepIndex?: number;
}

export interface QuizOption {
  value: string;
  label: string;
  /** Glifo do signo, quando a opção for um signo. */
  symbol?: string;
  /** Linha secundária do card (ex.: intervalo de datas do signo). */
  hint?: string;
}

export type QuizStep = { id: string } & (
  | {
      kind: "question";
      question: string;
      subtitle?: string;
      options: QuizOption[];
      /**
       * Fala da Master Aura ANTES da pergunta (bolha de chat). Só algumas
       * perguntas têm — a guia não comenta cada resposta, ela conversa em
       * momentos-chave, como numa DM.
       */
      intro?: string[];
    }
  | {
      /** Só a Master Aura falando (1+ bolhas) + botão para continuar. */
      kind: "chat";
      messages: string[];
      cta?: string;
    }
  | {
      /** Captura do primeiro nome, em formato de conversa. */
      kind: "name";
      messages: string[];
      placeholder?: string;
      cta?: string;
    }
  | {
      /** Revelação do mapa: signo + 3 leituras + fecho. */
      kind: "reveal";
      eyebrow: string;
      lines: Array<{ icon: "sun" | "venus" | "house"; title: string; text: string }>;
      closing: string;
      cta?: string;
    }
  | {
      /** Prova social: números + casais reais. */
      kind: "proof";
      title: string;
      subtitle?: string;
      cta?: string;
    }
  | {
      /** Vídeo/animação em tela cheia com mensagem da guia. */
      kind: "media";
      messages: string[];
      /** Vídeo do passo. Ausente quando `letter` assume a tela. */
      src?: string;
      poster?: string;
      /** Proporção CSS do arquivo (ex.: "16 / 9"). Só com `src`. */
      aspect?: string;
      /**
       * Carta preenchida ao vivo com o nome, a data e o signo DELA, no
       * lugar de um vídeo. Personalizada de verdade e sem download.
       */
      letter?: boolean;
      caption?: string;
      cta?: string;
      /** Narração da Master Aura tocada junto com o vídeo (opcional). */
      audio?: string;
    }
  | {
      /** Cidade do encontro (via /api/geo, com fallback genérico). */
      kind: "location";
      cta?: string;
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
  /** Glifo do signo (Unicode). */
  symbol: string;
  /** Intervalo de datas exibido no card. */
  dates: string;
  element: "Fire" | "Earth" | "Air" | "Water";
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
  { name: "Capricorn", symbol: "♑", dates: "Dec 22 – Jan 19", element: "Earth" },
  { name: "Aquarius", symbol: "♒", dates: "Jan 20 – Feb 18", element: "Air" },
  { name: "Pisces", symbol: "♓", dates: "Feb 19 – Mar 20", element: "Water" },
  { name: "Aries", symbol: "♈", dates: "Mar 21 – Apr 19", element: "Fire" },
  { name: "Taurus", symbol: "♉", dates: "Apr 20 – May 20", element: "Earth" },
  { name: "Gemini", symbol: "♊", dates: "May 21 – Jun 20", element: "Air" },
  { name: "Cancer", symbol: "♋", dates: "Jun 21 – Jul 22", element: "Water" },
  { name: "Leo", symbol: "♌", dates: "Jul 23 – Aug 22", element: "Fire" },
  { name: "Virgo", symbol: "♍", dates: "Aug 23 – Sep 22", element: "Earth" },
  { name: "Libra", symbol: "♎", dates: "Sep 23 – Oct 22", element: "Air" },
  { name: "Scorpio", symbol: "♏", dates: "Oct 23 – Nov 21", element: "Water" },
  { name: "Sagittarius", symbol: "♐", dates: "Nov 22 – Dec 21", element: "Fire" },
];

/** Traço de amor por signo — usado na tela de revelação do mapa. */
export const SIGN_LOVE_TRAIT: Record<string, string> = {
  Aries: "you love fast, fully, and without a safety net",
  Taurus: "you love once — and you stay",
  Gemini: "you fall for the mind before anything else",
  Cancer: "you love with your whole heart, and guard it carefully",
  Leo: "you love with your whole heart",
  Virgo: "you show love by taking care of the details",
  Libra: "you were born for partnership",
  Scorpio: "you love at a depth most people can't follow",
  Sagittarius: "you love someone who walks beside you, not behind",
  Capricorn: "you build love to last",
  Aquarius: "you love the person no one else understands",
  Pisces: "you feel the connection before it even happens",
};

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

// Funil de ALMA GÊMEA — segue a sequência do funil de referência:
//   nome → boas-vindas → 2 perguntas → signo → revelação do mapa →
//   2 perguntas → prova social → data → retrato (vídeo + narração) →
//   cidade do encontro → revelação → e-mail.
//
// A Master Aura fala em MOMENTOS-CHAVE (nunca comentando cada resposta),
// no ritmo de quem digita de verdade. O bloco de "show" (revelação,
// prova, retrato, cidade) vem seguido, sem perguntas no meio — é ele que
// leva a pessoa até a VSL.
export const STEPS: QuizStep[] = [
  {
    id: "c_welcome",
    kind: "chat",
    messages: [
      "I'm Master Aura. I read the chart you were born under — the one that already knows who you are looking for.",
      "I am not going to ask you for anything yet. Answer me honestly and the cards do the rest.",
    ],
    cta: "I'm ready ✨",
  },
  {
    id: "q_status",
    kind: "question",
    intro: [
      "First, tell me where your heart is right now. The cards read the truth, not the answer we wish were true.",
    ],
    question: "Where are you in love right now?",
    options: [
      { value: "searching", label: "Single, waiting for my person" },
      { value: "unsure", label: "With someone, but unsure they're the one" },
      { value: "complicated", label: "In something complicated" },
      { value: "healing", label: "Healing from a love that ended" },
    ],
  },
  {
    id: "q_met",
    kind: "question",
    question: "Do you feel you've already met them?",
    options: [
      { value: "yes", label: "Yes — and I think about them constantly" },
      { value: "maybe", label: "Maybe... someone comes to mind" },
      { value: "no", label: "No, not yet" },
      { value: "unsure", label: "I wouldn't know how to tell" },
    ],
  },
  {
    // O NOME MUDOU DE LUGAR (30/08). Era a PRIMEIRA tela do quiz e
    // custava 17% de todo mundo que comecava — a maior perda isolada do
    // funil, e igual em todos os dispositivos (16% Facebook, 17%
    // navegador, 19% Instagram), o que descarta bug de webview: era a
    // tela. A pessoa clicava em "leitura gratis" e a primeira coisa que
    // acontecia era um estranho pedindo o nome dela, antes de qualquer
    // entrega.
    //
    // Agora ele vem depois de duas perguntas. Ela ja contou onde esta o
    // coracao dela e se ja conheceu a pessoa — pedir o nome vira educacao
    // no meio de uma conversa, nao um formulario na porta.
    id: "name",
    kind: "name",
    messages: [
      "You just told me two true things. Most people cannot.",
      "Before I open your chart — what should I call you?",
    ],
    placeholder: "Your first name",
    cta: "Continue",
  },
  {
    id: "q_sign",
    kind: "question",
    intro: [
      "A true pleasure, {name}. ✨",
      "We each carry a soulmate written in our stars from the day we're born.",
      "Tell me your sign so I can read your chart and visualize them.",
    ],
    question: "What is your zodiac sign?",
    options: ZODIAC_SIGNS.map((sign) => ({
      value: sign.name,
      label: sign.name,
      symbol: sign.symbol,
      hint: sign.dates,
    })),
  },
  {
    id: "reveal_chart",
    kind: "reveal",
    eyebrow: "What your birth chart is revealing",
    lines: [
      { icon: "sun", title: "Sun in {sign}", text: "{trait}." },
      {
        icon: "venus",
        title: "Venus is active",
        text: "drawn to someone who adores and admires you.",
      },
      {
        icon: "house",
        title: "7th house lit up",
        text: "a soulmate connection is already forming.",
      },
    ],
    closing:
      "Your chart is telling me something rare: the alignment to meet your soulmate is opening right now. With this, I can finally visualize their face.",
    cta: "Continue",
  },
  {
    id: "q_past",
    kind: "question",
    intro: [
      "Before I draw them, one thing can blur the image: an open door to the past.",
    ],
    question: "Is there someone from your past you still think about?",
    options: [
      { value: "often", label: "Yes — almost every day" },
      { value: "sometimes", label: "Sometimes, out of nowhere" },
      { value: "letting_go", label: "I'm trying to let go" },
      { value: "no", label: "No, that chapter is closed" },
    ],
  },
  {
    id: "q_ready",
    kind: "question",
    question: "If they walked in tomorrow, would you be ready?",
    options: [
      { value: "yes", label: "Yes — I've been ready for a while" },
      { value: "scared", label: "Yes, but honestly? It scares me" },
      { value: "work", label: "I have some healing left to do" },
      { value: "unsure", label: "I'm not sure I'd recognize them" },
    ],
  },
  {
    id: "proof",
    kind: "proof",
    title: "You will meet your soulmate soon",
    subtitle: "They waited too. Then everything changed.",
    cta: "Continue",
  },
  { id: "birthdate", kind: "birthdate" },
  {
    // Print de referência: a guia narra enquanto o retrato é desenhado —
    // vídeo E narração juntos, na MESMA tela.
    id: "media_drawing",
    kind: "media",
    messages: [
      "Based on your birth chart, I am preparing a portrait of your soulmate. I'm starting right now 👇🔮",
    ],
    src: "/funnel/portrait-drawing.mp4",
    poster: "/funnel/portrait-drawing-poster.webp",
    aspect: "16 / 9",
    audio: "/funnel/soulmate-narration.mp3",
    caption: "Name initial · Birth date · Zodiac sign · Meeting place · Meeting date",
    cta: "Continue",
  },
  {
    id: "location",
    kind: "location",
    cta: "Show me the revelation ✨",
  },
  {
    id: "media_reveal",
    kind: "media",
    messages: [
      "The cards have settled. This is the energy of the person your chart keeps pointing to.",
    ],
    src: "/funnel/soulmate-reveal.mp4",
    poster: "/funnel/soulmate-reveal-poster.webp",
    aspect: "16 / 9",
    cta: "Reveal their face",
  },
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
 * Máximo real: 6 pontos (q_status 0-2, q_past 0-2, q_ready 0-2).
 *   total >= 4 → LOW (blocked) | 2—3 → MEDIUM (awakening) | else → HIGH (strong)
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

  // q_ready: prontidão emocional.
  if (answers.q_ready === "work" || answers.q_ready === "unsure") points += 2;
  else if (answers.q_ready === "scared") points += 1;

  if (points >= 4) return "LOW";
  if (points >= 2) return "MEDIUM";
  return "HIGH";
}

/**
 * Passo em que o funil deve retomar.
 *
 * Usa o `stepIndex` persistido (o ponto mais longe que a pessoa alcançou) —
 * NÃO dá para inferir pelas respostas, porque telas sem resposta (chat,
 * revelação, vídeos, localização) ficam entre inputs e seriam puladas.
 * Nunca retoma na tela de "analyzing", que navega sozinha.
 */
/**
 * A ordem dos passos mudou em 30/08 (o nome saiu da primeira tela e foi
 * para depois de duas perguntas). Quem tinha estado salvo pela ordem
 * ANTIGA guardou um índice que agora aponta para outro passo: salvo em 2
 * (era q_status, não respondido) voltaria em q_met e pularia q_status
 * PARA SEMPRE — e q_status é pontuado, então o score iria para HIGH sem
 * ela ter respondido. Estado sem versão volta para o começo; as respostas
 * que ela já deu continuam salvas, então não é recomeço de verdade.
 */
export const STEPS_VERSION = 2;

export function resumeIndex(state: QuizState): number {
  if (state.stepsVersion !== STEPS_VERSION) return 0;
  const saved = state.stepIndex;
  if (typeof saved !== "number" || !Number.isFinite(saved)) return 0;
  const lastPlayable = STEPS.length - 2; // -1 = analyzing
  return Math.min(Math.max(0, Math.floor(saved)), Math.max(0, lastPlayable));
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
      stepIndex:
        typeof parsed.stepIndex === "number" && Number.isFinite(parsed.stepIndex)
          ? parsed.stepIndex
          : undefined,
      // Precisa atravessar a remontagem campo a campo, senão resumeIndex
      // veria `undefined` sempre e ninguém mais retomaria de onde parou.
      stepsVersion:
        typeof parsed.stepsVersion === "number" ? parsed.stepsVersion : undefined,
    };
  } catch {
    return { answers: {} };
  }
}

/** Persist the quiz state (client only). */
export function saveQuizState(state: QuizState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ ...state, stepsVersion: STEPS_VERSION })
    );
  } catch {
    // Storage may be unavailable (private mode); the funnel still works in memory.
  }
}
