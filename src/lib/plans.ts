// Fonte única de verdade para planos, preços e matriz de features.
// Usado tanto no client (exibição) quanto no server (gating).

export const PLANS = {
  FREE: "FREE",
  PREMIUM_MONTHLY: "PREMIUM_MONTHLY",
  // Ciclo de 6 meses da oferta Unlimited do funil ($39.99/semestre).
  PREMIUM_SEMIANNUAL: "PREMIUM_SEMIANNUAL",
  PREMIUM_YEARLY: "PREMIUM_YEARLY",
} as const;

export type SubscriptionPlan = (typeof PLANS)[keyof typeof PLANS];

/** Purchasable products at checkout (Stripe). */
export const CHECKOUT_PLANS = {
  /** One-off pack: +5 tarot readings. Single payment. */
  PACK5: {
    key: "PACK5",
    name: "5-Reading Pack",
    priceLabel: "$9.99",
    period: "one-time payment",
    readings: 5,
    features: [
      "5 Egyptian Tarot readings",
      "A personalized interpretation of every card",
      "Reading history",
    ],
  },
  /** Monthly subscription: unlimited + all premium features. */
  PREMIUM: {
    key: "PREMIUM",
    name: "Unlimited Premium",
    priceLabel: "$14.99",
    period: "per month",
    readings: Infinity,
    features: [
      "Unlimited tarot readings",
      "Your daily horoscope",
      "Find your soulmate reading",
      "Your fortune & money map",
      "Complete birth chart",
      "Your lucky numbers",
    ],
  },
  /** Yearly subscription: same access, one payment per year (67% off). */
  PREMIUM_YEARLY: {
    key: "PREMIUM_YEARLY",
    name: "Unlimited Premium — Yearly",
    priceLabel: "$79",
    period: "per year",
    readings: Infinity,
    features: [
      "Everything in Unlimited Premium",
      "One payment covers 12 months",
      "Save $100 vs paying monthly",
    ],
  },
} as const;

export type CheckoutPlanKey = keyof typeof CHECKOUT_PLANS;

/**
 * Retrato da alma gêmea — add-on de compra única, FORA de CHECKOUT_PLANS
 * de propósito: aquele tipo significa "comprável no /cart", e este produto
 * é vendido dentro do funil (/api/quiz/portrait-upsell, no cartão já
 * salvo). Misturar os dois faria o /cart precisar tratar um plano que ele
 * nunca mostra.
 */
export const SOULMATE_PORTRAIT = {
  key: "SOULMATE_PORTRAIT",
  name: "Draw My Soulmate",
  priceLabel: "$24.99",
  period: "one-time payment",
  features: [
    "Your soulmate's portrait, unblurred",
    "How you'll recognize them",
    "The window when you're most likely to meet",
  ],
} as const;

/** Features exclusivas do plano Premium Ilimitado. */
export const PREMIUM_FEATURES = [
  "horoscope",
  "numerology",
  "birth_chart",
  "prosperity",
  "compatibility",
] as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

export const FEATURE_LABELS: Record<PremiumFeature, string> = {
  horoscope: "Daily horoscope",
  numerology: "Lucky numbers",
  birth_chart: "Birth chart",
  prosperity: "Fortune reading",
  compatibility: "Soulmate reading",
};

export interface PlanProfile {
  subscription_plan?: string | null;
  subscription_status?: string | null;
  readings_left?: number | null;
}

/** Assinatura premium ativa (ou cancelada mas ainda dentro do período pago). */
export function isPremium(profile: PlanProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    (profile.subscription_plan === PLANS.PREMIUM_MONTHLY ||
      profile.subscription_plan === PLANS.PREMIUM_SEMIANNUAL ||
      profile.subscription_plan === PLANS.PREMIUM_YEARLY) &&
    profile.subscription_status === "active"
  );
}

export function canUseFeature(
  profile: PlanProfile | null | undefined,
  _feature: PremiumFeature
): boolean {
  // Hoje todas as features premium exigem o mesmo plano; a assinatura
  // por feature fica trivial de introduzir depois via este ponto único.
  return isPremium(profile);
}

/** Premium tem leituras ilimitadas; demais dependem do saldo readings_left. */
export function hasReadingsLeft(profile: PlanProfile | null | undefined): boolean {
  if (isPremium(profile)) return true;
  return (profile?.readings_left ?? 0) > 0;
}
