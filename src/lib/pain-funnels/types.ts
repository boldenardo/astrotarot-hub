// Funis de dor — o laboratório de Direct Response que roda AO LADO do
// Control (/quiz), nunca dentro dele.
//
// Arquitetura: ENGINE + CONFIG. O componente <PainFunnel> é um só; cada
// segmento (intimacy/body/money) é um arquivo de configuração com o quiz,
// as cartas e a LP. A diferença entre variantes vive em dados, não em
// código — três apps copiados seriam três lugares para o mesmo bug.
//
// O Control não importa NADA daqui; daqui só se importam primitives que
// já existiam (checkout embutido, analytics, cartas egípcias, avatar).

export type PainSegment =
  | "intimacy"
  | "body"
  | "money"
  | "ex"
  // AstroTarot 2.0 — funis novos (registro em src/lib/funnels/registry.ts)
  | "cord"
  | "luck"
  | "pastlife"
  | "dreams";

export interface PainOption {
  /** id curto e enumerado — é o que vai para analytics, nunca texto livre. */
  id: string;
  label: string;
  /** Para qual padrão dominante esta resposta soma ("none" = não soma). */
  pattern: string;
  /** Reação da Aura específica desta opção (vence a reaction da pergunta). */
  reaction?: string;
}

/** Gênero da pessoa — decide o ramo do quiz e os pronomes do ex. */
export type PainGender = "woman" | "man";

export interface PainImage {
  /** Caminho em /public — ex.: /funnel/ex/w-awake.webp (3:4). */
  src: string;
  alt: string;
}

export interface PainQuestion {
  id: string;
  /** Etapa psicológica (reconhecimento, pensamento, medo…) — só telemetria. */
  stage: string;
  /**
   * Ramo: a pergunta só aparece para este gênero. Sem o campo = pergunta
   * compartilhada (a de gênero, por exemplo).
   */
  gender?: PainGender;
  /** Foto que a Aura "manda" junto desta pergunta (depois das mensagens). */
  image?: PainImage;
  /**
   * "text": campo livre curto (ex.: o sonho). O texto NUNCA vai para
   * analytics; vai só ao endpoint de preview (aiEndpoint) e fica na sessão.
   */
  kind?: "options" | "text";
  placeholder?: string;
  /** Endpoint público que devolve { theme, symbols[], reaction } para o texto. */
  aiEndpoint?: string;
  /** Mensagens da Master Aura antes da pergunta, no estilo DM do Control. */
  aura: string[];
  question: string;
  options: PainOption[];
  /**
   * Resposta pontual da Aura depois que a pessoa escolhe — presente só nas
   * perguntas-chave. É o que mantém a característica de conversa íntima do
   * quiz 1: ela OUVE, não só pergunta.
   */
  reaction?: string;
}

export interface PainPattern {
  id: string;
  /** Nome do padrão mostrado à pessoa (ex.: "The Quiet Countdown"). */
  label: string;
  description: string;
}

export interface PainCard {
  /** Número do arcano em public/cards/egyptian/{number}.jpg. */
  number: number;
  name: string;
  /** Interpretação simbólica condicional — linguagem de leitura, não de fato. */
  interpretation: string;
  /** Frase que liga a carta ao padrão; "{pattern}" vira o label dominante. */
  patternLine: string;
}

export interface PainLpComparison {
  criterion: string;
  without: string;
  with: string;
}

export interface PainLpValue {
  benefit: string;
  feature: string;
}

export interface PainLpFaq {
  q: string;
  a: string;
}

