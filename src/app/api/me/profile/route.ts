// POST /api/me/profile — atualiza nome + dados de nascimento e invalida o
// cache do mapa astral (força regeneração com os novos dados).

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() : undefined;
}

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: Record<string, string> = {};
  for (const key of ["name", "birth_date", "birth_time", "birth_location"]) {
    const value = str(body[key]);
    if (value !== undefined) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("users")
    .update(updates)
    .eq("id", gate.profile.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save profile." },
      { status: 500 }
    );
  }

  // Invalida o mapa astral em cache para regenerar com os novos dados.
  await admin.from("birth_charts").delete().eq("user_id", gate.profile.id);

  return NextResponse.json({ profile: data });
}
