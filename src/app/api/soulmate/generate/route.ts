// POST /api/soulmate/generate — Draw Your Soulmate, para quem está logado.
//
// A geração em si mudou de casa (src/lib/server/soulmate-generate.ts): ela
// precisava ser chamável sem sessão, porque amarrar a ENTREGA ao login
// custou a primeira venda da Hotmart — pagou às 04:08 e treze horas depois
// não tinha retrato, porque faltava criar conta e apertar um botão.
//
// Esta rota continua existindo e continua sendo o caminho de quem já tem
// conta. O que ela faz agora é só o que é dela: autorizar.

import { NextResponse } from "next/server";
import { requireUser, hasEntitlement } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isPremium } from "@/lib/plans";
import {
  BUCKET,
  SIGNED_URL_TTL_S,
  generateSoulmateFor,
} from "@/lib/server/soulmate-generate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  // Destrava por assinatura OU por compra avulsa do retrato: o entitlement
  // é exatamente "eu paguei por isto".
  const owns = await hasEntitlement(profile.id, "soulmate_portrait");
  if (!isPremium(profile) && !owns) {
    return NextResponse.json(
      {
        error: "Your soulmate portrait is part of the membership.",
        code: "PREMIUM_REQUIRED",
      },
      { status: 403 }
    );
  }

  const result = await generateSoulmateFor({
    id: profile.id,
    email: profile.email ?? null,
    name: profile.name ?? null,
    birth_date: profile.birth_date ?? null,
    birth_location: profile.birth_location ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      result.code === "NOT_CONFIGURED"
        ? {
            error: "Portrait generation is not available right now.",
            code: "NOT_CONFIGURED",
          }
        : {
            error: "We couldn't draw your portrait right now. Please try again.",
          },
      { status: result.code === "NOT_CONFIGURED" ? 503 : 500 }
    );
  }

  // A prévia sai assinada para a tela que acabou de pedir. A imagem cheia
  // continua saindo só com o add-on, em GET /api/soulmate.
  const admin = getSupabaseAdmin();
  let previewUrl: string | null = null;
  if (result.portrait.preview_url) {
    const signed = await admin.storage
      .from(BUCKET)
      .createSignedUrl(result.portrait.preview_url, SIGNED_URL_TTL_S);
    previewUrl = signed.data?.signedUrl ?? null;
  }

  return NextResponse.json({
    portrait: {
      image_url: null,
      preview_url: previewUrl,
      dossier: result.portrait.dossier,
      sign: result.portrait.sign,
    },
    generated: result.generated,
  });
}
