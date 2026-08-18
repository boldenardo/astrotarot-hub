"use client";

// Quiz funnel — resultado + VSL + área de conversão.
//
// Checkout guest (sem conta): POST /api/quiz/checkout {plan, email} →
// Stripe → /quiz/thank-you. O webhook continua sendo a fonte da verdade
// da compra; nada aqui concede acesso.
//
// OFERTA PRINCIPAL: PACK5 — 5 leituras por $9.99, PAGAMENTO ÚNICO.
// Confirmado na Stripe live: price_1Tvg2V07YF1LaBzhBH3h9Tqm é one_time.
// Não existe preço de $9.99/mês nesta conta, então qualquer "/month" aqui
// seria uma assinatura inventada. O Premium ($14.99/mês) continua no
// produto, mas como segunda opção — não é o primeiro compromisso que
// tráfego frio deve assumir.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import VSLPlayer from "@/components/VSLPlayer";
import { trackEvent, trackPaymentInitiated } from "@/lib/analytics";
import { getStoredRef, getVisitorId } from "@/lib/affiliate";
import { computeScore } from "@/lib/quiz-data";
import { getStoredSource } from "@/lib/source";
import { getFunnelSessionId, getUtmParams } from "@/lib/funnel-session";
// Braço de CONTROLE do experimento de página comercial. A V2 vive em
// /quiz/vsl-v2; sem carimbar a variante aqui também, os eventos dos dois
// braços chegam somados no GA4 e o teste não mede nada.
import { VARIANT_CONTROL, setFunnelVariant } from "@/lib/funnel-variant";

type Score = "LOW" | "MEDIUM" | "HIGH";
type PlanKey = "PREMIUM" | "PACK5";

const PLAN_PRICES: Record<PlanKey, number> = { PREMIUM: 14.99, PACK5: 9.99 };

/** Rótulo da oferta que viaja até o metadata do Stripe. */
const OFFER_ID = "five_readings_999_onetime";

/** Oferta principal, num lugar só — o texto não pode divergir do price. */
const OFFER = {
  plan: "PACK5" as PlanKey,
  readings: 5,
  price: "$9.99",
  terms: "one-time",
  /** $9.99 / 5 = $1.998. A conta fecha; se o preço mudar, revise. */
  perReading: "Less than $2 per reading",
} as const;

interface QuizStore {
  answers?: Record<string, string>;
  email?: string;
  name?: string;
  birthDate?: string;
  sign?: string;
  score?: Score;
}

const STORE_KEY = "astro_quiz_v1";
const RETURNED_KEY = "astro_vsl_returned";

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
// A frase entra na oferta: o resultado do quiz precisa participar da venda
// em vez de morrer no topo da página. Nenhuma delas afirma fato sobre o
// futuro — é leitura de carta, e o texto se mantém nesse registro.
const SCORE_COPY: Record<
  Score,
  { label: string; color: string; hook: string }
> = {
  LOW: {
    label: "Blocked",
    color: "bg-red-500/80",
    hook: "A Blocked signal usually means the connection is there and something keeps interrupting it. The cards are specific about what.",
  },
  MEDIUM: {
    label: "Awakening",
    color: "bg-amber-400/80",
    hook: "People with an Awakening signal are often left with one question: who is this connection pointing toward?",
  },
  HIGH: {
    label: "Strong",
    color: "bg-emerald-400/80",
    hook: "A Strong signal rarely points at a stranger. Most of the time the cards are describing someone already circling your life.",
  },
};

/**
 * Fotos reais do projeto (public/social-proof + public/testimonials).
 *
 * Só imagem. As frases que existiam aqui ("I was skeptical...", "Worth
 * every penny") eram escritas por nós e apresentadas como depoimento de
 * cliente — com nome e cidade inventados. Prova social fabricada é risco
 * jurídico e some na primeira vez que alguém pergunta quem é a pessoa.
 * Enquanto não houver depoimento com consentimento, mostramos rostos e
 * deixamos o texto de fora.
 */
const PROOF_PHOTOS: string[] = [
  "/social-proof/couple-2.webp",
  "/social-proof/couple-1.webp",
  "/social-proof/couple-4.webp",
  "/social-proof/couple-3.webp",
];

const MEMBER_FACES: string[] = [
  "/testimonials/t1.jpg",
  "/testimonials/t7.jpg",
  "/testimonials/t3.jpg",
  "/testimonials/t4.jpg",
  "/testimonials/t6.jpg",
  "/testimonials/t2.jpg",
  "/testimonials/t5.jpg",
  "/testimonials/t8.jpg",
];

