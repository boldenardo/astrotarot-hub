"use client";

// Checkout DENTRO da nossa página.
//
// Por que isso existe: com o checkout hospedado, 34 pessoas criaram sessão
// no Stripe e apenas 1 digitou um cartão. Entre o clique e a tela de
// pagamento havia um `window.location.href`, e 84% do tráfego chega pela
// webview do Facebook — que pode engolir essa navegação sem erro nenhum.
// Cinco pessoas clicaram em comprar mais de uma vez; uma delas cinco.
//
// Aqui não há navegação: o formulário é montado num iframe do Stripe
// dentro da página que a pessoa já está vendo. Some o ponto cego, e some
// também a troca de domínio para checkout.stripe.com no meio da compra —
// a barra de endereço continua dizendo astrotarot.shop.
//
// O cartão continua indo direto para o Stripe: o iframe é deles, e nada
// de dado sensível passa pelo nosso código. PCI igual ao hospedado.

import { useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Loader2, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/** Marcos de carregamento do iframe da Stripe (ms desde a abertura). */
const SLOW_MS = 8_000;
const TIMEOUT_MS = 20_000;

/**
 * O SDK do Stripe só é baixado quando alguém abre o checkout — carregar no
 * topo do módulo custaria ~40KB a toda visita da VSL, inclusive de quem
 * nunca clica em comprar.
 */
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

interface Props {
  /** Segredo da Checkout Session (ui_mode: embedded). */
  clientSecret: string;
  /**
   * Epoch (segundos) em que a sessão EXPIRA de verdade na Stripe.
   * O cronômetro conta até ela — zero = sessão morta, painel fecha e a
   * pessoa recomeça. Honesto por construção: não há urgência encenada.
   */
  expiresAt?: number | null;
  /** Fechar o painel — a pessoa desistiu e volta para a oferta. */
  onClose: () => void;
  /**
   * Rede de segurança: cria a MESMA compra como Checkout hospedado e
   * devolve a URL. Usado quando o iframe não carrega (webview do Facebook,
   * Stripe.js bloqueado): aos 8s aparece o botão, aos 20s vai sozinho.
   * checkout.stripe.com abre em qualquer webview; o iframe, não.
   */
  requestHostedUrl?: () => Promise<string | null>;
}

/**
 * Janela do painel em minutos. A Stripe não aceita expires_at abaixo de
 * 30 min, então os 10 minutos são cumpridos AQUI: no zero o painel fecha
 * de verdade e esta instância de checkout deixa de existir — reabrir cria
 * outra sessão. O relógio promete exatamente o que executa.
 */
const PANEL_MINUTES = 10;

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function EmbeddedCheckoutPanel({
  clientSecret,
  expiresAt,
  onClose,
  requestHostedUrl,
}: Props) {
  const [ready, setReady] = useState(false);
  // Iframe ainda não carregou passado SLOW_MS: oferece a saída hospedada.
  const [slow, setSlow] = useState(false);
  const [falling, setFalling] = useState(false);
  const fallbackRef = useRef(false);
  const hostedRef = useRef(requestHostedUrl);
  hostedRef.current = requestHostedUrl;

  const goHosted = async (reason: "slow_click" | "timeout" | "stripe_js_unavailable") => {
    if (fallbackRef.current || !hostedRef.current) return;
    fallbackRef.current = true;
    setFalling(true);
    trackEvent("checkout_fallback_hosted", {
      category: "checkout",
      label: reason,
      seconds_open: Math.round((Date.now() - openedAtRef.current) / 1000),
    });
    try {
      const url = await hostedRef.current();
      if (url) {
        window.location.href = url;
        return;
      }
    } catch {
      // cai no erro abaixo
    }
    fallbackRef.current = false;
    setFalling(false);
    trackEvent("checkout_form_error", { category: "checkout", label: "hosted_fallback_failed" });
  };
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // ---- telemetria do formulário ----
  // O que se quer saber de cada abertura: o iframe da Stripe CHEGOU a
  // carregar? Em quanto tempo? E a pessoa saiu antes ou depois de vê-lo?
  const openedAtRef = useRef<number>(Date.now());
  const loadedRef = useRef(false);
  const closedTrackedRef = useRef(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const trackClose = (reason: "user" | "expired" | "unmount") => {
    if (closedTrackedRef.current) return;
    closedTrackedRef.current = true;
    trackEvent("checkout_form_closed", {
      category: "checkout",
      label: reason,
      loaded: loadedRef.current,
      seconds_open: Math.round((Date.now() - openedAtRef.current) / 1000),
    });
  };

  useEffect(() => {
    openedAtRef.current = Date.now();
    trackEvent("checkout_form_opened", { category: "checkout" });

    // Stripe.js não carregou (bloqueador, rede, chave ausente) — sem isto a
    // pessoa ficaria olhando um spinner eterno sem a gente saber.
    getStripe().then((stripe) => {
      if (!stripe) {
        trackEvent("checkout_form_error", {
          category: "checkout",
          label: "stripe_js_unavailable",
        });
        void goHosted("stripe_js_unavailable");
      }
    });

    // O <EmbeddedCheckout> não expõe "montei": observamos o iframe que a
    // Stripe injeta e escutamos o load dele. Cross-origin, então só o load
    // e a altura visível são observáveis — e é exatamente o que precisamos.
    const host = hostRef.current;
    const onLoaded = (via: string) => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      setReady(true);
      trackEvent("checkout_form_loaded", {
        category: "checkout",
        label: via,
        ms: Date.now() - openedAtRef.current,
      });
    };
    const attach = (iframe: HTMLIFrameElement) => {
      iframe.addEventListener("load", () => onLoaded("iframe_load"), { once: true });
    };
    host?.querySelectorAll("iframe").forEach(attach);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLIFrameElement) attach(n);
          else if (n instanceof HTMLElement) n.querySelectorAll("iframe").forEach(attach);
        });
      }
    });
    if (host) mo.observe(host, { childList: true, subtree: true });

    // Rede de segurança: iframe visível com altura real também conta.
    const poll = window.setInterval(() => {
      const f = host?.querySelector("iframe");
      if (f && f.getBoundingClientRect().height > 200) onLoaded("iframe_visible");
    }, 500);

    const slowTimer = window.setTimeout(() => {
      if (!loadedRef.current) {
        trackEvent("checkout_form_slow", { category: "checkout", ms: SLOW_MS });
        setSlow(true);
      }
    }, SLOW_MS);
    const timeout = window.setTimeout(() => {
      if (!loadedRef.current) {
        trackEvent("checkout_form_timeout", { category: "checkout", ms: TIMEOUT_MS });
        void goHosted("timeout");
      }
    }, TIMEOUT_MS);

    return () => {
      mo.disconnect();
      window.clearInterval(poll);
      window.clearTimeout(slowTimer);
      window.clearTimeout(timeout);
      trackClose("unmount");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trava o scroll do fundo enquanto o painel está aberto: no mobile, a
  // página rolando atrás do formulário faz o campo do cartão fugir do dedo.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        trackClose("user");
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  // O <EmbeddedCheckout> não expõe evento de "montei". Um atraso curto
  // troca o spinner pelo formulário sem deixar a tela piscar vazia.
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  // Conta até o que vencer primeiro: os PANEL_MINUTES ou a expiração
  // real da sessão na Stripe. Zerou → fecha; a oferta continua lá e o
  // próximo clique cria uma sessão nova.
  useEffect(() => {
    const cap = Math.floor(Date.now() / 1000) + PANEL_MINUTES * 60;
    const deadline = expiresAt ? Math.min(expiresAt, cap) : cap;
    const tick = () => {
      const left = Math.max(0, deadline - Math.floor(Date.now() / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        trackClose("expired");
        closeRef.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0a1a]">
      {/* Cabeçalho: identidade nossa em cima do formulário deles, para a
          compra continuar parecendo a mesma jornada. */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="font-display text-base font-semibold tracking-tight text-ink-50">
          Astro<span className="text-gold">Tarot</span>
        </span>
        {secondsLeft != null && secondsLeft > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            Your session expires in
            <span className="rounded-full bg-[#7c5cff] px-2.5 py-0.5 font-mono text-[13px] font-semibold text-white">
              {mmss(secondsLeft)}
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            trackClose("user");
            onClose();
          }}
          aria-label="Close checkout"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Iframe demorando: saída honesta para o checkout hospedado, que
          abre em qualquer webview. Some sozinho assim que o iframe carrega. */}
      {(slow || falling) && !loadedRef.current && requestHostedUrl && (
        <div className="shrink-0 border-b border-white/10 bg-[#15102a] px-4 py-3 text-center">
          <p className="text-sm text-white/75">
            {falling ? "Opening the secure checkout..." : "Taking longer than usual?"}
          </p>
          {!falling && (
            <button
              type="button"
              onClick={() => void goHosted("slow_click")}
              className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-400 px-5 text-sm font-bold text-[#1a1233]"
            >
              Open secure checkout
            </button>
          )}
        </div>
      )}
      <div ref={hostRef} className="relative flex-1 overflow-y-auto">
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-gold" aria-hidden />
            <p className="text-sm text-white/70">Preparing your reading...</p>
          </div>
        )}
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
          <EmbeddedCheckout className="min-h-full" />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
