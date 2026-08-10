"use client";

import TarotChallenge from "@/components/TarotChallenge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChallengePage() {
  return (
    <main className="min-h-screen">
      {/* Back button */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="glass glass-gold flex items-center gap-2 rounded-full px-4 py-2 text-ink-200 transition-colors hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      {/* H1 SSR (SEO/AEO): título e proposta da página no HTML inicial */}
      <header className="relative z-10 mx-auto max-w-2xl px-4 pt-24 text-center sm:pt-28">
        <h1 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl">
          Free 4-Card Tarot Reading
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink-400">
          A free interactive Egyptian tarot reading: shuffle the deck, pick 4
          cards and reveal what they say about your present moment. No sign-up
          required.
        </p>
      </header>

      <TarotChallenge />
    </main>
  );
}
