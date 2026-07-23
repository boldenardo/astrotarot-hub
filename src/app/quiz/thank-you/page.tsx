"use client";

// Quiz funnel — post-checkout page. The purchase was made as a GUEST;
// the user creates an account with the SAME email and the webhook-created
// user row (matched by email) already carries the Premium benefit.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";

const STORE_KEY = "astro_quiz_v1";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { email?: string };
      if (parsed && typeof parsed.email === "string" && parsed.email.trim()) {
        setEmail(parsed.email.trim());
      }
    } catch {
      // storage unavailable — copy still works without the email hint
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10">
        <CircleCheck className="h-9 w-9 text-amber-300" aria-hidden />
      </span>

      <h1 className="mt-5 text-2xl font-semibold">
        Payment confirmed — <span className="text-gold">welcome to AstroTarot</span>
      </h1>

      <p className="mt-3 text-sm text-white/80">
        Create your account with the SAME email you used at checkout
        {email ? (
          <>
            {" "}
            (<span className="font-medium text-white">{email}</span>)
          </>
        ) : null}{" "}
        and your Premium access unlocks instantly.
      </p>

      <Link
        href="/auth/register"
        className="btn-gold mt-6 flex w-full min-h-[52px] items-center justify-center text-base font-semibold"
      >
        Create my account
      </Link>

      <Link
        href="/auth/login"
        className="btn-ghost mt-3 flex w-full min-h-[48px] items-center justify-center text-sm"
      >
        Already created it? Sign in
      </Link>

      <p className="mt-6 text-xs text-white/50">
        Your access links to your purchase automatically by email — nothing
        else to do.
      </p>

      {sessionId && (
        <p className="mt-2 break-all text-[11px] text-white/30">
          Order reference: {sessionId}
        </p>
      )}
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}