export interface PainFunnelConfig {
  segment: PainSegment;
  /** Título da aba/SEO da rota. */
  pageTitle: string;
  hook: {
    /** O gancho que para o scroll — a primeira coisa que a pessoa lê. */
    line: string;
    sub: string;
    cta: string;
    /** Foto de abertura, acima da manchete (substitui o verso de carta). */
    image?: PainImage;
  };
  /**
   * Id da pergunta de gênero (opções com ids "woman"/"man"). Quando
   * presente, o engine filtra o quiz por ramo e troca os tokens de pronome
   * ({he} {him} {his} {He} {Him} {His} {himself}) em toda a copy.
   */
  genderQuestionId?: string;
  /** Foto enviada pela Aura junto da transição para as cartas. */
  transitionImage?: PainImage;
  /** Variante B: pula a landing e abre direto na conversa. */
  skipHook?: boolean;
  /** Identificação do experimento nos eventos (funnel_id / variant_id). */
  funnelId?: string;
  variantId?: string;
  /**
   * Valor REAL entregue antes do paywall, logo após a carta. Tokens:
   * {pattern} (label do padrão), {moon} (fase real da lua), {dreamTheme},
   * {dreamSymbols} (quando houve pergunta de texto com IA).
   */
  preview?: { title: string; items: Array<{ label: string; text: string }> };
  quiz: PainQuestion[];
  /** 3 mensagens da Aura fechando o quiz e justificando a carta. */
  transition: string[];
  patterns: PainPattern[];
  /** 4 cartas; a pessoa escolhe às cegas e recebe a que tocou. */
  cards: PainCard[];
  openLoop: {
    surfaceLine: string;
    card2: string;
    card3: string;
    cta: string;
  };
  lp: {
    headline: string;
    subheadline: string;
    /** Exatamente 3 parágrafos (Etapa 3 do LP Copywriter). */
    connection: string[];
    /** Exatamente 5 critérios (Etapa 4). */
    comparison: PainLpComparison[];
    authority: string;
    value: PainLpValue[];
    priceLine: string;
    guarantee: string;
    /** Exatamente 4 (Etapa 9). */
    faq: PainLpFaq[];
    /** CTA B — resultado começa agora. (CTA A exige escassez real; não há.) */
    ctaB: string;
  };
}

/** Sessão mínima persistida — ids enumerados, nunca relato livre. */
export interface PainSession {
  answers: Record<string, string>;
  stage?: "quiz" | "transition" | "pick" | "reveal" | "lp";
  qIndex?: number;
  cardIndex?: number;
  email?: string;
}

/** Padrão dominante = o mais votado pelas respostas; empate → primeiro. */
export function dominantPattern(
  config: PainFunnelConfig,
  answers: Record<string, string>
): PainPattern {
  const tally: Record<string, number> = {};
  for (const q of config.quiz) {
    const picked = answers[q.id];
    if (!picked) continue;
    const opt = q.options.find((o) => o.id === picked);
    if (opt && opt.pattern !== "none") tally[opt.pattern] = (tally[opt.pattern] ?? 0) + 1;
  }
  let best = config.patterns[0];
  let bestN = -1;
  for (const p of config.patterns) {
    const n = tally[p.id] ?? 0;
    if (n > bestN) {
      best = p;
      bestN = n;
    }
  }
  return best;
}

/** Perguntas visíveis para o gênero respondido (ou todas as compartilhadas). */
export function activeQuiz(
  config: PainFunnelConfig,
  answers: Record<string, string>
): PainQuestion[] {
  const gid = config.genderQuestionId;
  if (!gid) return config.quiz;
  const g = answers[gid] as PainGender | undefined;
  return config.quiz.filter((q) => !q.gender || (g !== undefined && q.gender === g));
}

export function genderOf(
  config: PainFunnelConfig,
  answers: Record<string, string>
): PainGender {
  const gid = config.genderQuestionId;
  const g = gid ? answers[gid] : undefined;
  return g === "man" ? "man" : "woman";
}

const PRONOUNS: Record<PainGender, Record<string, string>> = {
  woman: { he: "he", He: "He", him: "him", Him: "Him", his: "his", His: "His", himself: "himself" },
  man: { he: "she", He: "She", him: "her", Him: "Her", his: "her", His: "Her", himself: "herself" },
};

/** Troca os tokens de pronome do ex em qualquer string. */
export function genderizeText(text: string, g: PainGender): string {
  return text.replace(/{(He|he|Him|him|His|his|himself)}/g, (_, k: string) => PRONOUNS[g][k] ?? k);
}

/** Aplica genderizeText em TODAS as strings de um objeto (config inteira). */
export function genderizeDeep<T>(value: T, g: PainGender): T {
  if (typeof value === "string") return genderizeText(value, g) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => genderizeDeep(v, g)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = genderizeDeep(v, g);
    return out as T;
  }
  return value;
}
