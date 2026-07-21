"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Crown,
  Check,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CHECKOUT_PLANS, type CheckoutPlanKey } from "@/lib/plans";
import { startCheckout } from "@/lib/payment-client";
import { trackPageView, trackPaymentInitiated } from "@/lib/analytics";

const PLAN_PRICES: Record<CheckoutPlanKey, number> = {
  PACK5: 9.99,
  PREMIUM: 29.9,
};

function PlansContent() {
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planParam = (searchParams.get("plan") || "").toLowerCase();
  const highlightedPlan: CheckoutPlanKey | null =
    planParam === "premium" ? "PREMIUM" : planParam === "pack5" ? "PACK5" : null;

  useEffect(() => {
    trackPageView("/cart", "Planos");
  }, []);

  const handleCheckout = async (plan: CheckoutPlanKey) => {
    if (loadingPlan) return;
    setError(null);
    setLoadingPlan(plan);
    trackPaymentInitiated(plan, PLAN_PRICES[plan]);

    try {
      await startCheckout(plan);
      // Em caso de sucesso o navegador é redirecionado para o Stripe;
      // mantemos o loading até a navegação acontecer.
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível iniciar o pagamento. Tente novamente."
      );
      setLoadingPlan(null);
    }
  };

  const pack5 = CHECKOUT_PLANS.PACK5;
  const premium = CHECKOUT_PLANS.PREMIUM;

  return (
    <div className="relative min-h-screen text-ink-200 pt-24 pb-12">
      {/* Fundo ambiente */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,92,255,0.12),transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-gold-400" />
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-50">
              Escolha seu <span className="text-gold">plano</span>
            </h1>
          </div>
          <p className="text-ink-400 max-w-2xl mx-auto">
            Desbloqueie leituras de tarot e todo o poder da astrologia
            personalizada. Cancele quando quiser.
          </p>
        </motion.div>

        {/* Erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 max-w-2xl mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Cards de planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Pacote 5 Leituras */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass rounded-3xl p-8 flex flex-col transition-all ${
              highlightedPlan === "PACK5"
                ? "border-gold-400/60 ring-1 ring-gold-400/40"
                : "border-white/5 hover:border-gold-400/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gold-300" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-ink-50">
                {pack5.name}
              </h2>
            </div>

            <div className="mb-6 mt-4">
              <span className="text-4xl font-semibold text-ink-50">
                {pack5.priceLabel}
              </span>
              <span className="text-ink-400 ml-2 text-sm">{pack5.period}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {pack5.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <span className="text-ink-200">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("PACK5")}
              disabled={loadingPlan !== null}
              className="w-full rounded-full py-4 px-8 border border-gold-400/40 bg-white/5 text-gold-300 font-semibold hover:border-gold-400/70 hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === "PACK5" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                "Comprar pacote"
              )}
            </button>
          </motion.div>

          {/* Premium Ilimitado */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`relative glass glass-gold rounded-3xl p-8 flex flex-col transition-all ${
              highlightedPlan === "PREMIUM"
                ? "border-gold-400/70 ring-2 ring-gold-400/40"
                : "hover:border-gold-400/50"
            }`}
          >
            {/* Selo Mais popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="btn-gold rounded-full px-5 py-1.5 text-sm font-semibold inline-flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                Mais popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold flex items-center justify-center">
                <Crown className="w-6 h-6 text-night-900" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-ink-50">
                {premium.name}
              </h2>
            </div>

            <div className="mb-6 mt-4">
              <span className="text-4xl font-semibold text-gold">
                {premium.priceLabel}
              </span>
              <span className="text-ink-400 ml-2 text-sm">
                {premium.period}
              </span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {premium.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <span className="text-ink-100">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("PREMIUM")}
              disabled={loadingPlan !== null}
              className="btn-gold w-full rounded-full py-4 px-8 font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loadingPlan === "PREMIUM" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                "Assinar Premium"
              )}
            </button>
          </motion.div>
        </div>

        {/* Segurança */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-12 glass rounded-3xl p-6 border-white/5 max-w-3xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-gold-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-ink-50">
                  Pagamento seguro via Stripe
                </p>
                <p className="text-sm text-ink-400">
                  Seus dados de cartão são processados diretamente pelo Stripe.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-400">
              <Lock className="w-4 h-4 text-gold-300" />
              Criptografia de ponta a ponta
            </div>
          </div>
        </motion.div>

        {/* Voltar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link
            href="/"
            className="text-gold-300 hover:text-gold-200 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar explorando
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-ink-200">
          <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
        </div>
      }
    >
      <PlansContent />
    </Suspense>
  );
}
