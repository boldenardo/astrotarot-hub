// POST /api/personality
// { birthData: { name, year, month, day, hour, minute, city, nation?,
//   latitude?, longitude?, timezone? } }
// → { profile: PersonalityResult, interpretation: string }
//
// O perfil (big three, elementos, modalidades) é derivado DETERMINISTICAMENTE
// do mapa natal real (western_horoscope); o Groq gera apenas os textos.

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

// Shape EXATO esperado pela página de relatório de personalidade.
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

// Mapa de signos (nomes em pt e en, sem acentos) → elemento e modalidade.
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

// Os 10 planetas clássicos considerados nas contagens (pt e en, sem acentos).
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
      { error: "Serviço de astrologia não configurado." },
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
        error: "Envie 'birthData' com year, month, day, hour, minute e city.",
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
    chartRaw = (await westernHoroscope(birth, "pt")) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar o serviço de astrologia." },
      { status: 502 }
    );
  }

  // ---- Derivação determinística do perfil ----
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

  // Ascendente = signo da casa 1 (ou entrada "Ascendant" quando existir).
  const ascFromPlanets = findPlanet("ascendant", "ascendente");
  const ascSign =
    ascFromPlanets?.sign ??
    houses.find((h) => Number(h.house) === 1)?.sign ??
    "";

  const sunSign = String(sunPlanet?.sign ?? "");
  const moonSign = String(moonPlanet?.sign ?? "");

  if (!sunSign || !moonSign || !ascSign) {
    return NextResponse.json(
      { error: "Falha ao consultar o serviço de astrologia." },
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

  const ELEMENT_PT: Record<Element, string> = {
    Fire: "Fogo",
    Earth: "Terra",
    Air: "Ar",
    Water: "Água",
  };
  const MODALITY_PT: Record<Modality, string> = {
    Cardinal: "Cardinal",
    Fixed: "Fixo",
    Mutable: "Mutável",
  };

  // ---- Textos via Groq ----
  let texts: {
    strengths: string[];
    challenges: string[];
    lifePurpose: string;
    interpretation: string;
  };
  try {
    texts = await groqChatJson({
      system:
        "Você é um astrólogo brasileiro experiente. Responda SOMENTE com JSON válido, sem nenhum texto fora do JSON. Todos os textos devem estar em português do Brasil.",
      user: [
        name ? `Consulente: ${name}.` : "",
        "Perfil astrológico REAL derivado do mapa natal (astrologyapi.com):",
        `- Sol em ${sunSign} (elemento ${ELEMENT_PT[sunInfo.element]}, modalidade ${MODALITY_PT[sunInfo.modality]})`,
        `- Lua em ${moonSign} (elemento ${ELEMENT_PT[moonInfo.element]}, modalidade ${MODALITY_PT[moonInfo.modality]})`,
        `- Ascendente em ${ascSign} (elemento ${ELEMENT_PT[ascInfo.element]}, modalidade ${MODALITY_PT[ascInfo.modality]})`,
        `- Distribuição de elementos entre os planetas: Fogo ${elements.Fire}, Terra ${elements.Earth}, Ar ${elements.Air}, Água ${elements.Water} (dominante: ${ELEMENT_PT[dominantElement]})`,
        `- Distribuição de modalidades: Cardinal ${modalities.Cardinal}, Fixo ${modalities.Fixed}, Mutável ${modalities.Mutable} (dominante: ${MODALITY_PT[dominantModality]})`,
        "",
        "Com base EXCLUSIVAMENTE nesse perfil real, gere os textos.",
        "Responda SOMENTE com um JSON exatamente neste schema:",
        `{
  "strengths": ["4 a 6 dons naturais desta pessoa, frases curtas em pt-BR"],
  "challenges": ["3 a 5 áreas de crescimento, frases curtas e acolhedoras em pt-BR"],
  "lifePurpose": "string (2-3 frases sobre o propósito de vida)",
  "interpretation": "string (leitura astrológica completa em 3-4 parágrafos, separados por linha em branco, citando Sol, Lua, Ascendente e o equilíbrio de elementos)"
}`,
      ]
        .filter(Boolean)
        .join("\n"),
      maxTokens: 1400,
      temperature: 0.7,
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao gerar a interpretação." },
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
