"use client";

// Home. Ordem: tarot (produto principal) → alma gêmea (o retrato) →
// prova → planos → o resto do catálogo em uma faixa.
//
// A versão anterior abria com seis cards de features (dinheiro, horóscopo,
// mapa astral, números) antes de qualquer um dos dois produtos, e a
// leitura de tarot — o que a pessoa veio buscar — só aparecia perto do
// rodapé. Agora cada bloco vende uma coisa só.

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TarotSection from "@/components/TarotSection";
import SoulmateSection from "@/components/SoulmateSection";
import AlsoIncluded from "@/components/AlsoIncluded";
import FaqSection from "@/components/FaqSection";
import { HOME_FAQS } from "@/lib/faq-data";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Star, Sparkles, Crown } from "lucide-react";
import { CHECKOUT_PLANS } from "@/lib/plans";

const freePerks = [
  "4 free tarot readings",
  "Egyptian Tarot insights",
  "Spiritual Guide",
];

const testimonials = [
  {
    name: "Sarah M.",
    text: "The cards named the thing I hadn't told anyone. Then the portrait looked like someone I'd already met.",
    rating: 5,
    location: "Austin, TX",
    photo: "/testimonials/t6.jpg",
  },
  {
    name: "Emily R.",
    text: "I've paid for readings before and got horoscope copy. This one actually answered what I asked.",
    rating: 5,
    location: "Portland, OR",
    photo: "/testimonials/t3.jpg",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />

      {/* 1. Tarot — o produto principal, logo abaixo da dobra. */}
      <TarotSection />

      {/* 2. Alma gêmea — a VSL mora dentro dela, é o argumento do retrato. */}
      <SoulmateSection />

      {/* Prova social */}
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
                  <Image
                    src={t.photo}
                    alt={t.name}
                    width={96}
                    height={96}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-gold-400/40"
                  />
                  <div>
                    <p className="font-semibold text-ink-50">{t.name}</p>
                    <p className="text-sm text-ink-600">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Casais: a prova que importa para o retrato é gente junta. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {["couple-1", "couple-2", "couple-3", "couple-4"].map((c) => (
              <Image
                key={c}
                src={`/social-proof/${c}.webp`}
                alt=""
                width={320}
                height={320}
                className="aspect-square w-full rounded-2xl object-cover ring-1 ring-white/10"
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Planos */}
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

            {/* 5-Reading Pack SAIU DA VITRINE (24/08): ficava ao lado do
                Unlimited com o MESMO número — "$9.99 pagamento único" e
                "$9.99/mês" — e o visitante parava para entender a diferença
                em vez de escolher. A escada agora é Free → Soulmate Reading
                $29 → Unlimited $9.99/mês. Quem já comprou o pacote continua
                com o acesso: só o cartão da home saiu, o plano segue válido
                em /cart?plan=pack5 e no gating. */}

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
              {/* Visitante frio: começa pelo funil (grátis), não pelo /cart
                  protegido — login antes de ver preço mata a conversão. */}
              <Link
                href="/quiz"
                className="btn-gold block rounded-full py-4 text-center"
              >
                Start with a free reading
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Resto do catálogo, sem competir com os dois produtos. */}
      <AlsoIncluded />

      {/* FAQ — conteúdo estático, essencial para AEO/GEO */}
      <FaqSection faqs={HOME_FAQS} />

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-ink-600 sm:px-6">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <Image
              src="/brand/astrotarot-logo.png"
              alt="AstroTarot"
              width={36}
              height={36}
              className="h-8 w-8 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.35)]"
            />
            <span className="font-display text-lg font-semibold tracking-tight text-ink-50">
              Astro<span className="text-gold">Tarot</span>
            </span>
          </div>
          <p>© 2026 AstroTarot &bull; All rights reserved</p>
          <p className="mt-2">
            Tarot and soulmate readings, for entertainment and reflection.
          </p>
          <p className="mt-4">
            <Link href="/about" className="text-ink-400 underline-offset-4 hover:text-gold-300 hover:underline">
              About AstroTarot Hub
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
