// POST /api/affiliate/click — registra um clique de indicação.
// Público por natureza (o visitante ainda não tem conta), mas escreve
// apenas em affiliate_clicks e só aceita códigos que existem e estão
// ativos — não há como criar afiliado nem inflar receita por aqui.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { normalizeCode } from "@/lib/affiliate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    code?: string;
    visitorId?: string;
    landingPath?: string;
    referrer?: string | null;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const code = normalizeCode(body.code);
  const visitorId = (body.visitorId ?? "").trim().slice(0, 64);
  if (!code || !visitorId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();

    const { data: affiliate } = await admin
      .from("affiliates")
      .select("code")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();

    // Código inexistente/inativo: responde 200 para não virar oráculo de
    // enumeração de códigos, mas não grava nada.
    if (!affiliate) return NextResponse.json({ ok: true });

    const { error } = await admin.from("affiliate_clicks").insert({
      code,
      visitor_id: visitorId,
      landing_path: (body.landingPath ?? "").slice(0, 200) || null,
      referrer: (body.referrer ?? "")?.slice(0, 300) || null,
    });
    // 23505 = mesmo visitante já contado para este código: tudo certo.
    if (error && (error as { code?: string }).code !== "23505") {
      console.error("[affiliate/click] insert falhou:", error);
    }
  } catch (e) {
    console.error("[affiliate/click] erro:", e);
  }

  return NextResponse.json({ ok: true });
}
