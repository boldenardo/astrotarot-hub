"use client";

import TarotChallenge from "@/components/TarotChallenge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChallengePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Back button */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-600/50 rounded-full transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </Link>
      </div>

      <TarotChallenge />
    </main>
  );
}
