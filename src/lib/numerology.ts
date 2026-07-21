// Local numerology engine — pure math, no external API, no cost, no key to leak.
// Pythagorean system. Master numbers 11, 22 and 33 are preserved.

export interface NumerologyNumber {
  number: number;
  isMaster: boolean;
  title: string;
  meaning: string;
}

export interface NumerologyResult {
  lifePath: NumerologyNumber; // from the birth date — your core life theme
  expression: NumerologyNumber; // from the full name — your natural talents (a.k.a. Destiny)
  soulUrge: NumerologyNumber; // from the vowels — your inner cravings (a.k.a. Heart's Desire)
  personality: NumerologyNumber; // from the consonants — how others perceive you
  birthday: NumerologyNumber; // from the day of birth — a special gift
}

export interface BirthDateParts {
  day: number;
  month: number;
  year: number;
}

const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
};

// Vowels for the Soul Urge; every other letter counts toward the Personality.
// (Y is treated as a consonant here — a common, predictable simplification.)
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

const MASTER_NUMBERS = new Set([11, 22, 33]);

const MEANINGS: Record<number, { title: string; meaning: string }> = {
  1: { title: "The Leader", meaning: "Independent, driven, and pioneering — you forge your own path." },
  2: { title: "The Diplomat", meaning: "Sensitive, cooperative, and intuitive — you bring harmony and balance." },
  3: { title: "The Communicator", meaning: "Creative, expressive, and joyful — you inspire through words and art." },
  4: { title: "The Builder", meaning: "Practical, disciplined, and loyal — you create solid foundations." },
  5: { title: "The Free Spirit", meaning: "Adventurous, curious, and adaptable — you thrive on change and freedom." },
  6: { title: "The Nurturer", meaning: "Caring, responsible, and devoted — you protect and support those around you." },
  7: { title: "The Seeker", meaning: "Analytical, spiritual, and introspective — you pursue deeper truths." },
  8: { title: "The Powerhouse", meaning: "Ambitious, authoritative, and abundant — you master the material world." },
  9: { title: "The Humanitarian", meaning: "Compassionate, wise, and generous — you serve a greater purpose." },
  11: { title: "The Visionary", meaning: "A master number of intuition and inspiration — you light the way for others." },
  22: { title: "The Master Builder", meaning: "A master number that turns grand visions into lasting reality." },
  33: { title: "The Master Teacher", meaning: "A master number of selfless love and spiritual upliftment." },
};

/** Reduce a number to a single digit, preserving master numbers 11/22/33. */
function reduceNumber(n: number): number {
  let value = Math.abs(n);
  while (value > 9 && !MASTER_NUMBERS.has(value)) {
    value = String(value)
      .split("")
      .reduce((acc, digit) => acc + Number(digit), 0);
  }
  return value;
}

function describe(n: number): NumerologyNumber {
  const meta = MEANINGS[n] ?? { title: "", meaning: "" };
  return {
    number: n,
    isMaster: MASTER_NUMBERS.has(n),
    title: meta.title,
    meaning: meta.meaning,
  };
}

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (José -> Jose)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function sumLetters(name: string, keep: (char: string) => boolean): number {
  const total = sanitize(name)
    .split("")
    .filter(keep)
    .reduce((acc, char) => acc + (LETTER_VALUES[char] ?? 0), 0);
  return reduceNumber(total);
}

/** Life Path — the most important number, derived from the birth date. */
export function lifePathNumber(birth: BirthDateParts): number {
  const parts =
    reduceNumber(birth.day) +
    reduceNumber(birth.month) +
    reduceNumber(birth.year);
  return reduceNumber(parts);
}

/** Parse a "YYYY-MM-DD" string into date parts (timezone-safe, no Date object). */
export function parseBirthDate(iso: string): BirthDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

/** Compute the full numerology profile from a full name and birth date. */
export function computeNumerology(
  fullName: string,
  birth: BirthDateParts
): NumerologyResult {
  return {
    lifePath: describe(lifePathNumber(birth)),
    expression: describe(sumLetters(fullName, () => true)),
    soulUrge: describe(sumLetters(fullName, (c) => VOWELS.has(c))),
    personality: describe(sumLetters(fullName, (c) => !VOWELS.has(c))),
    birthday: describe(reduceNumber(birth.day)),
  };
}
