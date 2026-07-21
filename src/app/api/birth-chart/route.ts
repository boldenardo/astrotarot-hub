// POST /api/birth-chart
// { birthDate: 'YYYY-MM-DD', birthTime: 'HH:MM', birthLocation, name,
//   latitude?, longitude?, timezone? }
// → { sun: { sign, house, interpretation }, moon: { sign, house, interpretation },
//     ascendant: { sign, interpretation }, interpretation, raw_data? }
//
// Cache: if the user already has a chart in birth_charts, return the saved
// chart_data (with transits as raw_data) without spending API credits.

import { NextRequest, NextResponse } from "next/server";
import { requirePremium } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { groqChatJson } from "@/lib/server/groq";
import {
  westernHoroscope,
  isConfigured,
  type BirthInput,
} from "@/lib/astrology/client";
import { birthTzone } from "@/lib/server/timezone";
import { geocodeCity } from "@/lib/server/geocode";

export const runtime = "nodejs";

const SAO_PAULO = { lat: -23.5505, lon: -46.6333 };

function stripAccents(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

interface ChartData {
  sun: { sign: string; house: number; interpretation: string };
  moon: { sign: string; house: number; interpretation: string };
  ascendant: { sign: string; interpretation: string };
  interpretation: string;
}

export async function POST(req: NextRequest) {
  const gate = await requirePremium("birth_chart");
  if (!gate.ok) return gate.response;
  const profile = gate.profile;

  const admin = getSupabaseAdmin();

  // 1) Cache: chart already calculated for this user.
  const { data: cached } = await admin
    .from("birth_charts")
    .select("chart_data, transits")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached?.chart_data) {
    return NextResponse.json({
      ...(cached.chart_data as ChartData),
      raw_data: cached.transits ?? undefined,
    });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Astrology service is not configured." },
      { status: 503 }
    );
  }

  // 2) No cache: calculate with real data.
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const birthDate =
    typeof body?.birthDate === "string" ? body.birthDate.trim() : "";
  const birthTime =
    typeof body?.birthTime === "string" ? body.birthTime.trim() : "";
  const birthLocation =
    typeof body?.birthLocation === "string" ? body.birthLocation.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const timezone =
    typeof body?.timezone === "string" && body.timezone
      ? body.timezone
      : "America/Sao_Paulo";

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(birthTime);
  if (!dateMatch || !timeMatch) {
    return NextResponse.json(
      {
        error:
          "Send 'birthDate' (YYYY-MM-DD), 'birthTime' (HH:MM) and 'birthLocation'.",
      },
      { status: 400 }
    );
  }

  let lat = num(body?.latitude);
  let lon = num(body?.longitude);
  if ((lat === null || lon === null) && birthLocation) {
    const geo = await geocodeCity(birthLocation);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }
  if (lat === null || lon === null) {
    lat = SAO_PAULO.lat;
    lon = SAO_PAULO.lon;
  }

  const birthYear = Number(dateMatch[1]);
  const birthMonth = Number(dateMatch[2]);
  const birthDay = Number(dateMatch[3]);
  const birthHour = Number(timeMatch[1]);
  const birthMinute = Number(timeMatch[2]);

  const birth: BirthInput = {
    year: birthYear,
    month: birthMonth,
    day: birthDay,
    hour: birthHour,
    min: birthMinute,
    lat,
    lon,
    tzone: birthTzone(
      lat,
      lon,
      new Date(
        Date.UTC(birthYear, birthMonth - 1, birthDay, birthHour, birthMinute)
      ),
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

  // Positions extracted deterministically from the real response.
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
  const ascSign = String(
    findPlanet("ascendant", "ascendente")?.sign ??
      houses.find((h) => Number(h.house) === 1)?.sign ??
      ""
  );
  const sunSign = String(sunPlanet?.sign ?? "");
  const moonSign = String(moonPlanet?.sign ?? "");
  const sunHouse = Number(sunPlanet?.house) || 0;
  const moonHouse = Number(moonPlanet?.house) || 0;

  if (!sunSign || !moonSign || !ascSign) {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }

  // 3) Interpretations via Groq (the real signs/houses are already fixed).
  let texts: {
    sun: string;
    moon: string;
    ascendant: string;
    overall: string;
  };
  try {
    texts = await groqChatJson({
      system:
        "You are an experienced astrologer. Respond ONLY with valid JSON, with no text outside the JSON. All texts must be in English (US).",
      user: [
        name ? `Querent: ${name}.` : "",
        "REAL natal chart positions (astrologyapi.com):",
        `- Sun in ${sunSign}, house ${sunHouse}`,
        `- Moon in ${moonSign}, house ${moonHouse}`,
        `- Ascendant in ${ascSign}`,
        "",
        "Generate the interpretations based EXCLUSIVELY on these real positions.",
        "Respond ONLY with a JSON exactly in this schema:",
        `{
  "sun": "string (2-3 sentences about the Sun in that sign and house)",
  "moon": "string (2-3 sentences about the Moon in that sign and house)",
  "ascendant": "string (2-3 sentences about the Ascendant in that sign)",
  "overall": "string (general synthesis of the chart in 4-6 sentences)"
}`,
      ]
        .filter(Boolean)
        .join("\n"),
      maxTokens: 900,
      temperature: 0.7,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }

  const chartData: ChartData = {
    sun: {
      sign: sunSign,
      house: sunHouse,
      interpretation: typeof texts.sun === "string" ? texts.sun : "",
    },
    moon: {
      sign: moonSign,
      house: moonHouse,
      interpretation: typeof texts.moon === "string" ? texts.moon : "",
    },
    ascendant: {
      sign: ascSign,
      interpretation:
        typeof texts.ascendant === "string" ? texts.ascendant : "",
    },
    interpretation: typeof texts.overall === "string" ? texts.overall : "",
  };

  // 4) Persist to serve as cache for future queries.
  await admin.from("birth_charts").insert({
    user_id: profile.id,
    birth_date: birthDate,
    birth_time: birthTime,
    birth_location: birthLocation,
    latitude: lat,
    longitude: lon,
    chart_data: chartData,
    transits: chartRaw,
  });

  return NextResponse.json({ ...chartData, raw_data: chartRaw });
}