/** O que continua trancado até a compra. Tudo aqui é leitura de carta. */
const LOCKED_ITEMS: string[] = [
  "Who this person may be",
  "The traits that can make them recognizable",
  "What may currently be standing between you",
  "When your paths are most likely to cross",
  "What the cards suggest exploring next",
];

/**
 * As 5 leituras. Cada uma é uma leitura de Tarô Egípcio com interpretação
 * personalizada — que é exatamente o que o PACK5 credita (readings_left +5).
 * Nada aqui promete recurso de plano pago: compatibilidade, mapa astral e
 * horóscopo são do Premium, e o retrato desenhado é o add-on de $24.99.
 */
const READING_PASS: Array<{ n: string; title: string }> = [
  { n: "01", title: "Your complete Soulmate Reading" },
  { n: "02", title: "Ask what may be standing between you" },
  { n: "03", title: "Ask when your paths are most likely to cross" },
  { n: "04", title: "Ask what the cards suggest doing next" },
  { n: "05", title: "Ask the question you can't stop thinking about" },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What do I unlock?",
    a: "Five personalized Egyptian Tarot readings, starting with your complete Soulmate Reading — who the cards point toward, the traits that make them recognizable, what may be standing between you, and when your paths are most likely to cross. The remaining four are yours to spend on any question you want to ask.",
  },
  {
    q: "Is this a subscription?",
    a: "No. This is a single payment of $9.99 for 5 readings. There is no recurring charge and nothing to cancel. If you later want unlimited readings plus the daily horoscope, birth chart and compatibility tools, Unlimited Premium is a separate $14.99/month plan you can choose at any time.",
  },
  {
    q: "When do I get access?",
    a: "Immediately after a successful payment. Create your account with the same email you used at checkout and your 5 readings are already there.",
  },
  {
    q: "Is my payment secure?",
    a: "Payment is processed by Stripe. Your card details go straight to Stripe and never touch our servers.",
  },
  {
    q: "What happens to my quiz result?",
    a: "Your answers and your Soulmate Signal are carried into your first reading, so it continues from where the quiz stopped instead of starting over.",
  },
  {
    q: "How accurate is a reading?",
    a: "Your reading is built from your birth data and your quiz answers rather than a generic sun-sign column, so it is specific to you. Tarot is interpretation — it is offered for reflection and insight, not as a factual prediction of the future.",
  },
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
        const next = (prev + 1) % PROOF_PHOTOS.length;
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
    const i = Math.round((el.scrollLeft / el.scrollWidth) * PROOF_PHOTOS.length);
    setActive(Math.min(Math.max(i, 0), PROOF_PHOTOS.length - 1));
  }, []);

  const arrow = (dir: -1 | 1) => {
    interactedRef.current = true;
    goTo((active + dir + PROOF_PHOTOS.length) % PROOF_PHOTOS.length);
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
        {PROOF_PHOTOS.map((photo, i) => (
          <div
            key={photo}
            className="relative w-[72%] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 sm:w-[46%]"
          >
            <Image
              src={photo}
              alt=""
              width={1080}
              height={1080}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-square h-auto w-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => arrow(-1)}
          aria-label="Previous photo"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden>
          {PROOF_PHOTOS.map((_, i) => (
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
          aria-label="Next photo"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default function QuizVslPage() {
  const [store, setStore] = useState<QuizStore>({});
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [emailModalPlan, setEmailModalPlan] = useState<PlanKey | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const primaryCtaRef = useRef<HTMLDivElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  /** Voltou do Stripe sem pagar. Sem desconto inventado: só reencontro. */
  const [returned, setReturned] = useState(false);

  const viewFiredRef = useRef(false);
  const offerViewedRef = useRef(false);
  /** Trava síncrona contra duplo clique — setState não é imediato. */
  const submittingRef = useRef(false);

  const score: Score =
    store.score ??
    (store.answers && Object.keys(store.answers).length > 0
      ? computeScore(store.answers)
      : "LOW");
  const scoreMeta = SCORE_COPY[score];
  const firstName = store.name?.trim().split(/\s+/)[0];

  useEffect(() => {
    setStore(readStore());
    setFunnelVariant(VARIANT_CONTROL);
    let canceled = false;
    try {
      canceled =
        new URLSearchParams(window.location.search).get("canceled") === "1";
      if (canceled) sessionStorage.setItem(RETURNED_KEY, "1");
      if (sessionStorage.getItem(RETURNED_KEY) === "1") setReturned(true);
    } catch {
      if (canceled) setReturned(true);
    }
    if (!viewFiredRef.current) {
      viewFiredRef.current = true;
      // Denominador de tudo: quantas pessoas a área comercial recebeu.
      trackEvent("quiz_vsl_view", {
        category: "quiz",
        offer: OFFER_ID,
        variant: VARIANT_CONTROL,
      });
      trackEvent("quiz_result_viewed", {
        category: "quiz",
        variant: VARIANT_CONTROL,
      });
    }
  }, []);

  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !offerViewedRef.current) {
          offerViewedRef.current = true;
          trackEvent("offer_viewed", {
            category: "quiz",
            offer: OFFER_ID,
            variant: VARIANT_CONTROL,
          });
        }
        // Barra fixa só depois que a oferta já apareceu uma vez: antes disso
        // ela cobriria o vídeo sem a pessoa saber do que se trata.
        setShowSticky(offerViewedRef.current && !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const checkout = useCallback(
    async (plan: PlanKey, email: string, ctaPosition: string) => {
      setLoadingPlan(plan);
      setError(null);
      try {
        const res = await fetch("/api/quiz/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            email,
            ref: getStoredRef(),
            src: getStoredSource(),
            funnelSessionId: getFunnelSessionId(),
            signal: score,
            offer: plan === "PACK5" ? OFFER_ID : "premium_1499_monthly",
            variant: VARIANT_CONTROL,
            cancelPath: "/quiz/vsl",
            utm: getUtmParams(),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          sessionId?: string;
          error?: string;
        };
        if (!res.ok || !data.url) {
          trackEvent("checkout_error", {
            category: "quiz",
            label: plan,
            offer: OFFER_ID,
            variant: VARIANT_CONTROL,
            status: res.status,
            cta_position: ctaPosition,
          });
          console.error("[quiz/vsl] checkout falhou", res.status, data.error);
          setError(
            data.error ||
              "We couldn't open the secure checkout. Please try again."
          );
          setLoadingPlan(null);
          submittingRef.current = false;
          return;
        }
        // Só aqui a sessão existe de fato no Stripe. Separar este evento do
        // clique é o que distingue "oferta fraca" de "backend quebrado".
        trackEvent("checkout_session_created", {
          category: "quiz",
          label: plan,
          offer: OFFER_ID,
          variant: VARIANT_CONTROL,
          session_id: data.sessionId,
          funnel_session_id: getFunnelSessionId(),
        });
        trackEvent("checkout_redirect_started", {
          category: "quiz",
          label: plan,
          offer: OFFER_ID,
          variant: VARIANT_CONTROL,
        });
        window.location.href = data.url;
      } catch (e) {
        trackEvent("checkout_error", {
          category: "quiz",
          label: plan,
          offer: OFFER_ID,
          variant: VARIANT_CONTROL,
          reason: "network",
        });
        console.error("[quiz/vsl] erro de rede no checkout:", e);
        setError("We couldn't open the secure checkout. Please try again.");
        setLoadingPlan(null);
        submittingRef.current = false;
      }
    },
    [score]
  );

  const startGuestCheckout = useCallback(
    (plan: PlanKey, ctaPosition: string) => {
      // Guarda síncrona: dois toques rápidos no mesmo botão criariam duas
      // Checkout Sessions, e a pessoa poderia pagar as duas.
      if (submittingRef.current || loadingPlan) return;
      submittingRef.current = true;

      // Disparado ANTES de falar com o backend: é a intenção do usuário, e
      // precisa existir mesmo que a criação da sessão falhe depois.
      trackEvent("checkout_cta_clicked", {
        category: "quiz",
        label: plan,
        offer: plan === "PACK5" ? OFFER_ID : "premium_1499_monthly",
        variant: VARIANT_CONTROL,
        signal: score,
        cta_position: ctaPosition,
        funnel_session_id: getFunnelSessionId(),
        ...getUtmParams(),
      });
      trackEvent("offer_clicked", { category: "quiz", label: plan });
      trackPaymentInitiated(plan, PLAN_PRICES[plan]);

      const email = store.email?.trim();
      if (!email) {
        setEmailInput("");
        setEmailError(null);
        setEmailModalPlan(plan);
        submittingRef.current = false;
        return;
      }
      void checkout(plan, email, ctaPosition);
    },
    [loadingPlan, store.email, checkout, score]
  );

  const submitEmailModal = useCallback(() => {
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    const plan = emailModalPlan;
    if (!plan) return;
    try {
      const next = { ...readStore(), email };
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      setStore(next);
    } catch {
      // storage unavailable — checkout still works
    }
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
    void checkout(plan, email, "email_modal");
  }, [emailInput, emailModalPlan, checkout]);

  /** CTA principal. Vende o desejo; o preço fica logo abaixo, legível. */
  const CtaBlock = ({ id }: { id: string }) => (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => startGuestCheckout(OFFER.plan, id)}
        disabled={loadingPlan !== null}
        className="btn-gold flex w-full min-h-[58px] items-center justify-center gap-2 rounded-full px-6 text-base font-bold uppercase tracking-wide disabled:opacity-60"
        data-cta={id}
      >
        {loadingPlan === OFFER.plan ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Preparing your reading...
          </>
        ) : (
          <>
            Reveal my full soulmate reading
            <span aria-hidden>&rarr;</span>
          </>
        )}
      </button>
      <p className="mt-2.5 text-center text-sm font-medium text-white/75">
        {OFFER.readings} personalized readings &middot;{" "}
        <span className="text-gold">{OFFER.price}</span> {OFFER.terms} &middot;
        yours to keep
      </p>
      <p className="mt-1 text-center text-xs text-white/45">
        Instant access &middot; Secure checkout by Stripe &middot; No
        subscription
      </p>
      {error && (
        <p className="mt-2 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-36 pt-6 md:max-w-2xl">
      {/* BLOCO 1 — Resultado personalizado */}
      <section className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-white/60">
          {firstName ? `${firstName}, your results are in` : "Your results are in"}
        </p>
        {/* Maior que os h2 da página: é o momento personalizado, e vinha
            menor que os títulos genéricos abaixo dele. */}
        <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
          Your Soulmate Signal:{" "}
          <span className="text-gold drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]">
            {scoreMeta.label}
          </span>
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
          {scoreMeta.hook}{" "}
          <span className="font-medium text-gold">
            Master Aura explains it in the video below.
          </span>
        </p>
      </section>

      {/* Voltou do Stripe sem concluir. Sem desconto falso, sem contagem
          regressiva — só retoma de onde parou. */}
      {returned && (
        <section className="glass mt-6 rounded-2xl border border-amber-300/40 p-4">
          <p className="text-sm text-white/85">
            Your reading is still here{firstName ? `, ${firstName}` : ""} —
            nothing was lost. Pick up where you left off whenever you&apos;re
            ready.
          </p>
        </section>
      )}

      {/* BLOCO 2 — VSL */}
      <section className="mt-6">
        <p className="mb-2 text-center text-sm font-medium text-white/80">
          Watch: what the cards revealed about your soulmate
        </p>
        <VSLPlayer placement="quiz_result" variant={VARIANT_CONTROL} />
      </section>

      {/* BLOCO 3 — Ponte: o vídeo acaba, a curiosidade continua */}
      <section className="mt-10 text-center">
        <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
          Your answers revealed more than we could{" "}
          <span className="text-gold">show you here</span>.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75">
          Your personalized Soulmate Reading is ready to be drawn. Unlock the
          rest of what the cards have to say about this connection.
        </p>
      </section>

      {/* BLOCO 4 — Status: a pessoa já fez o trabalho */}
      <section className="glass mt-6 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-white/55">
          Your reading status
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {[
            "Answers analyzed",
            "Soulmate signal identified",
            "Connection pattern detected",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2.5 text-white/85">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-300">
                &#10003;
              </span>
              {s}
            </li>
          ))}
          <li className="flex items-center gap-2.5 font-medium text-white">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400/20">
              <Lock className="h-3 w-3 text-gold" aria-hidden />
            </span>
            Full reading locked
          </li>
        </ul>
      </section>

      {/* BLOCO 5 — O que continua trancado */}
      <section className="mt-6">
        <h3 className="text-center text-base font-semibold text-white/90">
          One part of your result is still hidden
        </h3>
        <ul className="mt-4 space-y-2.5">
          {LOCKED_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70"
            >
              <Lock className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* BLOCO 6 — CTA principal (âncora do offer_viewed e da barra fixa) */}
      <div ref={primaryCtaRef}>
        <CtaBlock id="after_locked" />
      </div>

      {/* BLOCO 7 — O que vem nas 5 leituras */}
      <section className="glass mt-12 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" aria-hidden />
          <h3 className="text-lg font-semibold">Your 5-Reading Pass</h3>
        </div>
        <p className="mt-1 text-sm text-white/60">
          Five personalized Egyptian Tarot readings. Use them whenever you
          want — they don&apos;t expire.
        </p>
        <ol className="mt-5 space-y-3">
          {READING_PASS.map((r) => (
            <li key={r.n} className="flex items-start gap-3">
              <span className="mt-0.5 font-mono text-xs font-semibold text-gold/70">
                {r.n}
              </span>
              <span className="text-sm text-white/85">{r.title}</span>
            </li>
          ))}
        </ol>
      </section>

      <CtaBlock id="after_pass" />

      {/* BLOCO 8 — Prova visual. Só fotos: sem depoimento fabricado. */}
      <section className="mt-12">
        <h3 className="text-center text-lg font-semibold">
          People are already exploring their answers with{" "}
          <span className="text-gold">AstroTarot</span>
        </h3>
        <div className="mt-4">
          <ProofCarousel />
        </div>
        <div className="mt-5 flex flex-col items-center gap-2">
          <span className="flex -space-x-2.5" aria-hidden>
            {MEMBER_FACES.map((src) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                className="h-9 w-9 rounded-full border-2 border-[#161027] object-cover"
              />
            ))}
          </span>
          <span className="flex items-center gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-4 w-4 fill-gold text-gold" />
            ))}
          </span>
        </div>
      </section>

      {/* BLOCO 9 — Oferta simplificada */}
      <section className="glass glass-gold mt-12 rounded-2xl p-6 text-center">
        <h3 className="text-xl font-semibold leading-snug">
          Unlock what your answers uncovered
        </h3>
        <p className="mt-4 text-sm text-white/70">
          {OFFER.readings} personalized readings
        </p>
        <p className="mt-1 text-4xl font-bold text-gold">{OFFER.price}</p>
        <p className="mt-1 text-sm text-white/60">
          {OFFER.terms} &middot; {OFFER.perReading}
        </p>
        <CtaBlock id="offer_card" />
      </section>

      {/* BLOCO 10 — Garantia */}
      <section className="glass mt-8 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden />
          <h3 className="font-semibold">Explore your reading without the risk</h3>
        </div>
        <p className="mt-2 text-sm text-white/70">
          You have 7 days to decide if AstroTarot is right for you. If it
          isn&apos;t, email us and we&apos;ll refund every cent.
        </p>
      </section>

      {/* BLOCO 11 — FAQ */}
      <section className="mt-12">
        <h3 className="text-center text-lg font-semibold">
          Questions, answered
        </h3>
        <div className="mt-4 space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium"
                >
                  {item.q}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <p className="px-4 pb-4 text-sm leading-relaxed text-white/70">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BLOCO 12 — Fechamento */}
      <CtaBlock id="after_faq" />

      {/* Segunda opção, deliberadamente discreta: quem quer tudo encontra,
          quem está frio não é obrigado a decidir sobre assinatura agora. */}
      <p className="mt-8 text-center text-xs leading-relaxed text-white/40">
        Want unlimited readings, your daily horoscope, birth chart and
        compatibility tools?{" "}
        <button
          type="button"
          onClick={() => startGuestCheckout("PREMIUM", "secondary_premium")}
          disabled={loadingPlan !== null}
          className="underline underline-offset-4 hover:text-white/70 disabled:opacity-60"
        >
          Unlimited Premium is $14.99/month
        </button>
        , cancel anytime.
      </p>

      {/* Barra fixa — só depois que a oferta já apareceu uma vez. */}
      {showSticky && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-3 pt-3 backdrop-blur-md"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={() => startGuestCheckout(OFFER.plan, "sticky")}
            disabled={loadingPlan !== null}
            className="btn-gold mx-auto flex w-full max-w-lg min-h-[54px] items-center justify-center gap-2 rounded-full px-6 text-sm font-bold uppercase tracking-wide disabled:opacity-60"
          >
            {loadingPlan === OFFER.plan ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Preparing your reading...
              </>
            ) : (
              <>
                Reveal my full soulmate reading
                <span aria-hidden>&rarr;</span>
              </>
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-white/55">
            {OFFER.readings} readings &middot; {OFFER.price} {OFFER.terms}
          </p>
        </div>
      )}

      {/* Email modal (guest sem e-mail guardado) */}
      {emailModalPlan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="glass w-full max-w-sm rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-semibold">Where should we send your reading?</h4>
              <button
                type="button"
                onClick={() => setEmailModalPlan(null)}
                aria-label="Close"
                className="text-white/50 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEmailModal();
              }}
              placeholder="you@email.com"
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-gold-400/60"
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {emailError}
              </p>
            )}
            <button
              type="button"
              onClick={submitEmailModal}
              className="btn-gold mt-4 flex w-full min-h-[52px] items-center justify-center rounded-full px-6 font-semibold"
            >
              Continue to secure checkout
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
