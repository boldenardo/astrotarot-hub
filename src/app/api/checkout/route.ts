// POST /api/checkout — cria uma sessão de Checkout do Stripe.
// PACK5 → pagamento único (5 leituras). PREMIUM → assinatura mensal.
// PREMIUM_YEARLY → assinatura anual ($79/ano).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isPremium } from "@/lib/plans";
import { normalizeCode } from "@/lib/affiliate";
import { stripeEnabled, STRIPE_DISABLED_RESPONSE } from "@/lib/payments/provider";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Stripe desligada do runtime (migração Hotmart): nenhuma sessão nova.
  if (!stripeEnabled()) {
    return NextResponse.json(STRIPE_DISABLED_RESPONSE, { status: 503 });
  }
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  let body: { plan?: string; ref?: string } = {};
  try {
    body = await req.json();
  } catch {
    // corpo inválido tratado abaixo
  }

  // Afiliado: usa o código guardado no browser; se o usuário já tem
  // atribuição no cadastro, ela vence (first-touch permanente).
  const affiliateCode = profile.affiliate_code ?? normalizeCode(body.ref);

  const plan = body.plan;
  if (plan !== "PACK5" && plan !== "PREMIUM" && plan !== "PREMIUM_YEARLY") {
    return NextResponse.json(
      { error: "Invalid plan. Choose 'PACK5', 'PREMIUM' or 'PREMIUM_YEARLY'." },
      { status: 400 }
    );
  }

  const isSubscription = plan === "PREMIUM" || plan === "PREMIUM_YEARLY";

  // Bloqueia nova assinatura quando já existe uma (ativa OU suspensa).
  // stripe_subscription_id só fica null após cancelamento definitivo.
  if (isSubscription && (isPremium(profile) || profile.stripe_subscription_id)) {
    return NextResponse.json(
      {
        error:
          profile.subscription_status === "suspended"
            ? "Your subscription has a pending payment. Please update your payment method instead of subscribing again."
            : "You already have an active Premium subscription.",
        code: "SUBSCRIPTION_EXISTS",
      },
      { status: 400 }
    );
  }

  const price =
    plan === "PREMIUM_YEARLY"
      ? process.env.STRIPE_PRICE_PREMIUM_YEARLY
      : plan === "PREMIUM"
        ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY
        : process.env.STRIPE_PRICE_READINGS_PACK;

  if (!process.env.STRIPE_SECRET_KEY || !price) {
    return NextResponse.json(
      { error: "Payments are not configured. Please try again later." },
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
      metadata: {
        user_id: profile.id,
        plan,
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
      },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: {
                user_id: profile.id,
                ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
              },
            },
          }
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
      amount: plan === "PREMIUM_YEARLY" ? 79 : isSubscription ? 14.99 : 9.99,
      currency: "usd",
      status: "PENDING",
      payment_type: isSubscription ? "SUBSCRIPTION" : "READINGS_PACK",
      stripe_checkout_session_id: session.id,
    });

    if (insertError) {
      console.error("[/api/checkout] erro ao registrar pagamento:", insertError);
      return NextResponse.json(
        { error: "Could not start checkout. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[/api/checkout] erro ao criar sessão Stripe:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
