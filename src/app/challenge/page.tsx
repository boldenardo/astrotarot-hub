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

      <TarotChallenge />
    </main>
  );
}
