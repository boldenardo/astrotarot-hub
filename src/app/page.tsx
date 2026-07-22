"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Star, Sparkles, Heart, Crown } from "lucide-react";
import { CHECKOUT_PLANS } from "@/lib/plans";

const freePerks = [
  "4 free tarot readings",
  "Egyptian Tarot insights",
  "AI Spiritual Guide",
];

const testimonials = [
  {
    name: "Sarah M.",
    text: "I finally found clarity about my path in love. The accuracy genuinely surprised me.",
    rating: 5,
    location: "Austin, TX",
  },
  {
    name: "Emily R.",
    text: "I discovered my purpose and everything started to make sense. An incredible tool.",
    rating: 5,
    location: "Portland, OR",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />

      {/* Plans & pricing */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl md:text-5xl">
              Start free, upgrade whenever you want
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-400 sm:text-lg">
              Experience the magic with no commitment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="glass rounded-4xl border-white/8 p-6 sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Sparkles className="h-6 w-6 text-ink-200" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-ink-50">
                    Free
                  </h3>
                  <p className="text-sm text-ink-600">No credit card required</p>
                </div>
              </div>
              <ul className="mb-8 space-y-4">
                {freePerks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink-400" />
                    <span className="text-ink-200">{perk}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/challenge"
                className="btn-ghost block rounded-full py-4 text-center font-semibold"
              >
                Start Free
              </Link>
            </motion.div>

            {/* 5-Reading Pack */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass rounded-4xl border-white/8 p-6 sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10">
                  <Star className="h-6 w-6 text-gold-300" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-ink-50">
                    {CHECKOUT_PLANS.PACK5.name}
                  </h3>
                  <p className="text-sm text-ink-400">
                    <span className="text-gold">
                      {CHECKOUT_PLANS.PACK5.priceLabel}
                    </span>{" "}
                    &bull; {CHECKOUT_PLANS.PACK5.period}
                  </p>
                </div>
              </div>
              <ul className="mb-8 space-y-4">
                {CHECKOUT_PLANS.PACK5.features.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-400" />
                    <span className="text-ink-200">{perk}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/cart?plan=pack5"
                className="btn-ghost block rounded-full py-4 text-center font-semibold"
              >
                Buy Pack
              </Link>
            </motion.div>

            {/* Unlimited Premium */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass glass-gold relative overflow-hidden rounded-4xl p-6 sm:p-8"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold-400/10 blur-3xl" />
              <div className="mb-4 inline-block rounded-full bg-gold-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-300 sm:absolute sm:right-6 sm:top-6 sm:mb-0">
                Most Popular
              </div>

              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold">
                  <Crown className="h-6 w-6 text-night-900" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-ink-50">
                    {CHECKOUT_PLANS.PREMIUM.name}
                  </h3>
                  <p className="text-sm text-ink-400">
                    <span className="text-gold">
                      {CHECKOUT_PLANS.PREMIUM.priceLabel}
                    </span>{" "}
                    &bull; {CHECKOUT_PLANS.PREMIUM.period}
                  </p>
                </div>
              </div>
              <ul className="mb-8 space-y-4">
                {CHECKOUT_PLANS.PREMIUM.features.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-400" />
                    <span className="text-ink-200">{perk}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/cart?plan=premium"
                className="btn-gold block rounded-full py-4 text-center"
              >
                Subscribe to Premium
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-night-900/50 to-transparent" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center font-display text-3xl font-semibold text-ink-50 sm:text-4xl"
          >
            Real stories
          </motion.h2>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-3xl p-6 sm:p-8"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(t.rating)].map((_, s) => (
                    <Star
                      key={s}
                      className="h-5 w-5 text-gold-400"
                      fill="currentColor"
                    />
                  ))}
                </div>
                <p className="mb-6 break-words text-base italic leading-relaxed text-ink-200 sm:text-lg">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-600 font-display text-xl font-semibold text-night-900">
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-50">{t.name}</p>
                    <p className="text-sm text-ink-600">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free 4-card reading */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gold-300">
              100% Free
            </span>
            <h2 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl md:text-5xl">
              The 4-Card Reading
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-400 sm:text-lg">
              Uncover insights about your present moment with our free
              interactive reading.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass glass-gold relative overflow-hidden rounded-4xl p-6 sm:p-8 md:p-12"
          >
            <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-6 font-display text-2xl font-semibold text-gold-300">
                  How it works
                </h3>
                <div className="space-y-5">
                  {[
                    "Pick 4 cards from the shuffled Egyptian deck",
                    "Reveal the mystical meaning of each card",
                    "Receive insights on love, growth, and decisions",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-600 font-semibold text-night-900">
                        {i + 1}
                      </span>
                      <p className="text-ink-200">{step}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/challenge"
                  className="btn-gold mt-8 flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 sm:inline-flex sm:w-auto"
                >
                  <Sparkles className="h-5 w-5" />
                  Play Now, Free
                </Link>
                <p className="mt-4 text-sm text-ink-600">
                  No sign-up &bull; Completely free &bull; Unlimited
                </p>
              </div>

              <div className="relative">
                <motion.div
                  initial={{ rotate: -4 }}
                  animate={{ rotate: 4 }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] rounded-2xl border border-gold-400/30 shadow-gold"
                      style={{
                        backgroundImage:
                          'url("https://i.pinimg.com/originals/8c/de/fb/8cdefb154d4d30cf5e5ef00d1b998b6c.jpg")',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Spiritual Guide */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass glass-gold relative overflow-hidden rounded-4xl p-6 text-center sm:p-12 md:p-20"
          >
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-amethyst-500/10 blur-3xl" />
            <div className="relative z-10">
              <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10">
                <Heart className="h-8 w-8 text-gold-300" />
              </span>
              <h2 className="font-display text-3xl font-semibold leading-tight text-ink-50 sm:text-4xl md:text-5xl">
                Your personal spiritual guide
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-400 sm:text-lg">
                Chat with our AI specialized in emotional and spiritual
                well-being.
                <span className="mt-2 block font-medium text-gold-300">
                  Comfort &bull; Guidance &bull; Reflection
                </span>
              </p>
              <Link
                href="/guia"
                className="btn-gold mt-8 flex w-full items-center justify-center gap-2 rounded-full px-10 py-4 text-base sm:inline-flex sm:w-auto sm:py-5 sm:text-lg"
              >
                <Sparkles className="h-5 w-5" />
                Talk to the Guide
              </Link>
              <p className="mt-6 text-sm text-ink-600">
                Available 24/7 &bull; Confidential &bull; Positive psychology
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-ink-600 sm:px-6">
          <p>© 2026 AstroTarot Hub &bull; All rights reserved</p>
          <p className="mt-2">
            Built to help you find clarity and direction.
          </p>
        </div>
      </footer>
    </main>
  );
}
