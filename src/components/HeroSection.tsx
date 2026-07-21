"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield, Zap, Star, ChevronDown, Moon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Light fallback shown while the 3D Canvas has not mounted yet.
function Hero3DFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-gold-400/30 border-t-gold-400" />
    </div>
  );
}

// Light, static visual (no three.js) for mobile.
function StaticMysticVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute h-64 w-64 rounded-full bg-gold-400/15 blur-3xl" />
      <div className="absolute h-80 w-80 rounded-full bg-amethyst-500/10 blur-3xl" />
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="glass glass-gold relative flex h-44 w-44 items-center justify-center rounded-full shadow-gold"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400/10 to-transparent" />
        <Moon className="h-16 w-16 text-gold-300" strokeWidth={1.25} />
        <motion.span
          className="absolute -right-1 -top-1"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-7 w-7 text-gold-200" />
        </motion.span>
      </motion.div>
    </div>
  );
}

const FortuneTeller3D = dynamic(() => import("./FortuneTeller3D"), {
  ssr: false,
  loading: () => <Hero3DFallback />,
});

export default function HeroSection() {
  // We only mount the 3D Canvas on desktop and after first paint, so the
  // landing loads instantly and never blocks on small screens.
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Mobile = width < 768px → light static visual instead of the Canvas.
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    setMounted(true);
    return () => query.removeEventListener("change", update);
  }, []);

  const show3D = mounted && isDesktop;

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
                Discover your path through the stars
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-display text-5xl font-semibold leading-[1.05] text-ink-50 md:text-7xl lg:text-[5.25rem]"
            >
              Unlock your <span className="text-gold">inner power</span>
              <br />
              with Tarot &amp; Astrology
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mx-auto mt-6 max-w-xl text-lg text-ink-400 lg:mx-0 lg:text-xl"
            >
              Connect with the universe through personalized tarot readings,
              detailed birth charts, and celestial guidance to light up your
              path.
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
                Start Free
              </Link>
              <Link
                href="/cart?plan=premium"
                className="btn-ghost flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium"
              >
                <Star className="h-5 w-5 text-gold-300" />
                Unlock Premium
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
                Private &amp; secure
              </span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold-400" />
                Instant results
              </span>
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gold-400" fill="currentColor" />
                4.9/5 satisfaction
              </span>
            </motion.div>
          </div>

          {/* Visual — 3D on desktop, light static visual on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative h-[380px] w-full sm:h-[460px] lg:h-[600px]"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amethyst-500/10 to-transparent blur-3xl" />
            {show3D ? <FortuneTeller3D /> : <StaticMysticVisual />}
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
          <span className="text-xs uppercase tracking-[0.2em]">Explore</span>
          <ChevronDown className="h-5 w-5 text-gold-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
