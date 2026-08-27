"use client";

// Checkout PRÓPRIO — modelado no checkout de referência que o dono mandou
// copiar, tirando o que lá é fabricado (contadores falsos, "2/10 vagas",
// reviews inventadas). A estrutura que fica: risco-zero no topo, resumo do
// pedido que continua vendendo, bumps por checkbox, pagamento inline com
// carteiras, garantia e prova REAL por todo lado.
//
// O valor é recalculado no SERVIDOR a cada bump — a página só manda flags.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { trackEvent } from "@/lib/analytics";
import { useQuizContent } from "@/components/LocaleProvider";
import { QUIZ_STORAGE_KEY } from "@/lib/quiz-data";
import { getFunnelSessionId, getUtmParams } from "@/lib/funnel-session";
import { getStoredRef } from "@/lib/affiliate";
import { FRONT_INCLUDES, GUARANTEE_DAYS } from "@/lib/offer";
import { fmtMoney } from "@/lib/pricing";
import { useLocalPricing } from "@/lib/pricing-client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Cartas de desconto pré-checkout: 5 cartas reais — 3× 5%, 1× 20%, 1× 30%.
// O baralho é embaralhado de verdade no client; o 5% cai mais porque há
// mais cartas dele, não porque o jogo manipula o resultado. O percentual
// é revalidado no servidor (ALLOWED_DISCOUNTS) — o client nunca manda valor.
const CARD_DISCOUNTS = [5, 5, 5, 20, 30];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}



let stripePromise: Promise<StripeJs | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

/** Aparência do Payment Element casada com o tema da página. */
const APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#d4af37",
    colorBackground: "#171226",
    colorText: "#e8e4f5",
    colorDanger: "#f87171",
    borderRadius: "12px",
    fontFamily: "system-ui, sans-serif",
  },
};

// Fotos regeradas (26/08, aprovadas pelo dono): couple-1..4 agora sao
// candids sem celular na mao — as antigas traziam "120,000+" gravado na
// tela, contradizendo o numero real de 40,000. couple-1 (casal sul-
// africano, nosso publico pagante) + as tres naturais da Marie (grid 2x2).
const PROOF_PHOTOS = [
  "/social-proof/couple-1.webp",
  "/social-proof/marie/extra-05.png",
  "/social-proof/marie/extra-06.png",
  "/social-proof/marie/extra-09.png",
];

// Mural de reviews (trocado 26/08 a pedido do dono): saiu o print da
// Marie (marca alheia, rostos alheios) e entrou o mural da própria
// Master Aura, fornecido pelo dono. Mesmo formato de comentários.
const REVIEW_SHOTS = [
  "/social-proof/aura-reviews.webp",
];

// Urgência REAL: a carta revelada segura o desconto por 15 min nesta
// sessão. Expirou antes de avançar → escolhe de novo. Depois de avançar,
// o desconto já está travado na metadata do PaymentIntent ("locked in").
const DISCOUNT_HOLD_MS = 15 * 60 * 1000;
const DEADLINE_KEY = "ck_discount_deadline";

const fmtMmSs = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

interface PiState {
  clientSecret: string;
  piId: string;
  amount: number;
  grantToken: string | null;
}

