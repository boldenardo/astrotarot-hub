// POST /api/quiz/upgrade-yearly — upsell pós-compra da thank-you.
// O comprador ACABOU de assinar o Premium mensal via quiz (guest checkout);
// o cartão dele já está salvo como default da subscription no Stripe.
// Um subscriptions.update para o price anual cobra o cartão salvo na hora:
//   - billing_cycle_anchor "now": o ano começa hoje
//   - proration_behavior "always_invoice": o $14.99 recém-pago vira crédito
//     na fatura anual (o "desconto de boas-vindas" sai de graça)
//   - payment_behavior "error_if_incomplete": cartão recusou → rota falha
//     limpo e a UI esconde o card (assinatura mensal permanece intacta)
//
// Segurança: exige o session_id (não-adivinhável) de uma sessão PAGA do
// funil de quiz em modo subscription — só o comprador real o possui.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { stripeEnabled, STRIPE_DISABLED_RESPONSE } from "@/lib/payments/provider";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Stripe desligada do runtime (migração Hotmart): sem upgrade one-click.
  if (!stripeEnabled()) {
    return NextResponse.json(STRIPE_DISABLED_RESPONSE, { status: 503 });
  }
  let body: { session_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sessionId = body.session_id ?? "";
  if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  const yearlyPrice = process.env.STRIPE_PRICE_PREMIUM_YEARLY;
  if (!process.env.STRIPE_SECRET_KEY || !yearlyPrice) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.payment_status !== "paid" ||
      session.mode !== "subscription" ||
      session.metadata?.source !== "quiz"
    ) {
      return NextResponse.json({ error: "Not eligible." }, { status: 400 });
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "Not eligible." }, { status: 400 });
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const item = sub.items.data[0];

    // Idempotência: já está no anual → sucesso silencioso.
    if (item?.price?.id === yearlyPrice) {
      return NextResponse.json({ ok: true, alreadyYearly: true });
    }
    if (!item || sub.status !== "active") {
      return NextResponse.json({ error: "Not eligible." }, { status: 400 });
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: item.id, price: yearlyPrice }],
      billing_cycle_anchor: "now",
      proration_behavior: "always_invoice",
      payment_behavior: "error_if_incomplete",
      metadata: { ...sub.metadata, plan: "PREMIUM_YEARLY" },
    });

    // Atualiza o usuário direto (o webhook de invoice.paid filtra
    // billing_reason=subscription_cycle e ignoraria esta fatura).
    const email = (
      session.metadata?.quiz_email ||
      session.customer_details?.email ||
      ""
    )
      .toLowerCase()
      .trim();
    if (email) {
      const admin = getSupabaseAdmin();
      // API atual do Stripe: current_period_end vive no subscription ITEM.
      const periodEndUnix = updated.items.data[0]?.current_period_end;
      const periodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await admin
        .from("users")
        .update({
          subscription_plan: "PREMIUM_YEARLY",
          subscription_status: "active",
          subscription_end_date: periodEnd,
        })
        .eq("email", email);
      if (error) {
        console.error("[quiz/upgrade-yearly] users update:", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Cartão recusado ou sessão inexistente: a UI esconde o card em silêncio.
    console.error("[quiz/upgrade-yearly] failed:", e);
    return NextResponse.json({ error: "Upgrade failed." }, { status: 400 });
  }
}
