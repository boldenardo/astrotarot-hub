import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/middleware";
import { supabase } from "@/lib/supabase";
import { astroSeekService } from "@/lib/astroseek";

async function handler(req: AuthRequest) {
  try {
    const userId = req.userId!;

    // Buscar usuário com dados de nascimento
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, birth_charts(*)")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (!user.birth_date || !user.birth_time || !user.birth_location) {
      return NextResponse.json(
        {
          error:
            "Dados de nascimento incompletos. Por favor, atualize seu perfil.",
        },
        { status: 400 }
      );
    }

    // Se já existe mapa astral recente (menos de 30 dias), retornar
    const birthCharts = user.birth_charts;
    if (birthCharts && birthCharts.length > 0) {
      const birthChart = birthCharts[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (new Date(birthChart.generated_at) > thirtyDaysAgo) {
        return NextResponse.json({
          birthChart: birthChart.chart_data,
          transits: birthChart.transits,
          generatedAt: birthChart.generated_at,
        });
      }
    }

    // Gerar novo mapa astral
    // NOTA: Implementar geocoding para converter birthLocation em lat/long
    const [year, month, day] = user.birth_date
      .split("T")[0]
      .split("-");
    const [hour, minute] = user.birth_time.split(":");

    const birthData = {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      minute: parseInt(minute),
      latitude: -23.5505, // Exemplo: São Paulo (implementar geocoding)
      longitude: -46.6333,
      city: user.birth_location?.split(",")[0] || "Unknown",
      nation: user.birth_location?.split(",")[1]?.trim() || "BR",
      timezone: "America/Sao_Paulo",
      name: user.name || "User",
    };

    const chartData = await astroSeekService.generateBirthChart(birthData);
    const transits = await astroSeekService.getTransits(birthData);

    // Verificar se já existe mapa astral
    const existingChart = birthCharts && birthCharts.length > 0 ? birthCharts[0] : null;

    let birthChart;
    if (existingChart) {
      // Atualizar
      const { data, error } = await supabase
        .from("birth_charts")
        .update({
          chart_data: chartData,
          transits: transits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingChart.id)
        .select()
        .single();
      
      if (error) throw error;
      birthChart = data;
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from("birth_charts")
        .insert({
          user_id: userId,
          birth_date: user.birth_date,
          birth_time: user.birth_time,
          birth_location: user.birth_location,
          chart_data: chartData,
          transits: transits,
        })
        .select()
        .single();
      
      if (error) throw error;
      birthChart = data;
    }

    return NextResponse.json({
      birthChart: birthChart.chart_data,
      transits: birthChart.transits,
      generatedAt: birthChart.generated_at,
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
