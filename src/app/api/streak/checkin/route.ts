// POST /api/streak/checkin — registra a visita do dia e devolve o estado.
// Chamado uma vez quando o dashboard monta. Idempotente por dia: a
// função SQL record_checkin usa UNIQUE (user_id, checkin_date), então
// abrir o app dez vezes hoje conta uma.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { pendingRewards, nextMilestone, pickMessage } from "@/lib/streak-rewards";

export const runtime = "nodejs";

export async function POST() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("record_checkin", {
    p_user_id: profile.id,
  });

  if (error) {
    console.error("[streak/checkin] record_checkin falhou:", error);
    // Streak nunca pode quebrar o dashboard: devolve estado neutro.
    return NextResponse.json({
      currentStreak: 0,
      longestStreak: 0,
      points: 0,
      isNewCheckin: false,
      rewards: [],
      next: null,
      message: null,
    });
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        current_streak: number;
        longest_streak: number;
        points_total: number;
        claimed_milestones: number[];
        is_new_checkin: boolean;
      }
    | undefined;

  const current = row?.current_streak ?? 0;
  const claimed = row?.claimed_milestones ?? [];
  const rewards = pendingRewards(current, claimed);

  return NextResponse.json({
    currentStreak: current,
    longestStreak: row?.longest_streak ?? 0,
    points: row?.points_total ?? 0,
    isNewCheckin: row?.is_new_checkin ?? false,
    rewards,
    next: nextMilestone(current),
    // Mensagem do dia: estável por pessoa e por dia, sem custo de IA.
    message: pickMessage(
      `${profile.id}-${new Date().toISOString().slice(0, 10)}`
    ),
  });
}
