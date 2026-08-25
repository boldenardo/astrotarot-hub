// POST /api/soulmate/checkout — compra única do retrato completo ($24.99).
// Exige login: o add-on é creditado ao usuário, não a um e-mail solto.
// metadata.product = "soulmate_portrait" é o que o webhook lê para
// conceder o entitlement (ver setEntitlement em api/stripe/webhook).

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser, hasEntitlement } from "@/lib/server/plan-gate";

export const runtime = "nodejs";

export async function POST() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  // PREÇO DE TABELA (26/08): compra direta (fora do funil) paga o preço
  // cheio de $58 — é o que torna verdadeiro o "50% off" do funil. O
  // texto da página vem de FRONT_LIST_PRICE_LABEL, deste mesmo número.
  const price =
    process.env.STRIPE_PRICE_FRONT_LIST || "price_1U8T3w07YF1LaBzhCEz4jyE3";
  if (!process.env.STRIPE_SECRET_KEY || !price) {
    return NextResponse.json(
      { error: "This unlock isn't available right now.", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  // Já comprou: não cobra de novo.
  if (await hasEntitlement(profile.id, "soulmate_portrait")) {
    return NextResponse.json(
      { error: "You already own the full portrait.", code: "ALREADY_OWNED" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "en",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: profile.id,
      metadata: {
        user_id: profile.id,
        product: "soulmate_portrait",
        plan: "SOULMATE_PORTRAIT",
      },
      ...(profile.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: profile.email }),
      success_url: `${appUrl}/soulmate?unlocked=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/soulmate`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[soulmate/checkout] falhou:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
