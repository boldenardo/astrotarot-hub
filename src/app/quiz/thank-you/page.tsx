"use client";

// Quiz funnel — post-checkout page. The purchase was made as a GUEST;
// the user creates an account with the SAME email and the webhook-created
// user row (matched by email) already carries the benefit.
//
// Esta página também:
// - dispara o Purchase real (valor vindo do Stripe via /api/quiz/session)
// - adapta a copy por plano (PREMIUM vs PACK5)
// - oferece o upgrade one-click pro plano anual (upsell pós-compra:
//   pico de confiança + cartão salvo = melhor momento de LTV)
// - pré-preenche o email no registro (menos fricção de ativação)

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CircleCheck, Crown, Loader2, Sparkles } from "lucide-react";
import { trackPurchase, trackEvent } from "@/lib/analytics";
// Qual página comercial originou a venda. Sem isto o guardrail do
// experimento (checkout start → purchase) fica cego: a compra é confirmada
// aqui, uma página depois do braço que a gerou.
import { getFunnelVariant } from "@/lib/funnel-variant";

const STORE_KEY = "astro_quiz_v1";

interface SessionInfo {
  paid: boolean;
  amount: number | null;
  currency: string;
  plan: string | null;
  email: string | null;
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  // Upsell anual: idle → loading → done | hidden (erro esconde em silêncio)
  const [upsell, setUpsell] = useState<"idle" | "loading" | "done" | "hidden">(
    "idle"
  );
  // Upsell do retrato ($24.99): mesma máquina de estados.
  const [portrait, setPortrait] = useState<
    "idle" | "loading" | "done" | "hidden"
  >("idle");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string };
        if (parsed && typeof parsed.email === "string" && parsed.email.trim()) {
          setEmail(parsed.email.trim());
        }
      }
    } catch {
      // storage unavailable — copy still works without the email hint
    }
  }, []);

  // Confirma a sessão no servidor: dispara o Purchase com o valor REAL,
  // descobre o plano e recupera o email (cobre storage limpo/outro device).
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/quiz/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SessionInfo | null) => {
        if (!data?.paid) return;
        // Fecha o funil do lado do cliente. A fonte da verdade da compra
        // continua sendo o webhook — este evento só existe para o relatório
        // conseguir ligar quiz_vsl_view → checkout_cta_clicked →
        // checkout_session_created → compra pelo mesmo session_id.
        const variant = getFunnelVariant() ?? undefined;
        trackEvent("purchase_completed", {
          category: "quiz",
          label: data.plan ?? undefined,
          session_id: sessionId,
          value: data.amount ?? undefined,
          variant,
        });
        if (typeof data.amount === "number") {
          trackPurchase({
            sessionId,
            value: data.amount,
            currency: data.currency ?? "usd",
            plan: data.plan ?? undefined,
            variant,
          });
        }
        if (data.plan) setPlan(data.plan);
        if (data.email) setEmail((prev) => prev ?? data.email);
      })
      .catch(() => {
        // Endpoint indisponível: evento aproximado é melhor que nenhum.
        trackPurchase({ sessionId, value: 14.99, currency: "usd" });
      });
  }, [sessionId]);

  const upgradeToYearly = async () => {
    if (!sessionId || upsell === "loading") return;
    setUpsell("loading");
    trackEvent("subscription_upgrade_clicked", {
      category: "subscription",
      label: "yearly_thank_you",
    });
    try {
      const res = await fetch("/api/quiz/upgrade-yearly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        setUpsell("done");
        trackPurchase({
          sessionId: `${sessionId}_yearly`,
          value: 79,
          currency: "usd",
          plan: "PREMIUM_YEARLY",
        });
      } else {
        // Cartão recusado / não elegível: o fluxo principal segue intacto.
        setUpsell("hidden");
      }
    } catch {
      setUpsell("hidden");
    }
  };

  // Retrato completo no cartão salvo. O funil inteiro prometeu essa imagem;
  // oferecer só em /soulmate (atrás de login) perdia quase todo mundo.
  const buyPortrait = async () => {
    if (!sessionId || portrait === "loading") return;
    setPortrait("loading");
    trackEvent("offer_clicked", {
      category: "upsell",
      label: "soulmate_portrait",
      value: 24.99,
    });
    try {
      const res = await fetch("/api/quiz/portrait-upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        setPortrait("done");
        trackPurchase({
          sessionId: `${sessionId}_portrait`,
          value: 24.99,
          currency: "usd",
        });
      } else {
        // Cartão recusado / 3DS: some daqui, mas segue comprável em /soulmate.
        setPortrait("hidden");
      }
    } catch {
      setPortrait("hidden");
    }
  };

  const isPack = plan === "PACK5";
  const registerHref = email
    ? `/auth/register?email=${encodeURIComponent(email)}`
    : "/auth/register";

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10">
        <CircleCheck className="h-9 w-9 text-amber-300" aria-hidden />
      </span>

      <h1 className="mt-5 text-2xl font-semibold">
        Payment confirmed — <span className="text-gold">welcome to AstroTarot</span>
      </h1>

      <p className="mt-3 text-sm text-white/80">
        {isPack ? (
          <>Your 5-reading pack is active. Create your account with the SAME
          email you used at checkout</>
        ) : (
          <>Create your account with the SAME email you used at checkout</>
        )}
        {email ? (
          <>
            {" "}
            (<span className="font-medium text-white">{email}</span>)
          </>
        ) : null}{" "}
        and your {isPack ? "readings unlock" : "Premium access unlocks"}{" "}
        instantly.
      </p>

      {/* Upsell anual — só para assinatura mensal do quiz, one-click no
          cartão salvo. Disclosure explícita: cobrança acontece na hora. */}
      {!isPack && plan === "PREMIUM" && upsell !== "hidden" && (
        <div className="glass glass-gold mt-6 w-full rounded-2xl border border-amber-300/40 p-5 text-left">
          {upsell === "done" ? (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <CircleCheck className="h-5 w-5 shrink-0" aria-hidden />
              You&apos;re on the yearly plan — 12 months locked in.
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-200">
                <Crown className="h-4 w-4" aria-hidden />
                One-time upgrade
              </p>
              <h2 className="mt-2 text-lg font-semibold leading-snug">
                Lock a full year for <span className="text-gold">$79</span>{" "}
                <span className="text-white/60">(save $100/yr)</span>
              </h2>
              <p className="mt-1.5 text-sm text-white/75">
                The $14.99 you just paid counts toward it.
              </p>
              <button
                type="button"
                onClick={upgradeToYearly}
                disabled={upsell === "loading"}
                className="btn-gold mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60"
              >
                {upsell === "loading" && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Upgrade to yearly — $79
              </button>
              <p className="mt-2 text-center text-[11px] text-white/50">
                Your card on file will be charged now. 7-day money-back
                guarantee still applies.
              </p>
            </>
          )}
        </div>
      )}

      {/* Retrato completo — a promessa que trouxe a pessoa até aqui.
          Só para assinatura (o cartão salvo vem da subscription) e só
          depois que o upgrade anual foi resolvido, para não competir. */}
      {!isPack && plan === "PREMIUM" && portrait !== "hidden" && upsell !== "loading" && (
        <div className="glass mt-4 w-full overflow-hidden rounded-2xl border border-white/10 text-left">
          {portrait === "done" ? (
            <p className="flex items-center gap-2 p-5 text-sm font-medium text-emerald-300">
              <CircleCheck className="h-5 w-5 shrink-0" aria-hidden />
              Your full portrait is unlocked — it&apos;s waiting inside your
              account.
            </p>
          ) : (
            <>
              <div className="relative">
                <Image
                  src="/funnel/soulmate-reveal-poster.webp"
                  alt=""
                  width={640}
                  height={360}
                  aria-hidden
                  className="h-32 w-full object-cover opacity-80"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#0e0a1a] to-transparent" />
              </div>
              <div className="p-5">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-violet-200">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Draw your soulmate
                </p>
                <h2 className="mt-2 text-lg font-semibold leading-snug">
                  See their face in full —{" "}
                  <span className="text-gold">$24.99</span>
                </h2>
                <p className="mt-1.5 text-sm text-white/75">
                  Your plan includes a first look. This unlocks the full
                  portrait: their features in detail, when your paths cross,
                  and the image to download and keep.
                </p>
                <button
                  type="button"
                  onClick={buyPortrait}
                  disabled={portrait === "loading"}
                  className="btn-gold mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60"
                >
                  {portrait === "loading" && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  Unlock my full portrait — $24.99
                </button>
                <p className="mt-2 text-center text-[11px] text-white/50">
                  One-time charge on the card you just used. Same 7-day
                  guarantee.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <Link
        href={registerHref}
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
