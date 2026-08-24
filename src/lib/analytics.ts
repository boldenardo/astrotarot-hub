// Analytics client — GA4 (via window.gtag, injetado no layout) + Meta Pixel.
//
// IMPORTANTE: NÃO usar react-ga4 aqui. O snippet gtag.js do src/app/layout.tsx
// é quem inicializa o GA4; react-ga4 nunca era inicializado e descartava
// silenciosamente todos os eventos. Tudo passa por window.gtag direto.

// Custom event types
export type AnalyticsEvent =
  | "page_view"
  | "sign_up"
  | "login"
  | "logout"
  | "tarot_reading_started"
  | "tarot_reading_completed"
  | "payment_initiated"
  | "payment_completed"
  | "payment_failed"
  | "spiritual_guide_message"
  | "compatibility_check"
  | "personality_analysis"
  | "predictions_viewed"
  | "abundance_viewed"
  | "subscription_upgrade_clicked"
  // Funil de quiz + VSL (placement diferencia sales_page vs quiz_result)
  | "quiz_started"
  | "quiz_completed"
  | "quiz_result_viewed"
  | "quiz_step_viewed"
  // Troca de passo que não se resolveu sozinha e precisou do watchdog.
  // Falha muda por natureza (não gera erro no console) — por isso vira evento.
  | "quiz_transition_stuck"
  // Chunk do deploy anterior sumiu e a tela recarregou sozinha para se salvar.
  | "quiz_chunk_reload"
  | "lead_captured"
  | "vsl_play"
  | "vsl_25"
  | "vsl_50"
  | "vsl_75"
  | "vsl_90"
  | "vsl_complete"
  // Vídeo não carregou (404, rede, codec). Alerta de receita: quando
  // dispara, o portão da oferta abriu por falha, não por audiência.
  | "vsl_error"
  // Etapas explícitas do handoff VSL → Stripe. Separadas de propósito: a
  // diferença entre "clicou" e "sessão criada" é a diferença entre um
  // problema de oferta e um problema de backend, e sem os dois eventos as
  // duas falhas parecem a mesma coisa.
  // Laboratório de funis de dor (/quiz/intimacy|body|money). Prefixo
  // próprio para os relatórios nunca se misturarem com o Control.
  | "pain_funnel_view"
  | "pain_quiz_started"
  | "pain_quiz_answered"
  | "pain_quiz_completed"
  | "pain_tarot_started"
  | "pain_card_selected"
  | "pain_card_revealed"
  | "pain_lp_viewed"
  | "pain_offer_viewed"
  | "pain_checkout_clicked"
  // Abriu os ciclos longos escondidos sob o CTA único (layout single_cta).
  | "pain_plan_options_opened"
  | "plan_options_opened"
  | "quiz_vsl_view"
  | "vsl_video_started"
  | "vsl_video_25"
  | "vsl_video_50"
  | "vsl_video_75"
  | "vsl_video_completed"
  // CTA principal ENTROU na tela (distinto de offer_viewed: mede quantos
  // chegaram ao botão, e é o denominador honesto do cta_click).
  | "cta_viewed"
  | "checkout_cta_clicked"
  | "checkout_session_created"
  | "checkout_redirect_started"
  | "checkout_error"
  // Painel de checkout embutido — separa "não viu o formulário" de
  // "viu e desistiu" (sem isto, 8 sessões sem cartão eram um mistério).
  | "checkout_form_opened"
  | "checkout_form_loaded"
  | "checkout_form_slow"
  | "checkout_form_timeout"
  | "checkout_form_error"
  | "checkout_form_closed"
  // O iframe não carregou a tempo e a pessoa foi para checkout.stripe.com
  // (label = slow_click | timeout | stripe_js_unavailable).
  | "checkout_fallback_hosted"
  // AstroTarot 2.0 — experiências guiadas (feature em params.feature)
  | "experience_view"
  | "experience_start"
  | "experience_step"
  | "experience_complete_chat"
  | "experience_result"
  | "experience_gate"
  | "experience_error"
  | "ritual_start"
  | "ritual_complete"
  | "dream_submitted"
  | "purchase_completed"
  | "offer_unlocked"
  | "offer_viewed"
  | "offer_clicked"
  | "downsell_viewed"
  | "downsell_clicked"
  | "challenge_cta_clicked"
  | "soulmate_draw_started"
  | "soulmate_unlock_clicked"
  | "streak_checkin"
  | "vibes_subscribe_clicked";

