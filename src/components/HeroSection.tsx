"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield, Zap, Star, ChevronDown } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FortuneTeller3D = dynamic(() => import("./FortuneTeller3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-gold-400/40 border-t-gold-400" />
    </div>
  ),
});

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,92,255,0.14),transparent_60%)]" />
        <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.08),transparent_45%)]" />

        {/* Subtle stars */}
        {[
          [12, 22],
          [82, 18],
          [68, 62],
          [24, 74],
          [46, 12],
          [90, 48],
          [8, 52],
          [58, 84],
        ].map(([left, top], i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ left: `${left}%`, top: `${top}%` }}
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{
              duration: 3 + (i % 3),
              delay: i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Rotating zodiac wheel */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
          animate={{ rotate: 360 }}
          transition={{ duration: 160, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" className="h-full w-full">
            {[90, 70, 50].map((r) => (
              <circle
                key={r}
                cx="100"
                cy="100"
                r={r}
                stroke="url(#goldGrad)"
                strokeWidth="0.4"
                fill="none"
              />
            ))}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={100 + 90 * Math.cos(angle)}
                  y2={100 + 90 * Math.sin(angle)}
                  stroke="url(#goldGrad)"
                  strokeWidth="0.25"
                />
              );
            })}
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F7ECC9" />
                <stop offset="100%" stopColor="#A9822F" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass glass-gold mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2"
            >
              <Sparkles className="h-4 w-4 text-gold-300" />
              <span className="text-sm font-medium text-ink-200">
                Descubra seu caminho através dos astros
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-display text-5xl font-semibold leading-[1.05] text-ink-50 md:text-7xl lg:text-[5.25rem]"
            >
              Descubra seu <span className="text-gold">poder interior</span>
              <br />
              com Tarot e Astrologia
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mx-auto mt-6 max-w-xl text-lg text-ink-400 lg:mx-0 lg:text-xl"
            >
              Conecte-se com o universo através de leituras de tarot
              personalizadas, mapas astrais detalhados e orientação celestial
              para iluminar seu caminho.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link
                href="/challenge"
                className="btn-gold flex items-center gap-2 rounded-full px-8 py-4 text-base"
              >
                <Sparkles className="h-5 w-5" />
                Começar Grátis
              </Link>
              <Link
                href="/cart?plan=premium"
                className="btn-ghost flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium"
              >
                <Star className="h-5 w-5 text-gold-300" />
                Desbloquear Premium
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-400 lg:justify-start"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold-400" />
                Privado e seguro
              </span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold-400" />
                Resultados instantâneos
              </span>
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gold-400" fill="currentColor" />
                4,9/5 de satisfação
              </span>
            </motion.div>
          </div>

          {/* 3D model */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative hidden h-[600px] w-full lg:block"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amethyst-500/10 to-transparent blur-3xl" />
            <FortuneTeller3D />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-ink-400"
        >
          <span className="text-xs uppercase tracking-[0.2em]">Explorar</span>
          <ChevronDown className="h-5 w-5 text-gold-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
