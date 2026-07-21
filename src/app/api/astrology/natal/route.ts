import { NextRequest, NextResponse } from "next/server";
import {
  westernHoroscope,
  natalWheelChart,
  isConfigured,
} from "@/lib/astrology/client";
import type { BirthInput } from "@/lib/astrology/client";
import { requirePremium } from "@/lib/server/plan-gate";

export const runtime = "nodejs";

const REQUIRED: (keyof BirthInput)[] = [
  "day",
  "month",
  "year",
  "hour",
  "min",
  "lat",
  "lon",
  "tzone",
];

function parseBirth(body: unknown): BirthInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  for (const key of REQUIRED) {
    if (typeof b[key] !== "number" || Number.isNaN(b[key])) return null;
  }
  return b as unknown as BirthInput;
}

// POST /api/astrology/natal  { day, month, year, hour, min, lat, lon, tzone, wheel?, language? }
export async function POST(req: NextRequest) {
  const gate = await requirePremium("birth_chart");
  if (!gate.ok) return gate.response;

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Astrology service is not configured." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const birth = parseBirth(body);
  if (!birth) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid birth data. Send the numbers: day, month, year, hour, min, lat, lon, tzone.",
      },
      { status: 400 }
    );
  }

  const language =
    typeof (body as Record<string, unknown>).language === "string"
      ? ((body as Record<string, unknown>).language as string)
      : "en";
  const withWheel = (body as Record<string, unknown>).wheel === true;

  try {
    const [chart, wheel] = await Promise.all([
      westernHoroscope(birth, language),
      withWheel ? natalWheelChart(birth) : Promise.resolve(null),
    ]);
    return NextResponse.json({ chart, wheel });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }
}
