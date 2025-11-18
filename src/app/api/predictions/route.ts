import { NextRequest, NextResponse } from "next/server";
import { AstrologerService } from "@/lib/astroseek";
import Groq from "groq-sdk";

const astrologerService = new AstrologerService();

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
  });
}

// Significados dos aspectos
const ASPECT_MEANINGS: {
  [key: string]: { energy: string; description: string };
} = {
  conjunction: {
    energy: "Fusão e Intensidade",
    description: "Energias se fundem, criando novo começo ou intensificação",
  },
  opposition: {
    energy: "Tensão e Consciência",
    description: "Polaridades que exigem equilíbrio e integração",
  },
  trine: {
    energy: "Harmonia e Fluxo",
    description: "Energia flui facilmente, oportunidades naturais",
  },
  sextile: {
    energy: "Oportunidade e Ação",
    description: "Portas se abrem com esforço consciente",
  },
  square: {
    energy: "Desafio e Crescimento",
    description: "Atrito que impulsiona mudança e desenvolvimento",
  },
};

// Significados dos planetas em trânsito
const TRANSIT_PLANET_MEANINGS: { [key: string]: string } = {
  Sun: "identidade, vitalidade, propósito",
  Moon: "emoções, necessidades, intuição",
  Mercury: "comunicação, pensamento, aprendizado",
  Venus: "amor, beleza, valores, dinheiro",
  Mars: "ação, energia, desejo, conflito",
  Jupiter: "expansão, sorte, crescimento, sabedoria",
  Saturn: "responsabilidade, limites, estrutura, lições",
  Uranus: "mudança súbita, inovação, liberdade",
  Neptune: "intuição, espiritualidade, ilusão, sonhos",
  Pluto: "transformação profunda, poder, renascimento",
};

// Fase lunar
const MOON_PHASES = [
  { name: "Lua Nova", emoji: "🌑", meaning: "Novos começos e intenções" },
  { name: "Lua Crescente", emoji: "🌒", meaning: "Construção e crescimento" },
  {
    name: "Quarto Crescente",
    emoji: "🌓",
    meaning: "Ação e superação de obstáculos",
  },
  {
    name: "Lua Gibosa Crescente",
    emoji: "🌔",
    meaning: "Refinamento e ajustes",
  },
  { name: "Lua Cheia", emoji: "🌕", meaning: "Culminação e revelação" },
  {
    name: "Lua Gibosa Minguante",
    emoji: "🌖",
    meaning: "Compartilhamento e gratidão",
  },
  { name: "Quarto Minguante", emoji: "🌗", meaning: "Liberação e perdão" },
  {
    name: "Lua Minguante",
    emoji: "🌘",
    meaning: "Descanso e renovação interior",
  },
];

interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  isApplying: boolean;
}

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

function calculateMoonPhase(date: Date): {
  name: string;
  emoji: string;
  meaning: string;
  percentage: number;
} {
  // Simplificado: calcula fase aproximada baseada no dia do mês
  const dayOfMonth = date.getDate();
  const phaseIndex = Math.floor((dayOfMonth % 29.5) / 3.69); // ~8 fases
  const phase = MOON_PHASES[Math.min(phaseIndex, 7)];
  const percentage = ((dayOfMonth % 29.5) / 29.5) * 100;

  return {
    ...phase,
    percentage,
  };
}

function analyzeTransitAspects(transits: any): TransitAspect[] {
  const aspects: TransitAspect[] = [];

  if (!transits.aspects || !Array.isArray(transits.aspects)) {
    return aspects;
  }

  for (const aspect of transits.aspects) {
    if (aspect.planet1 && aspect.planet2 && aspect.aspect) {
      aspects.push({
        transitPlanet: aspect.planet1,
        natalPlanet: aspect.planet2,
        aspect: aspect.aspect,
        orb: aspect.orb || 0,
        isApplying: aspect.orb < 3,
      });
    }
  }

  return aspects;
}

