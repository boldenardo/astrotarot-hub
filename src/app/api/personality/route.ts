import { NextRequest, NextResponse } from "next/server";
import { AstrologerService } from "@/lib/astroseek";
import Groq from "groq-sdk";

const astrologerService = new AstrologerService();
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Mapeamento de signos para elementos
const signElements: { [key: string]: string } = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

// Mapeamento de signos para modalidades
const signModalities: { [key: string]: string } = {
  Aries: "Cardinal",
  Taurus: "Fixed",
  Gemini: "Mutable",
  Cancer: "Cardinal",
  Leo: "Fixed",
  Virgo: "Mutable",
  Libra: "Cardinal",
  Scorpio: "Fixed",
  Sagittarius: "Mutable",
  Capricorn: "Cardinal",
  Aquarius: "Fixed",
  Pisces: "Mutable",
};

interface ElementDistribution {
  Fire: number;
  Earth: number;
  Air: number;
  Water: number;
}

interface ModalityDistribution {
  Cardinal: number;
  Fixed: number;
  Mutable: number;
}

interface PersonalityProfile {
  bigThree: {
    sun: { sign: string; element: string; modality: string };
    moon: { sign: string; element: string; modality: string };
    ascendant: { sign: string; element: string; modality: string };
  };
  elements: ElementDistribution;
  modalities: ModalityDistribution;
  dominantElement: string;
  dominantModality: string;
  strengths: string[];
  challenges: string[];
  lifePurpose: string;
}

function calculateElementDistribution(chart: any): ElementDistribution {
  const distribution: ElementDistribution = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };

  // Conta todos os planetas pessoais e pontos importantes
  const importantPlanets = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Ascendant",
    "Midheaven",
  ];

  for (const planet of importantPlanets) {
    const planetData = chart.planets[planet] || chart.houses?.Ascendant;
    if (planetData && planetData.sign) {
      const element = signElements[planetData.sign];
      if (element) {
        distribution[element as keyof ElementDistribution]++;
      }
    }
  }

  return distribution;
}

function calculateModalityDistribution(chart: any): ModalityDistribution {
  const distribution: ModalityDistribution = {
    Cardinal: 0,
    Fixed: 0,
    Mutable: 0,
  };

  const importantPlanets = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Ascendant",
  ];

  for (const planet of importantPlanets) {
    const planetData = chart.planets[planet] || chart.houses?.Ascendant;
    if (planetData && planetData.sign) {
      const modality = signModalities[planetData.sign];
      if (modality) {
        distribution[modality as keyof ModalityDistribution]++;
      }
    }
  }

  return distribution;
}

function getDominantElement(distribution: ElementDistribution): string {
  return Object.entries(distribution).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
}

function getDominantModality(distribution: ModalityDistribution): string {
  return Object.entries(distribution).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
}

function analyzeStrengths(profile: PersonalityProfile): string[] {
  const strengths: string[] = [];

  // Análise baseada no elemento dominante
  switch (profile.dominantElement) {
    case "Fire":
      strengths.push("Entusiasmo natural e energia contagiante");
      strengths.push("Coragem para iniciar novos projetos");
      strengths.push("Capacidade de inspirar e liderar outros");
      break;
    case "Earth":
      strengths.push("Praticidade e senso de realidade");
      strengths.push("Persistência e confiabilidade");
      strengths.push("Habilidade para construir bases sólidas");
      break;
    case "Air":
      strengths.push("Mente ágil e comunicação clara");
      strengths.push("Capacidade de análise objetiva");
      strengths.push("Versatilidade e adaptabilidade social");
      break;
    case "Water":
      strengths.push("Profunda intuição e empatia");
      strengths.push("Sensibilidade emocional refinada");
      strengths.push("Capacidade de cura e transformação");
      break;
  }

  // Análise baseada na modalidade dominante
  switch (profile.dominantModality) {
    case "Cardinal":
      strengths.push("Iniciativa e capacidade de começar projetos");
      strengths.push("Liderança natural em situações novas");
      break;
    case "Fixed":
      strengths.push("Determinação e foco inabalável");
      strengths.push("Lealdade e constância nos relacionamentos");
      break;
    case "Mutable":
      strengths.push("Flexibilidade e adaptabilidade");
      strengths.push("Capacidade de ver múltiplas perspectivas");
      break;
  }

  return strengths;
}

