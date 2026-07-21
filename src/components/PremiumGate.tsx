"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Check, Sparkles, LogIn } from "lucide-react";
import { getMyProfile } from "@/lib/client/me";
import {
  CHECKOUT_PLANS,
  FEATURE_LABELS,
  canUseFeature,
  type PremiumFeature,
} from "@/lib/plans";

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
}

type GateStatus = "loading" | "anonymous" | "blocked" | "allowed";

/**
 * Wraps content exclusive to the Unlimited Premium plan.
 * - Loading: mystic spinner
 * - Signed out: CTA to /auth/login
 * - Signed in without premium: lock screen with the plan offer
 * - Premium active: renders the content normally
 */
export default function PremiumGate({ feature, children }: PremiumGateProps) {
  const [status, setStatus] = useState<GateStatus>("loading");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const profile = await getMyProfile();
        if (!active) return;
        if (!profile) {
          setStatus("anonymous");
          return;
        }
        setStatus(canUseFeature(profile, feature) ? "allowed" : "blocked");
      } catch {
        if (!active) return;
        setStatus("anonymous");
      }
    })();

    return () => {
      active = false;
    };
  }, [feature]);

  if (status === "allowed") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6 h-16 w-16 rounded-full border-4 border-gold-400/40 border-t-gold-400"
        />
        <p className="text-ink-400">Consulting the stars...</p>
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-gold w-full max-w-md rounded-3xl p-8 text-center shadow-glass"
        >
          <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10">
            <LogIn className="h-8 w-8 text-gold-300" />
          </span>
          <h2 className="mb-2 font-display text-2xl font-semibold text-ink-50">
            Sign in to continue
          </h2>
          <p className="mb-6 text-ink-400">
            Sign in to access {FEATURE_LABELS[feature].toLowerCase()} and every
            feature of your mystic portal.
          </p>
          <Link
            href="/auth/login"
            className="btn-gold block w-full rounded-full py-4 text-center font-semibold"
          >
            Sign in
          </Link>
        </motion.div>
      </div>
    );
  }

  // blocked: signed in, but without an active premium plan
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glass-gold w-full max-w-lg rounded-3xl p-8 text-center shadow-glass md:p-10"
      >
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10"
        >
          <Lock className="h-8 w-8 text-gold-300" />
        </motion.span>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
          Premium Feature
        </p>
        <h2 className="mb-3 font-display text-3xl font-semibold text-ink-50">
          {FEATURE_LABELS[feature]}
        </h2>
        <p className="mb-8 text-ink-400">
          This feature is exclusive to the{" "}
          <span className="text-gold-300">{CHECKOUT_PLANS.PREMIUM.name}</span>{" "}
          plan. Unlock it now and access everything the stars have to reveal:
        </p>

        <ul className="mb-8 space-y-3 text-left">
          {CHECKOUT_PLANS.PREMIUM.features.map((item) => (
            <li key={item} className="flex items-start gap-3 text-ink-200">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-400" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mb-6">
          <span className="font-display text-4xl font-semibold text-gold">
            {CHECKOUT_PLANS.PREMIUM.priceLabel}
          </span>
          <span className="text-ink-400">/month</span>
        </div>

        <Link
          href="/cart?plan=premium"
          className="btn-gold mb-4 flex w-full items-center justify-center gap-2 rounded-full py-4 font-semibold"
        >
          <Sparkles className="h-5 w-5" />
          Unlock with Unlimited Premium
        </Link>
        <Link
          href="/cart"
          className="text-sm text-ink-400 underline-offset-4 transition-colors hover:text-gold-300 hover:underline"
        >
          See all plans
        </Link>
      </motion.div>
    </div>
  );
}
