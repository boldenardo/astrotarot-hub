"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function LoginPage() {
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

      <SignIn
        routing="hash"
        signUpUrl="/auth/register"
        fallbackRedirectUrl="/dashboard"
      />

      <p className="mt-6 text-sm text-purple-200/60">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-gold hover:underline">
          Create a free account
        </Link>
      </p>
    </main>
  );
}
