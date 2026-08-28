// A leitura de alma gêmea como UM objeto — cartas + dossiê — partilhado
// pela prévia grátis e pela entrega paga.
//
// POR QUE ISTO EXISTE COMO MÓDULO PRÓPRIO
//
// A prévia grátis (2 cartas viradas no fim do quiz) e a leitura paga (as 5)
// TÊM de ser a mesma tirada. Se a prévia sorteasse duas cartas e a compra
// sorteasse outras, "as cartas já se assentaram" viraria mentira na cara de
// quem pagou. Três consumidores dependem destes tipos — a rota pública, a
// rota paga e a VSL — e sem uma fonte única eles divergem em silêncio.
//
// NADA AQUI DEPENDE DE SERVIDOR: é importável pelo cliente.

import { EGYPTIAN_DECK } from "@/lib/tarot-data";

/** Uma das cinco posições da tirada. Ordem fixa: é a ordem da tirada. */
export type PositionId = "I" | "II" | "III" | "IV" | "V";

/** Campo do dossiê que cada posição revela. */
export type DossierField =
  | "appearance"
  | "traits"
  | "obstacle"
  | "meeting_window"
  | "next_step";

export interface Position {
  id: PositionId;
  /** Rótulo mostrado na carta. Herdado do bloco SEALED da VSL. */
  title: string;
  /** Linha curta sob o título — o que aquela carta responde. */
  subtitle: string;
  field: DossierField;
  /** Virada de graça, antes de qualquer pagamento. */
  free: boolean;
}

/**
 * As cinco posições.
 *
 * GRÁTIS: III e IV (decisão do dono, 28/08). São as duas que o funil já
 * entregava pela metade — a página do quiz já diz a cidade do encontro e o
 * FRICTION_MIRROR da VSL já afirma que "algo está no caminho". Formalizá-las
 * não vaza informação nova: converte duas meias-promessas em duas cumpridas.
 *
 * E são as duas que falam DELA, não dele. III é a única carta falsificável
 * da tirada — a pessoa confere em dois segundos se bate. Num mercado que já
 * ouviu toda promessa espiritual possível, a pergunta de compra não é "eu
 * quero saber", é "isso é real?", e prova só existe onde dá para errar.
 *
 * TRANCADAS: I, II e V — a identidade e a ação. A própria VSL promete, no
 * parágrafo logo acima das cartas, que "your reading has one job: describe
 * who your chart points to". Liberar I ou II contradiz a oferta a três
 * centímetros dela.
 */
export const POSITIONS: readonly Position[] = [
  {
    id: "I",
    title: "Who the cards point to",
    subtitle: "Their face, their build, the room they walk into",
    field: "appearance",
    free: false,
  },
  {
    id: "II",
    title: "The traits that make them recognizable",
    subtitle: "Four of them, in the words the cards used",
    field: "traits",
    free: false,
  },
  {
    id: "III",
    title: "What may be standing between you",
    subtitle: "Read from the answers you gave me",
    field: "obstacle",
    free: true,
  },
  {
    id: "IV",
    title: "When your paths are most likely to cross",
    subtitle: "Read from your chart and where you are now",
    field: "meeting_window",
    free: true,
  },
  {
    id: "V",
    title: "What the cards suggest you do next",
    subtitle: "One thing, inside the window you just read",
    field: "next_step",
    free: false,
  },
] as const;

export const FREE_POSITIONS: readonly PositionId[] = POSITIONS.filter(
  (p) => p.free
).map((p) => p.id);

/** Uma carta tirada, já casada com a posição que ocupa. */
export interface DrawnCard {
  position: PositionId;
  /** Arcano egípcio, 1-22. */
  arcanum: number;
  name: string;
  image: string;
}

export interface SoulmateDossier {
  appearance: string;
  traits: string[];
  meeting_window: string;
  how_to_recognize: string;
  obstacle: string;
  next_step: string;
  closing: string;
}

export interface SoulmateReading {
  cards: DrawnCard[];
  /**
   * `null` quando a LLM falhou. As cartas continuam válidas (são sorteadas
   * em código), mas o texto ainda precisa ser gerado — e é por isso que o
   * caminho pago NUNCA reaproveita um dossiê de origem "fallback".
   */
  dossier: SoulmateDossier | null;
  source: "llm" | "fallback";
  /** Só o que é grátis. É este subconjunto que a VSL mostra. */
  free: Partial<Record<DossierField, string | string[]>>;
  window?: SolarWindow;
}

