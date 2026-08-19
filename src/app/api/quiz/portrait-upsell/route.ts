// POST /api/quiz/portrait-upsell — retrato completo ($24.99) na thank-you.
//
// POR QUE AQUI: o funil inteiro promete o retrato da alma gêmea (o vídeo do
// desenho, "posso finalmente ver o rosto dela"). Até agora o add-on só era
// oferecido em /soulmate, que exige LOGIN — ou seja, a pessoa tinha que
// pagar a assinatura, criar conta, entrar e achar a página para só então
// ver a oferta. Quase ninguém chega lá. Aqui a oferta acontece no minuto
// seguinte à compra, com a promessa ainda fresca e o cartão já salvo.
//
// COMO: o comprador acabou de assinar via guest checkout, então existe um
// PaymentMethod salvo na subscription. Cobramos off-session com ele —
// um clique, sem redigitar cartão.
//
// SEGURANÇA: exige o session_id (não-adivinhável) de uma sessão PAGA do
// funil, em modo subscription. Só o comprador real o possui.
//
// FALHA LIMPA: cartão recusado ou 3DS obrigatório → 400 e a UI esconde o
// card. A assinatura principal nunca é afetada.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";


export async function POST(req: NextRequest) {
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

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // "quiz" é o metadata histórico; "quiz_vsl" é o atual — a troca do
    // rótulo tinha desligado este upsell até para assinantes.
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
      .toLowerCase()
      .trim();
    if (!email) {
      return NextResponse.json({ error: "Not eligible." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: user } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!user) {
      // O webhook ainda não criou a linha: peça de novo em instantes.
      return NextResponse.json({ error: "Not ready yet." }, { status: 409 });
    }
    const userId = (user as { id: string }).id;

    // Já tem o add-on? Sucesso silencioso — nunca cobrar duas vezes.
    const { data: owned } = await admin
      .from("user_entitlements")
      .select("id")
      .eq("user_id", userId)
      .eq("feature", "soulmate_portrait")
      .eq("active", true)
      .maybeSingle();
    if (owned) {
      return NextResponse.json({ ok: true, alreadyOwned: true });
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (!customerId) {
      return NextResponse.json({ error: "Not eligible." }, { status: 400 });
    }

    // O cartão salvo vem de onde a compra veio: da assinatura (Premium) ou
    // do PaymentIntent com setup_future_usage (pacote de $9.99 — a oferta
    // principal do funil, que este upsell recusava por inteiro).
    let paymentMethod: string | undefined;
    if (session.mode === "subscription") {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        paymentMethod =
          typeof sub.default_payment_method === "string"
            ? sub.default_payment_method
            : sub.default_payment_method?.id;
      }
    } else if (session.mode === "payment") {
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

    // Moeda do upsell = moeda em que a pessoa ACABOU de pagar. Cobrar USD
    // no cartão de quem pagou em BRL não é só grosseiro: cartão brasileiro
    // em dólar é RECUSADO por regra de bandeira, e o upsell falharia
    // sempre. Valores charm ancorados nos $24.99.
    const PORTRAIT_BY_CURRENCY: Record<string, number> = {
      usd: 2499, eur: 2299, gbp: 1999, aud: 3799,
      cad: 3399, nzd: 4099, brl: 12900, mxn: 44900,
    };
    const chargeCurrency =
      session.currency && PORTRAIT_BY_CURRENCY[session.currency]
        ? session.currency
        : "usd";
    const chargeAmount = PORTRAIT_BY_CURRENCY[chargeCurrency];

    // Idempotency key derivada da sessão: um duplo clique (ou um retry de
    // rede) não vira duas cobranças de $24.99.
    const intent = await stripe.paymentIntents.create(
      {
        amount: chargeAmount,
        currency: chargeCurrency,
        customer: customerId,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: "AstroTarot — Draw Your Soulmate (full portrait)",
        metadata: {
          user_id: userId,
          product: "soulmate_portrait",
          plan: "SOULMATE_PORTRAIT",
          source: "quiz_thankyou_upsell",
        },
      },
      { idempotencyKey: `portrait_${sessionId}` }
    );

    if (intent.status !== "succeeded") {
      // Ex.: requires_action (3DS). Não insistimos aqui — a pessoa ainda
      // pode comprar em /soulmate, onde o Checkout trata a autenticação.
      return NextResponse.json(
        { error: "Card needs confirmation.", code: "REQUIRES_ACTION" },
        { status: 400 }
      );
    }

    // Concede o add-on. O webhook também trata charge.refunded para revogar.
    const { error: entErr } = await admin.from("user_entitlements").upsert(
      {
        user_id: userId,
        feature: "soulmate_portrait",
        active: true,
        source: "stripe_one_time",
        stripe_reference: intent.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,feature" }
    );
    if (entErr) {
      console.error("[quiz/portrait-upsell] entitlement:", entErr);
    }

    // Registra a receita: sem isto o upsell não existiria no banco.
    const { error: payErr } = await admin.from("payments").insert({
      user_id: userId,
      amount: chargeAmount / 100,
      currency: chargeCurrency,
      status: "COMPLETED",
      payment_type: "READINGS_PACK", // CHECK atual não tem tipo próprio
      stripe_payment_intent_id: intent.id,
      paid_at: new Date().toISOString(),
    });
    if (payErr && (payErr as { code?: string }).code !== "23505") {
      console.error("[quiz/portrait-upsell] payments:", payErr);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Cartão recusado / sessão inválida: a UI esconde o card em silêncio.
    console.error("[quiz/portrait-upsell] failed:", e);
    return NextResponse.json({ error: "Purchase failed." }, { status: 400 });
  }
}
