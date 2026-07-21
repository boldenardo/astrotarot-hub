// Fonte única de verdade para planos, preços e matriz de features.
// Usado tanto no client (exibição) quanto no server (gating).

export const PLANS = {
  FREE: "FREE",
  PREMIUM_MONTHLY: "PREMIUM_MONTHLY",
} as const;

export type SubscriptionPlan = (typeof PLANS)[keyof typeof PLANS];

/** Produtos compráveis no checkout (Stripe). */
export const CHECKOUT_PLANS = {
  /** Pacote avulso: +5 leituras de tarot. Pagamento único. */
  PACK5: {
    key: "PACK5",
    name: "Pacote 5 Leituras",
    priceLabel: "US$ 9,99",
    period: "pagamento único",
    readings: 5,
    features: [
      "5 leituras de Tarot Egípcio",
      "Interpretação personalizada por IA",
      "Histórico de leituras",
    ],
  },
  /** Assinatura mensal: ilimitado + todas as features premium. */
  PREMIUM: {
    key: "PREMIUM",
    name: "Premium Ilimitado",
    priceLabel: "US$ 29,90",
    period: "por mês",
    readings: Infinity,
    features: [
      "Leituras de tarot ilimitadas",
      "Horóscopo diário personalizado",
      "Numerologia completa",
      "Mapa astral completo",
      "Guia de prosperidade",
      "Compatibilidade amorosa",
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
  horoscope: "Horóscopo diário",
  numerology: "Numerologia",
  birth_chart: "Mapa astral",
  prosperity: "Guia de prosperidade",
  compatibility: "Compatibilidade amorosa",
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