function calculateEnergyRatings(
  aspects: TransitAspect[]
): DailyPrediction["energyRatings"] {
  const ratings = {
    love: 50,
    career: 50,
    health: 50,
    finances: 50,
    spirituality: 50,
  };

  for (const aspect of aspects) {
    const isHarmonious =
      aspect.aspect === "trine" || aspect.aspect === "sextile";
    const isChallenging =
      aspect.aspect === "square" || aspect.aspect === "opposition";
    const modifier = isHarmonious ? 15 : isChallenging ? -15 : 5;

    // Venus afeta amor e finanças
    if (aspect.transitPlanet === "Venus" || aspect.natalPlanet === "Venus") {
      ratings.love += modifier;
      ratings.finances += modifier * 0.7;
    }

    // Marte afeta energia e carreira
    if (aspect.transitPlanet === "Mars" || aspect.natalPlanet === "Mars") {
      ratings.career += modifier;
      ratings.health += modifier * 0.5;
    }

    // Júpiter traz expansão
    if (aspect.transitPlanet === "Jupiter") {
      ratings.career += modifier * 1.2;
      ratings.finances += modifier;
    }

    // Saturno traz responsabilidade
    if (aspect.transitPlanet === "Saturn") {
      ratings.career += modifier * 0.8;
    }

    // Netuno e Plutão afetam espiritualidade
    if (
      aspect.transitPlanet === "Neptune" ||
      aspect.transitPlanet === "Pluto"
    ) {
      ratings.spirituality += modifier;
    }

    // Sol afeta vitalidade
    if (aspect.transitPlanet === "Sun" || aspect.natalPlanet === "Sun") {
      ratings.health += modifier;
      ratings.career += modifier * 0.5;
    }
  }

  // Normaliza entre 1-100
  return {
    love: Math.max(1, Math.min(100, ratings.love)),
    career: Math.max(1, Math.min(100, ratings.career)),
    health: Math.max(1, Math.min(100, ratings.health)),
    finances: Math.max(1, Math.min(100, ratings.finances)),
    spirituality: Math.max(1, Math.min(100, ratings.spirituality)),
  };
}

function determineBestTimes(
  aspects: TransitAspect[]
): DailyPrediction["bestTimeOfDay"] {
  const hasHarmoniousVenus = aspects.some(
    (a) =>
      (a.transitPlanet === "Venus" || a.natalPlanet === "Venus") &&
      (a.aspect === "trine" || a.aspect === "sextile")
  );

  const hasActiveMars = aspects.some(
    (a) => a.transitPlanet === "Mars" || a.natalPlanet === "Mars"
  );

  const hasMercury = aspects.some(
    (a) => a.transitPlanet === "Mercury" || a.natalPlanet === "Mercury"
  );

  return {
    morning: hasActiveMars
      ? "Energia alta para exercícios e tarefas que exigem coragem"
      : "Meditação e planejamento do dia",
    afternoon: hasMercury
      ? "Ideal para reuniões, estudos e comunicações importantes"
      : "Foco em tarefas práticas e produtividade",
    evening: hasHarmoniousVenus
      ? "Perfeito para romance, arte e conexões sociais"
      : "Tempo para relaxar e recarregar energias",
  };
}

