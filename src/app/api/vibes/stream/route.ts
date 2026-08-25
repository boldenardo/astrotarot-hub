// Vibes & Meditations — entrega do áudio.
//
// As faixas ficam num bucket PRIVADO: esta rota é a única porta de
// saída. Sem sessão → 401; sem o entitlement `vibes` (bump de $19 no
// checkout ou add-on de $9.99/mês) → 403. Quem tem direito recebe uma
// signed URL de curta duração — o caminho real no bucket nunca aparece
// no client nem vira link compartilhável permanente.
//
// Mesmo padrão do /api/soulmate (bucket privado + createSignedUrl).
//
// GET /api/vibes/stream?track=<id> → { url, expiresIn }

import { NextRequest, NextResponse } from "next/server";
import { requireUser, hasEntitlement } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { VIBE_TRACKS } from "@/lib/vibes-catalog";

export const runtime = "nodejs";

const BUCKET = "vibes";
const SIGNED_URL_TTL_S = 60 * 60; // 1h — cobre a faixa mais longa (70min toca sob a mesma URL já aberta)

export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;

  if (!(await hasEntitlement(gate.profile.id, "vibes"))) {
    return NextResponse.json(
      { error: "Vibes & Meditations is locked for this account.", code: "ADDON_REQUIRED" },
      { status: 403 }
    );
  }

  const id = req.nextUrl.searchParams.get("track") ?? "";
  const track = VIBE_TRACKS.find((t) => t.id === id);
  if (!track) {
    return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(track.src, SIGNED_URL_TTL_S);

  if (error || !data?.signedUrl) {
    console.error("[vibes/stream] createSignedUrl falhou:", error);
    return NextResponse.json(
      { error: "This track is unavailable right now." },
      { status: 503 }
    );
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_S });
}
