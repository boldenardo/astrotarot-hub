// POST /api/quiz/checkout — guest checkout for the quiz funnel.
// No auth: the buyer may not have an account yet. The Stripe webhook
// reconciles the purchase to a user row by email (metadata.quiz_email).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let body: { plan?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    // invalid body handled below
  }

  const plan = body.plan;
  if (plan !== "PACK5" && plan !== "PREMIUM") {
    return NextResponse.json(
      { error: "Invalid plan. Choose 'PACK5' or 'PREMIUM'." },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").toLowerCase().trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const isSubscription = plan === "PREMIUM";
  const price = isSubscription
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

  const metadata = { source: "quiz", plan, quiz_email: email };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      locale: "en",
      line_items: [{ price, quantity: 1 }],
      customer_email: email,
      metadata,
      ...(isSubscription ? { subscription_data: { metadata } } : {}),
      success_url: `${appUrl}/quiz/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/quiz/vsl`,
      allow_promotion_codes: true,
    });

    // NOTE: no payments row is inserted here — the guest has no user row
    // yet. The webhook (checkout.session.completed) creates the user by
    // email and inserts the COMPLETED payment idempotently.

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[/api/quiz/checkout] failed to create Stripe session:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
