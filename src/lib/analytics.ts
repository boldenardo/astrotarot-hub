import ReactGA from "react-ga4";

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
  | "subscription_upgrade_clicked";

interface AnalyticsEventParams {
  category?: string;
  label?: string;
  value?: number;
  userId?: string;
  [key: string]: any;
}

/**
 * Initializes Google Analytics
 * Should be called once at application startup
 */
export function initializeAnalytics(measurementId: string) {
  if (typeof window !== "undefined" && measurementId) {
    ReactGA.initialize(measurementId);
    console.log("Google Analytics initialized:", measurementId);
  }
}

/**
 * Tracks a page view
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
 * Tracks a custom event
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
}

/**
 * Sets the user ID for tracking
 */
export function setUserId(userId: string) {
  if (typeof window !== "undefined") {
    ReactGA.set({ userId });
  }
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
 * Tracks the start of a payment
 */
export function trackPaymentInitiated(type: string, amount: number) {
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
  return typeof window !== "undefined" && !!(window as any).fbq;
}

/**
 * Checks whether Google Analytics is loaded
 */
export function isGALoaded(): boolean {
  return typeof window !== "undefined" && !!ReactGA;
}
