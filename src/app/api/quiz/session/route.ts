// GET /api/quiz/session?session_id=cs_... — read-only lookup of a Stripe
// Checkout Session, used by the thank-you pages to (a) fire the Purchase
// pixel with the REAL amount, (b) adapt copy per plan and (c) recover the
// buyer's email when localStorage is unavailable.
//
// Session IDs are unguessable, and we only confirm data the buyer already
// knows (their own purchase) — no enumeration risk. `paid` is validated
// server-side so a forged URL cannot fire a fake Purchase with real money.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id") ?? "";
  if (!/^(cs|pi)_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Compra do checkout próprio: veio por PaymentIntent, não por sessão.
    if (sessionId.startsWith("pi_")) {
      const pi = await stripe.paymentIntents.retrieve(sessionId);
      if (pi.metadata?.source !== "custom_checkout") {
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      }
      return NextResponse.json({
        portraitIncluded: false,
        paid: pi.status === "succeeded",
        amount: pi.amount / 100,
        currency: pi.currency ?? "usd",
        plan: "FRONT_READING",
        email: pi.metadata.quiz_email ?? null,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    // O retrato veio como order bump nesta compra? A thank-you usa isto
    // para NÃO oferecer de novo o que a pessoa acabou de levar — o risco
    // real era o one-click cobrar $24.99 em cima do bump na janela em que
    // o webhook ainda não gravou o entitlement.
    const portraitIncluded = Boolean(
      process.env.STRIPE_PRICE_SOULMATE_PORTRAIT &&
        session.line_items?.data?.some(
          (li) => li.price?.id === process.env.STRIPE_PRICE_SOULMATE_PORTRAIT
        )
    );
    return NextResponse.json({
      portraitIncluded,
      paid: session.payment_status === "paid",
      amount:
        typeof session.amount_total === "number"
          ? session.amount_total / 100
          : null,
      currency: session.currency ?? "usd",
      plan: session.metadata?.plan ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
}
