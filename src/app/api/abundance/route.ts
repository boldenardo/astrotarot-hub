// POST /api/abundance
// { birthData: { year, month, day, hour, minute, city, nation?, latitude?,
//   longitude?, timezone? } }
// → { success: true, analysis } (exact shape of src/app/abundance/page.tsx)
//
// REAL natal chart (western_horoscope); extracts Jupiter/Venus and houses
// 2/8/10/11 and passes them to Groq to write the prosperity guide in English.

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

// EXACT shape expected by the abundance page.
interface AbundanceAnalysis {
  currentCycle: string;
  scores: {
    financial: number;
    career: number;
    investments: number;
    opportunities: number;
  };
  favorablePeriods: string[];
  houses: {
    house2: string;
    house8: string;
    house10: string;
    house11: string;
  };
  jupiterPosition: string;
  recommendations: string[];
}

const SAO_PAULO = { lat: -23.5505, lon: -46.6333 };

function isSaoPaulo(city: string): boolean {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .includes("sao paulo");
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
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
  const gate = await requirePremium("prosperity");
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
        error:
          "Send 'birthData' with year, month, day, hour, minute and city.",
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

  // Deterministic extraction of the positions tied to prosperity.
  const planets = (
    Array.isArray(chartRaw?.planets) ? chartRaw.planets : []
  ) as RawPlanet[];
  const houses = (
    Array.isArray(chartRaw?.houses) ? chartRaw.houses : []
  ) as RawHouse[];

  const jupiter = planets.find((p) => normalizeName(p.name) === "jupiter");
  const venus = planets.find((p) => normalizeName(p.name) === "venus");
  const houseSign = (n: number) =>
    houses.find((h) => Number(h.house) === n)?.sign ?? "unknown";

  const positionsText = [
    jupiter
      ? `Jupiter (expansion and fortune): sign ${jupiter.sign}, house ${jupiter.house}`
      : "Jupiter: position not available",
    venus
      ? `Venus (values and resources): sign ${venus.sign}, house ${venus.house}`
      : "Venus: position not available",
    `House 2 (resources and money): cusp in ${houseSign(2)}`,
    `House 8 (transformation and shared resources): cusp in ${houseSign(8)}`,
    `House 10 (career and achievement): cusp in ${houseSign(10)}`,
    `House 11 (gains and networks): cusp in ${houseSign(11)}`,
  ].join("\n");

  const chartText = JSON.stringify(chartRaw).slice(0, 4000);

  const schema = `{
  "currentCycle": "string (2-3 sentences about the person's current prosperity cycle)",
  "scores": { "financial": "integer 0-100", "career": "integer 0-100", "investments": "integer 0-100", "opportunities": "integer 0-100" },
  "favorablePeriods": ["3 to 5 favorable periods with astrological justification, short sentences"],
  "houses": {
    "house2": "string (1-2 sentences about house 2 in this person's chart)",
    "house8": "string (1-2 sentences about house 8)",
    "house10": "string (1-2 sentences about house 10)",
    "house11": "string (1-2 sentences about house 11)"
  },
  "jupiterPosition": "string (1-2 sentences about Jupiter in this person's chart)",
  "recommendations": ["4 to 6 strategic and practical recommendations, short sentences"]
}`;

  try {
    const analysis = await groqChatJson<AbundanceAnalysis>({
      system:
        "You are an astrologer specialized in the astrology of prosperity and finances. Respond ONLY with valid JSON, with no text outside the JSON. All texts must be in English (US).",
      user: [
        "REAL natal chart positions tied to abundance (data from astrologyapi.com):",
        positionsText,
        "",
        "Excerpt of the full natal chart (raw data, for context):",
        chartText,
        "",
        "Based EXCLUSIVELY on these real positions, generate the abundance guide.",
        "The scores must be consistent with the positions (well-placed Jupiter/Venus raise them); avoid extremes like 0 or 100.",
        "Respond ONLY with a JSON exactly in this schema:",
        schema,
      ].join("\n"),
      maxTokens: 1600,
      temperature: 0.7,
    });

    if (!analysis || typeof analysis !== "object") {
      throw new Error("Invalid JSON");
    }
    if (!Array.isArray(analysis.favorablePeriods)) {
      analysis.favorablePeriods = [];
    }
    if (!Array.isArray(analysis.recommendations)) {
      analysis.recommendations = [];
    }

    return NextResponse.json({ success: true, analysis });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }
}
