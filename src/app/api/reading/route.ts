// A leitura comprada, servida por LINK ASSINADO — sem login.
//
// GET  ?e=&t=  devolve o estado atual (rápido, serve para o poll)
// POST { e, t } gera se ainda não existir (até 60s)
//
// Quem autoriza aqui é o HMAC do e-mail (ver reading-access.ts), e a porta
// só abre para quem REALMENTE comprou: o entitlement é conferido antes de
// qualquer coisa. Token válido de quem não pagou não vê nada.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { verifyReadingToken } from "@/lib/server/reading-access";
import {
  BUCKET,
  SIGNED_URL_TTL_S,
  generateSoulmateFor,
  type SoulmateProfile,
} from "@/lib/server/soulmate-generate";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Gate {
  profile: SoulmateProfile;
  owns: boolean;
}

/** Valida o link e devolve o comprador, ou null. */
async function gate(email: string, token: string): Promise<Gate | null> {
  if (!email || !token || !verifyReadingToken(email, token)) return null;
  const admin = getSupabaseAdmin();
  const { data: user } = await admin
    .from("users")
    .select("id, email, name, birth_date, birth_location")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (!user) return null;
  const { data: ent } = await admin
    .from("user_entitlements")
    .select("feature")
    .eq("user_id", (user as { id: string }).id)
    .eq("feature", "soulmate_portrait")
    .maybeSingle();
  return { profile: user as unknown as SoulmateProfile, owns: Boolean(ent) };
}

/** Assina a prévia e — para quem comprou — a imagem cheia. */
async function sign(path: string | null): Promise<string | null> {
  if (!path) return null;
  const admin = getSupabaseAdmin();
  const r = await admin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_S);
  return r.data?.signedUrl ?? null;
}

async function currentState(g: Gate) {
  const admin = getSupabaseAdmin();
  const { data: p } = await admin
    .from("soulmate_portraits")
    .select("image_url, preview_url, dossier, sign")
    .eq("user_id", g.profile.id)
    .maybeSingle();
  // "pending" só quando não há NADA. Com o dossiê salvo e a imagem
  // faltando, a leitura vai — é a maior parte do que foi comprado, e
  // segurá-la porque o desenho atrasou seria punir quem já pagou.
  if (!p?.dossier) return { status: "pending" as const };

  const row = p as {
    image_url: string;
    preview_url: string | null;
    dossier: Record<string, unknown>;
    sign: string | null;
  };
  return {
    status: "ready" as const,
    /** O desenho ainda está vindo — a leitura abaixo já é definitiva. */
    portrait_pending: !row.image_url,
    name: g.profile.name ?? null,
    sign: row.sign,
    // A imagem CHEIA só sai para quem tem o direito. Sem entitlement fica
    // a prévia borrada — a mesma regra de /api/soulmate, agora também
    // valendo para o acesso por link.
    image_url: g.owns ? await sign(row.image_url) : null,
    preview_url: await sign(row.preview_url),
    dossier: g.owns ? row.dossier : null,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const g = await gate(sp.get("e") ?? "", sp.get("t") ?? "");
  if (!g) return NextResponse.json({ error: "invalid_link" }, { status: 403 });
  if (!g.owns) return NextResponse.json({ status: "not_purchased" });
  return NextResponse.json(await currentState(g));
}

export async function POST(req: NextRequest) {
  let body: { e?: string; t?: string } = {};
  try {
    body = await req.json();
  } catch {
    // corpo inválido cai na validação abaixo
  }
  const g = await gate(body.e ?? "", body.t ?? "");
  if (!g) return NextResponse.json({ error: "invalid_link" }, { status: 403 });
  if (!g.owns) return NextResponse.json({ status: "not_purchased" }, { status: 403 });

  // Idempotente por usuário: se o webhook já gerou, isto devolve na hora.
  const result = await generateSoulmateFor(g.profile);
  if (!result.ok) {
    return NextResponse.json({ status: "failed", code: result.code }, { status: 503 });
  }
  return NextResponse.json(await currentState(g));
}
