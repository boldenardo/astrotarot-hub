"use client";

// Alma gêmea — o segundo produto, logo depois do tarot.
//
// A VSL mora aqui, e não solta no meio da página: ela É o argumento do
// retrato. Separadas, o vídeo pedia atenção sem dizer para quê.
//
// O poster do reveal já mostra o rosto borrado com "?" — é a promessa
// inteira numa imagem, então ele carrega o bloco visual em vez de um
// ícone genérico.

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import VSLPlayer from "@/components/VSLPlayer";
import { SOULMATE_PORTRAIT as PORTRAIT } from "@/lib/plans";

export default function SoulmateSection() {
  return (
    <section id="soulmate" className="relative px-4 py-16 sm:px-6 sm:py-24">
      <div className="absolute right-10 top-32 h-80 w-80 rounded-full bg-amethyst-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-amethyst-400/30 bg-amethyst-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-amethyst-200">
            Most requested
          </span>
          <h2 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl md:text-5xl">
            Then see <span className="text-gold">their face</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-400 sm:text-lg">
            Master Aura reads your chart and draws the person it points to.
            Watch how it works &mdash; it takes a few minutes.
          </p>
        </motion.div>

        {/* A VSL fica dentro do bloco da alma gêmea: é o argumento dele. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <VSLPlayer placement="sales_page">
            <div className="mt-6 flex justify-center">
              <Link
                href="/quiz"
                className="btn-gold flex items-center justify-center rounded-full px-8 py-4 text-base"
              >
                Start my free reading
              </Link>
            </div>
          </VSLPlayer>
        </motion.div>

        {/* Oferta do retrato */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass glass-gold relative mt-14 overflow-hidden rounded-4xl p-6 sm:p-8 md:p-10"
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-white/10">
              <Image
                src="/funnel/soulmate-reveal-poster.webp"
                alt="A soulmate portrait, still blurred before the reveal"
                width={720}
                height={405}
                className="h-auto w-full object-cover"
              />
            </div>

            <div>
              <h3 className="font-display text-2xl font-semibold text-ink-50 sm:text-3xl">
                {PORTRAIT.name}
              </h3>
              <p className="mt-2 text-sm text-ink-400">
                <span className="text-gold text-lg font-semibold">
                  {PORTRAIT.priceLabel}
                </span>{" "}
                &bull; {PORTRAIT.period}
              </p>

              <ul className="mt-6 space-y-4">
                {PORTRAIT.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-400" />
                    <span className="text-ink-200">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/quiz"
                className="btn-gold mt-8 flex w-full items-center justify-center rounded-full px-8 py-4 sm:w-auto sm:px-10"
              >
                Reveal my soulmate
              </Link>
              <p className="mt-4 text-sm text-ink-600">
                Starts with the free reading &bull; the portrait is optional
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
