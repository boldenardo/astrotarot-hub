// GET /api/soulmate — estado do retrato para a página.
// Diz se a pessoa já tem o retrato gerado e se possui o add-on completo,
// sem nunca gerar nada (geração é POST e custa dinheiro).
//
// O bucket é PRIVADO: a tabela guarda caminhos, e as URLs são assinadas
// aqui conforme o direito de cada um — prévia borrada para assinante,
// imagem cheia só para quem comprou o add-on. Antes as duas colunas
// apontavam para a MESMA URL pública e o add-on não protegia nada.

import { NextResponse } from "next/server";
import { requireUser, hasEntitlement } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isPremium } from "@/lib/plans";

export const runtime = "nodejs";

const BUCKET = "soulmate";
const SIGNED_URL_TTL_S = 60 * 60;

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("soulmate_portraits")
    .select("image_url, preview_url, dossier, sign, created_at")
    .eq("user_id", profile.id)
    .maybeSingle();

  const hasFullUnlock = await hasEntitlement(profile.id, "soulmate_portrait");

  let portrait = null;
  if (data) {
    // Compatibilidade: linhas antigas guardavam URL pública completa.
    const asUrl = (v: string | null) =>
      v && /^https?:\/\//.test(v) ? v : null;
    const asPath = (v: string | null) =>
      v && !/^https?:\/\//.test(v) ? v : null;

    const previewPath = asPath(data.preview_url);
    const fullPath = asPath(data.image_url);

    const [previewSigned, fullSigned] = await Promise.all([
      previewPath
        ? admin.storage.from(BUCKET).createSignedUrl(previewPath, SIGNED_URL_TTL_S)
        : Promise.resolve({ data: null }),
      // A imagem completa só é assinada para quem pagou o add-on.
      hasFullUnlock && fullPath
        ? admin.storage.from(BUCKET).createSignedUrl(fullPath, SIGNED_URL_TTL_S)
        : Promise.resolve({ data: null }),
    ]);

    portrait = {
      preview_url: previewSigned.data?.signedUrl ?? asUrl(data.preview_url),
      image_url: hasFullUnlock
        ? fullSigned.data?.signedUrl ?? asUrl(data.image_url)
        : null,
      dossier: data.dossier,
      sign: data.sign,
      created_at: data.created_at,
    };
  }

  return NextResponse.json({
    isPremium: isPremium(profile),
    hasFullUnlock,
    hasBirthDate: Boolean(profile.birth_date),
    portrait,
  });
}