/** Monta as 5 cartas a partir de arcanos já sorteados. */
export function toDrawnCards(arcana: number[]): DrawnCard[] {
  return POSITIONS.map((p, i) => {
    const id = arcana[i] ?? i + 1;
    const card = EGYPTIAN_DECK.find((c) => c.id === id) ?? EGYPTIAN_DECK[0];
    return {
      position: p.id,
      arcanum: card.id,
      name: card.name,
      image: card.imageUrl,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Janela solar — a carta IV é CALCULADA, nunca inventada pelo modelo.  */
/* ------------------------------------------------------------------ */

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** Início de cada signo solar: [mês, dia]. Mesmas faixas do deriveSign. */
const SIGN_START: Record<string, [number, number]> = {
  Aries: [3, 21], Taurus: [4, 20], Gemini: [5, 21], Cancer: [6, 21],
  Leo: [7, 23], Virgo: [8, 23], Libra: [9, 23], Scorpio: [10, 23],
  Sagittarius: [11, 22], Capricorn: [12, 22], Aquarius: [1, 20], Pisces: [2, 19],
};

/** Signo solar de uma data (YYYY-MM-DD ou Date). Cálculo local, sem API. */
export function signOf(date: string | Date): string | null {
  const d =
    typeof date === "string"
      ? new Date(`${date.slice(0, 10)}T12:00:00Z`)
      : date;
  if (Number.isNaN(d.getTime())) return null;
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  // Mesmas faixas do deriveSign da rota paga — os dois têm de concordar,
  // senão a prévia e a leitura falam de signos diferentes.
  const ranges: Array<[string, number, number, number, number]> = [
    ["Capricorn", 12, 22, 1, 19], ["Aquarius", 1, 20, 2, 18],
    ["Pisces", 2, 19, 3, 20], ["Aries", 3, 21, 4, 19],
    ["Taurus", 4, 20, 5, 20], ["Gemini", 5, 21, 6, 20],
    ["Cancer", 6, 21, 7, 22], ["Leo", 7, 23, 8, 22],
    ["Virgo", 8, 23, 9, 22], ["Libra", 9, 23, 10, 22],
    ["Scorpio", 10, 23, 11, 21], ["Sagittarius", 11, 22, 12, 21],
  ];
  for (const [name, fm, fd, tm, td] of ranges) {
    if (fm === 12 && tm === 1) {
      if ((month === 12 && day >= fd) || (month === 1 && day <= td)) return name;
    } else if ((month === fm && day >= fd) || (month === tm && day <= td)) {
      return name;
    }
  }
  return null;
}

export interface SolarWindow {
  /** Casa solar (whole-sign) da janela, contada do signo dela. */
  house: number;
  /** Signo que o Sol atravessa nessa janela. */
  sunSign: string;
  /** Primeiro dia da janela, ISO. Igual a hoje quando já está aberta. */
  from: string;
  /** Último dia da janela, ISO. */
  until: string;
  /** A janela já está aberta agora? */
  open: boolean;
  /** O que aquela casa governa, em linguagem de leitura. */
  theme: string;
}

/**
 * O que cada casa solar governa. As DOZE — sem buraco.
 *
 * Um Record parcial deixaria metade das pessoas caindo num texto genérico
 * justamente na carta que existe para ser específica.
 */
const HOUSE_THEME: Record<number, string> = {
  1: "how you are being seen — people notice you before you speak",
  2: "what you value, and what you are done settling for",
  3: "short trips, messages and the people just next door",
  4: "home, family and who gets invited into it",
  5: "what you do for pleasure — and who is there when you do it",
  6: "your routine: same places, same hours, a new face in them",
  7: "one-to-one meetings — the house of partnership itself",
  8: "what you share with one person and no one else",
  9: "distance, study, anything that takes you out of your routine",
  10: "your work, and where you are seen doing it",
  11: "friends, circles and the people your people already know",
  12: "quiet, endings, what you let go of before the next thing",
};

/**
 * As casas em que um encontro é a leitura óbvia.
 *
 * A carta IV pergunta "quando seus caminhos têm mais chance de se cruzar".
 * Responder "casa 4 — lar e família" é honesto e inútil. Procuramos a
 * próxima passagem do Sol pela 5ª (prazer), 7ª (parceria) ou 11ª (círculos)
 * — a resposta que a pergunta pede. Como são três casas espaçadas, nunca há
 * mais de ~4 meses até a próxima: a janela é sempre concreta e próxima.
 */
const MEETING_HOUSES: readonly number[] = [5, 7, 11];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "September 22" — data legível, sem depender do locale do runtime. */
export function humanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}

/**
 * A janela da carta IV: a próxima passagem do Sol por uma casa de encontro.
 *
 * Casas whole-sign a partir do signo solar — aritmética de 12 posições, sem
 * efeméride. A `src/lib/astrology/client.ts` NÃO serve: exige hora e local
 * de nascimento, que o quiz nunca coleta. Isto usa só a data de nascimento
 * e a data de hoje, e é conferível por qualquer pessoa — que é justamente o
 * ponto: uma data inventada pelo modelo vira reembolso.
 */
export function solarWindow(
  birthDate: string,
  today: Date = new Date()
): SolarWindow | null {
  const natal = signOf(birthDate);
  if (!natal) return null;
  const natalIdx = SIGNS.indexOf(natal as (typeof SIGNS)[number]);
  if (natalIdx < 0) return null;

  const DAY = 24 * 60 * 60 * 1000;
  const base = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  // Varre dia a dia até o próximo em que o Sol esteja numa casa de encontro.
  // Teto de 400 dias por segurança; com três casas alvo fecha em ~120.
  for (let i = 0; i < 400; i++) {
    const sun = signOf(new Date(base + i * DAY));
    if (!sun) continue;
    const sunIdx = SIGNS.indexOf(sun as (typeof SIGNS)[number]);
    if (sunIdx < 0) continue;
    const house = ((sunIdx - natalIdx + 12) % 12) + 1;
    if (!MEETING_HOUSES.includes(house)) continue;

    // Achou o começo: anda até o fim desse trânsito.
    let j = i;
    while (j < i + 45 && signOf(new Date(base + (j + 1) * DAY)) === sun) j++;

    return {
      house,
      sunSign: sun,
      from: new Date(base + i * DAY).toISOString().slice(0, 10),
      until: new Date(base + j * DAY).toISOString().slice(0, 10),
      open: i === 0,
      theme: HOUSE_THEME[house],
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Fallback determinístico                                             */
/* ------------------------------------------------------------------ */

/**
 * Texto das duas cartas grátis quando a LLM falha.
 *
 * Não inventa nada: usa o significado canônico da carta tirada
 * (EGYPTIAN_DECK) e a janela já calculada. Uma carta "grátis" vazia por
 * falha da Groq é pior do que não ter prévia nenhuma — a promessa da porta
 * volta a ser falsa no pior momento possível.
 */
export function fallbackFree(
  cards: DrawnCard[],
  window: SolarWindow | null,
  sign: string | null
): Partial<Record<DossierField, string>> {
  const byPos = (id: PositionId) => cards.find((c) => c.position === id);
  const cIII = byPos("III");
  const cIV = byPos("IV");
  const deckOf = (arcanum?: number) =>
    EGYPTIAN_DECK.find((c) => c.id === arcanum);

  const dIII = deckOf(cIII?.arcanum);
  const dIV = deckOf(cIV?.arcanum);

  const obstacle = dIII
    ? `Your third card is ${dIII.name}. In this position it reads as ${dIII.upright
        .slice(0, 2)
        .join(" and ")
        .toLowerCase()} — something on your side of the door, not a rival and not bad timing. ${
        sign ? `Read against your Sun in ${sign}, ` : ""
      }it is the pattern the cards keep circling back to.`
    : "";

  const meeting = window
    ? window.open
      ? `Your fourth card falls in your solar ${ordinal(window.house)} house — ${
          window.theme
        }. The Sun is crossing it right now and leaves on ${humanDate(
          window.until
        )}. That is the opening you can still stand inside.`
      : `Your fourth card falls in your solar ${ordinal(window.house)} house — ${
          window.theme
        }. The Sun enters it on ${humanDate(window.from)} and stays until ${humanDate(
          window.until
        )}. That is the next opening your own chart gives you.`
    : "";

  return { obstacle, meeting_window: meeting };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/* ------------------------------------------------------------------ */
/* Validação                                                           */
/* ------------------------------------------------------------------ */

/**
 * Um dossiê só conta como completo com TODOS os campos.
 *
 * Mesma disciplina do assertComplete da rota paga: melhor gerar de novo do
 * que entregar cinco itens a quem comprou seis — e como a idempotência
 * nunca regenera, um dossiê incompleto gravado fica incompleto para sempre.
 */
export function isCompleteDossier(d: unknown): d is SoulmateDossier {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  const strings: Array<keyof SoulmateDossier> = [
    "appearance", "meeting_window", "how_to_recognize",
    "obstacle", "next_step", "closing",
  ];
  for (const k of strings) {
    if (typeof o[k] !== "string" || !(o[k] as string).trim()) return false;
  }
  return Array.isArray(o.traits) && o.traits.length >= 3;
}

/** Só o que pode sair antes do pagamento. Blindagem contra vazar I, II ou V. */
export function pickFree(
  dossier: SoulmateDossier | null,
  fallback: Partial<Record<DossierField, string>>
): Partial<Record<DossierField, string | string[]>> {
  const out: Partial<Record<DossierField, string | string[]>> = {};
  for (const p of POSITIONS) {
    if (!p.free) continue;
    const v = dossier?.[p.field];
    if (typeof v === "string" && v.trim()) out[p.field] = v;
    else if (fallback[p.field]) out[p.field] = fallback[p.field];
  }
  return out;
}

/** Chave do cache no navegador. Fora do QUIZ_STORAGE_KEY de propósito:
 *  loadQuizState remonta o objeto campo a campo e descartaria esta. */
export const READING_STORAGE_KEY = "astro_soulmate_reading_v1";
