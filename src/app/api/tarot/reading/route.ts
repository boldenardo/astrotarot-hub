import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import {
  RIDER_WAITE_DECK,
  EGYPTIAN_DECK,
  SPREAD_TYPES,
} from "@/lib/tarot-data";
import { z } from "zod";

const readingSchema = z.object({
  deckType: z.enum(["NORMAL", "EGIPCIO"]),
  spreadType: z.enum(["SINGLE", "THREE_CARD", "CELTIC_CROSS"]),
});

// Função para embaralhar e selecionar cartas
function drawCards(deckType: "NORMAL" | "EGIPCIO", spreadType: string): any[] {
  const deck = deckType === "NORMAL" ? RIDER_WAITE_DECK : EGYPTIAN_DECK;
  const spreadConfig = SPREAD_TYPES[spreadType as keyof typeof SPREAD_TYPES];
  const numCards = spreadConfig.positions.length;

  // Embaralhar deck (Fisher-Yates shuffle)
  const shuffled = [...deck].sort(() => Math.random() - 0.5);

  // Selecionar cartas
  return shuffled.slice(0, numCards).map((card, index) => ({
    cardName: card.name,
    cardNameEn: card.nameEn,
    position: index + 1,
    positionName: spreadConfig.positions[index],
    upright: Math.random() > 0.5, // 50% chance de carta invertida
    keywords: card.keywords,
    imageUrl: card.imageUrl,
  }));
}

// Gerar teaser (interpretação parcial)
function generateTeaser(cards: any[]): string {
  const card = cards[0];
  return `A carta ${card.cardName} apareceu na posição ${
    card.positionName
  }. Esta carta simboliza ${card.keywords.join(
    ", "
  )}... [Premium: Desbloqueie a interpretação completa com análise astrológica personalizada]`;
}

async function handler(req: AuthRequest) {
  try {
    const body = await req.json();
    const validatedData = readingSchema.parse(body);
    const userId = req.userId!;

    // Verificar se usuário é premium
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const isPremium = user?.subscription?.status === "active";

    // Sortear cartas
    const cards = drawCards(validatedData.deckType, validatedData.spreadType);

    // Salvar tiragem
    const reading = await prisma.tarotReading.create({
      data: {
        userId,
        deckType: validatedData.deckType,
        spreadType: validatedData.spreadType,
        cards: cards,
        interpretation: isPremium ? null : generateTeaser(cards), // Teaser se não premium
        isPremium: isPremium,
      },
    });

    return NextResponse.json({
      reading: {
        id: reading.id,
        cards,
        isPremium,
        interpretation: reading.interpretation,
        needsPayment: !isPremium,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro ao criar tiragem:", error);
    return NextResponse.json(
      { error: "Erro ao criar tiragem" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
