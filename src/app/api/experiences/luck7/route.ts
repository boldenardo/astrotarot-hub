// /api/experiences/luck7 — progresso do Ritual dos 7 Dias da Sorte.
//
// POST { day: 1..7, intention?, note? } — registra o check-in do dia em
// `experiences` (kind "ritual", subtype "luck7-day-<n>"). Idempotente por
// usuário+dia. NÃO consome crédito: crédito é para leituras da Aura (os
// dias 1 e 7 chamam /api/experiences/ritual normalmente); marcar presença
// não é uma leitura.
//
// GET — devolve os dias completados, para o progresso sobreviver à troca
// de aparelho (o localStorage é só o cache local).

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  try {
    const { data } = await getSupabaseAdmin()
      .from("experiences")
      .select("subtype, created_at")
      .eq("user_id", gate.profile.id)
      .eq("kind", "ritual")
      .like("subtype", "luck7-day-%");
    const done: Record<string, string> = {};
    for (const row of data ?? []) {
      const day = String(row.subtype).replace("luck7-day-", "");
      if (/^[1-7]$/.test(day)) done[day] = String(row.created_at).slice(0, 10);
    }
    return NextResponse.json({ done });
  } catch {
    return NextResponse.json({ done: {} });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  let body: { day?: number; intention?: string; note?: string } = {};
  try {
    body = await req.json();
  } catch {
    // tratado abaixo
  }
  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    return NextResponse.json({ error: "Invalid day." }, { status: 400 });
  }
  const subtype = `luck7-day-${day}`;
  const intention =
    typeof body.intention === "string" ? body.intention.slice(0, 40) : undefined;
  const note = typeof body.note === "string" ? body.note.slice(0, 280) : undefined;

  try {
    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from("experiences")
      .select("id")
      .eq("user_id", profile.id)
      .eq("kind", "ritual")
      .eq("subtype", subtype)
      .limit(1)
      .maybeSingle();
    if (!existing) {
      await admin.from("experiences").insert({
        user_id: profile.id,
        kind: "ritual",
        subtype,
        input: { day, ...(intention ? { intention } : {}) },
        result: { readingType: "luck7-checkin", day, ...(note ? { note } : {}) },
        completed_at: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true, day });
  } catch (e) {
    console.warn("[luck7] check-in não persistiu:", e);
    // Best-effort: o dia conta mesmo assim (localStorage segura o progresso).
    return NextResponse.json({ ok: true, day, persisted: false });
  }
}
