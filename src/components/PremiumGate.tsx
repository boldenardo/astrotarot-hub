"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Check, Sparkles, LogIn } from "lucide-react";
import { getUserProfile } from "@/lib/auth-client";
import {
  CHECKOUT_PLANS,
  FEATURE_LABELS,
  canUseFeature,
  type PremiumFeature,
  type PlanProfile,
} from "@/lib/plans";

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
}

type GateStatus = "loading" | "anonymous" | "blocked" | "allowed";

/**
 * Envolve conteúdo exclusivo do plano Premium Ilimitado.
 * - Carregando: spinner místico
 * - Sem login: CTA para /auth/login
 * - Logado sem premium: tela de bloqueio com oferta do plano
 * - Premium ativo: renderiza o conteúdo normalmente
 */
export default function PremiumGate({ feature, children }: PremiumGateProps) {
  const [status, setStatus] = useState<GateStatus>("loading");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const profile = (await getUserProfile()) as PlanProfile;
        if (!active) return;
        setStatus(canUseFeature(profile, feature) ? "allowed" : "blocked");
      } catch {
        // getUserProfile lança erro quando não há sessão ativa
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
        <p className="text-ink-400">Consultando os astros...</p>
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
            Entre para continuar
          </h2>
          <p className="mb-6 text-ink-400">
            Faça login para acessar {FEATURE_LABELS[feature].toLowerCase()} e
            todos os recursos do seu portal místico.
          </p>
          <Link
            href="/auth/login"
            className="btn-gold block w-full rounded-full py-4 text-center font-semibold"
          >
            Fazer login
          </Link>
        </motion.div>
      </div>
    );
  }

  // blocked: logado, mas sem plano premium ativo
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
          Recurso Premium
        </p>
        <h2 className="mb-3 font-display text-3xl font-semibold text-ink-50">
          {FEATURE_LABELS[feature]}
        </h2>
        <p className="mb-8 text-ink-400">
          Este recurso é exclusivo do plano{" "}
          <span className="text-gold-300">{CHECKOUT_PLANS.PREMIUM.name}</span>.
          Desbloqueie agora e acesse tudo o que os astros têm a revelar:
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
          <span className="text-ink-400">/mês</span>
        </div>

        <Link
          href="/cart?plan=premium"
          className="btn-gold mb-4 flex w-full items-center justify-center gap-2 rounded-full py-4 font-semibold"
        >
          <Sparkles className="h-5 w-5" />
          Desbloquear com Premium Ilimitado
        </Link>
        <Link
          href="/cart"
          className="text-sm text-ink-400 underline-offset-4 transition-colors hover:text-gold-300 hover:underline"
        >
          Ver todos os planos
        </Link>
      </motion.div>
    </div>
  );
}
