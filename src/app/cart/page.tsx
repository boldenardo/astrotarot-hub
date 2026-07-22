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
    trackPageView("/cart", "Plans");
  }, []);

  const handleCheckout = async (plan: CheckoutPlanKey) => {
    if (loadingPlan) return;
    setError(null);
    setLoadingPlan(plan);
    trackPaymentInitiated(plan, PLAN_PRICES[plan]);

    try {
      await startCheckout(plan);
      // On success the browser is redirected to Stripe; we keep the
      // loading state until the navigation happens.
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't start the payment. Please try again."
      );
      setLoadingPlan(null);
    }
  };

  const pack5 = CHECKOUT_PLANS.PACK5;
  const premium = CHECKOUT_PLANS.PREMIUM;

  return (
    <div className="relative min-h-screen text-ink-200 pt-24 pb-12">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,92,255,0.12),transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 text-gold-400" />
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-ink-50">
              Choose your <span className="text-gold">plan</span>
            </h1>
          </div>
          <p className="text-ink-400 max-w-2xl mx-auto">
            Unlock tarot readings and the full power of personalized astrology.
            Cancel anytime.
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 max-w-2xl mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* 5-Reading Pack */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass rounded-3xl p-6 sm:p-8 flex flex-col transition-all ${
              highlightedPlan === "PACK5"
                ? "border-gold-400/60 ring-1 ring-gold-400/40"
                : "border-white/5 hover:border-gold-400/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gold-300" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink-50 break-words">
                {pack5.name}
              </h2>
            </div>

            <div className="mb-6 mt-4">
              <span className="text-3xl sm:text-4xl font-semibold text-ink-50">
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
                  Redirecting...
                </>
              ) : (
                "Buy pack"
              )}
            </button>
          </motion.div>

          {/* Unlimited Premium */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`relative glass glass-gold rounded-3xl p-6 sm:p-8 flex flex-col transition-all ${
              highlightedPlan === "PREMIUM"
                ? "border-gold-400/70 ring-2 ring-gold-400/40"
                : "hover:border-gold-400/50"
            }`}
          >
            {/* Most popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="btn-gold rounded-full px-5 py-1.5 text-sm font-semibold inline-flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                Most popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2 mt-2">
              <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold flex items-center justify-center">
                <Crown className="w-6 h-6 text-night-900" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink-50 break-words">
                {premium.name}
              </h2>
            </div>

            <div className="mb-6 mt-4">
              <span className="text-3xl sm:text-4xl font-semibold text-gold">
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
                  Redirecting...
                </>
              ) : (
                "Subscribe to Premium"
              )}
            </button>
          </motion.div>
        </div>

        {/* Security */}
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
                  Secure payment via Stripe
                </p>
                <p className="text-sm text-ink-400">
                  Your card details are processed directly by Stripe.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-400">
              <Lock className="w-4 h-4 text-gold-300" />
              End-to-end encryption
            </div>
          </div>
        </motion.div>

        {/* Back */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link
            href="/"
            className="text-gold-300 hover:text-gold-200 transition-colors inline-flex items-center gap-2 px-4 py-2.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Keep exploring
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
