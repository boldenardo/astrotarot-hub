import { NextRequest, NextResponse } from "next/server";
import {
  dailySunSign,
  isZodiacSign,
  isConfigured,
} from "@/lib/astrology/client";
import { requirePremium } from "@/lib/server/plan-gate";

export const runtime = "nodejs";

// GET /api/astrology/horoscope?sign=leo&language=pt
export async function GET(req: NextRequest) {
  const gate = await requirePremium("horoscope");
  if (!gate.ok) return gate.response;

  const sign = (req.nextUrl.searchParams.get("sign") || "").toLowerCase();

  if (!isZodiacSign(sign)) {
    return NextResponse.json(
      { error: "Informe um 'sign' válido (ex.: aries, leo, scorpio)." },
      { status: 400 }
    );
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Serviço de astrologia não configurado." },
      { status: 503 }
    );
  }

  const language = req.nextUrl.searchParams.get("language") || "pt";

  try {
    const data = await dailySunSign(sign, language);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar o serviço de astrologia." },
      { status: 502 }
    );
  }
}