export default function CustomCheckout() {
  // Idioma do funil (en|es) — vale também para os campos do Stripe.
  const content = useQuizContent();
  // Moeda do visitante (ZA→ZAR; resto USD). Exibição — a cobrança usa o
  // MESMO país, resolvido no servidor pelo header de IP.
  const cur = useLocalPricing();
  const fmt = (v: number) => fmtMoney(cur, v);
  const [email, setEmail] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pi, setPi] = useState<PiState | null>(null);
  const [creating, setCreating] = useState(false);
  const [bumps, setBumps] = useState({ cord: false, vibes: false });
  // Etapa das cartas: `advanced` vira true depois da escolha (ou do botão
  // de continuar) e libera o formulário de pagamento.
  const [cards] = useState(() => shuffle(CARD_DISCOUNTS));
  const [picked, setPicked] = useState<number | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const startedRef = useRef(false);

  const discount = picked !== null ? cards[picked] : null;

  // Contador de urgência — persiste na sessão (sobrevive a refresh na aba).
  const [deadline, setDeadline] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DEADLINE_KEY);
      if (raw) setDeadline(Number(raw));
    } catch {
      // sem storage: o contador simplesmente não persiste
    }
  }, []);

  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const secondsLeft = deadline
    ? Math.max(0, Math.floor((deadline - nowTs) / 1000))
    : null;

  // Expirou ANTES de avançar: o desconto volta pro baralho e a pessoa
  // escolhe outra carta. Depois de avançar, o desconto já está no PI.
  useEffect(() => {
    if (secondsLeft === 0 && !advanced && picked !== null) {
      setPicked(null);
      setDeadline(null);
      try {
        sessionStorage.removeItem(DEADLINE_KEY);
      } catch {
        // idem
      }
    }
  }, [secondsLeft, advanced, picked]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
      const p = raw
        ? (JSON.parse(raw) as { email?: string; name?: string })
        : null;
      if (p?.email) setEmail(p.email.trim());
      if (p?.name) setName(p.name.trim().split(/\s+/)[0]);
    } catch {
      // sem estado: o campo de e-mail resolve
    }
    trackEvent("checkout_form_opened", { category: "checkout", label: "custom" });
  }, []);

  const createIntent = useCallback(
    async (mail: string) => {
      if (creating || startedRef.current) return;
      setCreating(true);
      setEmailError(null);
      try {
        const res = await fetch("/api/quiz/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            email: mail,
            name,
            bumps,
            discountPct: discount ?? 0,
            funnelSessionId: getFunnelSessionId(),
            variant: "custom_checkout",
            ref: getStoredRef(),
            utm: getUtmParams(),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as Partial<PiState> & {
          error?: string;
        };
        if (!res.ok || !data.clientSecret || !data.piId) {
          setEmailError(data.error || "Something went wrong. Please try again.");
          setCreating(false);
          return;
        }
        startedRef.current = true;
        setPi(data as PiState);
        trackEvent("checkout_session_created", {
          category: "checkout",
          label: "custom",
          session_id: data.piId,
        });
      } catch {
        setEmailError("Something went wrong. Please try again.");
      }
      setCreating(false);
    },
    [creating, name, bumps, discount]
  );

  // E-mail já veio do quiz → cria o intent sozinho. Só depois das cartas:
  // o desconto escolhido precisa entrar na criação do PaymentIntent.
  useEffect(() => {
    if (advanced && email && EMAIL_RE.test(email) && !pi && !startedRef.current) {
      void createIntent(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, advanced]);

  const frontFinal = (cur.front * (100 - (discount ?? 0))) / 100;
  const total =
    frontFinal + (bumps.cord ? cur.cord : 0) + (bumps.vibes ? cur.vibes : 0);

  const toggleBump = useCallback(
    async (key: "cord" | "vibes") => {
      const next = { ...bumps, [key]: !bumps[key] };
      setBumps(next);
      trackEvent("offer_clicked", {
        category: "checkout",
        label: `bump_${key}_${next[key] ? "on" : "off"}`,
      });
      if (pi) {
        try {
          await fetch("/api/quiz/payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update", piId: pi.piId, bumps: next }),
          });
        } catch {
          // o servidor revalida na confirmação; o toggle visual fica
        }
      }
    },
    [bumps, pi]
  );

  // locale FIXADO no idioma do funil (26/08). Sem isto o Stripe segue o
  // idioma do NAVEGADOR: um visitante com celular em português via
  // "Número do cartão / Data de validade" embaixo de "GET MY READING —
  // $27.55" (print real do dono). Meia página em outro idioma na hora de
  // digitar o cartão parece site clonado — e é o exato momento em que a
  // pessoa decide confiar.
  const options = useMemo(
    () =>
      pi
        ? {
            clientSecret: pi.clientSecret,
            appearance: APPEARANCE,
            locale: content.locale === "es" ? ("es" as const) : ("en" as const),
          }
        : undefined,
    [pi, content.locale]
  );

  // ── Etapa 1: as cartas de desconto ─────────────────────────────────────
  if (!advanced) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pb-20 pt-10">
        <div className="flex items-center justify-center">
          <span className="font-display text-lg font-semibold text-ink-50">
            Astro<span className="text-gold">Tarot</span>
          </span>
        </div>
        <div className="mt-6 flex justify-center">
          <Image
            src="/social-proof/marie/badge-50-off.png"
            alt=""
            width={120}
            height={120}
            className="h-24 w-24 object-contain"
          />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-semibold text-ink-50 sm:text-3xl">
          {name ? `${name}, one` : "One"} of these cards holds your discount
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-ink-300">
          Pick a card. The discount you reveal applies to today&apos;s reading
          — from 5% to 30% off the {fmt(cur.front)}.
        </p>

        <div className="mt-8 grid grid-cols-5 gap-2 sm:gap-3">
          {cards.map((pct, i) => {
            const isPicked = picked === i;
            const revealed = picked !== null;
            return (
              <button
                key={i}
                type="button"
                disabled={revealed}
                onClick={() => {
                  setPicked(i);
                  const dl = Date.now() + DISCOUNT_HOLD_MS;
                  setDeadline(dl);
                  try {
                    sessionStorage.setItem(DEADLINE_KEY, String(dl));
                  } catch {
                    // sem storage: segue sem persistir
                  }
                  trackEvent("checkout_discount_card_picked", {
                    category: "checkout",
                    label: `card_${i}`,
                    value: pct,
                  });
                }}
                className={`flex aspect-[3/4] items-center justify-center rounded-xl border text-center transition-all duration-500 ${
                  isPicked
                    ? "scale-105 border-gold-400 bg-gold-400/20 shadow-[0_0_24px_rgba(212,175,55,0.35)]"
                    : revealed
                      ? "border-white/10 bg-white/[0.03] opacity-50"
                      : "border-gold-400/40 bg-gradient-to-b from-[#2a1f45] to-[#171226] hover:scale-105 hover:border-gold-400"
                }`}
              >
                {revealed ? (
                  <span
                    className={`font-display font-bold ${
                      isPicked ? "text-lg text-gold sm:text-xl" : "text-sm text-white/50"
                    }`}
                  >
                    {pct}%<br />OFF
                  </span>
                ) : (
                  <span className="text-xl text-gold-400/80" aria-hidden>
                    ✦
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-8 text-center">
            <p className="text-[15px] font-semibold text-white">
              Your card revealed{" "}
              <span className="text-gold">{cards[picked]}% off</span> — your
              reading comes out at {fmt(frontFinal)}.
            </p>
            {secondsLeft !== null && secondsLeft > 0 && (
              <p className="mt-2 text-[13px] font-medium text-gold-300" role="status">
                Discount held for{" "}
                <span className="font-bold tabular-nums">{fmtMmSs(secondsLeft)}</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                trackEvent("checkout_card_stage_passed", {
                  category: "checkout",
                  label: picked != null ? "with_discount" : "skipped",
                });
                setAdvanced(true);
              }}
              className="btn-gold mt-5 flex min-h-[52px] w-full items-center justify-center rounded-full font-semibold"
            >
              Continue to my checkout
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Etapa 2: o checkout ────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-20 pt-6">
      {/* Cabeçalho de segurança */}
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-ink-50">
          Astro<span className="text-gold">Tarot</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-white/60">
          <Lock className="h-3.5 w-3.5" aria-hidden /> Secure checkout
        </span>
      </div>

      {/* Urgência — o desconto da carta é real e tem validade nesta sessão */}
      {discount !== null && secondsLeft !== null && (
        <div className="mt-4 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-2.5 text-center text-[13px] text-white">
          {secondsLeft > 0 ? (
            <>
              Your <span className="font-bold text-gold">{discount}% off</span>{" "}
              is reserved for{" "}
              <span className="font-bold tabular-nums text-gold">
                {fmtMmSs(secondsLeft)}
              </span>
            </>
          ) : (
            <>
              Your <span className="font-bold text-gold">{discount}% off</span>{" "}
              is locked in for this order
            </>
          )}
        </div>
      )}

      {/* Risco zero no topo — a manchete do checkout de referência, na
          nossa versão honesta (a garantia é real e já está na LP). */}
      <div className="mt-5 rounded-2xl border border-gold-400/35 bg-gold-400/[0.07] px-4 py-3 text-center">
        <p className="text-[15px] font-semibold leading-snug text-white">
          Try it risk-free — if the reading doesn&apos;t describe someone you
          recognize, you get your money back.
        </p>
        <p className="mt-1 text-xs text-white/60">
          {GUARANTEE_DAYS}-day money-back guarantee &middot; the portrait stays
          yours
        </p>
      </div>

      {/* Resumo do pedido — continua vendendo */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-gold-400/30 bg-gradient-to-b from-[#2a1f45] to-[#171226]">
            <div className="absolute inset-2 rounded-lg bg-[radial-gradient(circle_at_40%_35%,rgba(212,175,55,0.35),transparent_60%)] blur-[6px]" />
            <span className="absolute inset-x-0 bottom-1 text-center text-[8px] font-bold uppercase tracking-widest text-gold-300">
              Sealed
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white">
              {name ? `${name}'s ` : "Your "}Soulmate Reading + Portrait
            </p>
            <p className="text-sm text-white/60">
              <span className="text-white/40 line-through">{fmt(cur.list)}</span>{" "}
              {discount ? (
                <>
                  <span className="text-white/40 line-through">
                    {fmt(cur.front)}
                  </span>{" "}
                  <span className="text-[15px] font-bold text-gold">
                    {fmt(frontFinal)}
                  </span>{" "}
                  once &middot; your card unlocked {discount}% off
                </>
              ) : (
                <>
                  <span className="text-[15px] font-bold text-gold">
                    {fmt(cur.front)}
                  </span>{" "}
                  once
                </>
              )}{" "}
              &middot; yours to keep
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">
              A private psychic session ends when the call ends. This one you keep.
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
          {FRONT_INCLUDES.slice(0, 4).map((i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-white/75">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
      </div>

      {/* BUMP 1 — The Cord Reading (produto real, copy do produto) */}
      <button
        type="button"
        onClick={() => void toggleBump("cord")}
        className={`mt-4 flex w-full items-start gap-3 rounded-2xl border-2 border-dashed p-4 text-left transition-colors ${
          bumps.cord ? "border-gold-400 bg-gold-400/[0.08]" : "border-gold-400/40 bg-white/[0.02]"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
            bumps.cord ? "border-gold-400 bg-gold-400 text-[#1a1233]" : "border-white/40"
          }`}
        >
          {bumps.cord && <Check className="h-4 w-4" aria-hidden />}
        </span>
        <span className="min-w-0">
          <span className="text-sm font-semibold text-white">
            Add The Cord Reading — {fmt(cur.cord)}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-white/65">
            Something in your answers was unsettled. This reads what is still
            tied to someone from before, and whether it is blurring the
            connection you asked about.
          </span>
        </span>
      </button>

      {/* BUMP 2 — Vibes & Meditations (produto real, entrega no /vibes) */}
      <button
        type="button"
        onClick={() => void toggleBump("vibes")}
        className={`mt-3 flex w-full items-start gap-3 rounded-2xl border-2 border-dashed p-4 text-left transition-colors ${
          bumps.vibes ? "border-gold-400 bg-gold-400/[0.08]" : "border-gold-400/40 bg-white/[0.02]"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
            bumps.vibes ? "border-gold-400 bg-gold-400 text-[#1a1233]" : "border-white/40"
          }`}
        >
          {bumps.vibes && <Check className="h-4 w-4" aria-hidden />}
        </span>
        <span className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gold-400/25 sm:block">
          <Image
            src="/social-proof/marie/vibes-order-bump.png"
            alt=""
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </span>
        <span className="min-w-0">
          <span className="text-sm font-semibold text-white">
            Add Vibes &amp; Meditations — {fmt(cur.vibes)}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-white/65">
            Guided audio sessions tuned to your intention — love, luck and
            calm — to listen while your connection unfolds.{" "}
            <span className="text-gold-300">
              Lifetime access for less than two months of the $9.99/mo plan.
            </span>
          </span>
        </span>
      </button>

      {/* E-mail (pré-preenchido pelo quiz; editável) */}
      <label htmlFor="ck-email" className="mt-5 block text-xs font-medium uppercase tracking-wider text-white/50">
        Your reading goes to
      </label>
      <input
        id="ck-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError(null);
        }}
        onBlur={() => {
          const v = email.trim();
          if (v && EMAIL_RE.test(v) && !pi) void createIntent(v);
        }}
        placeholder="you@email.com"
        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-base text-white outline-none focus:border-gold-400/60"
      />
      {emailError && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {emailError}
        </p>
      )}

      {/* Pagamento */}
      <div className="mt-5">
        {pi && options ? (
          <Elements stripe={getStripe()} options={options}>
            <PayBlock total={total} piId={pi.piId} grantToken={pi.grantToken} />
          </Elements>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
            {creating ? (
              <span className="flex items-center gap-2 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Preparing your secure checkout...
              </span>
            ) : (
              <span className="px-6 text-center text-sm text-white/50">
                Enter your email above to unlock the payment form.
              </span>
            )}
          </div>
        )}
      </div>

      {/* SELO de garantia — carimbo dourado do funil irmão, claim real */}
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-gold-400/40 bg-gold-400/[0.07] p-3.5">
        <div className="h-16 w-16 shrink-0">
          <Image
            src="/social-proof/marie/guarantee-seal.png"
            alt=""
            width={128}
            height={128}
            className="block h-16 w-16 object-contain"
          />
        </div>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-white/80">
          <span className="font-semibold text-white">
            {GUARANTEE_DAYS}-day money-back guarantee.
          </span>{" "}
          If the reading doesn&apos;t describe someone you recognize, we refund
          it — and the portrait stays yours.
        </p>
      </div>

      {/* Bandeiras e carteiras — os símbolos que o lead procura na dúvida */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {["VISA", "Mastercard", "AMEX", "G Pay", "Apple Pay"].map((b) => (
          <span
            key={b}
            className="rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/70"
          >
            {b}
          </span>
        ))}
        <span className="flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/70">
          <Lock className="h-3 w-3" aria-hidden /> Powered by Stripe
        </span>
      </div>
      <div className="mt-2 flex justify-center">
        <Image
          src="/social-proof/marie/payment-logos.png"
          alt=""
          width={300}
          height={40}
          loading="lazy"
          className="h-auto w-56 opacity-80"
        />
      </div>

      {/* Prova social — números reais, fotos de casais */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[15px] tracking-tight text-gold" aria-hidden>
            ★★★★★
          </span>
          <span className="text-sm font-semibold text-white">4.9</span>
        </div>
        <p className="mt-0.5 text-center text-xs text-white/55">
          40,000+ readings delivered
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PROOF_PHOTOS.map((p) => (
            <div key={p} className="overflow-hidden rounded-xl border border-white/10">
              <Image
                src={p}
                alt=""
                width={270}
                height={270}
                loading="lazy"
                sizes="(max-width: 640px) 45vw, 200px"
                className="aspect-square h-auto w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Mural de reviews — prints com tamanho uniforme */}
        <div className="mt-4 space-y-2">
          {REVIEW_SHOTS.map((p) => (
            <div key={p} className="overflow-hidden rounded-xl border border-white/10 bg-white">
              <Image
                src={p}
                alt=""
                width={850}
                height={777}
                loading="lazy"
                sizes="(max-width: 640px) 90vw, 440px"
                className="h-auto w-full object-contain"
              />
            </div>
          ))}
          {/* Faixa de estrelas logo abaixo dos comentários do Facebook */}
          <div className="flex justify-center rounded-xl border border-white/10 bg-[#171226] py-3">
            <Image
              src="/social-proof/marie/extra-13.png"
              alt=""
              width={250}
              height={48}
              loading="lazy"
              className="h-auto w-52"
            />
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/40">
          Already reading. For reflection and entertainment.
        </p>
      </div>

      <p className="mt-4 text-center text-[13px] text-white/60">
        Your portrait is already drawn and linked to this email — it&apos;s
        waiting on the other side of this page.
      </p>
    </div>
  );
}

/** Botões de carteira + cartão + botão de pagar. Dentro do <Elements>. */
function PayBlock({
  total,
  piId,
  grantToken,
}: {
  total: number;
  piId: string;
  grantToken: string | null;
}) {
  // Mesmo grid do pai (o fetch do /api/geo é cacheado pelo browser).
  const cur = useLocalPricing();
  const fmt = (v: number) => fmtMoney(cur, v);
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Carteiras disponíveis NESTE aparelho. Dentro da webview do Facebook no
  // iOS não existe nenhuma (a Meta não expõe ApplePaySession), e o
  // ExpressCheckoutElement renderiza vazio — deixando "OR PAY WITH CARD"
  // pendurado sobre o nada, o que parece página quebrada bem na hora de
  // digitar o cartão. Guardamos o resultado para esconder o divisor e para
  // medir, com dado, quanto tráfego chega sem carteira nenhuma.
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  const onReady = () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    trackEvent("checkout_form_loaded", { category: "checkout", label: "custom" });
  };

  const onExpressReady = (e: { availablePaymentMethods?: Record<string, boolean> }) => {
    const av = e.availablePaymentMethods;
    const any = Boolean(av && Object.values(av).some(Boolean));
    setHasWallet(any);
    trackEvent("checkout_wallets_ready", {
      category: "checkout",
      label: any ? "wallet" : "none",
      apple_pay: Boolean(av?.applePay),
      google_pay: Boolean(av?.googlePay),
      link: Boolean(av?.link),
    });
    onReady();
  };

  const pay = async () => {
    if (!stripe || !elements || paying) return;
    setPaying(true);
    setError(null);
    trackEvent("checkout_cta_clicked", {
      category: "checkout",
      label: "custom_pay",
      value: total,
    });
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/quiz/thank-you?flow=pi`,
      },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message ?? "Payment didn't go through. Please try again.");
      trackEvent("checkout_error", {
        category: "checkout",
        label: "custom",
        reason: err.type,
      });
      setPaying(false);
      return;
    }
    // Sem redirect (cartão sem 3DS): sucesso — segue para a entrega.
    window.location.href = `/quiz/thank-you?flow=pi&payment_intent=${piId}&redirect_status=succeeded`;
  };

  return (
    <div>
      <ExpressCheckoutElement
        onConfirm={() => void pay()}
        onReady={onExpressReady}
        options={{ buttonTheme: { googlePay: "black", applePay: "black" } }}
      />
      {hasWallet && (
        <div className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
          <span className="h-px flex-1 bg-white/10" /> or pay with card
          <span className="h-px flex-1 bg-white/10" />
        </div>
      )}
      <PaymentElement onReady={onReady} options={{ layout: "tabs" }} />
      <button
        type="button"
        onClick={() => void pay()}
        disabled={paying || !stripe}
        className="btn-gold mt-4 flex w-full min-h-[58px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold uppercase tracking-[0.05em] disabled:opacity-60"
      >
        {paying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Confirming...
          </>
        ) : (
          <>Get my reading — {fmt(total)} · risk-free</>
        )}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
      {/* Gatilhos de decisão — todos os claims reais e verificáveis */}
      <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-white/55">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-gold-400" aria-hidden />
          Instant access
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-gold-400" aria-hidden />
          {GUARANTEE_DAYS}-day guarantee
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-3.5 w-3.5 text-gold-400" aria-hidden />
          Secure payment
        </span>
      </div>
      {grantToken && (
        <p className="mt-3 text-center text-xs text-white/40">
          <a
            href={`/quiz/offer-19?t=${grantToken}`}
            className="underline underline-offset-2 hover:text-white/70"
          >
            ← Back to my reading
          </a>
        </p>
      )}
    </div>
  );
}
