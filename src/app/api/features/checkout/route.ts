// POST /api/features/checkout — compra avulsa de UMA feature, logado.
//
// O modelo de preços dentro da conta (25/08): a recorrência de $9.99 é o
// Tarot ilimitado; as demais features têm preço próprio e viram
// entitlement ao serem compradas. Esta rota abre o Checkout hospedado da
// feature pedida com o e-mail do PRÓPRIO usuário logado — o webhook então
// concede o entitlement pelo plano (ver ENTITLEMENT_BY_PLAN no webhook).
//
// O preço vive na Stripe; o mapa aqui só escolhe o price id. Nenhum valor
// é aceito do cliente.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "@/lib/server/plan-gate";

export const runtime = "nodejs";

const FEATURES: Record<
  string,
  { plan: string; price: () => string; returnTo: string }
> = {
  pastlife: {
    plan: "OTO_PASTLIFE",
    price: () =>
      process.env.STRIPE_PRICE_OTO_PASTLIFE || "price_1U7yhj07YF1LaBzhKHhpPOeB",
    returnTo: "/past-lives",
  },
  cord: {
    plan: "CORD_READING",
    price: () =>
      process.env.STRIPE_PRICE_BUMP_CORD || "price_1U7yhi07YF1LaBzh4ConA7Ic",
    returnTo: "/rituals/cord-cutting",
  },
};

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  let body: { feature?: string } = {};
  try {
    body = await req.json();
  } catch {
    // tratado abaixo
  }
  const feat = FEATURES[body.feature ?? ""];
  if (!feat) {
    return NextResponse.json({ error: "Unknown feature." }, { status: 400 });
  }
  if (!process.env.STRIPE_SECRET_KEY || !profile.email) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://astrotarot.shop";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "en",
      currency: "usd",
      line_items: [{ price: feat.price(), quantity: 1 }],
      // quiz_email é a chave que o webhook usa para achar/criar o usuário —
      // aqui é o e-mail da própria conta logada, então o entitlement cai
      // exatamente onde a pessoa está.
      metadata: { plan: feat.plan, quiz_email: profile.email, source: "account" },
      ...(profile.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: profile.email }),
      success_url: `${appUrl}${feat.returnTo}?unlocked=1`,
      cancel_url: `${appUrl}${feat.returnTo}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout." },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[/api/features/checkout] falhou:", e);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 }
    );
  }
}
