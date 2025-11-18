import { NextRequest, NextResponse } from "next/server";
import { EGYPTIAN_DECK, RIDER_WAITE_DECK } from "@/lib/tarot-data";
import Groq from "groq-sdk";

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cards, deckType, question, spreadType } = body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "É necessário fornecer as cartas sorteadas" },
        { status: 400 }
      );
    }

    // Seleciona o deck apropriado
    const deck = deckType === "EGYPTIAN" ? EGYPTIAN_DECK : RIDER_WAITE_DECK;

    // Busca informações completas das cartas
    const cardDetails = cards.map((c: any) => {
      const cardData = deck.find((dc) => dc.name === c.name || dc.id === c.id);
      return {
        position: c.position,
        name: c.name,
        upright: cardData?.upright || [],
        keywords: cardData?.keywords || [],
      };
    });

    // Monta o prompt para a IA
    const prompt = `Você é um mestre tarólogo especialista em Tarot Egípcio, com profundo conhecimento da Kábala e dos ensinamentos de Samael Aun Weor.

TIRAGEM REALIZADA:
${cardDetails
  .map(
    (card: any, idx: number) =>
      `${idx + 1}. ${card.position}: ${card.name}
   Significados: ${card.upright.join(", ")}
   Palavras-chave: ${card.keywords.join(", ")}`
  )
  .join("\n\n")}

${question ? `PERGUNTA DO CONSULENTE: ${question}\n` : ""}

Como um sábio tarólogo egípcio, forneça uma interpretação profunda, mística e personalizada desta tiragem. 

IMPORTANTE:
- Use linguagem poética e mística, mas clara e acessível
- Conecte as cartas entre si, mostrando a narrativa completa
- Relacione com a sabedoria ancestral do Egito quando apropriado
- Seja específico sobre cada posição e seu significado
- Termine com um conselho prático e encorajador
- Escreva em português do Brasil
- Use aproximadamente 300-500 palavras

Comece sua interpretação:`;

    // Gera interpretação com Groq
    let interpretation = "";

    try {
      const groqClient = getGroqClient();
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Você é uma taróloga experiente especializada no Tarot Egípcio. Forneça interpretações profundas, compassivas e acionáveis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.8,
        max_tokens: 800,
      });

      interpretation =
        chatCompletion.choices[0]?.message?.content ||
        "Interpretação não disponível no momento.";
    } catch (error) {
      console.error("Erro ao gerar interpretação:", error);
      interpretation =
        "As cartas revelam mensagens importantes para você. Confie em sua intuição para compreender os sinais.";
    }

    return NextResponse.json({
      success: true,
      interpretation,
      cards: cardDetails,
      deckType,
    });
  } catch (error: any) {
    console.error("Erro ao interpretar tiragem:", error);

    // Fallback com interpretação genérica
    return NextResponse.json({
      success: true,
      interpretation: `✨ As cartas revelam uma jornada de transformação profunda. Cada carta nesta tiragem carrega mensagens ancestrais do Tarot Egípcio, guiando você através dos mistérios que conectam o passado, presente e futuro.

🔮 Esta configuração de cartas sugere que você está em um momento de transição significativa. As energias cósmicas apontam para um período de crescimento pessoal e descobertas importantes sobre si mesmo.

💫 Observe especialmente a primeira e a última carta - elas formam um arco narrativo que revela sua jornada atual. As cartas centrais mostram o caminho que você deve seguir.

🌟 CONSELHO: Confie em sua intuição e permaneça aberto aos sinais que o universo está lhe enviando. A sabedoria dos antigos egípcios nos ensina que cada momento contém sementes do futuro que desejamos criar.

Que as bênçãos dos deuses egípcios iluminem seu caminho! 🙏✨`,
    });
  }
}
