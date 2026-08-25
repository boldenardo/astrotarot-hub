// POST /api/quiz/oto — OTO pós-compra em UM clique.
//
// Generalização do padrão de /api/quiz/portrait-upsell: em vez de um
// produto fixo, recebe a chave do OTO e cobra o cartão que a compra que
// acabou de acontecer deixou salvo (setup_future_usage no PaymentIntent,
// ou o default da subscription).
//
// POR QUE UM CLIQUE: upsell se mede por quanto soma ao ticket médio, não
// por taxa de conversão. Um segundo formulário de cartão mata a compra por
// impulso, que é o que sustenta o OTO — a pessoa já decidiu, já digitou,
// já confiou.
//
// SEGURANÇA: exige o session_id (não-adivinhável) de uma sessão PAGA deste
// funil. Só o comprador real o tem. Idempotency key derivada da sessão +
// produto: duplo clique não vira duas cobranças.
//
// FALHA LIMPA: recusa ou 3DS → 400, e a UI oferece o checkout normal.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/** Catálogo dos OTOs cobráveis em um clique. Valores em centavos, USD. */
const OTOS: Record<
  string,
  { amount: number; description: string; plan: string }
> = {
  OTO_PASTLIFE: {
    amount: 2700,
    description: "AstroTarot — Past Life Connection",
    plan: "OTO_PASTLIFE",
  },
};

export async function POST(req: NextRequest) {
  let body: { session_id?: string; oto?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sessionId = body.session_id ?? "";
  if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }
  const oto = OTOS[body.oto ?? ""];
  if (!oto) {
    return NextResponse.json({ error: "Unknown offer." }, { status: 400 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      session.payment_status !== "paid" ||
      !["quiz", "quiz_vsl"].includes(session.metadata?.source ?? "")
    ) {
      return NextResponse.json({ error: "Not eligible." }, { status: 400 });
    }

    const email = (
      session.metadata?.quiz_email ||
      session.customer_details?.email ||
      ""
    )
      .trim()
      .toLowerCase();

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (!customerId) {
      return NextResponse.json({ error: "No customer on file." }, { status: 400 });
    }

    // O cartão salvo vem de onde a compra veio: da subscription, ou do
    // PaymentIntent com setup_future_usage (caso do front de $29).
    let paymentMethod: string | undefined;
    if (session.mode === "subscription") {
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        paymentMethod =
          typeof sub.default_payment_method === "string"
            ? sub.default_payment_method
            : sub.default_payment_method?.id;
      }
    } else {
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (piId) {
        const pi = await stripe.paymentIntents.retrieve(piId);
        paymentMethod =
          typeof pi.payment_method === "string"
            ? pi.payment_method
            : pi.payment_method?.id;
      }
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: "No card on file." }, { status: 400 });
    }

    const intent = await stripe.paymentIntents.create(
      {
        amount: oto.amount,
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: oto.description,
        statement_descriptor_suffix: "ASTROTAROT",
        metadata: {
          plan: oto.plan,
          quiz_email: email,
          source: "quiz_thankyou_oto",
          origin_session: sessionId,
        },
      },
      { idempotencyKey: `oto_${oto.plan}_${sessionId}` }
    );

    if (intent.status !== "succeeded") {
      // 3DS obrigatório, por exemplo. Não insistimos: a thank-you cai para
      // o checkout normal, que sabe autenticar.
      return NextResponse.json(
        { error: "Card needs confirmation.", fallback: true },
        { status: 400 }
      );
    }

    // ENTREGA: cobrança off-session não gera checkout.session.completed com
    // metadata de plano, então o entitlement é concedido AQUI — sem isto o
    // comprador do OTO pagava $27 e não recebia nada visível na conta.
    try {
      const admin = getSupabaseAdmin();
      let uid: string | null = null;
      if (email) {
        const { data: u } = await admin
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        uid = u?.id ?? null;
        if (!uid) {
          const { data: created } = await admin
            .from("users")
            .insert({
              email,
              subscription_plan: "FREE",
              subscription_status: "active",
              readings_left: 4,
            })
            .select("id")
            .maybeSingle();
          uid = created?.id ?? null;
        }
      }
      if (uid) {
        const { data: existing } = await admin
          .from("user_entitlements")
          .select("id")
          .eq("user_id", uid)
          .eq("feature", "past_life")
          .maybeSingle();
        if (existing) {
          await admin
            .from("user_entitlements")
            .update({ active: true, stripe_reference: intent.id })
            .eq("id", existing.id);
        } else {
          await admin.from("user_entitlements").insert({
            user_id: uid,
            feature: "past_life",
            active: true,
            source: "stripe_one_click",
            stripe_reference: intent.id,
          });
        }
      }
    } catch (e) {
      console.error("[/api/quiz/oto] entitlement não gravado:", e);
    }

    // Registro best-effort: a cobrança já valeu, e o webhook é a fonte de
    // verdade do entitlement.
    try {
      await getSupabaseAdmin().from("payments").insert({
        amount: oto.amount / 100,
        currency: "usd",
        status: "COMPLETED",
        payment_type: "OTO",
        stripe_payment_intent_id: intent.id,
      });
    } catch {
      // silêncio proposital
    }

    return NextResponse.json({ ok: true, amount: oto.amount / 100 });
  } catch (e) {
    console.error("[/api/quiz/oto] falhou:", e);
    return NextResponse.json(
      { error: "Could not complete the purchase." },
      { status: 400 }
    );
  }
}
