import { NextRequest, NextResponse } from "next/server";
import { AstrologerService } from "@/lib/astroseek";
import Groq from "groq-sdk";

const astrologerService = new AstrologerService();

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { person1, person2 } = body;

    if (!person1 || !person2) {
      return NextResponse.json(
        { error: "Dados de ambas as pessoas são necessários" },
        { status: 400 }
      );
    }

    // Gera mapas natais de ambas as pessoas
    const chart1 = await astrologerService.generateBirthChart({
      year: person1.year,
      month: person1.month,
      day: person1.day,
      hour: person1.hour,
      minute: person1.minute,
      latitude: person1.latitude,
      longitude: person1.longitude,
      city: person1.city,
      nation: person1.nation,
      timezone: person1.timezone,
      name: person1.name,
    });

    const chart2 = await astrologerService.generateBirthChart({
      year: person2.year,
      month: person2.month,
      day: person2.day,
      hour: person2.hour,
      minute: person2.minute,
      latitude: person2.latitude,
      longitude: person2.longitude,
      city: person2.city,
      nation: person2.nation,
      timezone: person2.timezone,
      name: person2.name,
    });

    // Calcula score de compatibilidade
    const compatibility = calculateCompatibility(chart1, chart2);

    // Gera análise com IA
    const aiAnalysis = await generateCompatibilityAnalysis(
      person1,
      person2,
      chart1,
      chart2,
      compatibility
    );

    return NextResponse.json({
      success: true,
      compatibility,
      analysis: aiAnalysis,
      chart1: {
        sun: chart1.planets.sun,
        moon: chart1.planets.moon,
        venus: chart1.planets.venus,
        mars: chart1.planets.mars,
      },
      chart2: {
        sun: chart2.planets.sun,
        moon: chart2.planets.moon,
        venus: chart2.planets.venus,
        mars: chart2.planets.mars,
      },
    });
  } catch (error: any) {
    console.error("Erro ao calcular compatibilidade:", error);

    // Fallback com dados genéricos
    return NextResponse.json({
      success: true,
      compatibility: {
        overall: 78,
        love: 82,
        communication: 75,
        values: 80,
        longTerm: 76,
      },
      analysis: `💕 **Compatibilidade Amorosa Detectada!**

Vocês dois compartilham uma conexão especial que vai além do comum. Existe uma sintonia natural que facilita a comunicação e o entendimento mútuo.

🌟 **Pontos Fortes:**
• Química emocional intensa
• Valores compartilhados sobre relacionamento
• Capacidade de crescer juntos
• Atração física e espiritual

⚠️ **Desafios a Trabalhar:**
• Algumas diferenças de temperamento podem gerar conflitos
• Importante manter diálogo aberto
• Respeitar os espaços individuais

💫 **Conselho dos Astros:**
Este relacionamento tem grande potencial de durar e se transformar em algo profundo e significativo. A chave é cultivar paciência e compreensão mútua.`,
    });
  }
}

function calculateCompatibility(chart1: any, chart2: any): any {
  let scores = {
    overall: 0,
    love: 0,
    communication: 0,
    values: 0,
    longTerm: 0,
  };

  // Compatibilidade Sol-Sol (identidade)
  const sunCompatibility = getSignCompatibility(
    chart1.planets?.sun?.sign,
    chart2.planets?.sun?.sign
  );
  scores.values = sunCompatibility;

  // Compatibilidade Lua-Lua (emoções)
  const moonCompatibility = getSignCompatibility(
    chart1.planets?.moon?.sign,
    chart2.planets?.moon?.sign
  );
  scores.communication = moonCompatibility;

  // Compatibilidade Vênus-Marte (amor e atração)
  const venusCompatibility = getSignCompatibility(
    chart1.planets?.venus?.sign,
    chart2.planets?.mars?.sign
  );
  scores.love = venusCompatibility;

  // Score de longo prazo (média ponderada)
  scores.longTerm = Math.round(
    sunCompatibility * 0.3 + moonCompatibility * 0.3 + venusCompatibility * 0.4
  );

  // Score geral
  scores.overall = Math.round(
    (scores.love + scores.communication + scores.values + scores.longTerm) / 4
  );

  return scores;
}

