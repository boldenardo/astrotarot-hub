// POST /api/compatibility
// { personA, personB } — cada pessoa: { name, year, month, day, hour, minute,
//   city, nation?, latitude?, longitude?, timezone? }
// → { success: true, analysis: CompatibilityResult }
//
// Uses the REAL synastry from astrologyapi.com; Groq writes the analysis in English.

import { NextRequest, NextResponse } from "next/server";
import { requirePremium } from "@/lib/server/plan-gate";
import { groqChatJson } from "@/lib/server/groq";
import {
  synastry,
  isConfigured,
  type BirthInput,
} from "@/lib/astrology/client";
import { birthTzone } from "@/lib/server/timezone";
import { geocodeCity } from "@/lib/server/geocode";

export const runtime = "nodejs";

// EXACT shape expected by the compatibility page.
interface CompatibilityResult {
  overall: number;
  love: number;
  communication: number;
  values: number;
  longTerm: number;
  synastry_analysis: {
    strengths: string[];
    challenges: string[];
    emotional_connection: string;
    sexual_chemistry: string;
    communication_style: string;
  };
  final_verdict: string;
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

interface ParsedPerson {
  name: string;
  birth: BirthInput;
}

async function parsePerson(value: unknown): Promise<ParsedPerson | null> {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;

  const day = num(p.day);
  const month = num(p.month);
  const year = num(p.year);
  const hour = num(p.hour);
  const minute = num(p.minute);
  if (
    day === null ||
    month === null ||
    year === null ||
    hour === null ||
    minute === null
  ) {
    return null;
  }

  const city = typeof p.city === "string" ? p.city.trim() : "";
  const nation = typeof p.nation === "string" ? p.nation.trim() : "";
  const timezone =
    typeof p.timezone === "string" && p.timezone
      ? p.timezone
      : "America/Sao_Paulo";

  let lat = num(p.latitude);
  let lon = num(p.longitude);
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

  return {
    name: typeof p.name === "string" && p.name.trim() ? p.name.trim() : "",
    birth: {
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
    },
  };
}

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

  const personA = await parsePerson(body?.personA);
  const personB = await parsePerson(body?.personB);
  if (!personA || !personB) {
    return NextResponse.json(
      {
        error:
          "Send 'personA' and 'personB', each with year, month, day, hour, minute and city.",
      },
      { status: 400 }
    );
  }

  let synastryRaw: unknown;
  try {
    synastryRaw = await synastry(personA.birth, personB.birth, "en");
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the astrology service." },
      { status: 502 }
    );
  }

  const nameA = personA.name || "Person 1";
  const nameB = personB.name || "Person 2";
  const synastryText = JSON.stringify(synastryRaw).slice(0, 4000);

  const schema = `{
  "overall": "integer 0-100 (overall compatibility, consistent with the other indices)",
  "love": "integer 0-100",
  "communication": "integer 0-100",
  "values": "integer 0-100",
  "longTerm": "integer 0-100",
  "synastry_analysis": {
    "strengths": ["3 to 5 strengths of the relationship, short sentences in English"],
    "challenges": ["3 to 5 challenges of the relationship, short sentences in English"],
    "emotional_connection": "string (2-3 sentences about the emotional connection)",
    "sexual_chemistry": "string (2-3 sentences about the couple's chemistry)",
    "communication_style": "string (2-3 sentences about the communication between the two)"
  },
  "final_verdict": "string (warm final verdict, 2-4 sentences)"
}`;

  try {
    const analysis = await groqChatJson<CompatibilityResult>({
      system:
        "You are an astrologer specialized in synastry (romantic compatibility). Respond ONLY with valid JSON, with no text outside the JSON. All texts must be in English (US).",
      user: [
        `Couple analyzed: ${nameA} and ${nameB}.`,
        "REAL synastry between the two natal charts (data from astrologyapi.com):",
        synastryText,
        "",
        "Based EXCLUSIVELY on these real aspects, generate the compatibility analysis.",
        "The percentages must be consistent with each other and with the aspects (harmonious ones raise, tense ones lower); avoid extremes like 0 or 100.",
        "Respond ONLY with a JSON exactly in this schema:",
        schema,
      ].join("\n"),
      maxTokens: 1500,
      temperature: 0.7,
    });

    if (!analysis || typeof analysis !== "object") {
      throw new Error("Invalid JSON");
    }

    const sa =
      analysis.synastry_analysis &&
      typeof analysis.synastry_analysis === "object"
        ? (analysis.synastry_analysis as Record<string, unknown>)
        : {};
    analysis.synastry_analysis = {
      strengths: Array.isArray(sa.strengths) ? (sa.strengths as string[]) : [],
      challenges: Array.isArray(sa.challenges)
        ? (sa.challenges as string[])
        : [],
      emotional_connection:
        typeof sa.emotional_connection === "string"
          ? sa.emotional_connection
          : "",
      sexual_chemistry:
        typeof sa.sexual_chemistry === "string" ? sa.sexual_chemistry : "",
      communication_style:
        typeof sa.communication_style === "string"
          ? sa.communication_style
          : "",
    };

    return NextResponse.json({ success: true, analysis });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }
}
