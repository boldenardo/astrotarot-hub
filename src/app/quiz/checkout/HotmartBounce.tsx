"use client";

// Rede de segurança da troca de gateway.
//
// O CTA da VSL decide para onde ir por uma env PÚBLICA
// (NEXT_PUBLIC_PAYMENT_PROVIDER), e o servidor decide por outra. As duas
// podem discordar: basta o dono setar uma e esquecer a outra na Vercel.
// Quando isso acontece a pessoa cai aqui, em /quiz/checkout, que é o
// checkout da STRIPE — e seria cobrada pelo gateway que o dono desligou.
//
// Este componente fecha esse buraco. A página é server component: ela lê o
// provider real e, se for Hotmart, nem monta o formulário da Stripe —
// monta isto, que refaz o pedido pelo caminho certo e sai.
//
// Não pede nada à pessoa. O e-mail vai se estiver guardado, e não vai se
// não estiver: o checkout da Hotmart coleta o dele de qualquer jeito.

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { QUIZ_STORAGE_KEY } from "@/lib/quiz-data";
import { getStoredRef } from "@/lib/affiliate";
import { getStoredSource } from "@/lib/source";
import { getFunnelSessionId, getUtmParams } from "@/lib/funnel-session";
import { trackEvent } from "@/lib/analytics";

export default function HotmartBounce() {
  const [error, setError] = useState<string | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    let email = "";
    let variant: string | null = null;
    try {
      const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
      const p = raw ? (JSON.parse(raw) as { email?: string; variant?: string }) : null;
      email = p?.email?.trim() ?? "";
      variant = p?.variant ?? null;
    } catch {
      // storage bloqueado: segue sem preenchimento prévio
    }

    trackEvent("checkout_provider_bounce", {
      category: "checkout",
      label: "hotmart",
    });

    void (async () => {
      try {
        const res = await fetch("/api/quiz/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: "FRONT_READING",
            email,
            variant,
            ref: getStoredRef(),
            src: getStoredSource(),
            funnelSessionId: getFunnelSessionId(),
            utm: getUtmParams(),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (data.url) {
          window.location.replace(data.url);
          return;
        }
        trackEvent("checkout_error", {
          category: "checkout",
          label: "bounce",
          reason: "hotmart_unavailable",
          status: res.status,
        });
        setError(data.error || "We couldn't open the checkout.");
      } catch {
        trackEvent("checkout_error", {
          category: "checkout",
          label: "bounce",
          reason: "network",
        });
        setError("We couldn't open the checkout.");
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {error ? (
        <>
          <p className="text-[15px] leading-relaxed text-white/80">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-gold mt-6 min-h-[52px] rounded-full px-8 font-semibold"
          >
            Try again
          </button>
        </>
      ) : (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-gold-400" aria-hidden />
          <p className="mt-4 text-[15px] text-white/70">
            Taking you to the secure checkout...
          </p>
        </>
      )}
    </div>
  );
}
