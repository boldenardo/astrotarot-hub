"use client";

import { motion } from "framer-motion";
import { Star, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PROOF_STATS } from "@/lib/proof-stats";

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
              // toFixed evita hydration mismatch: a precisão de float do
              // Math.cos/sin pode divergir entre servidor e browser.
              return (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={(100 + 90 * Math.cos(angle)).toFixed(3)}
                  y2={(100 + 90 * Math.sin(angle)).toFixed(3)}
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
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-28 text-center sm:px-6 sm:pt-32">
        {/* Logo centerpiece with gold glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto mb-8 flex w-40 items-center justify-center sm:w-52"
        >
          <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.35),transparent_65%)] blur-2xl" />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/brand/astrotarot-logo.png"
              alt="AstroTarot"
              width={416}
              height={416}
              priority
              className="h-auto w-40 object-contain drop-shadow-[0_0_28px_rgba(212,175,55,0.4)] sm:w-52"
            />
          </motion.div>
        </motion.div>

        {/* Eyebrow badge — prova social imediata acima do H1 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300 sm:text-sm"
        >
          <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden />
          {PROOF_STATS.rating}/5 &mdash; {PROOF_STATS.readings} readings delivered
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="break-words font-display text-4xl font-semibold leading-[1.05] text-ink-50 drop-shadow-[0_0_30px_rgba(124,92,255,0.35)] sm:text-5xl md:text-6xl lg:text-7xl"
        >
          What do the cards say about
          <br />
          your{" "}
          <span className="text-gold drop-shadow-[0_0_24px_rgba(212,175,55,0.45)]">
            love, money &amp; future
          </span>
          ?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-6 max-w-xl text-base text-ink-400 sm:text-lg lg:text-xl"
        >
          Answer a few quick questions and get your personal reading in 2
          minutes. Discover who your soulmate is, when money is coming, and what
          the stars have planned for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/quiz"
            className="btn-gold flex w-full items-center justify-center rounded-full px-8 py-4 text-base sm:w-auto"
          >
            Start my free reading
          </Link>
          {/* Visitante frio vai pro FUNIL, não pro /cart (rota protegida —
              cair em tela de login antes de ver preço mata a conversão). */}
          <Link
            href="/quiz"
            className="btn-ghost flex w-full items-center justify-center rounded-full px-8 py-4 text-base font-medium sm:w-auto"
          >
            Find your soulmate
          </Link>
        </motion.div>

        {/* Trust row — rostos reais de membros + rating */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 text-sm text-ink-400"
        >
          <span className="flex items-center">
            <span className="flex -space-x-2.5" aria-hidden="true">
              {["/testimonials/t7.jpg", "/testimonials/t1.jpg", "/testimonials/t6.jpg", "/testimonials/t4.jpg", "/testimonials/t3.jpg"].map(
                (src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={64}
                    height={64}
                    className="h-9 w-9 rounded-full border-2 border-night-900 object-cover"
                  />
                )
              )}
            </span>
            <span className="ml-3 flex flex-col items-start leading-tight">
              <span className="flex items-center gap-0.5" aria-label="4.9 out of 5 stars">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 text-gold-400"
                    fill="currentColor"
                  />
                ))}
              </span>
              <span className="text-xs text-ink-400">
                Trusted by <span className="font-semibold text-ink-100">{PROOF_STATS.readings}</span> seekers
              </span>
            </span>
          </span>
          <span className="text-xs">
            Free to start &bull; 2-minute reading &bull; No credit card required
          </span>
        </motion.div>
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
