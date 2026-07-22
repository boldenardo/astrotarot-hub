// POST /api/checkout — cria uma sessão de Checkout do Stripe.
// PACK5 → pagamento único (5 leituras). PREMIUM → assinatura mensal.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isPremium } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  let body: { plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    // corpo inválido tratado abaixo
  }

  const plan = body.plan;
  if (plan !== "PACK5" && plan !== "PREMIUM") {
    return NextResponse.json(
      { error: "Plano inválido. Escolha 'PACK5' ou 'PREMIUM'." },
      { status: 400 }
    );
  }

  // Bloqueia nova assinatura quando já existe uma (ativa OU suspensa).
  // stripe_subscription_id só fica null após cancelamento definitivo.
  if (plan === "PREMIUM" && (isPremium(profile) || profile.stripe_subscription_id)) {
    return NextResponse.json(
      {
        error:
          profile.subscription_status === "suspended"
            ? "Sua assinatura está com pagamento pendente. Atualize seu método de pagamento no portal de cobrança em vez de assinar novamente."
            : "Você já é assinante Premium.",
        code: "SUBSCRIPTION_EXISTS",
      },
      { status: 400 }
    );
  }

  const isSubscription = plan === "PREMIUM";
  const price = isSubscription
    ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY
    : process.env.STRIPE_PRICE_READINGS_PACK;

  if (!process.env.STRIPE_SECRET_KEY || !price) {
    return NextResponse.json(
      { error: "Pagamentos não configurados. Tente novamente mais tarde." },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      locale: "en",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: profile.id,
      metadata: { user_id: profile.id, plan },
      ...(isSubscription
        ? { subscription_data: { metadata: { user_id: profile.id } } }
        : {}),
      ...(profile.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: profile.email }),
      success_url: `${appUrl}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      allow_promotion_codes: true,
    });

    const admin = getSupabaseAdmin();
    const { error: insertError } = await admin.from("payments").insert({
      user_id: profile.id,
      amount: isSubscription ? 29.9 : 9.99,
      currency: "usd",
      status: "PENDING",
      payment_type: isSubscription ? "SUBSCRIPTION" : "READINGS_PACK",
      stripe_checkout_session_id: session.id,
    });

    if (insertError) {
      console.error("[/api/checkout] erro ao registrar pagamento:", insertError);
      return NextResponse.json(
        { error: "Não foi possível iniciar o checkout. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[/api/checkout] erro ao criar sessão Stripe:", e);
    return NextResponse.json(
      { error: "Não foi possível iniciar o checkout. Tente novamente." },
      { status: 500 }
    );
  }
}
