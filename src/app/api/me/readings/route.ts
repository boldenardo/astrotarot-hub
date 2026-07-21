// GET /api/me/readings?limit=5 — histórico de leituras de tarot do usuário.

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;

  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 20;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("tarot_readings")
    .select("id, cards, interpretation, spread_type, deck_type, is_premium, created_at")
    .eq("user_id", gate.profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "Could not load reading history." },
      { status: 500 }
    );
  }

  return NextResponse.json({ readings: data ?? [] });
}
