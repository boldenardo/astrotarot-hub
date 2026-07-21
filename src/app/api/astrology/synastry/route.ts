import { NextRequest, NextResponse } from "next/server";
import { synastry, isConfigured } from "@/lib/astrology/client";
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

// POST /api/astrology/synastry  { person1: BirthInput, person2: BirthInput, language? }
export async function POST(req: NextRequest) {
  const gate = await requirePremium("compatibility");
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
  const p1 = parseBirth(body?.person1);
  const p2 = parseBirth(body?.person2);
  if (!p1 || !p2) {
    return NextResponse.json(
      {
        error:
          "Send 'person1' and 'person2', each with day, month, year, hour, min, lat, lon, tzone.",
      },
      { status: 400 }
    );
  }

  const language = typeof body?.language === "string" ? body.language : "en";

  try {
    const data = await synastry(p1, p2, language);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }
}
