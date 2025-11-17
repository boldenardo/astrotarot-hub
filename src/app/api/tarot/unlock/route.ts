import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { groqService } from "@/lib/groq";
import { astroSeekService } from "@/lib/astroseek";

async function handler(req: AuthRequest) {
  try {
    const { readingId } = await req.json();
    const userId = req.userId!;

    // Buscar tiragem
    const reading = await prisma.tarotReading.findUnique({
      where: { id: readingId },
      include: { user: { include: { birthChart: true } } },
    });

    if (!reading || reading.userId !== userId) {
      return NextResponse.json(
        { error: "Tiragem não encontrada" },
        { status: 404 }
      );
    }

    if (reading.isPremium && reading.interpretation) {
      return NextResponse.json({ interpretation: reading.interpretation });
    }

    // Verificar se usuário pagou por esta tiragem
    const hasPaidForReading = await prisma.payment.findFirst({
      where: {
        userId,
        readingId,
        status: "COMPLETED",
      },
    });

    if (!hasPaidForReading) {
      return NextResponse.json(
        {
          error: "Pagamento necessário para desbloquear interpretação completa",
        },
        { status: 402 }
      );
    }

    // Gerar interpretação completa com IA
    const cards = reading.cards as Array<{
      cardName: string;
      position: string;
      positionName: string;
      upright: boolean;
      keywords: string[];
    }>;

    let astrologicalContext = "";

    // Se usuário tem mapa astral, integrar
    if (reading.user.birthChart) {
      const firstCard = cards[0];
      astrologicalContext = await astroSeekService.crossReferenceWithTarot(
        firstCard.cardName,
        firstCard.keywords,
        reading.user.birthChart.chartData as any
      );
    }

    // Gerar interpretação com Groq
    const interpretation = await groqService.generateFullReading(
      cards.map((card) => ({
        cardName: card.cardName,
        position: card.positionName,
        isUpright: card.upright,
        keywords: card.keywords,
      })),
      reading.spreadType,
      astrologicalContext
    );

    // Atualizar tiragem com interpretação
    await prisma.tarotReading.update({
      where: { id: readingId },
      data: {
        interpretation,
        astrologicalIntegration: astrologicalContext
          ? { context: astrologicalContext }
          : null,
        isPremium: true,
      },
    });

    return NextResponse.json({
      interpretation,
      astrologicalContext: astrologicalContext || null,
    });
  } catch (error) {
    console.error("Erro ao desbloquear interpretação:", error);
    return NextResponse.json(
      { error: "Erro ao processar interpretação" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
