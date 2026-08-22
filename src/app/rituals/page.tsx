// /rituals — hub. Substitui conceitualmente o antigo Fortune/Prosperity
// (/abundance → 301 aqui). SSR público com SEO; a experiência em si é
// client e pede login só na hora de gerar (APIs).

import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { moonContext } from "@/lib/experiences/moon";
import { RITUAL_LABELS } from "@/lib/experiences/prompts";
import { RITUAL_TYPES, type RitualType } from "@/lib/experiences/types";

export const metadata: Metadata = {
  title: "Personal Rituals — Luck, Money, Love, Cord Cutting & More",
  description:
    "A short conversation with Master Aura, then a ritual written for you: candle, card, intention and tonight's moon. Luck, money, love, cord cutting, protection, energy cleanse, new beginnings.",
  alternates: { canonical: "https://astrotarot.shop/rituals" },
  openGraph: {
    title: "Personal Rituals",
    description: "Tell Master Aura what you want to invite in. She writes the ritual.",
    url: "https://astrotarot.shop/rituals",
  },
};

export const revalidate = 3600;

const EMOJI: Record<RitualType, string> = {
  luck: "🍀",
  money: "🪙",
  love: "🌹",
  "cord-cutting": "🕯️",
  protection: "🛡️",
  "energy-cleanse": "💧",
  "new-beginning": "🌅",
  moon: "🌙",
};

export default function RitualsHub() {
  const moon = moonContext();
  const featured: RitualType[] = ["luck", "cord-cutting"];
  const rest = RITUAL_TYPES.filter((t) => !featured.includes(t));

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Rituals", path: "/rituals" }])} />
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:pt-32">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
          {moon.emoji} Tonight: {moon.label} — {moon.guidance}
        </p>
        <h1 className="mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight text-ink-50 sm:text-5xl">
          Tell Master Aura what you want to invite in.
          <span className="block text-gold">She writes the ritual.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-300">
          Three questions, then a ritual made for you — a candle, a card, an intention in your own words, and tonight&apos;s real moon. Something to actually do, not just read.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featured.map((t) => (
            <Link
              key={t}
              href={`/rituals/${t}`}
              className="glass glass-gold group relative rounded-3xl border-white/5 p-6 transition-all hover:border-gold-400/40"
            >
              <span className="text-3xl" aria-hidden>{EMOJI[t]}</span>
              <h2 className="mt-3 font-display text-2xl font-semibold text-ink-50">{RITUAL_LABELS[t].title}</h2>
              <p className="mt-1 text-sm text-ink-300">{RITUAL_LABELS[t].tagline}</p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-gold">
                Begin <span aria-hidden className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>

        <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">More rituals</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rest.map((t) => (
            <Link
              key={t}
              href={`/rituals/${t}`}
              className="glass rounded-2xl border-white/5 p-4 transition-all hover:border-gold-400/30"
            >
              <span className="text-2xl" aria-hidden>{EMOJI[t]}</span>
              <h3 className="mt-2 text-sm font-semibold text-ink-50">{RITUAL_LABELS[t].title}</h3>
              <p className="mt-0.5 text-xs leading-snug text-ink-400">{RITUAL_LABELS[t].tagline}</p>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-xs text-ink-600">
          Rituals are a guided moment of reflection — for entertainment and reflection, never a substitute for professional advice.
        </p>
      </section>
    </main>
  );
}
