"use client";

// A tela do downsell. A elegibilidade já foi decidida no servidor — aqui
// só sobra mostrar a copy e abrir o checkout. O botão manda o token junto,
// e a rota REVALIDA antes de escolher o price: um POST forjado com
// plan="DOWNSELL_19" recebe o preço cheio, não $9.99.

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { QUIZ_STORAGE_KEY } from "@/lib/quiz-data";
import { getFunnelSessionId, getUtmParams } from "@/lib/funnel-session";
import { getStoredRef } from "@/lib/affiliate";
import { getStoredSource } from "@/lib/source";
import { trackEvent } from "@/lib/analytics";
import { GUARANTEE_DAYS } from "@/lib/offer";
import { openCheckout } from "@/lib/webview";

export default function Offer19({ token }: { token: string }) {
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
      const p = raw ? (JSON.parse(raw) as { name?: string; email?: string }) : null;
      if (p?.name) setName(p.name.trim().split(/\s+/)[0]);
      if (p?.email) setEmail(p.email.trim());
    } catch {
      // sem estado guardado: a copy funciona sem o primeiro nome
    }
    trackEvent("downsell_viewed", { category: "quiz", label: "offer_19" });
  }, []);

  const buy = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    trackEvent("downsell_clicked", { category: "quiz", label: "offer_19" });
    try {
      const res = await fetch("/api/quiz/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "DOWNSELL_19",
          downsellToken: token,
          email,
          ref: getStoredRef(),
          src: getStoredSource(),
          funnelSessionId: getFunnelSessionId(),
          variant: "offer_19",
          cancelPath: "/quiz/vsl-v2",
          utm: getUtmParams(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        sessionId?: string;
        error?: string;
      };
      if (!data.url) {
        setError(data.error || "We couldn't open the secure checkout. Please try again.");
        setLoading(false);
        return;
      }
      const url = data.url;
      window.setTimeout(() => {
        if (!document.hidden) {
          setManualUrl(url);
          setLoading(false);
        }
      }, 2500);
      openCheckout({ url, sessionId: data.sessionId });
    } catch {
      setError("We couldn't open the secure checkout. Please try again.");
      setLoading(false);
    }
  }, [loading, token, email]);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-10">
      <h1 className="font-display text-[1.7rem] font-semibold leading-tight text-ink-50">
        {name ? `${name} — wait.` : "Wait."}
      </h1>

      <p className="mt-5 text-[15px] leading-relaxed text-white/85">
        The portrait is already drawn. It does not un-draw itself because you
        closed a page.
      </p>

      <p className="mt-4 text-[15px] leading-relaxed text-white/85">
        But I would rather you read it than not read it. So I will do something
        I do not do twice: five dollars off, for this reading, once.
      </p>

      <p className="mt-5 text-[17px] font-semibold leading-relaxed text-white">
        $9.99 — the same complete reading, the same portrait, the same{" "}
        {GUARANTEE_DAYS} days to decide.
      </p>

      <p className="mt-4 text-[15px] leading-relaxed text-white/75">
        This is tied to the answers you just gave me, and to this email. It is
        not a price you can come back for.
      </p>

      <button
        type="button"
        onClick={() => void buy()}
        disabled={loading}
        data-cta="offer_19"
        className="btn-gold mt-7 flex w-full min-h-[60px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold uppercase tracking-[0.06em] disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Opening your reading...
          </>
        ) : (
          <>
            Read my soulmate reading — $9.99
            <span aria-hidden>&rarr;</span>
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs leading-relaxed text-white/55">
        One payment of $9.99 &middot; Instant access &middot; {GUARANTEE_DAYS}
        -day money back &middot; Secure checkout by Stripe
      </p>

      {manualUrl && (
        <p className="mt-3 text-center text-sm text-white/70">
          Taking too long?{" "}
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold underline underline-offset-4"
          >
            Open the secure checkout
          </a>
        </p>
      )}
      {error && (
        <p className="mt-3 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
