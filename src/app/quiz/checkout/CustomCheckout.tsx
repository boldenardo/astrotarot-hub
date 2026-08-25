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
import { QUIZ_STORAGE_KEY } from "@/lib/quiz-data";
import { getFunnelSessionId, getUtmParams } from "@/lib/funnel-session";
import { getStoredRef } from "@/lib/affiliate";
import {
  FRONT_PRICE_USD,
  FRONT_INCLUDES,
  GUARANTEE_DAYS,
} from "@/lib/offer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CORD_USD = 9;
const VIBES_USD = 19;

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

const PROOF_PHOTOS = [
  "/social-proof/couple-2.webp",
  "/social-proof/couple-1.webp",
  "/social-proof/couple-4.webp",
  "/social-proof/couple-3.webp",
];

interface PiState {
  clientSecret: string;
  piId: string;
  amount: number;
  grantToken: string | null;
}

export default function CustomCheckout() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pi, setPi] = useState<PiState | null>(null);
  const [creating, setCreating] = useState(false);
  const [bumps, setBumps] = useState({ cord: false, vibes: false });
  const startedRef = useRef(false);

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
    [creating, name, bumps]
  );

  // E-mail já veio do quiz → cria o intent sozinho.
  useEffect(() => {
    if (email && EMAIL_RE.test(email) && !pi && !startedRef.current) {
      void createIntent(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const total =
    FRONT_PRICE_USD + (bumps.cord ? CORD_USD : 0) + (bumps.vibes ? VIBES_USD : 0);

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

  const options = useMemo(
    () =>
      pi
        ? { clientSecret: pi.clientSecret, appearance: APPEARANCE }
        : undefined,
    [pi]
  );

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
              <span className="text-white/40 line-through">$30–$150 per session</span>{" "}
              <span className="text-[15px] font-bold text-gold">${FRONT_PRICE_USD}</span>{" "}
              once &middot; yours to keep
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
            Add The Cord Reading — ${CORD_USD}
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
        <span className="min-w-0">
          <span className="text-sm font-semibold text-white">
            Add Vibes &amp; Meditations — ${VIBES_USD}
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

      {/* SELO de garantia — peso visual de carimbo, claim 100% real */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gold-400/40 bg-gold-400/[0.07] p-3.5">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-gold-400 bg-[#1a1233] text-center">
          <span className="text-[15px] font-black leading-none text-gold">
            {GUARANTEE_DAYS}
          </span>
          <span className="text-[7px] font-bold uppercase leading-tight tracking-wide text-gold-300">
            day
            <br />
            guarantee
          </span>
        </div>
        <p className="text-[13px] leading-snug text-white/80">
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

      {/* Prova social — números reais, fotos reais */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[15px] tracking-tight text-gold" aria-hidden>
            ★★★★★
          </span>
          <span className="text-sm font-semibold text-white">4.9</span>
        </div>
        <p className="mt-0.5 text-center text-xs text-white/55">
          120,000+ readings delivered
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
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const onReady = () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    trackEvent("checkout_form_loaded", { category: "checkout", label: "custom" });
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
        onReady={onReady}
        options={{ buttonTheme: { googlePay: "black", applePay: "black" } }}
      />
      <div className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
        <span className="h-px flex-1 bg-white/10" /> or pay with card
        <span className="h-px flex-1 bg-white/10" />
      </div>
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
          <>Get my reading — ${total} · risk-free</>
        )}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
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
