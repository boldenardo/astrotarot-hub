import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export class GroqService {
  private client: Groq | null = null;

  constructor() {
    if (GROQ_API_KEY) {
      this.client = new Groq({
        apiKey: GROQ_API_KEY,
      });
    }
  }

  async generateInterpretation(
    cardName: string,
    position: string,
    isUpright: boolean,
    keywords: string[],
    astrologicalContext?: string,
    userQuestion?: string
  ): Promise<string> {
    if (!this.client) {
      return this.getMockInterpretation(
        cardName,
        position,
        isUpright,
        keywords
      );
    }

    try {
      const prompt = this.buildPrompt(
        cardName,
        position,
        isUpright,
        keywords,
        astrologicalContext,
        userQuestion
      );

      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Você é um tarólogo experiente com conhecimento profundo de astrologia. Forneça interpretações precisas, compassivas e acionáveis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 500,
      });

      return (
        chatCompletion.choices[0]?.message?.content ||
        this.getMockInterpretation(cardName, position, isUpright, keywords)
      );
    } catch (error) {
      console.error("Erro ao gerar interpretação com Groq:", error);
      return this.getMockInterpretation(
        cardName,
        position,
        isUpright,
        keywords
      );
    }
  }

  async generateFullReading(
    cards: Array<{
      cardName: string;
      position: string;
      isUpright: boolean;
      keywords: string[];
    }>,
    spreadType: string,
    astrologicalContext?: string
  ): Promise<string> {
    if (!this.client) {
      return this.getMockFullReading(cards, spreadType);
    }

    try {
      const cardsDescription = cards
        .map(
          (card, index) =>
            `${index + 1}. ${card.cardName} (${
              card.isUpright ? "Normal" : "Invertida"
            }) na posição "${card.position}": ${card.keywords.join(", ")}`
        )
        .join("\n");

      const prompt = `Analise esta tiragem de tarot completa (${spreadType}):

${cardsDescription}

${astrologicalContext ? `\nContexto Astrológico:\n${astrologicalContext}` : ""}

Forneça uma interpretação holística de 300-400 palavras que:
1. Conecte as cartas entre si
2. Identifique padrões e temas principais
3. Ofereça insights práticos e acionáveis
4. Integre o contexto astrológico se fornecido
5. Seja compassivo mas honesto

Use uma linguagem acessível e inspiradora.`;

      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Você é um tarólogo mestre especializado em leituras holísticas que integram tarot e astrologia.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 800,
      });

      return (
        chatCompletion.choices[0]?.message?.content ||
        this.getMockFullReading(cards, spreadType)
      );
    } catch (error) {
      console.error("Erro ao gerar leitura completa:", error);
      return this.getMockFullReading(cards, spreadType);
    }
  }

  private buildPrompt(
    cardName: string,
    position: string,
    isUpright: boolean,
    keywords: string[],
    astrologicalContext?: string,
    userQuestion?: string
  ): string {
    let prompt = `Interprete a carta de tarot "${cardName}" ${
      isUpright ? "em posição normal" : "invertida"
    } na posição "${position}".

Palavras-chave: ${keywords.join(", ")}

${userQuestion ? `\nPergunta do consulente: ${userQuestion}` : ""}

${astrologicalContext ? `\nContexto Astrológico: ${astrologicalContext}` : ""}

Forneça uma interpretação de 150-200 palavras que seja:
- Específica para a posição na tiragem
- Compassiva mas honesta
- Prática e acionável
- Integrando o contexto astrológico se fornecido

Use linguagem acessível e inspiradora.`;

    return prompt;
  }

  private getMockInterpretation(
    cardName: string,
    position: string,
    isUpright: boolean,
    keywords: string[]
  ): string {
    return `A carta ${cardName} ${
      isUpright ? "" : "invertida "
    }na posição ${position} traz uma mensagem poderosa sobre ${keywords.join(
      ", "
    )}. 

${
  isUpright
    ? `Esta carta sugere que você está em um momento propício para abraçar ${keywords[0]}. As energias estão alinhadas para que você possa manifestar seus objetivos relacionados a este tema.`
    : `A posição invertida indica que pode haver bloqueios ou desafios relacionados a ${keywords[0]}. É um convite para examinar o que está impedindo seu progresso nesta área.`
}

Considere como ${
      keywords[1] || keywords[0]
    } está se manifestando em sua vida no momento. Esta carta o encoraja a ${
      isUpright
        ? "seguir em frente com confiança"
        : "refletir sobre ajustes necessários"
    } em seu caminho.

Confie em sua intuição e permita que esta mensagem ressoe com sua situação atual.`;
  }

  private getMockFullReading(
    cards: Array<{
      cardName: string;
      position: string;
      isUpright: boolean;
      keywords: string[];
    }>,
    spreadType: string
  ): string {
    const cardsList = cards
      .map((c) => `${c.cardName} (${c.position})`)
      .join(", ");

    return `Sua tiragem de ${spreadType} revelou: ${cardsList}.

Esta combinação de cartas conta uma história profunda sobre seu momento atual. As energias presentes sugerem um período de transformação e crescimento pessoal.

${cards[0].cardName} na posição ${
      cards[0].position
    } estabelece o tom da leitura, indicando que ${
      cards[0].keywords[0]
    } é um tema central. ${
      cards[0].isUpright
        ? "A posição normal sugere que você está bem posicionado para trabalhar com essa energia."
        : "A inversão sugere atenção especial a possíveis bloqueios."
    }

${
  cards.length > 1
    ? `${cards[1].cardName} adiciona uma camada de ${cards[1].keywords[0]}, criando um diálogo interessante entre as cartas. Esta combinação sugere que você deve equilibrar diferentes aspectos de sua jornada.`
    : ""
}

${
  cards.length > 2
    ? `A presença de ${cards[2].cardName} completa o panorama, trazendo insights sobre ${cards[2].keywords[0]} e como isso se conecta com os temas anteriores.`
    : ""
}

Confie no processo e permita que essas mensagens guiem suas ações. O tarot não determina seu destino, mas ilumina caminhos possíveis. Use estes insights para tomar decisões alinhadas com seu maior bem.`;
  }
}

export const groqService = new GroqService();
