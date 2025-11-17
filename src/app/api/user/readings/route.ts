import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handler(req: AuthRequest) {
  try {
    const userId = req.userId!;

    const readings = await prisma.tarotReading.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        deckType: true,
        spreadType: true,
        cards: true,
        interpretation: true,
        isPremium: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ readings });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
