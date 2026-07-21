// POST /api/predictions
// { name, day, month, year, hour, minute, city, latitude?, longitude?, timezone }
// → DailyPrediction (direct object, exact shape of src/app/predictions/page.tsx)
//
// Uses REAL daily transits from astrologyapi.com; Groq only writes the
// prediction in English from them.

import { NextRequest, NextResponse } from "next/server";
import { requirePremium } from "@/lib/server/plan-gate";
import { groqChatJson } from "@/lib/server/groq";
import {
  dailyTransits,
  isConfigured,
  type BirthInput,
} from "@/lib/astrology/client";
import { birthTzone } from "@/lib/server/timezone";
import { geocodeCity } from "@/lib/server/geocode";

export const runtime = "nodejs";

// EXACT shape expected by the predictions page.
interface DailyPrediction {
  date: string;
  moonPhase: {
    name: string;
    emoji: string;
    meaning: string;
    percentage: number;
  };
  majorTransits: Array<{
    transit: string;
    natal: string;
    aspect: string;
    energy: string;
    description: string;
    areas: string[];
  }>;
  energyRatings: {
    love: number;
    career: number;
    health: number;
    finances: number;
    spirituality: number;
  };
  bestTimeOfDay: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  luckyColor: string;
  luckyNumber: number;
  recommendation: string;
  warning: string;
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

export async function POST(req: NextRequest) {
  const gate = await requirePremium("horoscope");
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

  const day = num(body?.day);
  const month = num(body?.month);
  const year = num(body?.year);
  const hour = num(body?.hour);
  const minute = num(body?.minute);
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const nation = typeof body?.nation === "string" ? body.nation.trim() : "";
  const timezone =
    typeof body?.timezone === "string" && body.timezone
      ? body.timezone
      : "America/Sao_Paulo";

  if (
    day === null ||
    month === null ||
    year === null ||
    hour === null ||
    minute === null ||
    !city
  ) {
    return NextResponse.json(
      {
        error:
          "Incomplete birth data. Send day, month, year, hour, minute and city.",
      },
      { status: 400 }
    );
  }

  // Coordinates: use the received ones; geocode when absent or when they came
  // with the São Paulo fallback but the city is different.
  let lat = num(body?.latitude);
  let lon = num(body?.longitude);
  const looksDefault =
    lat !== null && Math.abs(lat - SAO_PAULO.lat) < 1e-4 && !isSaoPaulo(city);

  if (lat === null || lon === null || looksDefault) {
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

  let transitsRaw: unknown;
  try {
    transitsRaw = await dailyTransits(birth, "en");
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });

  const transitsText = JSON.stringify(transitsRaw).slice(0, 4000);

  const schema = `{
  "date": "string (today's date written out in English, e.g.: '${today}')",
  "moonPhase": { "name": "string (name of the moon phase in English)", "emoji": "string (emoji of the phase)", "meaning": "string (1-2 sentences about the energy of the phase)", "percentage": "integer 0-100 (lunar illumination)" },
  "majorTransits": [ { "transit": "string (transiting planet)", "natal": "string (natal planet or point)", "aspect": "string (aspect, e.g.: conjunction, trine)", "energy": "string (short summary of the energy)", "description": "string (1-2 sentences)", "areas": ["2 to 4 areas of life in English"] } ],
  "energyRatings": { "love": "integer 0-100", "career": "integer 0-100", "health": "integer 0-100", "finances": "integer 0-100", "spirituality": "integer 0-100" },
  "bestTimeOfDay": { "morning": "string (tip for the morning)", "afternoon": "string (tip for the afternoon)", "evening": "string (tip for the evening)" },
  "luckyColor": "string (lucky color in English)",
  "luckyNumber": "integer 1-99",
  "recommendation": "string (2-3 sentences of recommendation for today)",
  "warning": "string (1-2 sentences of caution for today)"
}`;

  try {
    const prediction = await groqChatJson<DailyPrediction>({
      system:
        "You are an experienced astrologer. Respond ONLY with valid JSON, with no text outside the JSON. All texts must be in English (US).",
      user: [
        `Today is ${today}.`,
        name ? `Querent: ${name}.` : "",
        `REAL planetary transits of today in relation to the querent's natal chart (data from astrologyapi.com):`,
        transitsText,
        "",
        "Based EXCLUSIVELY on these real transits, generate the prediction for the day.",
        "Include 3 to 5 items in majorTransits, choosing the most relevant transits from the data above.",
        "The moon phase (moonPhase) must be consistent with today's date.",
        "Respond ONLY with a JSON exactly in this schema:",
        schema,
      ]
        .filter(Boolean)
        .join("\n"),
      maxTokens: 1800,
      temperature: 0.7,
    });

    if (!prediction || typeof prediction !== "object") {
      throw new Error("Invalid JSON");
    }
    if (!Array.isArray(prediction.majorTransits)) {
      prediction.majorTransits = [];
    }

    // Normalize the nested shapes that the page dereferences without optional
    // chaining, ensuring keys are never missing nor come with wrong types.
    const str = (v: unknown, fallback = ""): string =>
      typeof v === "string" ? v : fallback;
    const clamp = (v: unknown): number => {
      const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
      return Math.min(100, Math.max(0, Math.round(n)));
    };

    const mp =
      prediction.moonPhase && typeof prediction.moonPhase === "object"
        ? (prediction.moonPhase as Record<string, unknown>)
        : {};
    prediction.moonPhase = {
      name: str(mp.name, "Lunar phase"),
      emoji: str(mp.emoji, "🌙"),
      meaning: str(mp.meaning, ""),
      percentage: clamp(mp.percentage),
    };

    const er =
      prediction.energyRatings && typeof prediction.energyRatings === "object"
        ? (prediction.energyRatings as Record<string, unknown>)
        : {};
    prediction.energyRatings = {
      love: clamp(er.love),
      career: clamp(er.career),
      health: clamp(er.health),
      finances: clamp(er.finances),
      spirituality: clamp(er.spirituality),
    };

    const bt =
      prediction.bestTimeOfDay && typeof prediction.bestTimeOfDay === "object"
        ? (prediction.bestTimeOfDay as Record<string, unknown>)
        : {};
    prediction.bestTimeOfDay = {
      morning: str(bt.morning, ""),
      afternoon: str(bt.afternoon, ""),
      evening: str(bt.evening, ""),
    };

    prediction.majorTransits = prediction.majorTransits.map((t) => ({
      ...t,
      areas: Array.isArray(t?.areas) ? t.areas : [],
    }));

    return NextResponse.json(prediction);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }
}
