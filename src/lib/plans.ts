// Fonte única de verdade para planos, preços e matriz de features.
// Usado tanto no client (exibição) quanto no server (gating).

export const PLANS = {
  FREE: "FREE",
  PREMIUM_MONTHLY: "PREMIUM_MONTHLY",
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
      "Personalized AI interpretation",
      "Reading history",
    ],
  },
  /** Monthly subscription: unlimited + all premium features. */
  PREMIUM: {
    key: "PREMIUM",
    name: "Unlimited Premium",
    priceLabel: "$29.90",
    period: "per month",
    readings: Infinity,
    features: [
      "Unlimited tarot readings",
      "Personalized daily horoscope",
      "Full numerology",
      "Complete birth chart",
      "Prosperity guide",
      "Love compatibility",
    ],
  },
} as const;

export type CheckoutPlanKey = keyof typeof CHECKOUT_PLANS;

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
  numerology: "Numerology",
  birth_chart: "Birth chart",
  prosperity: "Prosperity guide",
  compatibility: "Love compatibility",
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
    profile.subscription_plan === PLANS.PREMIUM_MONTHLY &&
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
