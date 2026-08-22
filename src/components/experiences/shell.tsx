"use client";

// Peças compartilhadas das experiências do produto: chamada à API com os
// estados de gate (login / sem créditos / IA indisponível), estado "a Aura
// está escrevendo", e blocos de leitura estruturada.

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export type GateState = "auth" | "credits" | "error" | null;

export function useExperienceCall<T>(feature: string) {
  const [busy, setBusy] = useState(false);
  const [gate, setGate] = useState<GateState>(null);
  const [result, setResult] = useState<T | null>(null);
  const [readingsLeft, setReadingsLeft] = useState<number | "unlimited" | null>(null);

  const call = useCallback(
    async (url: string, body: unknown) => {
      setBusy(true);
      setGate(null);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as {
          result?: T;
          readingsLeft?: number | "unlimited";
          code?: string;
        };
        if (res.status === 401) {
          setGate("auth");
          trackEvent("experience_gate", { category: "experience", feature, label: "auth" });
          return null;
        }
        if (res.status === 402) {
          setGate("credits");
          trackEvent("experience_gate", { category: "experience", feature, label: "credits" });
          return null;
        }
        if (!res.ok || !data.result) {
          setGate("error");
          trackEvent("experience_error", { category: "experience", feature, status: res.status });
          return null;
        }
        setResult(data.result);
        setReadingsLeft(data.readingsLeft ?? null);
        trackEvent("experience_result", { category: "experience", feature });
        return data.result;
      } catch {
        setGate("error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [feature]
  );

  return { busy, gate, result, readingsLeft, call, reset: () => { setResult(null); setGate(null); } };
}

export function AuraWriting({ text = "Master Aura is writing your reading…" }: { text?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center py-10 text-center">
      <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2.2 }} className="rounded-full p-[3px] ring-2 ring-[rgba(212,175,55,0.5)]">
        <Image src="/brand/master-aura.webp" alt="" width={96} height={96} className="h-20 w-20 rounded-full object-cover" />
      </motion.div>
      <p className="mt-4 text-[15px] text-white/80">{text}</p>
      <span className="mt-3 flex gap-1.5">
        {[0, 1, 2].map((d) => (
          <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#d4af37]/70" style={{ animationDelay: `${d * 140}ms` }} />
        ))}
      </span>
    </div>
  );
}

export function GateNotice({ gate, returnTo, onRetry }: { gate: GateState; returnTo: string; onRetry?: () => void }) {
  if (!gate) return null;
  if (gate === "auth") {
    return (
      <div className="glass mx-auto w-full max-w-lg rounded-3xl p-6 text-center">
        <Lock className="mx-auto h-7 w-7 text-[#d4af37]" aria-hidden />
        <h3 className="mt-3 font-display text-xl font-semibold text-ink-50">Sign in to receive your reading</h3>
        <p className="mt-2 text-sm text-white/70">Your answers are ready. An account keeps your readings and rituals in one private place — free to start.</p>
        <Link href={`/auth/register?redirect_url=${encodeURIComponent(returnTo)}`} className="btn-gold mt-5 flex min-h-[50px] items-center justify-center rounded-2xl text-sm font-semibold">
          Create my free account
        </Link>
        <Link href={`/auth/login?redirect_url=${encodeURIComponent(returnTo)}`} className="btn-ghost mt-3 flex min-h-[46px] items-center justify-center rounded-2xl text-sm">
          I already have one — sign in
        </Link>
      </div>
    );
  }
  if (gate === "credits") {
    return (
      <div className="glass glass-gold mx-auto w-full max-w-lg rounded-3xl p-6 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-[#d4af37]" aria-hidden />
        <h3 className="mt-3 font-display text-xl font-semibold text-ink-50">You've used your free readings</h3>
        <p className="mt-2 text-sm text-white/70">Unlimited opens every experience — readings, rituals, dreams and past lives — for $9.99 a month. Cancel anytime.</p>
        <Link href="/cart?plan=premium" className="btn-gold mt-5 flex min-h-[50px] items-center justify-center rounded-2xl text-sm font-semibold">
          Unlock everything — $9.99/mo
        </Link>
      </div>
    );
  }
  return (
    <div className="glass mx-auto w-full max-w-lg rounded-3xl p-6 text-center">
      <h3 className="font-display text-lg font-semibold text-ink-50">Master Aura couldn't finish this one</h3>
      <p className="mt-2 text-sm text-white/70">Nothing was charged. Give it another try in a moment.</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-gold mt-5 flex min-h-[48px] w-full items-center justify-center rounded-2xl text-sm font-semibold">
          Try again
        </button>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{label}</dt>
      <dd className="mt-0.5 text-[15px] leading-relaxed text-white/85">{children}</dd>
    </div>
  );
}
