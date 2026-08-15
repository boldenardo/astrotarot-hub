// POST /api/quiz/lead — persiste o lead do funil de quiz no servidor.
// Público por natureza (o visitante não tem conta), mas só escreve na
// tabela leads, com upsert idempotente por email — re-submits atualizam
// respostas/score em vez de duplicar. Sem esta rota, o email capturado
// no quiz morre no localStorage de quem não compra na hora.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { normalizeCode } from "@/lib/affiliate";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SCORES = new Set(["LOW", "MEDIUM", "HIGH"]);
const MAX_ANSWERS_BYTES = 2048;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    name?: string;
    birthDate?: string;
    sign?: string;
    score?: string;
    answers?: Record<string, string>;
    visitorId?: string;
    ref?: string | null;
    src?: string | null;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = (body.email ?? "").toLowerCase().trim().slice(0, 254);
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // answers: só pares string→string, com teto de tamanho serializado.
  let answers: Record<string, string> | null = null;
  if (body.answers && typeof body.answers === "object") {
    const entries = Object.entries(body.answers)
      .filter(([k, v]) => typeof k === "string" && typeof v === "string")
      .map(([k, v]) => [k.slice(0, 64), v.slice(0, 200)] as const);
    const candidate = Object.fromEntries(entries);
    if (JSON.stringify(candidate).length <= MAX_ANSWERS_BYTES) {
      answers = candidate;
    }
  }

  const birthDate = cleanText(body.birthDate, 10);
  const score = cleanText(body.score, 10)?.toUpperCase() ?? null;

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("leads").upsert(
      {
        email,
        name: cleanText(body.name, 100),
        birth_date: birthDate && DATE_RE.test(birthDate) ? birthDate : null,
        sign: cleanText(body.sign, 20),
        score: score && SCORES.has(score) ? score : null,
        answers,
        visitor_id: cleanText(body.visitorId, 64),
        affiliate_code: normalizeCode(body.ref ?? undefined),
        source: "quiz",
        source_platform: cleanText(body.src, 20),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    if (error) {
      console.error("[quiz/lead] upsert falhou:", error);
    }
  } catch (e) {
    console.error("[quiz/lead] erro:", e);
  }

  // Sempre 200: o funil nunca pode travar por causa da captura de lead.
  return NextResponse.json({ ok: true });
}
