import { NextRequest, NextResponse } from "next/server";
import { AstrologerService } from "@/lib/astroseek";
import Groq from "groq-sdk";

const astrologerService = new AstrologerService();

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
  });
}

// Planetas de abundância e seus significados
const ABUNDANCE_PLANETS = {
  Jupiter: {
    name: "Júpiter",
    energy: "Expansão, sorte, crescimento",
    meaning:
      "O grande benéfico que traz oportunidades de crescimento financeiro",
  },
  Venus: {
    name: "Vênus",
    energy: "Valor, atração, beleza",
    meaning: "Atrai recursos através de relacionamentos e talentos naturais",
  },
  Sun: {
    name: "Sol",
    energy: "Vitalidade, poder, reconhecimento",
    meaning: "Traz reconhecimento e valorização profissional",
  },
  Pluto: {
    name: "Plutão",
    energy: "Transformação, poder financeiro",
    meaning: "Transforma recursos através de investimentos e heranças",
  },
};

// Casas astrológicas relacionadas a dinheiro
const MONEY_HOUSES = {
  2: "Recursos Pessoais - Seu dinheiro, valores e talentos",
  8: "Recursos Compartilhados - Investimentos, heranças, crédito",
  10: "Carreira e Reconhecimento - Sucesso profissional e status",
  11: "Ganhos e Realizações - Lucros de projetos e conexões",
};

interface TransitData {
  planet: string;
  house: number;
  sign: string;
  aspect?: string;
  natalPlanet?: string;
}

function analyzeAbundanceTransits(chartData: any): TransitData[] {
  const transits: TransitData[] = [];

  if (!chartData || !chartData.planets) {
    return transits;
  }

  // Analisa posições dos planetas de abundância
  const abundancePlanetNames = Object.keys(ABUNDANCE_PLANETS);

  for (const planet of chartData.planets) {
    if (abundancePlanetNames.includes(planet.name)) {
      transits.push({
        planet: planet.name,
        house: planet.house || 0,
        sign: planet.sign || "",
      });
    }
  }

  return transits;
}

function calculateAbundanceScore(transits: TransitData[]): {
  financial: number;
  career: number;
  investments: number;
  opportunities: number;
} {
  let scores = {
    financial: 50, // Base 50
    career: 50,
    investments: 50,
    opportunities: 50,
  };

  for (const transit of transits) {
    const house = transit.house;

    // Júpiter aumenta abundância em qualquer casa
    if (transit.planet === "Jupiter") {
      if (house === 2) scores.financial += 25;
      if (house === 8) scores.investments += 25;
      if (house === 10) scores.career += 25;
      if (house === 11) scores.opportunities += 25;
    }

    // Vênus traz valor e atração
    if (transit.planet === "Venus") {
      if (house === 2) scores.financial += 20;
      if (house === 10) scores.career += 15;
    }

    // Sol traz reconhecimento
    if (transit.planet === "Sun") {
      if (house === 10) scores.career += 20;
      if (house === 2) scores.financial += 10;
    }

    // Plutão transforma finanças
    if (transit.planet === "Pluto") {
      if (house === 8) scores.investments += 20;
      if (house === 2) scores.financial += 15;
    }
  }

  // Normaliza entre 1-100
  return {
    financial: Math.max(1, Math.min(100, scores.financial)),
    career: Math.max(1, Math.min(100, scores.career)),
    investments: Math.max(1, Math.min(100, scores.investments)),
    opportunities: Math.max(1, Math.min(100, scores.opportunities)),
  };
}

