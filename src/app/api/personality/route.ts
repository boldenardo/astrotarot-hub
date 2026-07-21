// POST /api/personality
// { birthData: { name, year, month, day, hour, minute, city, nation?,
//   latitude?, longitude?, timezone? } }
// → { profile: PersonalityResult, interpretation: string }
//
// The profile (big three, elements, modalities) is derived DETERMINISTICALLY
// from the real natal chart (western_horoscope); Groq only generates the texts.

import { NextRequest, NextResponse } from "next/server";
import { requirePremium } from "@/lib/server/plan-gate";
import { groqChatJson } from "@/lib/server/groq";
import {
  westernHoroscope,
  isConfigured,
  type BirthInput,
} from "@/lib/astrology/client";
import { birthTzone } from "@/lib/server/timezone";
import { geocodeCity } from "@/lib/server/geocode";

export const runtime = "nodejs";

type Element = "Fire" | "Earth" | "Air" | "Water";
type Modality = "Cardinal" | "Fixed" | "Mutable";

// EXACT shape expected by the personality report page.
interface PersonalityResult {
  bigThree: {
    sun: { sign: string; element: string; modality: string };
    moon: { sign: string; element: string; modality: string };
    ascendant: { sign: string; element: string; modality: string };
  };
  elements: Record<Element, number>;
  modalities: Record<Modality, number>;
  dominantElement: string;
  dominantModality: string;
  strengths: string[];
  challenges: string[];
  lifePurpose: string;
}

const SAO_PAULO = { lat: -23.5505, lon: -46.6333 };

