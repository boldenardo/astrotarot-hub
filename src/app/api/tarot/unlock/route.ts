import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/middleware";
import { supabase } from "@/lib/supabase";
import { groqService } from "@/lib/groq";
import { astroSeekService } from "@/lib/astroseek";

async function handler(req: AuthRequest) {
  try {
    const { readingId } = await req.json();
    const userId = req.userId!;

    // Buscar tiragem
    const { data: reading, error: readingError } = await supabase
      .from("tarot_readings")
      .select("*, users(*, birth_charts(*))")
      .eq("id", readingId)
      .single();

    if (readingError || !reading || reading.user_id !== userId) {
      return NextResponse.json(
        { error: "Tiragem não encontrada" },
        { status: 404 }
      );
    }

    if (reading.is_premium && reading.interpretation) {
      return NextResponse.json({ interpretation: reading.interpretation });
    }

    // Verificar se usuário pagou por esta tiragem
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("reading_id", readingId)
      .eq("status", "COMPLETED")
      .single();

    const hasPaidForReading = !!payment;

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
    const birthCharts = reading.users?.birth_charts;
    if (birthCharts && birthCharts.length > 0) {
      const firstCard = cards[0];
      astrologicalContext = await astroSeekService.crossReferenceWithTarot(
        firstCard.cardName,
        firstCard.keywords,
        birthCharts[0].chart_data as any
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
      reading.spread_type,
      astrologicalContext
    );

    // Atualizar tiragem com interpretação
    await supabase
      .from("tarot_readings")
      .update({
        interpretation,
        astrological_integration: astrologicalContext
          ? { context: astrologicalContext }
          : null,
        is_premium: true,
      })
      .eq("id", readingId);

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
