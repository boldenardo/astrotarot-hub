"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-purple-200/70 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>

      <div className="mb-6 flex items-center gap-2 text-gold">
        <Sparkles className="w-5 h-5" />
        <span className="font-display text-2xl">AstroTarot</span>
      </div>

      <p className="mb-6 text-purple-200/70 text-sm text-center max-w-sm">
        Create your free account and get <span className="text-gold">4 tarot readings</span> to start.
      </p>

      <SignUp
        routing="hash"
        signInUrl="/auth/login"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
