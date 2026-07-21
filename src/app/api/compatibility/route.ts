// POST /api/compatibility
// { personA, personB } — cada pessoa: { name, year, month, day, hour, minute,
//   city, nation?, latitude?, longitude?, timezone? }
// → { success: true, analysis: CompatibilityResult }
//
// Usa a sinastria REAL da astrologyapi.com; o Groq redige a análise em pt-BR.

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

// Shape EXATO esperado pela página de compatibilidade.
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
      { error: "Serviço de astrologia não configurado." },
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
          "Envie 'personA' e 'personB', cada um com year, month, day, hour, minute e city.",
      },
      { status: 400 }
    );
  }

  let synastryRaw: unknown;
  try {
    synastryRaw = await synastry(personA.birth, personB.birth, "pt");
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar o serviço de astrologia." },
      { status: 502 }
    );
  }

  const nameA = personA.name || "Pessoa 1";
  const nameB = personB.name || "Pessoa 2";
  const synastryText = JSON.stringify(synastryRaw).slice(0, 4000);

  const schema = `{
  "overall": "inteiro 0-100 (compatibilidade geral, coerente com os demais índices)",
  "love": "inteiro 0-100",
  "communication": "inteiro 0-100",
  "values": "inteiro 0-100",
  "longTerm": "inteiro 0-100",
  "synastry_analysis": {
    "strengths": ["3 a 5 pontos fortes da relação, frases curtas em pt-BR"],
    "challenges": ["3 a 5 desafios da relação, frases curtas em pt-BR"],
    "emotional_connection": "string (2-3 frases sobre a conexão emocional)",
    "sexual_chemistry": "string (2-3 frases sobre a química do casal)",
    "communication_style": "string (2-3 frases sobre a comunicação entre os dois)"
  },
  "final_verdict": "string (veredito final acolhedor, 2-4 frases)"
}`;

  try {
    const analysis = await groqChatJson<CompatibilityResult>({
      system:
        "Você é um astrólogo brasileiro especialista em sinastria (compatibilidade amorosa). Responda SOMENTE com JSON válido, sem nenhum texto fora do JSON. Todos os textos devem estar em português do Brasil.",
      user: [
        `Casal analisado: ${nameA} e ${nameB}.`,
        "Sinastria REAL entre os dois mapas natais (dados da astrologyapi.com):",
        synastryText,
        "",
        "Com base EXCLUSIVAMENTE nesses aspectos reais, gere a análise de compatibilidade.",
        "Os percentuais devem ser coerentes entre si e com os aspectos (harmônicos elevam, tensos reduzem); evite extremos como 0 ou 100.",
        "Responda SOMENTE com um JSON exatamente neste schema:",
        schema,
      ].join("\n"),
      maxTokens: 1500,
      temperature: 0.7,
    });

    if (!analysis || typeof analysis !== "object") {
      throw new Error("JSON inválido");
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
      { error: "Falha ao gerar a interpretação." },
      { status: 502 }
    );
  }
}
