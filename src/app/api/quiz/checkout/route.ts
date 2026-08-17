// POST /api/quiz/checkout — guest checkout for the quiz funnel.
// No auth: the buyer may not have an account yet. The Stripe webhook
// reconciles the purchase to a user row by email (metadata.quiz_email).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { normalizeCode } from "@/lib/affiliate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isPremium } from "@/lib/plans";
import { LANG_COOKIE, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Cliente já existente para este e-mail, se houver.
 *
 * Este checkout é GUEST (sem login), então a única chave é o e-mail. Sem
 * esta consulta, um assinante que refaz o funil criaria uma SEGUNDA
 * assinatura no mesmo cartão — e o webhook sobrescreveria
 * stripe_customer_id/subscription_id, deixando a primeira órfã, cobrando
 * para sempre e invisível para o app.
 */
async function findExistingCustomer(email: string) {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("users")
      .select("id, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id")
      .eq("email", email)
      .maybeSingle();
    return (data ?? null) as {
      id: string;
      subscription_plan: string | null;
      subscription_status: string | null;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
    } | null;
  } catch (e) {
    // Banco indisponível não pode derrubar a venda: seguimos como guest.
    console.error("[/api/quiz/checkout] lookup de usuário falhou:", e);
    return null;
  }
}

/** Valor curto e sem surpresa para ir ao metadata do Stripe (limite 500). */
function meta(raw: unknown, max = 80): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().slice(0, max);
  return v || null;
}

export async function POST(req: NextRequest) {
  let body: {
    plan?: string;
    email?: string;
    ref?: string;
    src?: string;
    funnelSessionId?: string;
    signal?: string;
    offer?: string;
    utm?: Record<string, string>;
  } = {};
  try {
    body = await req.json();
  } catch {
    // invalid body handled below
  }

  const plan = body.plan;
  if (plan !== "PACK5" && plan !== "PREMIUM" && plan !== "PREMIUM_YEARLY") {
    return NextResponse.json(
      { error: "Invalid plan. Choose 'PACK5', 'PREMIUM' or 'PREMIUM_YEARLY'." },
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

  const isSubscription = plan === "PREMIUM" || plan === "PREMIUM_YEARLY";
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

  // Trava de assinatura duplicada (mesma regra do /api/checkout).
  const existing = await findExistingCustomer(email);
  if (isSubscription && existing?.stripe_subscription_id) {
    return NextResponse.json(
      {
        error:
          "You already have an active subscription with this email. Sign in to manage it.",
        code: "SUBSCRIPTION_EXISTS",
        signInUrl: `${appUrl}/auth/login`,
      },
      { status: 409 }
    );
  }
  if (isSubscription && existing && isPremium(existing)) {
    return NextResponse.json(
      {
        error: "This email already has Premium access. Sign in to use it.",
        code: "SUBSCRIPTION_EXISTS",
        signInUrl: `${appUrl}/auth/login`,
      },
      { status: 409 }
    );
  }

  // Código de afiliado (opcional). Vai no metadata da sessão E da assinatura
  // — assim o webhook credita a venda inicial e as renovações.
  const affiliateCode = normalizeCode(body.ref);
  // Plataforma de origem (?src=ig|tt|yt) viaja até a venda no Stripe:
  // é assim que se sabe qual conta orgânica gerou receita, sem pixel.
  const srcPlatform = (body.src ?? "").trim().toLowerCase().slice(0, 20);

  // Idioma do funil viaja até o webhook: o e-mail de boas-vindas sai na
  // mesma língua em que a pessoa comprou.
  const cookieLang = req.cookies.get(LANG_COOKIE)?.value;
  const locale = isLocale(cookieLang) ? cookieLang : DEFAULT_LOCALE;

  // Correlação funil → Stripe. O funnel_session_id é pseudônimo (número
  // aleatório do browser): sem ele, "N pessoas viram a oferta" e "N sessões
  // criadas" ficam sendo dois números que não se cruzam.
  const funnelSessionId = meta(body.funnelSessionId, 64);
  const signal = meta(body.signal, 20);
  const offer = meta(body.offer, 40);
  const utm = body.utm && typeof body.utm === "object" ? body.utm : {};
  const utmMeta: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = meta(utm[k]);
    if (v) utmMeta[k] = v;
  }

  const metadata: Record<string, string> = {
    source: "quiz_vsl",
    plan,
    quiz_email: email,
    locale,
    ...(offer ? { offer } : {}),
    ...(signal ? { soulmate_signal: signal } : {}),
    ...(funnelSessionId ? { funnel_session_id: funnelSessionId } : {}),
    ...utmMeta,
    ...(srcPlatform ? { src_platform: srcPlatform } : {}),
    ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      locale: "en",
      line_items: [{ price, quantity: 1 }],
      // Reaproveita o Customer quando o e-mail já comprou antes: sem isso o
      // Stripe cria um cus_* novo a cada compra e o histórico de cobrança
      // do cliente fica espalhado por vários registros.
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: email }),
      metadata,
      ...(isSubscription ? { subscription_data: { metadata } } : {}),
      success_url: `${appUrl}/quiz/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      // ?canceled=1 → a VSL mostra o downsell do PACK5 para quem desistiu.
      cancel_url: `${appUrl}/quiz/vsl?canceled=1`,
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

    // sessionId volta para o cliente disparar checkout_session_created com
    // a mesma chave que aparece no Stripe.
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("[/api/quiz/checkout] failed to create Stripe session:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