function analyzeChallenges(profile: PersonalityProfile): string[] {
  const challenges: string[] = [];

  // Desafios baseados no elemento dominante
  switch (profile.dominantElement) {
    case "Fire":
      challenges.push("Impulsividade e falta de planejamento");
      challenges.push("Impaciência com processos lentos");
      break;
    case "Earth":
      challenges.push("Resistência a mudanças e novidades");
      challenges.push("Tendência ao materialismo excessivo");
      break;
    case "Air":
      challenges.push("Dificuldade em conectar com emoções");
      challenges.push("Dispersão mental e falta de foco");
      break;
    case "Water":
      challenges.push("Vulnerabilidade a absorver emoções alheias");
      challenges.push("Tendência à melancolia ou escapismo");
      break;
  }

  // Análise de elementos fracos
  const weakElements = Object.entries(profile.elements)
    .filter(([_, count]) => count <= 1)
    .map(([element, _]) => element);

  if (weakElements.includes("Fire")) {
    challenges.push("Desenvolver mais iniciativa e autoconfiança");
  }
  if (weakElements.includes("Earth")) {
    challenges.push("Cultivar praticidade e disciplina");
  }
  if (weakElements.includes("Air")) {
    challenges.push("Melhorar comunicação e pensamento lógico");
  }
  if (weakElements.includes("Water")) {
    challenges.push("Conectar-se mais profundamente com emoções");
  }

  return challenges;
}

