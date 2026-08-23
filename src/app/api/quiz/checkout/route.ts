// POST /api/quiz/checkout — guest checkout for the quiz funnel.
// No auth: the buyer may not have an account yet. The Stripe webhook
// reconciles the purchase to a user row by email (metadata.quiz_email).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { normalizeCode } from "@/lib/affiliate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isPremium } from "@/lib/plans";
import { LANG_COOKIE, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { normalizeEmail } from "@/lib/email-normalize";

export const runtime = "nodejs";

/**
 * Páginas comerciais para onde o Stripe pode devolver quem cancela.
 *
 * ALLOWLIST FECHADA de propósito: o valor chega do browser e vira URL de
 * redirect assinada pelo Stripe. Aceitar string livre aqui seria um open
 * redirect com o checkout como trampolim. Fora da lista → cai na V1.
 */
const CANCEL_PATHS = new Set([
  "/quiz/vsl",
  "/quiz/vsl-v2",
  // Funis de dor: quem desiste no Stripe volta para o MESMO experimento.
  "/quiz/intimacy",
  "/quiz/body",
  "/quiz/money",
  "/quiz/ex",
]);
const DEFAULT_CANCEL_PATH = "/quiz/vsl";

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
    /** Braço do experimento de página comercial (vsl_v1_control | vsl_v2_ignite). */
    variant?: string;
    /** Página que iniciou o checkout — para o cancel voltar ao MESMO braço. */
    cancelPath?: string;
    /** true = formulário DENTRO da nossa página (ui_mode embedded). */
    embedded?: boolean;
    utm?: Record<string, string>;
  } = {};
  try {
    body = await req.json();
  } catch {
    // invalid body handled below
  }

  const plan = body.plan;
  const VALID_PLANS = new Set([
    // Oferta atual do funil: assinatura Unlimited em 3 ciclos.
    "SUB_MONTHLY",
    "SUB_SEMIANNUAL",
    "SUB_ANNUAL",
    // Legado (páginas antigas em cache / e-mails de recuperação já enviados).
    "PACK5",
    "PREMIUM",
    "PREMIUM_YEARLY",
  ]);
  if (!plan || !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  // Saneia antes de validar: sufixo de autocomplete do webview e typos de
  // TLD em provedores conhecidos viram o endereço real (ver email-normalize).
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const isSubscription = plan !== "PACK5";
  // Fallback hardcoded nos planos novos: price id não é segredo (aparece no
  // client em qualquer integração Stripe.js) e garante deploy atômico — o
  // funil novo não pode 503ar enquanto a env não chega na Vercel.
  const price =
    plan === "SUB_MONTHLY"
      ? process.env.STRIPE_PRICE_SUB_MONTHLY || "price_1U6hIO07YF1LaBzhrHFJ1lzW"
      : plan === "SUB_SEMIANNUAL"
        ? process.env.STRIPE_PRICE_SUB_SEMIANNUAL || "price_1U6hIO07YF1LaBzhwruCm40B"
        : plan === "SUB_ANNUAL"
          ? process.env.STRIPE_PRICE_SUB_ANNUAL || "price_1U6hIO07YF1LaBzhwWgoBSOw"
          : plan === "PREMIUM_YEARLY"
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
  // Variante também no metadata: o relatório de receita por braço passa a
  // existir do lado do servidor, sem depender do localStorage do browser.
  const variant = meta(body.variant, 40);
  // Funis experimentais (/f/<funnel>/<variant>) entram por padrão fechado:
  // só slug + versão, nada de query/fragmento.
  const cancelPath =
    typeof body.cancelPath === "string" &&
    (CANCEL_PATHS.has(body.cancelPath) || /^\/f\/[a-z-]{2,30}\/v\d{1,2}$/.test(body.cancelPath))
      ? body.cancelPath
      : DEFAULT_CANCEL_PATH;
  const embedded = body.embedded === true;
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
    ...(variant ? { page_variant: variant } : {}),
    ...(funnelSessionId ? { funnel_session_id: funnelSessionId } : {}),
    ...utmMeta,
    ...(srcPlatform ? { src_platform: srcPlatform } : {}),
    ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
  };

  try {
    // Objeto montado ANTES da chamada e tipado: os spreads condicionais
    // criavam uma união que o TS não conseguia casar com SessionCreateParams.
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscription ? "subscription" : "payment",
      locale: "en",
      // MOEDA TRAVADA EM USD (23/08). O price tem 9 moedas e a Stripe
      // escolhia pela localização: a página prometia "$9.99" e o
      // formulário abria "R$49,90", "179 ZAR", "179 MXN". O valor
      // convertido está certo; o NÚMERO parece 5x a 18x maior no exato
      // momento do cartão. Todo o site é escrito em USD — o checkout tem
      // de confirmar a promessa, não surpreender. Para voltar a moeda
      // local, o preço na página precisa virar local junto (geo), nunca
      // só aqui.
      currency: "usd",
      line_items: [{ price, quantity: 1 }],
      metadata,
      allow_promotion_codes: true,
    };

    // Reaproveita o Customer quando o e-mail já comprou antes: sem isso o
    // Stripe cria um cus_* novo a cada compra e o histórico do cliente fica
    // espalhado por vários registros.
    if (existing?.stripe_customer_id) params.customer = existing.stripe_customer_id;
    else params.customer_email = email;

    if (isSubscription) {
      params.subscription_data = { metadata };
      // SEM order bump na assinatura (23/08). A Stripe renderiza
      // optional_items no resumo, ACIMA do campo de e-mail: quem vinha
      // comprar uma leitura de $9.99 via "$24.99" (R$129 / 449 ZAR) antes
      // de digitar qualquer coisa. O retrato continua à venda no
      // one-click da thank-you, onde o cartão já está salvo e o
      // compromisso já foi assumido — mesma receita, momento melhor.
    } else {
      params.payment_intent_data = {
        // Marca do PRODUTO na fatura: "<empresa>* ASTROTAROT". Reconhecer
        // a cobrança é o que evita o chargeback de "não fui eu".
        statement_descriptor_suffix: "ASTROTAROT",
        // Guarda o cartão para o one-click do retrato na thank-you. Sem
        // isto, o upsell de $24.99 não tem onde cobrar: a assinatura salva
        // cartão por natureza, o pagamento único NÃO. O Checkout mostra o
        // aviso de cartão salvo sozinho quando este campo existe.
        setup_future_usage: "off_session",
      };
      // Cartão salvo precisa de um Customer para morar. Só quando não
      // estamos reaproveitando um existente (os dois campos são
      // mutuamente exclusivos na API).
      if (!existing?.stripe_customer_id) params.customer_creation = "always";

      // ORDER BUMP: o retrato de $24.99 como item opcional DENTRO do
      // formulário de pagamento — a Stripe renderiza o toggle sozinha, na
      // moeda da sessão (o price tem as mesmas 8 moedas do funil). Quem
      // marca compra os dois numa cobrança só; quem não marca ainda
      // encontra o one-click na thank-you.
      if (plan === "PACK5" && process.env.STRIPE_PRICE_SOULMATE_PORTRAIT) {
        params.optional_items = [
          { price: process.env.STRIPE_PRICE_SOULMATE_PORTRAIT, quantity: 1 },
        ];
      }
    }

    if (embedded) {
      // O formulário roda dentro da nossa página. O Stripe não redireciona,
      // então exige return_url e REJEITA success_url/cancel_url — mandar os
      // três juntos foi o que derrubou o checkout: a sessão nascia hospedada,
      // sem client_secret, e a rota devolvia 500 para todo mundo.
      // "embedded" foi descontinuado pela Stripe; este SDK exige
      // "embedded_page" e recusa o valor antigo com erro explícito.
      params.ui_mode = "embedded_page";
      params.return_url = `${appUrl}/quiz/thank-you?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      params.success_url = `${appUrl}/quiz/thank-you?session_id={CHECKOUT_SESSION_ID}`;
      // Volta para a MESMA página que abriu o checkout: mandar quem estava
      // na V2 de volta para a V1 contaminaria o experimento inteiro.
      params.cancel_url = `${appUrl}${cancelPath}?canceled=1`;
    }

    // Expiração REAL: a sessão morre em 30 minutos (mínimo da Stripe).
    // É o que permite mostrar um cronômetro honesto no checkout — quando
    // ele zera, a sessão de fato expirou, não é encenação.
    params.expires_at = Math.floor(Date.now() / 1000) + 30 * 60;

    const session = await stripe.checkout.sessions.create(params);

    // NOTE: no payments row is inserted here — the guest has no user row
    // yet. The webhook (checkout.session.completed) creates the user by
    // email and inserts the COMPLETED payment idempotently.

    if (embedded) {
      if (!session.client_secret) {
        return NextResponse.json(
          { error: "Could not start checkout. Please try again." },
          { status: 500 }
        );
      }
      return NextResponse.json({
        clientSecret: session.client_secret,
        sessionId: session.id,
        // Epoch da expiração real — o cronômetro do painel conta até aqui.
        expiresAt: session.expires_at,
      });
    }

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
