import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/middleware";
import { supabase } from "@/lib/supabase";

async function handler(req: AuthRequest) {
  try {
    const userId = req.userId!;

    const { data: readings, error } = await supabase
      .from("tarot_readings")
      .select(
        "id, deck_type, spread_type, cards, interpretation, is_premium, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

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
