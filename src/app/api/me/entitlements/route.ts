// GET /api/me/entitlements — as features avulsas que ESTA conta possui.
//
// Alimenta o dashboard: os cards mostram "Owned" em vez de preço quando a
// pessoa já comprou a feature. Só nomes de feature — nada financeiro.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  try {
    const { data } = await getSupabaseAdmin()
      .from("user_entitlements")
      .select("feature")
      .eq("user_id", gate.profile.id)
      .eq("active", true);
    return NextResponse.json({
      features: (data ?? []).map((r) => String(r.feature)),
    });
  } catch {
    return NextResponse.json({ features: [] });
  }
}