function determineFavorablePeriods(transits: TransitData[]): string[] {
  const periods: string[] = [];
  const now = new Date();

  // Júpiter em casa 2 ou 8
  const jupiterIn28 = transits.find(
    (t) => t.planet === "Jupiter" && (t.house === 2 || t.house === 8)
  );
  if (jupiterIn28) {
    const month1 = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    periods.push(
      `${month1.toLocaleDateString("pt-BR", {
        month: "long",
      })}: Excelente para novos investimentos (Júpiter favorável)`
    );
  }

  // Vênus em casas de dinheiro
  const venusInMoney = transits.find(
    (t) => t.planet === "Venus" && (t.house === 2 || t.house === 10)
  );
  if (venusInMoney) {
    const month2 = new Date(now.getFullYear(), now.getMonth() + 2, 10);
    periods.push(
      `${month2.toLocaleDateString("pt-BR", {
        month: "long",
      })}: Período ideal para negociações e parcerias (Vênus em harmonia)`
    );
  }

  // Sol em casa 10
  const sunIn10 = transits.find((t) => t.planet === "Sun" && t.house === 10);
  if (sunIn10) {
    const month3 = new Date(now.getFullYear(), now.getMonth() + 3, 5);
    periods.push(
      `${month3.toLocaleDateString("pt-BR", {
        month: "long",
      })}: Reconhecimento profissional e possível promoção (Sol no topo)`
    );
  }

  // Se não encontrou nada específico, adiciona períodos gerais
  if (periods.length === 0) {
    periods.push(
      "Próximos 3 meses: Foco em consolidar suas finanças e planejar investimentos",
      "Próximos 6 meses: Oportunidades surgem através de networking e colaborações",
      "Próximo ano: Ciclo de crescimento gradual com resultados sustentáveis"
    );
  }

  return periods.slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthData } = body;

    if (!birthData) {
      return NextResponse.json(
        { error: "Dados de nascimento são necessários" },
        { status: 400 }
      );
    }

    // Busca mapa natal
    const natalChart = await astrologerService.getNatalChart({
      year: birthData.year,
      month: birthData.month,
      day: birthData.day,
      hour: birthData.hour,
      minute: birthData.minute,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      city: birthData.city || "São Paulo",
      nation: birthData.nation || "Brazil",
      timezone: birthData.timezone || "America/Sao_Paulo",
    });

    // Analisa trânsitos de abundância
    const transits = analyzeAbundanceTransits(natalChart);

    // Calcula scores
    const scores = calculateAbundanceScore(transits);

    // Determina períodos favoráveis
    const favorablePeriods = determineFavorablePeriods(transits);

    // Análise das casas de dinheiro
    const houses: { [key: string]: string } = {};
    for (const transit of transits) {
      if ([2, 8, 10, 11].includes(transit.house)) {
        const planetInfo =
          ABUNDANCE_PLANETS[transit.planet as keyof typeof ABUNDANCE_PLANETS];
        if (planetInfo) {
          houses[
            `house${transit.house}`
          ] = `${planetInfo.name} em ${transit.sign} - ${planetInfo.energy}`;
        }
      }
    }

    // Gera análise personalizada com IA
    const aiPrompt = `Você é uma astróloga financeira especializada em ciclos de abundância. Analise o mapa astral para prosperidade:

**Posições Planetárias de Abundância:**
${transits
  .map((t) => `- ${t.planet} na Casa ${t.house} (${t.sign})`)
  .join("\n")}

**Scores de Abundância:**
- Finanças Pessoais: ${scores.financial}/100
- Carreira: ${scores.career}/100
- Investimentos: ${scores.investments}/100
- Oportunidades: ${scores.opportunities}/100

**Casas de Dinheiro:**
${Object.entries(MONEY_HOUSES)
  .map(([house, meaning]) => `- Casa ${house}: ${meaning}`)
  .join("\n")}

Crie em português brasileiro:

1. **Ciclo Atual** (2-3 frases): Descreva o momento astrológico de abundância que a pessoa está vivendo agora.

2. **4 Recomendações Práticas**: Ações específicas e práticas para maximizar a prosperidade baseadas nas posições planetárias. Seja direta e acionável.

Use linguagem feminina, empoderadora e focada em resultados concretos.`;

    let currentCycle = "";
    let recommendations: string[] = [];

    try {
      const groqClient = getGroqClient();
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Você é uma astróloga financeira que combina sabedoria astrológica com estratégia prática para criar abundância.",
          },
          {
            role: "user",
            content: aiPrompt,
          },
        ],
        model: "llama-3.1-70b-versatile",
        temperature: 0.8,
        max_tokens: 600,
      });

      const response = chatCompletion.choices[0]?.message?.content || "";
      const lines = response.split("\n").filter((l) => l.trim());

      // Extrai ciclo atual
      const cycleIndex = lines.findIndex(
        (l) => l.includes("Ciclo") || l.includes("ciclo")
      );
      if (cycleIndex >= 0 && cycleIndex + 1 < lines.length) {
        currentCycle = lines
          .slice(
            cycleIndex + 1,
            lines.findIndex(
              (l, i) =>
                i > cycleIndex &&
                (l.includes("Recomendações") || l.includes("1."))
            )
          )
          .join(" ")
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .trim();
      }

      // Extrai recomendações
      const recLines = lines.filter(
        (l) =>
          l.match(/^\d+\./) ||
          l.match(/^-/) ||
          (l.length > 30 && !l.includes("**"))
      );
      recommendations = recLines
        .slice(0, 4)
        .map((l) =>
          l
            .replace(/^\d+\.\s*/, "")
            .replace(/^-\s*/, "")
            .trim()
        )
        .filter((r) => r.length > 20);

      // Fallbacks
      if (!currentCycle) {
        currentCycle = transits.find((t) => t.planet === "Jupiter")
          ? "Júpiter está trazendo oportunidades de expansão financeira. É um momento propício para investir em seu crescimento."
          : "Você está em um ciclo de consolidação financeira. Foque em fortalecer suas bases antes de expandir.";
      }

      if (recommendations.length < 4) {
        recommendations = [
          "Invista em educação e habilidades que aumentem seu valor de mercado",
          "Diversifique suas fontes de renda e explore novas oportunidades",
          "Construa uma reserva financeira para aproveitar oportunidades futuras",
          "Fortaleça sua rede de contatos profissionais e colaborações estratégicas",
        ];
      }
    } catch (error) {
      console.error("Erro ao gerar análise com IA:", error);
      currentCycle =
        "Você está em um momento de potencial para crescimento financeiro através da consciência astrológica.";
      recommendations = [
        "Aproveite as energias planetárias atuais para tomar decisões financeiras conscientes",
        "Observe os padrões cíclicos em suas finanças e alinhe-se com os ritmos naturais",
        "Invista em áreas que ressoam com seus talentos e valores pessoais",
        "Mantenha-se aberta a oportunidades inesperadas que aparecem em seu caminho",
      ];
    }

    const analysis = {
      currentCycle,
      scores,
      favorablePeriods,
      houses,
      recommendations,
      bestInvestmentTiming: favorablePeriods[0] || "Próximos 3 meses",
      jupiterPosition: transits.find((t) => t.planet === "Jupiter")
        ? `Júpiter na Casa ${
            transits.find((t) => t.planet === "Jupiter")?.house
          } traz expansão`
        : "Júpiter favorece crescimento gradual neste período",
    };

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Erro ao gerar análise de abundância:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar análise de abundância",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
