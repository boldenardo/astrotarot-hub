import { NextRequest, NextResponse } from "next/server";
import {
  dailySunSign,
  isZodiacSign,
  isConfigured,
} from "@/lib/astrology/client";
import { requirePremium } from "@/lib/server/plan-gate";

export const runtime = "nodejs";

// GET /api/astrology/horoscope?sign=leo&language=en
export async function GET(req: NextRequest) {
  const gate = await requirePremium("horoscope");
  if (!gate.ok) return gate.response;

  const sign = (req.nextUrl.searchParams.get("sign") || "").toLowerCase();

  if (!isZodiacSign(sign)) {
    return NextResponse.json(
      { error: "Provide a valid 'sign' (e.g.: aries, leo, scorpio)." },
      { status: 400 }
    );
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Astrology service is not configured." },
      { status: 503 }
    );
  }

  const language = req.nextUrl.searchParams.get("language") || "en";

  try {
    const data = await dailySunSign(sign, language);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }
}