interface AnalyticsEventParams {
  category?: string;
  label?: string;
  value?: number;
  userId?: string;
  [key: string]: any;
}

type GtagFn = (...args: any[]) => void;

function getGtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  const gtag = (window as any).gtag;
  return typeof gtag === "function" ? gtag : undefined;
}

function getFbq(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  const fbq = (window as any).fbq;
  return typeof fbq === "function" ? fbq : undefined;
}

/**
 * Tracks a page view
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") return;

  getGtag()?.("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });

  // Meta Pixel PageView
  getFbq()?.("track", "PageView");
}

// Eventos de checkout também vão para o NOSSO banco (/api/telemetry →
// funnel_events), porque o GA4 não é legível pela operação. Só checkout:
// nada do quiz, nada de e-mail.
const MIRRORED =
  /^(pain_offer_viewed|pain_checkout_clicked|offer_viewed|checkout_|purchase_completed)/;

function mirror(eventName: string, params?: AnalyticsEventParams) {
  if (!MIRRORED.test(eventName)) return;
  try {
    const p = params ?? {};
    const variant =
      p.variant ??
      (p.funnel_id
        ? `${p.funnel_id}_${p.variant_id ?? "v1"}`
        : p.segment
          ? `pain_${p.segment}`
          : undefined);
    const payload = JSON.stringify({
      event: eventName,
      params: p,
      funnelSessionId:
        p.funnel_session_id ??
        window.localStorage.getItem("astro_funnel_sid") ??
        undefined,
      variant,
      path: window.location.pathname,
      vw: window.innerWidth,
      vh: window.innerHeight,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/telemetry",
        new Blob([payload], { type: "application/json" })
      );
    } else {
      void fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // telemetria nunca pode quebrar a compra
  }
}

/**
 * Tracks a custom event
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  params?: AnalyticsEventParams
) {
  if (typeof window === "undefined") return;
  mirror(eventName, params);

  // Google Analytics (GA4 event; params extras viram event params)
  getGtag()?.("event", eventName, {
    event_category: params?.category || "engagement",
    event_label: params?.label,
    value: params?.value,
    ...params,
  });

  // Meta Pixel Events
  const fbq = getFbq();
  if (fbq) {
    switch (eventName) {
      case "sign_up":
        fbq("track", "CompleteRegistration");
        break;
      case "login":
        fbq("track", "Login");
        break;
      case "lead_captured":
        fbq("track", "Lead");
        break;
      case "payment_initiated":
        fbq("track", "InitiateCheckout", {
          value: params?.value || 0,
          currency: "USD",
        });
        break;
      case "payment_completed":
        fbq("track", "Purchase", {
          value: params?.value || 0,
          currency: "USD",
        });
        break;
      case "tarot_reading_completed":
        fbq("track", "ViewContent", {
          content_name: "Tarot Reading",
          content_category: "Tarot",
        });
        break;
      default:
        fbq("trackCustom", eventName, params);
    }
  }
}

/**
 * Sets the user ID for tracking
 */
export function setUserId(userId: string) {
  getGtag()?.("set", { user_id: userId });
}

/**
 * Tracks a confirmed purchase, deduplicated per Stripe Checkout Session.
 * Fires GA4 `purchase` (transaction_id = session id) and Meta Pixel
 * `Purchase` with eventID = session id (ready for CAPI dedup later).
 */
