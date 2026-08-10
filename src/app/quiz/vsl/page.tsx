"use client";

// Quiz funnel — VSL + offer page. Guest checkout (no account needed):
// POST /api/quiz/checkout {plan, email} → Stripe → /quiz/thank-you.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import VSLPlayer from "@/components/VSLPlayer";
import { trackEvent } from "@/lib/analytics";

type Score = "LOW" | "MEDIUM" | "HIGH";
type PlanKey = "PREMIUM" | "PACK5";

interface QuizStore {
  answers?: Record<string, string>;
  email?: string;
  name?: string;
  birthDate?: string;
  sign?: string;
  score?: Score;
}

const STORE_KEY = "astro_quiz_v1";

function readStore(): QuizStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as QuizStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const SCORE_COPY: Record<Score, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-red-500/80" },
  MEDIUM: { label: "Medium", color: "bg-amber-400/80" },
  HIGH: { label: "High", color: "bg-emerald-400/80" },
};

const OFFER_ROWS: Array<{ item: string; value: string }> = [
  { item: "Find-your-soulmate readings", value: "$19" },
  { item: "Unlimited Egyptian Tarot readings", value: "$19" },
  { item: "Your personalized daily horoscope", value: "$29" },
  { item: "Your complete birth chart", value: "$27" },
  { item: "Your fortune & money windows", value: "$19" },
  { item: "Your lucky numbers", value: "$19" },
];

// Fotos reais de campanha (public/social-proof) — casais usando o app.
// Reforçam o ângulo soulmate da oferta na etapa final do funil.
const COUPLES: Array<{ photo: string; names: string; quote: string }> = [
  {
    photo: "/social-proof/couple-2.webp",
    names: "Tom & Rebecca",
    quote:
      "The soulmate reading described him down to the gray hair. I still get goosebumps.",
  },
  {
    photo: "/social-proof/couple-1.webp",
    names: "Daniel & Maria",
    quote:
      "Our compatibility came back 94% — now we read our daily horoscope together every morning.",
  },
  {
    photo: "/social-proof/couple-4.webp",
    names: "James & Claire",
    quote:
      "Married 20 years, and the readings still gave us a whole new language for our relationship.",
  },
  {
    photo: "/social-proof/couple-3.webp",
    names: "Paul & Ingrid",
    quote:
      "We check our readings together before every big decision. It became our little ritual.",
  },
];

const TESTIMONIALS: Array<{
  name: string;
  city: string;
  text: string;
  photo: string;
}> = [
  {
    name: "Rachel M.",
    city: "Austin, TX",
    text: "The money windows were scary accurate. I asked for a raise during mine and got it the same week.",
    photo: "/testimonials/t1.jpg",
  },
  {
    name: "Danielle K.",
    city: "Phoenix, AZ",
    text: "I was skeptical, but my 2026 plan explained exactly why last year felt so blocked. Worth every penny.",
    photo: "/testimonials/t7.jpg",
  },
  {
    name: "Marcus T.",
    city: "Charlotte, NC",
    text: "The daily horoscope actually feels written for me, not copy-pasted. The tarot readings are unreal.",
    photo: "/testimonials/t5.jpg",
  },
  {
    name: "Amanda S.",
    city: "Denver, CO",
    text: "My plan called out a 'window for a bold career move' in March. I applied for a job I thought was out of my league — and started last month.",
    photo: "/testimonials/t2.jpg",
  },
  {
    name: "Brittany W.",
    city: "Nashville, TN",
    text: "I've tried other tarot apps and they all felt generic. This one uses my actual birth chart — the difference is night and day.",
    photo: "/testimonials/t4.jpg",
  },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What exactly is included?",
    a: "Everything in the 2026 Cosmic Plan: unlimited Egyptian Tarot readings, your personalized daily horoscope, your complete birth chart, your fortune and money windows, your find-your-soulmate readings, and your lucky numbers — all inside your private dashboard.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Your membership is month to month with no contracts. Cancel in two taps from your account and you keep access until the end of your billing period.",
  },
  {
    q: "When do I get access?",
    a: "Instantly. Right after checkout, create your account with the same email you used to purchase and your Premium access unlocks automatically.",
  },
  {
    q: "Is it accurate?",
    a: "Your plan is built from your real birth data and the actual 2026 planetary transits — the same calculations professional astrologers use — then personalized with your quiz answers. It is specific to you, not a generic sun-sign column.",
  },
];

