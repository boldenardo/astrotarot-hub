"use client";

// Quiz funnel — VSL + offer page. Guest checkout (no account needed):
// POST /api/quiz/checkout {plan, email} → Stripe → /quiz/thank-you.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import VSLPlayer from "@/components/VSLPlayer";
import { trackEvent, trackPaymentInitiated } from "@/lib/analytics";
import { getStoredRef, getVisitorId } from "@/lib/affiliate";
import { computeScore } from "@/lib/quiz-data";
import { getStoredSource } from "@/lib/source";

type Score = "LOW" | "MEDIUM" | "HIGH";
// A oferta principal é UMA: a assinatura Premium. O PACK5 ($9.99 avulso) só
// existe como DOWNSELL pós-recusa — aparece apenas para quem foi ao checkout
// do Premium e voltou sem pagar (?canceled=1). Nunca na mesma dobra da
// oferta principal, para não canibalizar.
type PlanKey = "PREMIUM" | "PACK5";

const PLAN_PRICES: Record<PlanKey, number> = { PREMIUM: 14.99, PACK5: 9.99 };

interface QuizStore {
  answers?: Record<string, string>;
  email?: string;
  name?: string;
  birthDate?: string;
  sign?: string;
  score?: Score;
}

const STORE_KEY = "astro_quiz_v1";

// Downsell persistido por sessão: um refresh após voltar do Stripe não
// esconde a oferta de $9.99.
const DOWNSELL_KEY = "astro_vsl_downsell";

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

// Sinal de conexão de alma gêmea (ver computeScore em quiz-data.ts).
const SCORE_COPY: Record<Score, { label: string; color: string }> = {
  LOW: { label: "Blocked", color: "bg-red-500/80" },
  MEDIUM: { label: "Awakening", color: "bg-amber-400/80" },
  HIGH: { label: "Strong", color: "bg-emerald-400/80" },
};