export function trackPurchase(params: {
  sessionId: string;
  value: number;
  currency: string;
  plan?: string;
  /** Braço da página comercial que originou a venda (ver funnel-variant). */
  variant?: string;
}) {
  if (typeof window === "undefined") return;
  const { sessionId, value, currency, plan, variant } = params;

  const dedupKey = `astro_purchase_${sessionId}`;
  try {
    if (window.localStorage.getItem(dedupKey)) return;
    window.localStorage.setItem(dedupKey, "1");
  } catch {
    // Private mode: fire anyway — melhor risco de duplicar que perder o evento.
  }

  getGtag()?.("event", "purchase", {
    transaction_id: sessionId,
    value,
    currency,
    items: plan ? [{ item_id: plan, item_name: plan }] : undefined,
    ...(variant ? { variant } : null),
  });

  getFbq()?.(
    "track",
    "Purchase",
    { value, currency: currency.toUpperCase() },
    { eventID: sessionId }
  );
}

/**
 * Tracks a sign-up conversion
 */
export function trackSignUp(method: string = "email") {
  trackEvent("sign_up", {
    category: "user",
    label: method,
  });
}

/**
 * Tracks login
 */
export function trackLogin(method: string = "email") {
  trackEvent("login", {
    category: "user",
    label: method,
  });
}

/**
 * Tracks logout
 */
export function trackLogout() {
  trackEvent("logout", {
    category: "user",
  });
}

/**
 * Tracks the start of a tarot reading
 */
export function trackTarotReadingStarted(cardsCount: number) {
  trackEvent("tarot_reading_started", {
    category: "tarot",
    label: `${cardsCount}_cards`,
    value: cardsCount,
  });
}

/**
 * Tracks the completion of a tarot reading
 */
export function trackTarotReadingCompleted(
  cardsCount: number,
  hasQuestion: boolean
) {
  trackEvent("tarot_reading_completed", {
    category: "tarot",
    label: hasQuestion ? "with_question" : "without_question",
    value: cardsCount,
  });
}

/**
 * Tracks the start of a payment.
 * Also emits GA4 `begin_checkout` (the standard ecommerce event).
 */
export function trackPaymentInitiated(type: string, amount: number) {
  getGtag()?.("event", "begin_checkout", {
    value: amount,
    currency: "USD",
    items: [{ item_id: type, item_name: type }],
  });
  trackEvent("payment_initiated", {
    category: "payment",
    label: type,
    value: amount,
  });
}

/**
 * Tracks a completed payment
 */
export function trackPaymentCompleted(type: string, amount: number) {
  trackEvent("payment_completed", {
    category: "payment",
    label: type,
    value: amount,
  });
}

/**
 * Tracks a failed payment
 */
export function trackPaymentFailed(type: string, reason: string) {
  trackEvent("payment_failed", {
    category: "payment",
    label: `${type}_${reason}`,
  });
}

/**
 * Tracks a message sent in the spiritual guide
 */
export function trackSpiritualGuideMessage(messageLength: number) {
  trackEvent("spiritual_guide_message", {
    category: "spiritual_guide",
    value: messageLength,
  });
}

/**
 * Tracks a compatibility check
 */
export function trackCompatibilityCheck(sign1: string, sign2: string) {
  trackEvent("compatibility_check", {
    category: "astrology",
    label: `${sign1}_${sign2}`,
  });
}

/**
 * Tracks a personality analysis
 */
export function trackPersonalityAnalysis(sign: string) {
  trackEvent("personality_analysis", {
    category: "astrology",
    label: sign,
  });
}

/**
 * Tracks a predictions view
 */
export function trackPredictionsViewed(period: string) {
  trackEvent("predictions_viewed", {
    category: "astrology",
    label: period,
  });
}

/**
 * Tracks a subscription upgrade click
 */
export function trackSubscriptionUpgradeClicked(plan: string) {
  trackEvent("subscription_upgrade_clicked", {
    category: "subscription",
    label: plan,
  });
}

/**
 * Checks whether the Meta Pixel is loaded
 */
export function isMetaPixelLoaded(): boolean {
  return !!getFbq();
}

/**
 * Checks whether Google Analytics is loaded
 */
export function isGALoaded(): boolean {
  return !!getGtag();
}
