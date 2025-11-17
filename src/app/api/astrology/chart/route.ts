import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { astroSeekService } from "@/lib/astroseek";

async function handler(req: AuthRequest) {
  try {
    const userId = req.userId!;

    // Buscar usuário com dados de nascimento
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { birthChart: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (!user.birthDate || !user.birthTime || !user.birthLocation) {
      return NextResponse.json(
        {
          error:
            "Dados de nascimento incompletos. Por favor, atualize seu perfil.",
        },
        { status: 400 }
      );
    }

    // Se já existe mapa astral recente (menos de 30 dias), retornar
    if (user.birthChart) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (user.birthChart.generatedAt > thirtyDaysAgo) {
        return NextResponse.json({
          birthChart: user.birthChart.chartData,
          transits: user.birthChart.transits,
          generatedAt: user.birthChart.generatedAt,
        });
      }
    }

    // Gerar novo mapa astral
    // NOTA: Implementar geocoding para converter birthLocation em lat/long
    const [year, month, day] = user.birthDate
      .toISOString()
      .split("T")[0]
      .split("-");
    const [hour, minute] = user.birthTime.split(":");

    const birthData = {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      minute: parseInt(minute),
      latitude: -23.5505, // Exemplo: São Paulo (implementar geocoding)
      longitude: -46.6333,
      city: user.birthLocation?.split(",")[0] || "Unknown",
      nation: user.birthLocation?.split(",")[1]?.trim() || "BR",
      timezone: "America/Sao_Paulo",
      name: user.name || "User",
    };

    const chartData = await astroSeekService.generateBirthChart(birthData);
    const transits = await astroSeekService.getTransits(birthData);

    // Salvar ou atualizar mapa astral
    const birthChart = await prisma.birthChart.upsert({
      where: { userId },
      create: {
        userId,
        chartData: chartData as any,
        transits: transits as any,
      },
      update: {
        chartData: chartData as any,
        transits: transits as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      birthChart: birthChart.chartData,
      transits: birthChart.transits,
      generatedAt: birthChart.generatedAt,
    });
  } catch (error) {
    console.error("Erro ao gerar mapa astral:", error);
    return NextResponse.json(
      { error: "Erro ao gerar mapa astral" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
