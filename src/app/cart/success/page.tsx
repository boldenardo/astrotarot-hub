"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, LayoutDashboard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="relative min-h-screen text-ink-200 pt-24 pb-12 flex items-center justify-center">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,92,255,0.12),transparent_60%)]" />

      <div className="relative z-10 max-w-lg mx-auto px-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass glass-gold rounded-3xl p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-night-900" />
          </motion.div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-50 mb-4">
            Payment <span className="text-gold">confirmed!</span>
          </h1>

          <p className="text-ink-300 mb-8">
            Your access will be unlocked in moments. Thank you for trusting us
            with your spiritual journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn-gold rounded-full px-8 py-4 font-semibold transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-5 h-5" />
              Go to dashboard
            </Link>
            <Link
              href="/tarot"
              className="rounded-full px-8 py-4 font-semibold border border-gold-400/40 bg-white/5 text-gold-300 hover:border-gold-400/70 hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Get a reading
            </Link>
          </div>

          {sessionId && (
            <p className="mt-8 text-xs text-ink-600 break-all">
              Payment reference: {sessionId}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function CartSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-ink-200">
          <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
