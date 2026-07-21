// POST /api/predictions
// { name, day, month, year, hour, minute, city, latitude?, longitude?, timezone }
// → DailyPrediction (objeto direto, shape exato de src/app/predictions/page.tsx)
//
// Usa trânsitos diários REAIS da astrologyapi.com; o Groq apenas redige a
// previsão em pt-BR a partir deles.

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

// Shape EXATO esperado pela página de previsões.
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
      { error: "Serviço de astrologia não configurado." },
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
          "Dados de nascimento incompletos. Envie day, month, year, hour, minute e city.",
      },
      { status: 400 }
    );
  }

  // Coordenadas: usa as recebidas; geocodifica quando ausentes ou quando
  // vieram com o fallback de São Paulo mas a cidade é outra.
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
    transitsRaw = await dailyTransits(birth, "pt");
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar o serviço de astrologia." },
      { status: 502 }
    );
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });

  const transitsText = JSON.stringify(transitsRaw).slice(0, 4000);

  const schema = `{
  "date": "string (a data de hoje por extenso em português, ex.: '${today}')",
  "moonPhase": { "name": "string (nome da fase da lua em pt-BR)", "emoji": "string (emoji da fase)", "meaning": "string (1-2 frases sobre a energia da fase)", "percentage": "número inteiro 0-100 (iluminação lunar)" },
  "majorTransits": [ { "transit": "string (planeta em trânsito)", "natal": "string (planeta ou ponto natal)", "aspect": "string (aspecto, ex.: conjunção, trígono)", "energy": "string (resumo curto da energia)", "description": "string (1-2 frases)", "areas": ["2 a 4 áreas da vida em pt-BR"] } ],
  "energyRatings": { "love": "inteiro 0-100", "career": "inteiro 0-100", "health": "inteiro 0-100", "finances": "inteiro 0-100", "spirituality": "inteiro 0-100" },
  "bestTimeOfDay": { "morning": "string (dica para a manhã)", "afternoon": "string (dica para a tarde)", "evening": "string (dica para a noite)" },
  "luckyColor": "string (cor da sorte em pt-BR)",
  "luckyNumber": "número inteiro 1-99",
  "recommendation": "string (2-3 frases de recomendação para hoje)",
  "warning": "string (1-2 frases de cautela para hoje)"
}`;

  try {
    const prediction = await groqChatJson<DailyPrediction>({
      system:
        "Você é um astrólogo brasileiro experiente. Responda SOMENTE com JSON válido, sem nenhum texto fora do JSON. Todos os textos devem estar em português do Brasil.",
      user: [
        `Hoje é ${today}.`,
        name ? `Consulente: ${name}.` : "",
        `Trânsitos planetários REAIS de hoje em relação ao mapa natal do consulente (dados da astrologyapi.com):`,
        transitsText,
        "",
        "Com base EXCLUSIVAMENTE nesses trânsitos reais, gere a previsão do dia.",
        "Inclua de 3 a 5 itens em majorTransits, escolhendo os trânsitos mais relevantes dos dados acima.",
        "A fase da lua (moonPhase) deve ser coerente com a data de hoje.",
        "Responda SOMENTE com um JSON exatamente neste schema:",
        schema,
      ]
        .filter(Boolean)
        .join("\n"),
      maxTokens: 1800,
      temperature: 0.7,
    });

    if (!prediction || typeof prediction !== "object") {
      throw new Error("JSON inválido");
    }
    if (!Array.isArray(prediction.majorTransits)) {
      prediction.majorTransits = [];
    }

    // Normaliza os shapes aninhados que a página desreferencia sem optional
    // chaining, garantindo que nunca faltem chaves nem venham tipos errados.
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
      name: str(mp.name, "Fase lunar"),
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
      { error: "Falha ao gerar a interpretação." },
      { status: 502 }
    );
  }
}
