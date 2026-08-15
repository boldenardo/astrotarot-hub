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
  if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
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