// O que a ASSINATURA entrega de fato. O retrato completo (traços, janela
// do encontro, download) é o add-on de $24,99 — prometer aqui o que só sai
// com o segundo pagamento é a receita de reembolso e chargeback.
const OFFER_ROWS: Array<{ item: string; value: string }> = [
  { item: "Your soulmate reading — their nature and your bond", value: "$29" },
  { item: "A first look at your soulmate portrait", value: "$27" },
  { item: "Compatibility with anyone already in your life", value: "$19" },
  { item: "Unlimited Egyptian Tarot readings on love", value: "$19" },
  { item: "Your complete birth chart & Venus placement", value: "$19" },
  { item: "Daily love horoscope & lucky numbers", value: "$19" },
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

// Slides do carrossel de prova social: casais (foto grande) + membros (quote).
type ProofSlide =
  | { kind: "couple"; photo: string; names: string; quote: string }
  | { kind: "member"; photo: string; name: string; city: string; quote: string };

const PROOF_SLIDES: ProofSlide[] = [
  { kind: "couple", ...COUPLES[0] },
  { kind: "member", name: TESTIMONIALS[0].name, city: TESTIMONIALS[0].city, quote: TESTIMONIALS[0].text, photo: TESTIMONIALS[0].photo },
  { kind: "couple", ...COUPLES[1] },
  { kind: "member", name: TESTIMONIALS[1].name, city: TESTIMONIALS[1].city, quote: TESTIMONIALS[1].text, photo: TESTIMONIALS[1].photo },
  { kind: "couple", ...COUPLES[2] },
  { kind: "member", name: TESTIMONIALS[3].name, city: TESTIMONIALS[3].city, quote: TESTIMONIALS[3].text, photo: TESTIMONIALS[3].photo },
  { kind: "couple", ...COUPLES[3] },
  { kind: "member", name: TESTIMONIALS[2].name, city: TESTIMONIALS[2].city, quote: TESTIMONIALS[2].text, photo: TESTIMONIALS[2].photo },
  { kind: "member", name: TESTIMONIALS[4].name, city: TESTIMONIALS[4].city, quote: TESTIMONIALS[4].text, photo: TESTIMONIALS[4].photo },
];

// Carrossel leve com scroll-snap: auto-avança a cada 5s até o usuário tocar.
function ProofCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const interactedRef = useRef(false);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
    }
    setActive(i);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (interactedRef.current || document.visibilityState !== "visible") return;
      setActive((prev) => {
        const next = (prev + 1) % PROOF_SLIDES.length;
        const el = trackRef.current;
        const child = el?.children[next] as HTMLElement | undefined;
        if (el && child) {
          el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
        }
        return next;
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.scrollWidth === 0) return;
    const i = Math.round((el.scrollLeft / el.scrollWidth) * PROOF_SLIDES.length);
    setActive(Math.min(Math.max(i, 0), PROOF_SLIDES.length - 1));
  }, []);

  const arrow = (dir: -1 | 1) => {
    interactedRef.current = true;
    goTo((active + dir + PROOF_SLIDES.length) % PROOF_SLIDES.length);
  };

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onPointerDown={() => {
          interactedRef.current = true;
        }}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PROOF_SLIDES.map((s, i) => (
          <figure
            key={i}
            className="glass flex w-[85%] shrink-0 snap-center flex-col overflow-hidden rounded-2xl sm:w-[70%]"
          >
            {s.kind === "couple" ? (
              <>
                <Image
                  src={s.photo}
                  alt={`${s.names}, AstroTarot members`}
                  width={540}
                  height={405}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="flex flex-1 flex-col justify-between p-4">
                  <blockquote className="text-sm leading-relaxed text-white/85">
                    &ldquo;{s.quote}&rdquo;
                  </blockquote>
                  <p className="mt-3 text-xs text-white/50">
                    {s.names} — AstroTarot members
                  </p>
                </figcaption>
              </>
            ) : (
              <figcaption className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex gap-0.5" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-amber-300 text-amber-300"
                          aria-hidden
                        />
                      ))}
                    </span>
                    {/* Sem selo de "verificado": não há verificação real por
                        trás, e afirmar isso é exposição desnecessária. */}
                    <span className="text-[11px] font-medium text-white/40">
                      Member story
                    </span>
                  </div>
                  <blockquote className="mt-3 text-sm leading-relaxed text-white/85">
                    &ldquo;{s.quote}&rdquo;
                  </blockquote>
                </div>
                <div className="mt-4 flex items-center gap-2.5">
                  <Image
                    src={s.photo}
                    alt={s.name}
                    width={96}
                    height={96}
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gold-400/40"
                  />
                  <span className="text-xs text-white/50">
                    {s.name} — {s.city}
                  </span>
                </div>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {/* Controles */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => arrow(-1)}
          aria-label="Previous testimonial"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden>
          {PROOF_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              onClick={() => {
                interactedRef.current = true;
                goTo(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-gold-400" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => arrow(1)}
          aria-label="Next testimonial"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What exactly is included?",
    a: "Your complete soulmate reading (who they are, when you meet, what blocks it), compatibility analysis with anyone in your life, unlimited Egyptian Tarot readings, your full birth chart with Venus placement, daily love horoscope and lucky numbers — all inside your private dashboard.",
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
    a: "Your reading is built from your real birth data and the actual planetary transits — the same calculations professional astrologers use — then personalized with your quiz answers. It is specific to you, not a generic sun-sign column.",
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


  // Downsell PACK5: só para quem abandonou o checkout do Premium.
  const [showDownsell, setShowDownsell] = useState(false);

  // Eventos de funil disparados uma única vez nesta visita.
  const resultViewedRef = useRef(false);
  const offerViewedRef = useRef(false);

  useEffect(() => {
    setStore(readStore());
    // Retorno do Stripe sem pagar (cancel_url → ?canceled=1): mostra o
    // downsell de $9.99.
    let canceled = false;
    try {
      canceled =
        new URLSearchParams(window.location.search).get("canceled") === "1";
      if (canceled) sessionStorage.setItem(DOWNSELL_KEY, "1");
      if (sessionStorage.getItem(DOWNSELL_KEY) === "1") setShowDownsell(true);
    } catch {
      if (canceled) setShowDownsell(true);
    }
    if (canceled) {
      trackEvent("downsell_viewed", { category: "quiz", label: "PACK5" });
    }
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
        // Fora da viewport (acima OU abaixo) → mostra a barra fixa, para o
        // CTA continuar ao alcance do polegar.
        setShowSticky(!entry.isIntersecting);
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
        // ref: código de afiliado guardado no browser (null quando não há).
        body: JSON.stringify({ plan, email, ref: getStoredRef(), src: getStoredSource() }),
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
      // Evento padrão de ecommerce (fbq InitiateCheckout + gtag begin_checkout).
      trackPaymentInitiated(plan, PLAN_PRICES[plan]);
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
    // Quem chegou à VSL sem email do quiz também vira lead no servidor.
    const snapshot = readStore();
    fetch("/api/quiz/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        email,
        name: snapshot.name,
        birthDate: snapshot.birthDate,
        sign: snapshot.sign,
        score: snapshot.score,
        answers: snapshot.answers,
        visitorId: getVisitorId(),
        ref: getStoredRef(),
        src: getStoredSource(),
      }),
    }).catch(() => {});
    trackEvent("lead_captured", { category: "quiz", label: "vsl_modal" });
    setEmailModalPlan(null);
    void checkout(plan, email);
  }, [emailInput, emailModalPlan, checkout]);

  // Defesa: se o score não foi persistido (storage limpo), recalcula das
  // respostas; sem respostas, "LOW"/Blocked é o default (pitch mais forte).
  const score: Score =
    store.score ??
    (store.answers && Object.keys(store.answers).length > 0
      ? computeScore(store.answers)
      : "LOW");
  const scoreMeta = SCORE_COPY[score];
  const firstName = store.name?.trim().split(/\s+/)[0];

  // Plano único: assinatura. Sem pacote avulso, sem alternativa barata
  // competindo com a oferta na mesma tela.
  const CtaBlock = ({ id }: { id: string }) => (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => startGuestCheckout("PREMIUM")}
        disabled={loadingPlan !== null}
        className="btn-gold flex w-full min-h-[56px] items-center justify-center gap-2 rounded-full px-6 text-base font-semibold disabled:opacity-60"
        data-cta={id}
      >
        {loadingPlan === "PREMIUM" && (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        )}
        Unlock my Soulmate Reading
      </button>
      <p className="mt-2 text-center text-xs text-white/50">
        $14.99/month &bull; Cancel anytime &bull; Secure checkout by Stripe
      </p>
      {error && (
        <p className="mt-2 text-center text-sm text-red-400" role="alert">
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
          Your Soulmate Signal:{" "}
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
          <span>Blocked</span>
          <span className="text-center">Awakening</span>
          <span className="text-right">Strong</span>
        </div>
        <p className="mt-3 text-sm text-white/80">
          Your answers point to a specific person in your chart — their traits,
          the window when your paths cross, and what&apos;s been standing
          between you.{" "}
          <span className="font-medium text-gold">
            Master Aura explains it in the video below.
          </span>
        </p>
      </section>

      {/* a2. Downsell PACK5 — só para quem voltou do checkout sem pagar.
          Card (não modal): retorno de checkout com modal na cara irrita. */}
      {showDownsell && (
        <section className="glass mt-6 rounded-2xl border border-amber-300/40 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-200">
            Wait — a one-time option, no subscription
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-snug">
            Get your full Soulmate Reading for a single payment of{" "}
            <span className="text-gold">$9.99</span>
          </h2>
          <p className="mt-2 text-sm text-white/75">
            5 Egyptian Tarot readings &bull; your soulmate questions answered
            &bull; no recurring charge
          </p>
          <button
            type="button"
            onClick={() => {
              trackEvent("downsell_clicked", {
                category: "quiz",
                label: "PACK5",
              });
              startGuestCheckout("PACK5");
            }}
            disabled={loadingPlan !== null}
            className="btn-gold mt-4 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full px-6 font-semibold disabled:opacity-60"
          >
            {loadingPlan === "PACK5" && (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            )}
            Get my reading — $9.99 one-time
          </button>
          <p className="mt-2 text-center text-xs text-white/50">
            Prefer everything unlimited? The $14.99/mo plan is still available
            below.
          </p>
        </section>
      )}

      {/* b. VSL — preload="metadata" (só o cabeçalho do vídeo baixa antes
          do Play). O vídeo convence; ele não guarda mais a oferta. */}
      <section className="mt-6">
        <p className="mb-2 text-center text-sm font-medium text-white/80">
          Watch: what the cards revealed about your soulmate
        </p>
        <VSLPlayer placement="quiz_result" />
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-white/60">
          <Star className="h-4 w-4 shrink-0 fill-gold text-gold" aria-hidden />
          Master Aura explains what she saw &mdash; your reading is right
          below.
        </p>
      </section>

      {/* c0. Prova social em carrossel (sempre visível, sem preços) */}
      <section className="mt-8">
        <h3 className="text-center text-lg font-semibold">
          They asked about their{" "}
          <span className="text-gold">soulmate</span> — and found their answer
        </h3>
        <p className="mb-4 mt-1 text-center text-sm text-white/60">
          Members around the world use AstroTarot to find — and keep — their
          person.
        </p>
        <ProofCarousel />
      </section>

      {/* c. Offer stack */}
      <section className="glass glass-gold mt-8 rounded-2xl p-5">
        <span className="inline-block rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
          Includes your personalized soulmate reading
        </span>
        <h2 className="mt-3 text-2xl font-semibold leading-snug">
          Your Soulmate Plan — <span className="text-gold">Unlimited Premium</span>
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
            <span className="text-2xl font-semibold text-gold">$14.99/month</span>
          </div>
        </div>
      </section>

      {/* d. Garantia — logo abaixo do preço, antes do único CTA da dobra:
          derruba o risco no exato momento da decisão. */}
      <section className="glass mt-4 flex items-start gap-4 rounded-2xl p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10">
          <ShieldCheck className="h-6 w-6 text-emerald-300" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold">7-day money-back guarantee</h3>
          <p className="mt-1 text-sm text-white/70">
            Try your full Soulmate Plan for a week. If it doesn&apos;t feel
            uncannily accurate, email us and we&apos;ll refund every cent — no
            questions, no hoops.
          </p>
        </div>
      </section>

      {/* e. CTA principal — único nesta dobra (observado pela barra fixa) */}
      <div ref={primaryCtaRef}>
        <CtaBlock id="primary" />
      </div>

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

      {/* Fechamento: um último CTA, bem depois do primeiro (nunca colados). */}
      <CtaBlock id="after-faq" />

      {/* h. Sticky bottom CTA (mobile-first) — aparece quando a oferta sai
          da viewport, para o botão nunca ficar longe do polegar. */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 p-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => startGuestCheckout("PREMIUM")}
            disabled={loadingPlan !== null}
            className="btn-gold mx-auto flex w-full max-w-lg min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60"
          >
            {loadingPlan === "PREMIUM" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            Unlock my Soulmate Reading — $14.99/mo
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
              className="btn-gold mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full px-6 font-semibold disabled:opacity-60"
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
