// POST /api/abundance
// { birthData: { year, month, day, hour, minute, city, nation?, latitude?,
//   longitude?, timezone? } }
// → { success: true, analysis } (shape exato de src/app/abundance/page.tsx)
//
// Mapa natal REAL (western_horoscope); extrai Júpiter/Vênus e as casas
// 2/8/10/11 e passa ao Groq para redigir o guia de prosperidade em pt-BR.

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

// Shape EXATO esperado pela página de abundância.
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
          "Envie 'birthData' com year, month, day, hour, minute e city.",
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

  // Extração determinística das posições ligadas à prosperidade.
  const planets = (
    Array.isArray(chartRaw?.planets) ? chartRaw.planets : []
  ) as RawPlanet[];
  const houses = (
    Array.isArray(chartRaw?.houses) ? chartRaw.houses : []
  ) as RawHouse[];

  const jupiter = planets.find((p) => normalizeName(p.name) === "jupiter");
  const venus = planets.find((p) => normalizeName(p.name) === "venus");
  const houseSign = (n: number) =>
    houses.find((h) => Number(h.house) === n)?.sign ?? "desconhecido";

  const positionsText = [
    jupiter
      ? `Júpiter (expansão e fortuna): signo ${jupiter.sign}, casa ${jupiter.house}`
      : "Júpiter: posição não disponível",
    venus
      ? `Vênus (valores e recursos): signo ${venus.sign}, casa ${venus.house}`
      : "Vênus: posição não disponível",
    `Casa 2 (recursos e dinheiro): cúspide em ${houseSign(2)}`,
    `Casa 8 (transformação e recursos compartilhados): cúspide em ${houseSign(8)}`,
    `Casa 10 (carreira e realização): cúspide em ${houseSign(10)}`,
    `Casa 11 (ganhos e redes): cúspide em ${houseSign(11)}`,
  ].join("\n");

  const chartText = JSON.stringify(chartRaw).slice(0, 4000);

  const schema = `{
  "currentCycle": "string (2-3 frases sobre o ciclo de prosperidade atual da pessoa)",
  "scores": { "financial": "inteiro 0-100", "career": "inteiro 0-100", "investments": "inteiro 0-100", "opportunities": "inteiro 0-100" },
  "favorablePeriods": ["3 a 5 períodos favoráveis com justificativa astrológica, frases curtas"],
  "houses": {
    "house2": "string (1-2 frases sobre a casa 2 no mapa desta pessoa)",
    "house8": "string (1-2 frases sobre a casa 8)",
    "house10": "string (1-2 frases sobre a casa 10)",
    "house11": "string (1-2 frases sobre a casa 11)"
  },
  "jupiterPosition": "string (1-2 frases sobre Júpiter no mapa desta pessoa)",
  "recommendations": ["4 a 6 recomendações estratégicas e práticas, frases curtas"]
}`;

  try {
    const analysis = await groqChatJson<AbundanceAnalysis>({
      system:
        "Você é um astrólogo brasileiro especialista em astrologia da prosperidade e das finanças. Responda SOMENTE com JSON válido, sem nenhum texto fora do JSON. Todos os textos devem estar em português do Brasil.",
      user: [
        "Posições REAIS do mapa natal ligadas à abundância (dados da astrologyapi.com):",
        positionsText,
        "",
        "Trecho do mapa natal completo (dados brutos, para contexto):",
        chartText,
        "",
        "Com base EXCLUSIVAMENTE nessas posições reais, gere o guia de abundância.",
        "Os scores devem ser coerentes com as posições (Júpiter/Vênus bem colocados elevam); evite extremos como 0 ou 100.",
        "Responda SOMENTE com um JSON exatamente neste schema:",
        schema,
      ].join("\n"),
      maxTokens: 1600,
      temperature: 0.7,
    });

    if (!analysis || typeof analysis !== "object") {
      throw new Error("JSON inválido");
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
      { error: "Falha ao gerar a interpretação." },
      { status: 502 }
    );
  }
}
