// POST /api/quiz/payment-intent — motor do checkout PRÓPRIO (/quiz/checkout).
//
// Modelado no checkout que o dono mandou copiar (officialpsychicmarie):
// pagamento inline na NOSSA página, com order bumps por checkbox. Aqui o
// Payment Element troca a página hospedada da Stripe — a mesma cobrança,
// mas cercada da nossa prova, garantia e resumo do pedido.
//
// O VALOR é sempre computado AQUI a partir das flags — o cliente manda
// {cord:true}, nunca um número. Um POST forjado não inventa preço.
//
// create: cria o PaymentIntent (customer reaproveitado por e-mail,
//   setup_future_usage p/ OTO one-click) e o grant do downsell $19.99.
// update: recalcula o amount quando um bump é (des)marcado.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { normalizeEmail } from "@/lib/email-normalize";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { createDownsellGrant } from "@/lib/server/downsell";
import { normalizeCode } from "@/lib/affiliate";

export const runtime = "nodejs";

const FRONT_CENTS =
  String(process.env.NEXT_PUBLIC_FRONT_PRICE_USD || 29) === "37" ? 3700 : 2900;
const BUMP_CORD_CENTS = 900;
const BUMP_VIBES_CENTS = 1900;

// Desconto das cartas pré-checkout: só estes percentuais existem no jogo
// (3 cartas de 5%, 1 de 20%, 1 de 30%). Qualquer outro valor vira 0.
const ALLOWED_DISCOUNTS = new Set([0, 5, 20, 30]);

function parseDiscount(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return ALLOWED_DISCOUNTS.has(n) ? n : 0;
}

function amountFor(
  bumps: { cord?: boolean; vibes?: boolean },
  discountPct = 0
): number {
  const front = Math.round((FRONT_CENTS * (100 - discountPct)) / 100);
  return (
    front +
    (bumps.cord ? BUMP_CORD_CENTS : 0) +
    (bumps.vibes ? BUMP_VIBES_CENTS : 0)
  );
}

export async function POST(req: NextRequest) {
  let body: {
    action?: "create" | "update";
    email?: string;
    name?: string;
    bumps?: { cord?: boolean; vibes?: boolean };
    discountPct?: number;
    piId?: string;
    funnelSessionId?: string;
    variant?: string;
    ref?: string;
    utm?: Record<string, string>;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const bumps = {
    cord: Boolean(body.bumps?.cord),
    vibes: Boolean(body.bumps?.vibes),
  };

  // ── update: bump (des)marcado ─────────────────────────────────────────
  if (body.action === "update") {
    const piId = body.piId ?? "";
    if (!/^pi_[a-zA-Z0-9]+$/.test(piId)) {
      return NextResponse.json({ error: "Invalid intent." }, { status: 400 });
    }
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      // Só mexe em PI nosso, ainda não confirmado.
      if (
        pi.metadata?.source !== "custom_checkout" ||
        !["requires_payment_method", "requires_confirmation"].includes(pi.status)
      ) {
        return NextResponse.json({ error: "Not editable." }, { status: 400 });
      }
      // O desconto é decidido pelas cartas ANTES de criar o PI e gravado
      // na metadata — o update não aceita um novo, para um POST forjado
      // não baixar o preço depois.
      const discountPct = parseDiscount(pi.metadata?.discount_pct);
      const updated = await stripe.paymentIntents.update(piId, {
        amount: amountFor(bumps, discountPct),
        metadata: {
          ...pi.metadata,
          bump_cord: bumps.cord ? "1" : "0",
          bump_vibes: bumps.vibes ? "1" : "0",
        },
      });
      return NextResponse.json({ amount: updated.amount });
    } catch (e) {
      console.error("[payment-intent] update falhou:", e);
      return NextResponse.json({ error: "Could not update." }, { status: 400 });
    }
  }

  // ── create ────────────────────────────────────────────────────────────
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  const name = typeof body.name === "string" ? body.name.slice(0, 80) : undefined;
  const funnelSessionId =
    typeof body.funnelSessionId === "string"
      ? body.funnelSessionId.slice(0, 64)
      : undefined;
  const variant =
    typeof body.variant === "string" ? body.variant.slice(0, 64) : undefined;
  const affiliateCode = normalizeCode(body.ref);
  // Percentual revelado pelas cartas — validado contra o conjunto do jogo.
  const discountPct = parseDiscount(body.discountPct);

  const utmMeta: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = body.utm?.[k];
    if (typeof v === "string" && v.trim()) utmMeta[k] = v.trim().slice(0, 80);
  }

  try {
    // Customer reaproveitado por e-mail (mesma regra do checkout antigo):
    // sem isso cada compra cria um cus_ novo e o histórico se espalha.
    let customerId: string | undefined;
    const { data: existing } = await getSupabaseAdmin()
      .from("users")
      .select("stripe_customer_id")
      .eq("email", email)
      .maybeSingle();
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id as string;
    } else {
      const customer = await stripe.customers.create({ email, name });
      customerId = customer.id;
    }

    const pi = await stripe.paymentIntents.create({
      amount: amountFor(bumps, discountPct),
      currency: "usd",
      customer: customerId,
      // Cartão salvo → OTO da thank-you continua one-click.
      setup_future_usage: "off_session",
      automatic_payment_methods: { enabled: true },
      statement_descriptor_suffix: "ASTROTAROT",
      receipt_email: email,
      metadata: {
        source: "custom_checkout",
        plan: "FRONT_READING",
        quiz_email: email,
        bump_cord: bumps.cord ? "1" : "0",
        bump_vibes: bumps.vibes ? "1" : "0",
        discount_pct: String(discountPct),
        ...(funnelSessionId ? { funnel_session_id: funnelSessionId } : {}),
        ...(variant ? { page_variant: variant } : {}),
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
        ...utmMeta,
      },
    });

    // Quem sair sem pagar ainda tem o caminho do $19.99 (mesma trava de
    // sempre: servidor decide, e-mail queima uma vez).
    const grantToken = createDownsellGrant({
      email,
      quizSessionId: funnelSessionId ?? null,
      checkoutSessionId: pi.id,
    });

    return NextResponse.json({
      clientSecret: pi.client_secret,
      piId: pi.id,
      amount: pi.amount,
      grantToken,
    });
  } catch (e) {
    console.error("[payment-intent] create falhou:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
