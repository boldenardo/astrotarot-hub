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

export type PainSegment = "intimacy" | "body" | "money";

export interface PainOption {
  /** id curto e enumerado — é o que vai para analytics, nunca texto livre. */
  id: string;
  label: string;
  /** Para qual padrão dominante esta resposta soma. */
  pattern: string;
}

export interface PainQuestion {
  id: string;
  /** Etapa psicológica (reconhecimento, pensamento, medo…) — só telemetria. */
  stage: string;
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
  };
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
    if (opt) tally[opt.pattern] = (tally[opt.pattern] ?? 0) + 1;
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