function stripAccents(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function isSaoPaulo(city: string): boolean {
  return stripAccents(city).includes("sao paulo");
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Sign map (names in English and Portuguese, without accents) → element and modality.
const SIGN_INFO: Record<string, { element: Element; modality: Modality }> = {
  aries: { element: "Fire", modality: "Cardinal" },
  taurus: { element: "Earth", modality: "Fixed" },
  touro: { element: "Earth", modality: "Fixed" },
  gemini: { element: "Air", modality: "Mutable" },
  gemeos: { element: "Air", modality: "Mutable" },
  cancer: { element: "Water", modality: "Cardinal" },
  leo: { element: "Fire", modality: "Fixed" },
  leao: { element: "Fire", modality: "Fixed" },
  virgo: { element: "Earth", modality: "Mutable" },
  virgem: { element: "Earth", modality: "Mutable" },
  libra: { element: "Air", modality: "Cardinal" },
  scorpio: { element: "Water", modality: "Fixed" },
  escorpiao: { element: "Water", modality: "Fixed" },
  sagittarius: { element: "Fire", modality: "Mutable" },
  sagitario: { element: "Fire", modality: "Mutable" },
  capricorn: { element: "Earth", modality: "Cardinal" },
  capricornio: { element: "Earth", modality: "Cardinal" },
  aquarius: { element: "Air", modality: "Fixed" },
  aquario: { element: "Air", modality: "Fixed" },
  pisces: { element: "Water", modality: "Mutable" },
  peixes: { element: "Water", modality: "Mutable" },
};

// The 10 classic planets considered in the counts (English and Portuguese, without accents).
const COUNTED_PLANETS = new Set([
  "sun",
  "sol",
  "moon",
  "lua",
  "mercury",
  "mercurio",
  "venus",
  "mars",
  "marte",
  "jupiter",
  "saturn",
  "saturno",
  "uranus",
  "urano",
  "neptune",
  "netuno",
  "pluto",
  "plutao",
]);

function signInfo(sign: unknown): { element: Element; modality: Modality } {
  return (
    SIGN_INFO[stripAccents(sign)] ?? { element: "Fire", modality: "Cardinal" }
  );
}

interface RawPlanet {
  name?: unknown;
  sign?: unknown;
  house?: unknown;
}

interface RawHouse {
  house?: unknown;
  sign?: unknown;
}

export async function POST(req: NextRequest) {
  const gate = await requirePremium("birth_chart");
  if (!gate.ok) return gate.response;

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Astrology service is not configured." },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const bd = (body?.birthData ?? null) as Record<string, unknown> | null;

  const day = num(bd?.day);
  const month = num(bd?.month);
  const year = num(bd?.year);
  const hour = num(bd?.hour);
  const minute = num(bd?.minute);
  const city = typeof bd?.city === "string" ? bd.city.trim() : "";
  const nation = typeof bd?.nation === "string" ? bd.nation.trim() : "";
  const name = typeof bd?.name === "string" ? bd.name.trim() : "";
  const timezone =
    typeof bd?.timezone === "string" && bd.timezone
      ? bd.timezone
      : "America/Sao_Paulo";

  if (
    day === null ||
    month === null ||
    year === null ||
    hour === null ||
    minute === null
  ) {
    return NextResponse.json(
      {
        error: "Send 'birthData' with year, month, day, hour, minute and city.",
      },
      { status: 400 }
    );
  }

  let lat = num(bd?.latitude);
  let lon = num(bd?.longitude);
  const looksDefault =
    lat !== null &&
    Math.abs(lat - SAO_PAULO.lat) < 1e-4 &&
    Boolean(city) &&
    !isSaoPaulo(city);

  if ((lat === null || lon === null || looksDefault) && city) {
    const geo = await geocodeCity(city, nation || undefined);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }
  if (lat === null || lon === null) {
    lat = SAO_PAULO.lat;
    lon = SAO_PAULO.lon;
  }

  const birth: BirthInput = {
    day,
    month,
    year,
    hour,
    min: minute,
    lat,
    lon,
    tzone: birthTzone(
      lat,
      lon,
      new Date(Date.UTC(year, month - 1, day, hour, minute)),
      timezone
    ),
  };

  let chartRaw: Record<string, unknown>;
  try {
    chartRaw = (await westernHoroscope(birth, "en")) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }

  // ---- Deterministic derivation of the profile ----
  const planets = (
    Array.isArray(chartRaw?.planets) ? chartRaw.planets : []
  ) as RawPlanet[];
  const houses = (
    Array.isArray(chartRaw?.houses) ? chartRaw.houses : []
  ) as RawHouse[];

  const findPlanet = (...names: string[]) =>
    planets.find((p) => names.includes(stripAccents(p.name)));

  const sunPlanet = findPlanet("sun", "sol");
  const moonPlanet = findPlanet("moon", "lua");

  // Ascendant = sign of house 1 (or the "Ascendant" entry when it exists).
  const ascFromPlanets = findPlanet("ascendant", "ascendente");
  const ascSign =
    ascFromPlanets?.sign ??
    houses.find((h) => Number(h.house) === 1)?.sign ??
    "";

  const sunSign = String(sunPlanet?.sign ?? "");
  const moonSign = String(moonPlanet?.sign ?? "");

  if (!sunSign || !moonSign || !ascSign) {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }

  const elements: Record<Element, number> = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };
  const modalities: Record<Modality, number> = {
    Cardinal: 0,
    Fixed: 0,
    Mutable: 0,
  };

  for (const planet of planets) {
    if (!COUNTED_PLANETS.has(stripAccents(planet.name))) continue;
    const info = SIGN_INFO[stripAccents(planet.sign)];
    if (!info) continue;
    elements[info.element] += 1;
    modalities[info.modality] += 1;
  }

  const dominantElement = (Object.entries(elements) as [Element, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
  const dominantModality = (Object.entries(modalities) as [Modality, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  const sunInfo = signInfo(sunSign);
  const moonInfo = signInfo(moonSign);
  const ascInfo = signInfo(ascSign);

  const ELEMENT_EN: Record<Element, string> = {
    Fire: "Fire",
    Earth: "Earth",
    Air: "Air",
    Water: "Water",
  };
  const MODALITY_EN: Record<Modality, string> = {
    Cardinal: "Cardinal",
    Fixed: "Fixed",
    Mutable: "Mutable",
  };

  // ---- Texts via Groq ----
  let texts: {
    strengths: string[];
    challenges: string[];
    lifePurpose: string;
    interpretation: string;
  };
  try {
    texts = await groqChatJson({
      system:
        "You are an experienced astrologer. Respond ONLY with valid JSON, with no text outside the JSON. All texts must be in English (US).",
      user: [
        name ? `Querent: ${name}.` : "",
        "REAL astrological profile derived from the natal chart (astrologyapi.com):",
        `- Sun in ${sunSign} (element ${ELEMENT_EN[sunInfo.element]}, modality ${MODALITY_EN[sunInfo.modality]})`,
        `- Moon in ${moonSign} (element ${ELEMENT_EN[moonInfo.element]}, modality ${MODALITY_EN[moonInfo.modality]})`,
        `- Ascendant in ${ascSign} (element ${ELEMENT_EN[ascInfo.element]}, modality ${MODALITY_EN[ascInfo.modality]})`,
        `- Distribution of elements across the planets: Fire ${elements.Fire}, Earth ${elements.Earth}, Air ${elements.Air}, Water ${elements.Water} (dominant: ${ELEMENT_EN[dominantElement]})`,
        `- Distribution of modalities: Cardinal ${modalities.Cardinal}, Fixed ${modalities.Fixed}, Mutable ${modalities.Mutable} (dominant: ${MODALITY_EN[dominantModality]})`,
        "",
        "Based EXCLUSIVELY on this real profile, generate the texts.",
        "Respond ONLY with a JSON exactly in this schema:",
        `{
  "strengths": ["4 to 6 natural gifts of this person, short sentences in English"],
  "challenges": ["3 to 5 growth areas, short and supportive sentences in English"],
  "lifePurpose": "string (2-3 sentences about the life purpose)",
  "interpretation": "string (complete astrological reading in 3-4 paragraphs, separated by a blank line, citing the Sun, Moon, Ascendant and the balance of elements)"
}`,
      ]
        .filter(Boolean)
        .join("\n"),
      maxTokens: 1400,
      temperature: 0.7,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }

  const profile: PersonalityResult = {
    bigThree: {
      sun: {
        sign: sunSign,
        element: sunInfo.element,
        modality: sunInfo.modality,
      },
      moon: {
        sign: moonSign,
        element: moonInfo.element,
        modality: moonInfo.modality,
      },
      ascendant: {
        sign: String(ascSign),
        element: ascInfo.element,
        modality: ascInfo.modality,
      },
    },
    elements,
    modalities,
    dominantElement,
    dominantModality,
    strengths: Array.isArray(texts.strengths) ? texts.strengths : [],
    challenges: Array.isArray(texts.challenges) ? texts.challenges : [],
    lifePurpose:
      typeof texts.lifePurpose === "string" ? texts.lifePurpose : "",
  };

  return NextResponse.json({
    profile,
    interpretation:
      typeof texts.interpretation === "string" ? texts.interpretation : "",
  });
}
