// Seleção de provider financeiro do runtime.
//
// A Hotmart é o provider ativo desde 29/08 (decisão do dono, depois de mais
// um `transaction_not_allowed` na Stripe). A Stripe fica DESLIGADA para
// cobranças novas, mas 100% preservada no código.
//
//   PAYMENT_PROVIDER=stripe   escotilha explícita de volta, sem deploy.
//                             Qualquer outro valor (ou nenhum) significa
//                             Hotmart.
//   STRIPE_ENABLED=false      corta TODA criação de sessão nova na Stripe.
//
// ── A TRAVA ──────────────────────────────────────────────────────────────
//
// Hotmart só assume de verdade quando ela consegue ENTREGAR. A entrega
// inteira depende do webhook, e o webhook rejeita tudo sem `HOTMART_HOTTOK`
// — então um deploy com a Hotmart ligada e o hottok faltando venderia e não
// entregaria, que é pior que não vender. Enquanto o token não estiver no
// ambiente, o runtime continua na Stripe e `/api/health` diz por quê.
//
// Isto não é a "regra de ouro" sendo quebrada: aquela regra proíbe cair
// para a Stripe quando a Hotmart FALHA em runtime, e continua valendo (ver
// /api/quiz/checkout). Esta trava age antes disso, sobre configuração
// incompleta — nunca sobre uma cobrança em curso.
//
// O webhook da Stripe (/api/stripe/webhook) fica ATIVO de qualquer forma:
// ele só reage a eventos assinados pela Stripe e precisa continuar honrando
// compras feitas antes da troca (entitlements, reembolsos). Desligá-lo
// perderia clientes reais.

export type PaymentProviderName = "stripe" | "hotmart";

/**
 * A Hotmart consegue entregar o que vender?
 *
 * Um único requisito, e é o que basta: sem o hottok o webhook rejeita toda
 * notificação de compra, e quem pagar fica sem acesso.
 */
export function hotmartArmed(): boolean {
  return Boolean(process.env.HOTMART_HOTTOK?.trim());
}

export function activeProvider(): PaymentProviderName {
  // Volta explícita para a Stripe, sem deploy.
  if (process.env.PAYMENT_PROVIDER === "stripe") return "stripe";
  return hotmartArmed() ? "hotmart" : "stripe";
}

/**
 * A troca foi pedida mas não pôde acontecer? Serve ao diagnóstico — sem
 * isto o dono veria "ainda estou na Stripe" sem nenhuma pista do motivo.
 */
export function hotmartBlockedReason(): string | null {
  if (process.env.PAYMENT_PROVIDER === "stripe") return null;
  return hotmartArmed() ? null : "HOTMART_HOTTOK ausente no ambiente";
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
