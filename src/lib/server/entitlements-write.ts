// Concessão de direitos comprados — compartilhada pelos webhooks.
//
// Nasceu dentro do webhook da Stripe. Passou a viver aqui em 29/08, quando
// o webhook da Hotmart precisou conceder exatamente os MESMOS direitos:
// duas cópias divergiriam no primeiro ajuste, e a divergência apareceria
// como "comprei e não recebi" só para quem pagou pelo gateway esquecido.

import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import type { AddonFeature } from "@/lib/server/plan-gate";

/**
 * Concede (ou revoga) um add-on comprado fora do plano base.
 *
 * Idempotente por (user_id, feature): reentrega do gateway apenas reafirma
 * o mesmo direito em vez de duplicar linha — e os dois provedores reenviam
 * (a Stripe manda o mesmo evento de novo, a Hotmart manda APPROVED e
 * depois COMPLETE para a mesma venda).
 */
export async function setEntitlement(params: {
  userId: string;
  feature: AddonFeature;
  active: boolean;
  source?: string;
  reference?: string | null;
  expiresAt?: string | null;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin.from("user_entitlements").upsert(
      {
        user_id: params.userId,
        feature: params.feature,
        active: params.active,
        source: params.source ?? "one_time",
        stripe_reference: params.reference ?? null,
        expires_at: params.expiresAt ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,feature" }
    );
    if (error) console.error("[entitlements] upsert falhou:", error);
  } catch (e) {
    console.error("[entitlements] erro:", e);
  }
}

export type { AddonFeature };
