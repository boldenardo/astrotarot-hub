// Vibes & Meditations — add-on recorrente de $9.99/mês.
//
// Cobrança como ITEM DENTRO da assinatura existente (subscriptionItems),
// não como assinatura separada: o membro continua com uma fatura só e um
// cancelamento só. O entitlement é sincronizado pelo webhook a partir dos
// itens reais da assinatura (ver syncVibesFromSubscription).
//
// GET    → estado atual
// POST   → ativa o add-on (cobra pro-rata no ciclo corrente)
// DELETE → remove o add-on no fim do período pago

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser, hasEntitlement } from "@/lib/server/plan-gate";
import { isPremium } from "@/lib/plans";

export const runtime = "nodejs";

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    active: await hasEntitlement(gate.profile.id, "vibes"),
    isPremium: isPremium(gate.profile),
    configured: Boolean(process.env.STRIPE_PRICE_VIBES_MONTHLY),
  });
}

export async function POST() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  const price = process.env.STRIPE_PRICE_VIBES_MONTHLY;
  const stripe = stripeClient();
  if (!stripe || !price) {
    return NextResponse.json(
      { error: "Vibes isn't available right now.", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  // O add-on vive DENTRO da assinatura: sem assinatura, não há onde pendurar.
  if (!isPremium(profile) || !profile.stripe_subscription_id) {
    return NextResponse.json(
      {
        error: "Vibes is an add-on to your membership. Start your plan first.",
        code: "PREMIUM_REQUIRED",
      },
      { status: 403 }
    );
  }

  if (await hasEntitlement(profile.id, "vibes")) {
    return NextResponse.json({ ok: true, alreadyActive: true });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    // Idempotência: se o item já existe, não cria outro.
    if (sub.items.data.some((i) => i.price?.id === price)) {
      return NextResponse.json({ ok: true, alreadyActive: true });
    }

    await stripe.subscriptionItems.create({
      subscription: profile.stripe_subscription_id,
      price,
      quantity: 1,
      proration_behavior: "create_prorations",
    });

    // O entitlement é gravado pelo webhook (customer.subscription.updated),
    // que é a fonte de verdade: aqui só confirmamos que a ordem foi aceita.
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[vibes] subscribe falhou:", e);
    return NextResponse.json(
      { error: "We couldn't add Vibes to your plan. Please try again." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  const price = process.env.STRIPE_PRICE_VIBES_MONTHLY;
  const stripe = stripeClient();
  if (!stripe || !price || !profile.stripe_subscription_id) {
    return NextResponse.json({ ok: true });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    const item = sub.items.data.find((i) => i.price?.id === price);
    if (item) {
      // Sem prorata na saída: a pessoa fica com o que já pagou até o fim.
      await stripe.subscriptionItems.del(item.id, {
        proration_behavior: "none",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[vibes] unsubscribe falhou:", e);
    return NextResponse.json(
      { error: "We couldn't remove Vibes. Please try again." },
      { status: 400 }
    );
  }
}
