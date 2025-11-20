import ReactGA from "react-ga4";

// Tipos de eventos customizados
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
  | "subscription_upgrade_clicked";

interface AnalyticsEventParams {
  category?: string;
  label?: string;
  value?: number;
  userId?: string;
  [key: string]: any;
}

/**
 * Inicializa o Google Analytics
 * Deve ser chamado uma vez no início da aplicação
 */
export function initializeAnalytics(measurementId: string) {
  if (typeof window !== "undefined" && measurementId) {
    ReactGA.initialize(measurementId);
    console.log("✅ Google Analytics inicializado:", measurementId);
  }
}

/**
 * Registra uma visualização de página
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window !== "undefined") {
    ReactGA.send({
      hitType: "pageview",
      page: path,
      title: title || document.title,
    });

    // Meta Pixel PageView
    if ((window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }
}

/**
 * Registra um evento customizado
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  params?: AnalyticsEventParams
) {
  if (typeof window !== "undefined") {
    // Google Analytics
    ReactGA.event({
      category: params?.category || "engagement",
      action: eventName,
      label: params?.label,
      value: params?.value,
      ...params,
    });

    // Meta Pixel Events
    const fbq = (window as any).fbq;
    if (fbq) {
      switch (eventName) {
        case "sign_up":
          fbq("track", "CompleteRegistration");
          break;
        case "login":
          fbq("track", "Login");
          break;
        case "payment_initiated":
          fbq("track", "InitiateCheckout", {
            value: params?.value || 0,
            currency: "BRL",
          });
          break;
        case "payment_completed":
          fbq("track", "Purchase", {
            value: params?.value || 0,
            currency: "BRL",
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
}

/**
 * Define o ID do usuário para tracking
 */
export function setUserId(userId: string) {
  if (typeof window !== "undefined") {
    ReactGA.set({ userId });
  }
}

/**
 * Registra uma conversão de cadastro
 */
export function trackSignUp(method: string = "email") {
  trackEvent("sign_up", {
    category: "user",
    label: method,
  });
}

/**
 * Registra login
 */
export function trackLogin(method: string = "email") {
  trackEvent("login", {
    category: "user",
    label: method,
  });
}

/**
 * Registra logout
 */
export function trackLogout() {
  trackEvent("logout", {
    category: "user",
  });
}

/**
 * Registra início de leitura de tarot
 */
export function trackTarotReadingStarted(cardsCount: number) {
  trackEvent("tarot_reading_started", {
    category: "tarot",
    label: `${cardsCount}_cards`,
    value: cardsCount,
  });
}

/**
 * Registra conclusão de leitura de tarot
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
 * Registra início de pagamento
 */
export function trackPaymentInitiated(type: string, amount: number) {
  trackEvent("payment_initiated", {
    category: "payment",
    label: type,
    value: amount,
  });
}

/**
 * Registra pagamento concluído
 */
export function trackPaymentCompleted(type: string, amount: number) {
  trackEvent("payment_completed", {
    category: "payment",
    label: type,
    value: amount,
  });
}

/**
 * Registra pagamento falhou
 */
export function trackPaymentFailed(type: string, reason: string) {
  trackEvent("payment_failed", {
    category: "payment",
    label: `${type}_${reason}`,
  });
}

/**
 * Registra mensagem enviada no guia espiritual
 */
export function trackSpiritualGuideMessage(messageLength: number) {
  trackEvent("spiritual_guide_message", {
    category: "spiritual_guide",
    value: messageLength,
  });
}

/**
 * Registra análise de compatibilidade
 */
export function trackCompatibilityCheck(sign1: string, sign2: string) {
  trackEvent("compatibility_check", {
    category: "astrology",
    label: `${sign1}_${sign2}`,
  });
}

/**
 * Registra análise de personalidade
 */
export function trackPersonalityAnalysis(sign: string) {
  trackEvent("personality_analysis", {
    category: "astrology",
    label: sign,
  });
}

/**
 * Registra visualização de previsões
 */
export function trackPredictionsViewed(period: string) {
  trackEvent("predictions_viewed", {
    category: "astrology",
    label: period,
  });
}

/**
 * Registra clique em upgrade de assinatura
 */
export function trackSubscriptionUpgradeClicked(plan: string) {
  trackEvent("subscription_upgrade_clicked", {
    category: "subscription",
    label: plan,
  });
}

/**
 * Verifica se o Meta Pixel está carregado
 */
export function isMetaPixelLoaded(): boolean {
  return typeof window !== "undefined" && !!(window as any).fbq;
}

/**
 * Verifica se o Google Analytics está carregado
 */
export function isGALoaded(): boolean {
  return typeof window !== "undefined" && !!ReactGA;
}
