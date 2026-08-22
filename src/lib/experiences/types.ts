// Experiências guiadas (AstroTarot 2.0) — contratos de dados.
//
// Todas as leituras saem da LLM como JSON com schema fixo (groqChatJson) e
// são NORMALIZADAS antes de chegar à UI — nenhuma tela monta interface a
// partir de markdown frágil. Linguagem sempre interpretativa/simbólica:
// entertainment + reflection + spiritual guidance.

export type RitualType =
  | "luck"
  | "money"
  | "love"
  | "cord-cutting"
  | "protection"
  | "energy-cleanse"
  | "new-beginning"
  | "moon";

export const RITUAL_TYPES: RitualType[] = [
  "luck",
  "money",
  "love",
  "cord-cutting",
  "protection",
  "energy-cleanse",
  "new-beginning",
  "moon",
];

export function isRitualType(v: unknown): v is RitualType {
  return typeof v === "string" && (RITUAL_TYPES as string[]).includes(v);
}

export interface RitualItem {
  /** Ex.: "Candle", "Card", "Intention paper", "Water", "Salt". */
  name: string;
  /** Cor/variação quando fizer sentido (ex.: "gold", "white"). */
  detail?: string;
  /** Por que este item, em linguagem simbólica. */
  meaning: string;
}

export interface RitualStep {
  title: string;
  instruction: string;
  /** Segundos sugeridos para a pausa/respiração deste passo (0 = sem timer). */
  seconds: number;
  /** Gesto interativo da UI: acender vela, virar carta, escrever intenção, soltar. */
  action?: "light" | "card" | "write" | "release" | "breathe" | "none";
}

export interface RitualResult {
  readingType: "ritual";
  type: RitualType;
  intention: string;
  headline: string;
  /** Leitura curta da Aura do momento da pessoa (2-3 frases). */
  reading: string;
  moon: { label: string; emoji: string; guidance: string };
  items: RitualItem[];
  steps: RitualStep[];
  /** Arcano egípcio (1-22) que acompanha o ritual + uma linha de leitura. */
  card: { number: number; name: string; line: string };
  affirmation: string;
  reflection: string;
  nextStep: string;
  /** Só no cord-cutting: a leitura da conexão que antecede o ritual. */
  connection?: ConnectionReading;
}

export interface ConnectionReading {
  readingType: "connection";
  headline: string;
  emotionalAttachment: string;
  unfinishedFeelings: string;
  recurringThoughts: string;
  holdingOnto: string;
  mayNeedRelease: string;
  reflection: string;
}

export interface DreamReading {
  readingType: "dream";
  headline: string;
  mainTheme: string;
  symbols: Array<{ symbol: string; meaning: string }>;
  processing: string;
  lifeConnection: string;
  reflection: string;
  /** Perguntas curtas da Aura quando o relato é vago (0-3). */
  followUps: string[];
  /** 3 arcanos opcionais sobre o sonho. */
  cards?: Array<{ number: number; name: string; position: string; line: string }>;
}

export interface PastLifeReading {
  readingType: "past-life";
  headline: string;
  archetype: string;
  era: string;
  role: string;
  centralLesson: string;
  emotionalPattern: string;
  relationshipPattern: string;
  today: string;
  reflection: string;
  /** Só no modo "connection" (outra pessoa envolvida). */
  connection?: {
    bond: string;
    whyFamiliar: string;
    whatRepeats: string;
    whatItAsks: string;
  };
}

export type ExperienceResult = RitualResult | DreamReading | PastLifeReading | ConnectionReading;

/** Resposta padrão das rotas /api/experiences/*. */
export interface ExperienceResponse<T extends ExperienceResult> {
  success: true;
  result: T;
  readingsLeft: number | "unlimited";
  premium: boolean;
}
