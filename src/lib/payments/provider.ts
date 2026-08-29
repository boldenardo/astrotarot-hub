// Seleção de provider financeiro do runtime.
//
// Migração temporária (2026-08-20): Hotmart assume como provider ativo e a
// Stripe fica DESLIGADA do runtime, mas 100% preservada no código — a volta
// é trocar duas variáveis de ambiente, sem deploy de código.
//
//   PAYMENT_PROVIDER=hotmart|stripe   (default: stripe — trocar de gateway
//                                      é um ato explícito, nunca acidente
//                                      de env ausente)
//   STRIPE_ENABLED=true|false         (false corta TODA criação de sessão,
//                                      upsell e cobrança nova na Stripe)
//
// REGRA DE OURO (sem fallback): com PAYMENT_PROVIDER=hotmart, falha da
// Hotmart NUNCA cai para a Stripe. A rota devolve erro explícito.
//
// O webhook da Stripe (/api/stripe/webhook) fica ATIVO mesmo com
// STRIPE_ENABLED=false: ele só reage a eventos assinados pela Stripe e
// precisa continuar honrando compras feitas antes da troca (entitlements,
// reembolsos de vendas antigas). Desligá-lo perderia clientes reais.

export type PaymentProviderName = "stripe" | "hotmart";

export function activeProvider(): PaymentProviderName {
  return process.env.PAYMENT_PROVIDER === "hotmart" ? "hotmart" : "stripe";
}

/** Stripe pode criar sessões/cobranças novas? (leitura/webhook não passam aqui) */
export function stripeEnabled(): boolean {
  if (process.env.STRIPE_ENABLED === "false") return false;
  // Com a Hotmart ativa, a Stripe está implicitamente desligada para
  // cobranças novas — mesmo que STRIPE_ENABLED não tenha sido setada.
  return activeProvider() === "stripe";
}

/** Resposta padrão das rotas de cobrança Stripe quando o runtime está desligado. */
export const STRIPE_DISABLED_RESPONSE = {
  error: "This payment method is temporarily unavailable.",
  code: "PROVIDER_DISABLED",
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Modelo normalizado — o domínio não fala "Hotmart" nem "Stripe".
// Permite religar a Stripe (ou plugar outro gateway) sem tocar consumidores.
// ─────────────────────────────────────────────────────────────────────────

export interface PaymentTransaction {
  id: string;
  provider: PaymentProviderName;
  status: string;
  createdAt: string;
  product?: { id?: string; name?: string };
  customer?: { id?: string; name?: string; email?: string };
  amount?: { gross?: number; net?: number; currency?: string };
}

export interface PaymentSubscription {
  subscriberCode: string;
  provider: PaymentProviderName;
  status: string;
  productName?: string;
  plan?: string;
  customer?: { name?: string; email?: string };
  accession?: string;
  nextCharge?: string;
}

/**
 * Capacidades por provider — Stripe e Hotmart NÃO têm paridade e não se
 * deve forçar uma. Consumidores checam a capability, não o provider.
 */
export const PROVIDER_CAPABILITIES: Record<
  PaymentProviderName,
  Record<string, boolean>
> = {
  hotmart: {
    "sales.read": true,
    "sales.refund": true,
    "subscription.read": true,
    "subscription.cancel": true,
    "subscription.reactivate": true,
    "subscription.change_due_day": true,
    "checkout.dynamic_session": false, // checkout é por oferta criada no painel
    "checkout.embedded": false, // hospedado em pay.hotmart.com (ou widget)
    "checkout.order_bump_api": false, // bump se configura no painel, não via API
  },
  stripe: {
    "sales.read": true,
    "sales.refund": true,
    "subscription.read": true,
    "subscription.cancel": true,
    "subscription.reactivate": true,
    "subscription.change_due_day": false,
    "checkout.dynamic_session": true,
    "checkout.embedded": true,
    "checkout.order_bump_api": true,
  },
};
