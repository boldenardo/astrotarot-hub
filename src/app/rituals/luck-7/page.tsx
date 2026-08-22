// O RITUAL DOS 7 DIAS DA SORTE — landing especial + o programa em si.
//
// A mesma URL vende e entrega: a metade de cima é a página comercial
// (indexável, SEO), a metade de baixo é o infoproduto — o player dos 7
// dias com progresso salvo. Quem chega do funil já logado cai direto na
// prática; quem chega do Google entende o que é antes de começar.

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import Luck7Program from "@/components/experiences/Luck7Program";
import { LUCK7_DAYS } from "@/lib/experiences/luck7";

export const metadata: Metadata = {
  title: "The 7-Day Luck Ritual",
  description:
    "Seven days, five minutes a day. Name the door, clear the ground, break the \"almost\" pattern — guided by Master Aura, with a personal opening and sealing reading, one Egyptian card and the real moon each night.",
  alternates: { canonical: "https://astrotarot.shop/rituals/luck-7" },
};

const INCLUDED = [
  "A guided 5-minute practice for each of the 7 days",
  "A personal opening reading by Master Aura on day 1",
  "A sealing reading with your Egyptian card on day 7",
  "The real moon phase woven into every night",
  "Your progress saved — pick up exactly where you stopped",
];

export default function Luck7Page() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Rituals", path: "/rituals" },
          { name: "7-Day Luck Ritual", path: "/rituals/luck-7" },
        ])}
      />
      <section className="mx-auto w-full max-w-lg px-4 pb-16 pt-28">
        <Link href="/rituals" className="text-xs text-white/45 underline underline-offset-4">
          ← All rituals
        </Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-[#d4af37]">
          The 7-Day Luck Ritual
        </p>
        <h1 className="mt-2 font-display text-[1.9rem] font-semibold leading-[1.15] text-ink-50 sm:text-4xl">
          One week. One door. Five minutes a night.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          Luck that isn&apos;t named has nowhere to land. For seven days you work one
          area of your life — not five — with a short ritual each night: a candle, a
          sentence, a coin, one honest move. Master Aura opens the week with a
          personal reading and seals it with your card.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-white/45">
          A ritual is a moment made on purpose — for reflection, not a promise of
          outcomes. You bring the intention; the week gives it a shape.
        </p>

        {/* Os 7 dias — conteúdo real, renderizado no servidor (SEO). */}
        <h2 className="mt-9 font-display text-xl font-semibold text-ink-50">
          The seven days
        </h2>
        <ol className="mt-4 space-y-2.5">
          {LUCK7_DAYS.map((d) => (
            <li key={d.day} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-400/40 text-[11px] font-semibold text-gold-300">
                {d.day}
              </span>
              <span className="text-sm leading-relaxed text-white/75">
                <span className="font-semibold text-white/90">{d.title}.</span>{" "}
                {d.tagline}
              </span>
            </li>
          ))}
        </ol>

        <h2 className="mt-9 font-display text-xl font-semibold text-ink-50">
          What&apos;s included
        </h2>
        <ul className="mt-3 space-y-1.5">
          {INCLUDED.map((line) => (
            <li key={line} className="text-sm leading-relaxed text-white/75">
              · {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-white/50">
          The two Master Aura readings work like any reading on AstroTarot: free
          accounts use their reading balance, Unlimited members never run out. The
          daily practice itself is yours either way.
        </p>

        {/* O programa. */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <h2 className="font-display text-xl font-semibold text-ink-50">
            Begin — Day 1 is open
          </h2>
          <p className="mb-5 mt-1.5 text-sm text-white/55">
            One day per day. Each new day unlocks the morning after you seal the
            one before it.
          </p>
          <Suspense fallback={null}>
            <Luck7Program />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