export default function QuizVslPage() {
  const [store, setStore] = useState<QuizStore>({});
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Email modal (when quiz store has no email).
  const [emailModalPlan, setEmailModalPlan] = useState<PlanKey | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Sticky bottom CTA: shows after the primary CTA scrolls out of view.
  const primaryCtaRef = useRef<HTMLDivElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  // Eventos de funil disparados uma única vez nesta visita.
  const resultViewedRef = useRef(false);
  const offerViewedRef = useRef(false);

  useEffect(() => {
    setStore(readStore());
    if (!resultViewedRef.current) {
      resultViewedRef.current = true;
      trackEvent("quiz_result_viewed", { category: "quiz" });
    }
  }, []);

  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Primeira vez que a oferta entra na viewport → offer_viewed (1x).
        if (entry.isIntersecting && !offerViewedRef.current) {
          offerViewedRef.current = true;
          trackEvent("offer_viewed", { category: "quiz" });
        }
        // Visible again → hide the bar; scrolled past → show it.
        setShowSticky(
          !entry.isIntersecting && entry.boundingClientRect.top < 0
        );
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const checkout = useCallback(async (plan: PlanKey, email: string) => {
    setLoadingPlan(plan);
    setError(null);
    try {
      const res = await fetch("/api/quiz/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(
          data.error || "Something went wrong starting checkout. Please try again."
        );
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoadingPlan(null);
    }
  }, []);

  const startGuestCheckout = useCallback(
    (plan: PlanKey) => {
      if (loadingPlan) return;
      trackEvent("offer_clicked", {
        category: "quiz",
        label: plan,
        placement: "quiz_result",
      });
      const email = store.email?.trim();
      if (!email) {
        setEmailInput("");
        setEmailError(null);
        setEmailModalPlan(plan);
        return;
      }
      void checkout(plan, email);
    },
    [loadingPlan, store.email, checkout]
  );

  const submitEmailModal = useCallback(() => {
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    const plan = emailModalPlan;
    if (!plan) return;
    // Persist so the thank-you page can show it.
    try {
      const next = { ...readStore(), email };
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      setStore(next);
    } catch {
      // storage unavailable — checkout still works
    }
    setEmailModalPlan(null);
    void checkout(plan, email);
  }, [emailInput, emailModalPlan, checkout]);

  const score: Score = store.score ?? "LOW";
  const scoreMeta = SCORE_COPY[score];
  const firstName = store.name?.trim().split(/\s+/)[0];

  const CtaBlock = ({ id }: { id: string }) => (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={() => startGuestCheckout("PREMIUM")}
        disabled={loadingPlan !== null}
        className="btn-gold w-full min-h-[52px] text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        data-cta={id}
      >
        {loadingPlan === "PREMIUM" && (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        )}
        Unlock my 2026 Cosmic Plan — $29.90/mo
      </button>
      <button
        type="button"
        onClick={() => startGuestCheckout("PACK5")}
        disabled={loadingPlan !== null}
        className="block w-full min-h-[44px] text-center text-sm text-white/70 underline underline-offset-4 hover:text-white disabled:opacity-60"
      >
        {loadingPlan === "PACK5"
          ? "Opening secure checkout..."
          : "Prefer a one-time reading pack? Get 5 readings for $9.99"}
      </button>
      {error && (
        <p className="text-sm text-red-400 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-32 pt-6 md:max-w-2xl">
      {/* a. Result teaser */}
      <section className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-white/60">
          {firstName ? `${firstName}, your results are in` : "Your results are in"}
        </p>
        <h1 className="mt-1 text-xl font-semibold">
          Your Cosmic Alignment:{" "}
          <span className="text-gold">{scoreMeta.label}</span>
        </h1>
        <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden>
          {(["LOW", "MEDIUM", "HIGH"] as Score[]).map((s) => (
            <div
              key={s}
              className={`h-2.5 rounded-full ${
                s === score ? SCORE_COPY[s].color : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="mt-1 grid grid-cols-3 text-[11px] text-white/50">
          <span>Low</span>
          <span className="text-center">Medium</span>
          <span className="text-right">High</span>
        </div>
        <p className="mt-3 text-sm text-white/80">
          Your answers reveal 3 areas where 2026&apos;s transits are working
          against you — and one rare window in your favor, including what your
          chart says about your{" "}
          <span className="font-medium text-gold">soulmate connection</span>.
        </p>
      </section>

      {/* b. VSL block — só monta nesta etapa final; preload="none" garante
          que nenhum byte do MP4 é baixado antes do Play. */}
      <section className="mt-6">
        <p className="mb-2 text-center text-sm font-medium text-white/80">
          Watch how the 2026 transits shape your next 12 months
        </p>
        <VSLPlayer placement="quiz_result" />
      </section>

      {/* c. Offer stack */}
      <section className="glass glass-gold mt-8 rounded-2xl p-5">
        <span className="inline-block rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
          Includes your personalized 2026 plan
        </span>
        <h2 className="mt-3 text-2xl font-semibold leading-snug">
          The 2026 Cosmic Plan — <span className="text-gold">Unlimited Premium</span>
        </h2>
        <ul className="mt-4 space-y-3">
          {OFFER_ROWS.map((row) => (
            <li
              key={row.item}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="flex items-start gap-2 text-white/85">
                <Star
                  className="mt-0.5 h-4 w-4 shrink-0 fill-amber-300 text-amber-300"
                  aria-hidden
                />
                {row.item}
              </span>
              <span className="whitespace-nowrap text-white/50">
                {row.value}/mo
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-baseline justify-between text-sm text-white/60">
            <span>Total value</span>
            <span className="line-through">$132/mo</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-medium">Today</span>
            <span className="text-2xl font-semibold text-gold">$29.90/month</span>
          </div>
        </div>
      </section>

      {/* d. Primary CTA (observed for the sticky bar) */}
      <div ref={primaryCtaRef}>
        <CtaBlock id="primary" />
      </div>

      {/* e. Guarantee */}
      <section className="glass mt-8 flex items-start gap-4 rounded-2xl p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10">
          <ShieldCheck className="h-6 w-6 text-emerald-300" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold">7-day money-back guarantee</h3>
          <p className="mt-1 text-sm text-white/70">
            Try your full 2026 Cosmic Plan for a week. If it doesn&apos;t feel
            uncannily accurate, email us and we&apos;ll refund every cent — no
            questions, no hoops.
          </p>
        </div>
      </section>

      <CtaBlock id="after-guarantee" />

      {/* f0. Prova social — casais (foco soulmate) */}
      <section className="mt-10">
        <h3 className="text-center text-lg font-semibold">
          They asked about their{" "}
          <span className="text-gold">soulmate</span> — and found their answer
        </h3>
        <p className="mt-1 text-center text-sm text-white/60">
          Members around the world use AstroTarot to find — and keep — their
          person.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COUPLES.map((c) => (
            <figure key={c.names} className="glass overflow-hidden rounded-2xl">
              <Image
                src={c.photo}
                alt={`${c.names}, AstroTarot members`}
                width={540}
                height={540}
                className="aspect-square w-full object-cover"
              />
              <figcaption className="p-4">
                <blockquote className="text-sm leading-relaxed text-white/85">
                  &ldquo;{c.quote}&rdquo;
                </blockquote>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                  <BadgeCheck
                    className="h-3.5 w-3.5 text-emerald-300"
                    aria-hidden
                  />
                  {c.names} — AstroTarot members
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <CtaBlock id="after-couples" />

      {/* f. Testimonials */}
      <section className="mt-10">
        <h3 className="text-center text-lg font-semibold">
          Members are already inside 2026
        </h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-sm text-white/60">
          <span className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-amber-300 text-amber-300"
              />
            ))}
          </span>
          4.9/5 average member rating
        </p>
        <div className="mt-4 space-y-4">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-300 text-amber-300"
                      aria-hidden
                    />
                  ))}
                </div>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Verified member
                </span>
              </div>
              <blockquote className="mt-2 text-sm text-white/85">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-3 flex items-center gap-2.5">
                <Image
                  src={t.photo}
                  alt={t.name}
                  width={96}
                  height={96}
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gold-400/40"
                />
                <span className="text-xs text-white/50">
                  {t.name} — {t.city}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* g. FAQ */}
      <section className="mt-10">
        <h3 className="text-center text-lg font-semibold">Questions, answered</h3>
        <div className="mt-4 space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="glass rounded-xl">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
                >
                  {item.q}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/60 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <p className="px-4 pb-4 text-sm text-white/70">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <CtaBlock id="after-faq" />

      <p className="mt-6 text-center text-xs text-white/40">
        Secure checkout by Stripe. Cancel anytime. 7-day money-back guarantee.
      </p>

      {/* h. Sticky bottom CTA (mobile-first) */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 p-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => startGuestCheckout("PREMIUM")}
            disabled={loadingPlan !== null}
            className="btn-gold mx-auto flex w-full max-w-lg min-h-[48px] items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60"
          >
            {loadingPlan === "PREMIUM" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            Unlock my 2026 Cosmic Plan — $29.90/mo
          </button>
        </div>
      )}

      {/* Email modal (guest has no stored email) */}
      {emailModalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Enter your email to continue"
        >
          <div className="glass w-full max-w-sm rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold">Where should we send your plan?</h4>
              <button
                type="button"
                onClick={() => setEmailModalPlan(null)}
                aria-label="Close"
                className="-m-2 flex h-11 w-11 items-center justify-center text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-sm text-white/70">
              Enter the email you&apos;ll use for your account — your access
              links to it automatically.
            </p>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEmailModal();
              }}
              placeholder="you@example.com"
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:border-amber-300/60"
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {emailError}
              </p>
            )}
            <button
              type="button"
              onClick={submitEmailModal}
              disabled={loadingPlan !== null}
              className="btn-gold mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 font-semibold disabled:opacity-60"
            >
              {loadingPlan !== null && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Continue to secure checkout
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
