"use client";

// Tarot — PRODUTO PRINCIPAL da home. Vinha por último, depois de seis
// cards de features que competiam com ele; agora abre a página logo
// abaixo da dobra.
//
// Duas portas de propósito: /challenge joga na hora sem cadastro (pega o
// visitante frio) e /quiz é a leitura completa lida contra o mapa astral,
// que é onde a venda acontece.

import { motion } from "framer-motion";
import Link from "next/link";
import CardBack from "@/components/CardBack";

const STEPS = [
  "Pick 4 cards from the shuffled Egyptian deck",
  "Each card is read against your birth chart, not from a script",
  "Get straight answers on love, timing and the choice in front of you",
];

export default function TarotSection() {
  return (
    <section id="tarot" className="relative px-4 py-16 sm:px-6 sm:py-24">
      <div className="absolute left-10 top-24 h-72 w-72 rounded-full bg-amethyst-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gold-300">
            Free to start
          </span>
          <h2 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl md:text-5xl">
            The Egyptian Tarot <span className="text-gold">reading</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-400 sm:text-lg">
            The deck that answers the question you keep asking &mdash; drawn for
            you, read against the chart you were born under.
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
                {STEPS.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-600 font-semibold text-night-900">
                      {i + 1}
                    </span>
                    <p className="text-ink-200">{step}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/quiz"
                className="btn-gold mt-8 flex w-full items-center justify-center rounded-full px-8 py-4 sm:inline-flex sm:w-auto"
              >
                Start my free reading
              </Link>
              <p className="mt-4 text-sm text-ink-600">
                Or{" "}
                <Link
                  href="/challenge"
                  className="text-gold-300 underline-offset-4 hover:underline"
                >
                  pull 4 cards right now
                </Link>{" "}
                &mdash; no sign-up, unlimited
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
                  <CardBack key={i} className="aspect-[2/3]" />
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