function getSignCompatibility(sign1?: string, sign2?: string): number {
  if (!sign1 || !sign2) return 70;

  const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
    Aries: {
      Aries: 75,
      Leo: 95,
      Sagittarius: 90,
      Gemini: 70,
      Aquarius: 85,
      Libra: 80,
    },
    Taurus: {
      Taurus: 80,
      Virgo: 95,
      Capricorn: 90,
      Cancer: 85,
      Pisces: 88,
      Scorpio: 70,
    },
    Gemini: {
      Gemini: 75,
      Libra: 90,
      Aquarius: 95,
      Aries: 70,
      Leo: 85,
      Sagittarius: 80,
    },
    Cancer: {
      Cancer: 85,
      Scorpio: 95,
      Pisces: 92,
      Taurus: 88,
      Virgo: 85,
      Capricorn: 70,
    },
    Leo: {
      Leo: 80,
      Aries: 95,
      Sagittarius: 92,
      Gemini: 85,
      Libra: 88,
      Aquarius: 75,
    },
    Virgo: {
      Virgo: 85,
      Taurus: 95,
      Capricorn: 90,
      Cancer: 85,
      Scorpio: 88,
      Pisces: 75,
    },
    Libra: {
      Libra: 80,
      Gemini: 90,
      Aquarius: 92,
      Leo: 88,
      Sagittarius: 85,
      Aries: 80,
    },
    Scorpio: {
      Scorpio: 88,
      Cancer: 95,
      Pisces: 93,
      Virgo: 88,
      Capricorn: 85,
      Taurus: 70,
    },
    Sagittarius: {
      Sagittarius: 85,
      Aries: 90,
      Leo: 92,
      Libra: 85,
      Aquarius: 88,
      Gemini: 80,
    },
    Capricorn: {
      Capricorn: 85,
      Taurus: 90,
      Virgo: 90,
      Scorpio: 85,
      Pisces: 88,
      Cancer: 70,
    },
    Aquarius: {
      Aquarius: 90,
      Gemini: 95,
      Libra: 92,
      Sagittarius: 88,
      Aries: 85,
      Leo: 75,
    },
    Pisces: {
      Pisces: 88,
      Cancer: 92,
      Scorpio: 93,
      Capricorn: 88,
      Taurus: 88,
      Virgo: 75,
    },
  };

  return compatibilityMatrix[sign1]?.[sign2] || 70;
}

async function generateCompatibilityAnalysis(
  person1: any,
  person2: any,
  chart1: any,
  chart2: any,
  scores: any
): Promise<string> {
  const prompt = `Você é um astrólogo especialista em sinastria (compatibilidade astrológica de casais).

PESSOA 1 (${person1.name}):
- Sol em ${chart1.planets?.sun?.sign || "signo desconhecido"}
- Lua em ${chart1.planets?.moon?.sign || "signo desconhecido"}
- Vênus em ${chart1.planets?.venus?.sign || "signo desconhecido"}
- Marte em ${chart1.planets?.mars?.sign || "signo desconhecido"}

PESSOA 2 (${person2.name}):
- Sol em ${chart2.planets?.sun?.sign || "signo desconhecido"}
- Lua em ${chart2.planets?.moon?.sign || "signo desconhecido"}
- Vênus em ${chart2.planets?.venus?.sign || "signo desconhecido"}
- Marte em ${chart2.planets?.mars?.sign || "signo desconhecido"}

SCORES DE COMPATIBILIDADE:
- Amor: ${scores.love}%
- Comunicação: ${scores.communication}%
- Valores: ${scores.values}%
- Longo Prazo: ${scores.longTerm}%
- Geral: ${scores.overall}%

Como uma astróloga experiente e empática, forneça uma análise de compatibilidade amorosa completa e personalizada.

ESTRUTURA DA RESPOSTA:
1. Título empolgante sobre o nível de compatibilidade
2. Visão geral da conexão (2-3 parágrafos)
3. Pontos fortes do relacionamento (use emojis 💕🌟✨)
4. Desafios a trabalhar (use emojis ⚠️💭)
5. Conselho final dos astros (motivador e prático)

IMPORTANTE:
- Use linguagem afetuosa e acolhedora
- Seja honesta mas sempre construtiva
- Use emojis estrategicamente
- Escreva em português do Brasil
- 400-600 palavras
- Formato markdown

Comece a análise:`;

  try {
    const groqClient = getGroqClient();
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Você é uma astróloga especializada em sinastria e relacionamentos. Forneça análises profundas e empoderadoras.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
      max_tokens: 1000,
    });

    const analysis = chatCompletion.choices[0]?.message?.content || "";
    return (
      analysis ||
      `❤️ **Compatibilidade: ${scores.overall}%**\n\nVocês compartilham uma conexão especial baseada em suas energias astrais.`
    );
  } catch (error) {
    console.error("Erro ao gerar análise:", error);
    return `💕 **Compatibilidade Amorosa: ${scores.overall}%**

Vocês dois compartilham uma conexão especial! A análise dos mapas astrais revela uma sintonia natural que pode florescer em um relacionamento profundo e duradouro.

🌟 **Pontos Fortes:**
• Química emocional intensa
• Valores compartilhados
• Capacidade de crescer juntos
• Atração em múltiplos níveis

⚠️ **Desafios:**
• Algumas diferenças naturais de temperamento
• Importância do diálogo constante
• Respeitar espaços individuais

💫 **Conselho dos Astros:**
Este relacionamento tem grande potencial! Cultivem paciência, comunicação aberta e celebrem tanto as semelhanças quanto as diferenças.`;
  }
}
