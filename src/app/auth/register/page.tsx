"use client";

import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

function RegisterContent() {
  // ?email= vem da thank-you do funil: pré-preenche o cadastro com o MESMO
  // email do checkout — o benefício destrava por match de email, então cada
  // tecla a menos aqui é menos risco de acesso órfão.
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() || undefined;
  // Quem vem do e-mail de compra chega com redirect_url=/soulmate. Para
  // essa pessoa, "ganhe 4 leituras grátis" é a mensagem errada: ela já
  // pagou, e o que ela quer saber é que está a um passo do retrato.
  const redirectUrl = searchParams.get("redirect_url") || undefined;
  const isBuyer = Boolean(redirectUrl && redirectUrl.includes("/soulmate"));

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
        {isBuyer ? (
          <>
            Use <span className="text-gold">this same email</span> and your
            soulmate reading opens on the next screen.
          </>
        ) : (
          <>
            Create your free account and get{" "}
            <span className="text-gold">4 tarot readings</span> to start.
          </>
        )}
      </p>

      <SignUp
        routing="hash"
        signInUrl="/auth/login"
        fallbackRedirectUrl={redirectUrl ?? "/dashboard"}
        initialValues={email ? { emailAddress: email } : undefined}
      />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