function analyzeLifePurpose(profile: PersonalityProfile): string {
  const { sun, moon } = profile.bigThree;

  // Combinação Sol-Lua para propósito de vida
  if (sun.element === moon.element) {
    return `Seu propósito é integrar e expressar plenamente as qualidades de ${sun.element}, trazendo sua essência autêntica ao mundo.`;
  }

  if (sun.element === "Fire" && moon.element === "Water") {
    return "Seu propósito é equilibrar paixão com compaixão, usando sua energia para curar e inspirar emocionalmente os outros.";
  }

  if (sun.element === "Earth" && moon.element === "Air") {
    return "Seu propósito é manifestar ideias no mundo físico, construindo estruturas que comunicam e conectam pessoas.";
  }

  if (sun.element === "Air" && moon.element === "Earth") {
    return "Seu propósito é dar forma prática às suas ideias, criando sistemas que beneficiem a sociedade de forma tangível.";
  }

  if (sun.element === "Water" && moon.element === "Fire") {
    return "Seu propósito é transformar emoções profundas em ação criativa, inspirando outros através da sua jornada de cura.";
  }

  // Propósito baseado no elemento dominante
  switch (profile.dominantElement) {
    case "Fire":
      return "Seu propósito é inspirar e liderar, iluminando o caminho para outros através da sua coragem e entusiasmo.";
    case "Earth":
      return "Seu propósito é construir e estabilizar, criando bases sólidas que sustentam o crescimento de si mesma e dos outros.";
    case "Air":
      return "Seu propósito é comunicar e conectar, sendo uma ponte entre ideias e pessoas, facilitando o entendimento.";
    case "Water":
      return "Seu propósito é nutrir e transformar, usando sua sensibilidade para curar feridas emocionais profundas.";
    default:
      return "Seu propósito está em equilibrar e integrar as diferentes dimensões da sua personalidade única.";
  }
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

    // Gera mapa natal
    const chart = await astrologerService.generateBirthChart({
      year: birthData.year,
      month: birthData.month,
      day: birthData.day,
      hour: birthData.hour,
      minute: birthData.minute,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      city: birthData.city,
      nation: birthData.nation,
      timezone: birthData.timezone,
      name: birthData.name,
    });

    // Extrai Big 3
    const sun = chart.planets.Sun;
    const moon = chart.planets.Moon;
    const ascendant = chart.houses?.Ascendant || chart.planets.Ascendant;

    const bigThree = {
      sun: {
        sign: sun.sign,
        element: signElements[sun.sign],
        modality: signModalities[sun.sign],
      },
      moon: {
        sign: moon.sign,
        element: signElements[moon.sign],
        modality: signModalities[moon.sign],
      },
      ascendant: {
        sign: ascendant.sign,
        element: signElements[ascendant.sign],
        modality: signModalities[ascendant.sign],
      },
    };

    // Calcula distribuições
    const elements = calculateElementDistribution(chart);
    const modalities = calculateModalityDistribution(chart);
    const dominantElement = getDominantElement(elements);
    const dominantModality = getDominantModality(modalities);

    // Monta perfil de personalidade
    const profile: PersonalityProfile = {
      bigThree,
      elements,
      modalities,
      dominantElement,
      dominantModality,
      strengths: [],
      challenges: [],
      lifePurpose: "",
    };

    profile.strengths = analyzeStrengths(profile);
    profile.challenges = analyzeChallenges(profile);
    profile.lifePurpose = analyzeLifePurpose(profile);

    // Gera interpretação com IA
    const aiPrompt = `Você é uma astróloga especializada em análise de personalidade. Analise este mapa natal e crie uma interpretação profunda e personalizada para uma mulher brasileira interessada em autoconhecimento:

**Dados do Mapa Natal:**
- Sol em ${bigThree.sun.sign} (${bigThree.sun.element}, ${bigThree.sun.modality})
- Lua em ${bigThree.moon.sign} (${bigThree.moon.element}, ${bigThree.moon.modality})
- Ascendente em ${bigThree.ascendant.sign} (${bigThree.ascendant.element}, ${bigThree.ascendant.modality})

**Distribuição de Elementos:**
- Fogo: ${elements.Fire} planetas
- Terra: ${elements.Earth} planetas
- Ar: ${elements.Air} planetas
- Água: ${elements.Water} planetas

**Elemento Dominante:** ${dominantElement}
**Modalidade Dominante:** ${dominantModality}

Crie uma análise em português brasileiro com os seguintes tópicos:

1. **Essência da Personalidade** (2-3 parágrafos): Como o Sol, Lua e Ascendente se combinam para formar sua identidade única
2. **Dons Naturais** (1 parágrafo): Talentos e qualidades inatas baseadas nos elementos
3. **Áreas de Crescimento** (1 parágrafo): Desafios para evoluir como pessoa
4. **Relacionamentos** (1 parágrafo): Como você se conecta com outros
5. **Caminho de Realização** (1 parágrafo): Sugestões para expressar seu potencial máximo

Use linguagem acolhedora, inspiradora e empoderadora. Seja específica e evite generalidades.`;

    let aiInterpretation = "";

    try {
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Você é uma astróloga experiente especializada em análise de personalidade através do mapa natal. Forneça interpretações profundas, compassivas e empoderadoras.",
          },
          {
            role: "user",
            content: aiPrompt,
          },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 1200,
      });

      aiInterpretation =
        chatCompletion.choices[0]?.message?.content ||
        "Análise astrológica não disponível no momento.";
    } catch (error) {
      console.error("Erro ao gerar interpretação com Groq:", error);
      aiInterpretation = `Sua combinação única de Sol em ${bigThree.sun.sign}, Lua em ${bigThree.moon.sign} e Ascendente em ${bigThree.ascendant.sign} cria uma personalidade fascinante e multifacetada. Esta é uma análise básica - para insights mais profundos, tente novamente.`;
    }

    return NextResponse.json({
      success: true,
      profile,
      interpretation: aiInterpretation,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de personalidade:", error);
    return NextResponse.json(
      { error: "Erro ao processar dados astrológicos" },
      { status: 500 }
    );
  }
}