function getLuckyElements(
  aspects: TransitAspect[],
  date: Date
): { color: string; number: number } {
  const colors = [
    "roxo",
    "dourado",
    "rosa",
    "azul celeste",
    "verde esmeralda",
    "vermelho",
  ];
  const dominantPlanets = aspects.map((a) => a.transitPlanet);

  let colorIndex = 0;
  if (dominantPlanets.includes("Venus")) colorIndex = 2; // Rosa
  else if (dominantPlanets.includes("Jupiter")) colorIndex = 1; // Dourado
  else if (dominantPlanets.includes("Mars")) colorIndex = 5; // Vermelho
  else if (dominantPlanets.includes("Neptune")) colorIndex = 3; // Azul
  else colorIndex = 0; // Roxo

  const luckyNumber = ((date.getDate() + aspects.length) % 9) + 1;

  return {
    color: colors[colorIndex],
    number: luckyNumber,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthData, targetDate } = body;

    if (!birthData) {
      return NextResponse.json(
        { error: "Dados de nascimento são necessários" },
        { status: 400 }
      );
    }

    const date = targetDate ? new Date(targetDate) : new Date();

    // Busca trânsitos do dia
    const transits = await astrologerService.getTransits(birthData, date);

    // Analisa aspectos
    const aspects = analyzeTransitAspects(transits);

    // Calcula fase lunar
    const moonPhase = calculateMoonPhase(date);

    // Seleciona os 5 trânsitos mais importantes
    const majorTransits = aspects
      .filter((a) => a.isApplying || a.orb < 5)
      .slice(0, 5)
      .map((aspect) => {
        const aspectInfo =
          ASPECT_MEANINGS[aspect.aspect] || ASPECT_MEANINGS.conjunction;

        let areas: string[] = [];
        if (aspect.natalPlanet === "Sun" || aspect.transitPlanet === "Sun") {
          areas.push("Identidade", "Propósito");
        }
        if (aspect.natalPlanet === "Moon" || aspect.transitPlanet === "Moon") {
          areas.push("Emoções", "Lar");
        }
        if (
          aspect.natalPlanet === "Venus" ||
          aspect.transitPlanet === "Venus"
        ) {
          areas.push("Amor", "Finanças");
        }
        if (aspect.natalPlanet === "Mars" || aspect.transitPlanet === "Mars") {
          areas.push("Ação", "Energia");
        }

        return {
          transit: aspect.transitPlanet,
          natal: aspect.natalPlanet,
          aspect: aspect.aspect,
          energy: aspectInfo.energy,
          description: aspectInfo.description,
          areas: areas.length > 0 ? areas : ["Vida em geral"],
        };
      });

    // Calcula avaliações de energia
    const energyRatings = calculateEnergyRatings(aspects);

    // Determina melhores horários
    const bestTimeOfDay = determineBestTimes(aspects);

    // Elementos de sorte
    const { color, number } = getLuckyElements(aspects, date);

    // Gera recomendação e aviso com IA
    const aiPrompt = `Você é uma astróloga experiente. Baseado nos trânsitos astrológicos de hoje, crie uma previsão diária personalizada:

**Data:** ${date.toLocaleDateString("pt-BR")}
**Fase Lunar:** ${moonPhase.name} (${moonPhase.meaning})

**Principais Trânsitos:**
${majorTransits
  .map((t) => `- ${t.transit} em ${t.aspect} com ${t.natal} natal: ${t.energy}`)
  .join("\n")}

**Energias do Dia:**
- Amor: ${energyRatings.love}/100
- Carreira: ${energyRatings.career}/100
- Saúde: ${energyRatings.health}/100
- Finanças: ${energyRatings.finances}/100
- Espiritualidade: ${energyRatings.spirituality}/100

Crie em português brasileiro:

1. **Recomendação do Dia** (2-3 frases): Uma orientação prática e empoderadora sobre o que fazer hoje para aproveitar as energias astrais. Seja específica e inspiradora.

2. **Alerta do Dia** (1-2 frases): Um aviso gentil sobre possíveis desafios ou armadilhas a evitar hoje.

Use linguagem feminina, acolhedora e mística. Foque em ação prática, não apenas teoria.`;

    let recommendation = "";
    let warning = "";

    try {
      const groqClient = getGroqClient();
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Você é uma astróloga compassiva especializada em previsões diárias práticas e empoderadoras para mulheres.",
          },
          {
            role: "user",
            content: aiPrompt,
          },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 400,
      });

      const response = chatCompletion.choices[0]?.message?.content || "";

      // Tenta extrair recomendação e aviso da resposta
      const lines = response.split("\n").filter((l) => l.trim());
      const recIndex = lines.findIndex(
        (l) => l.includes("Recomendação") || l.includes("recomendação")
      );
      const warnIndex = lines.findIndex(
        (l) => l.includes("Alerta") || l.includes("alerta")
      );

      if (recIndex >= 0 && recIndex + 1 < lines.length) {
        recommendation = lines
          .slice(recIndex + 1, warnIndex > recIndex ? warnIndex : undefined)
          .join(" ")
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .trim();
      }

      if (warnIndex >= 0 && warnIndex + 1 < lines.length) {
        warning = lines
          .slice(warnIndex + 1)
          .join(" ")
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .trim();
      }

      // Fallback se não conseguiu extrair
      if (!recommendation) {
        recommendation =
          response.split("\n")[0] ||
          "Aproveite as energias do dia com consciência e intenção.";
      }
      if (!warning) {
        warning =
          "Mantenha-se centrada e evite decisões impulsivas sob forte emoção.";
      }
    } catch (error) {
      console.error("Erro ao gerar previsão com IA:", error);
      recommendation =
        "Hoje é um dia para confiar em sua intuição e abraçar as oportunidades que surgirem.";
      warning = "Evite tomar decisões importantes sob pressão emocional.";
    }

    const prediction: DailyPrediction = {
      date: date.toISOString(),
      moonPhase,
      majorTransits,
      energyRatings,
      bestTimeOfDay,
      luckyColor: color,
      luckyNumber: number,
      recommendation,
      warning,
    };

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error("Erro ao gerar previsões:", error);
    return NextResponse.json(
      { error: "Erro ao processar previsões astrológicas" },
      { status: 500 }
    );
  }
}
