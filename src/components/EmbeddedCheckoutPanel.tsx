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
  /** Fechar o painel — a pessoa desistiu e volta para a oferta. */
  onClose: () => void;
}

export default function EmbeddedCheckoutPanel({ clientSecret, onClose }: Props) {
  const [ready, setReady] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Trava o scroll do fundo enquanto o painel está aberto: no mobile, a
  // página rolando atrás do formulário faz o campo do cartão fugir do dedo.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0a1a]">
      {/* Cabeçalho: identidade nossa em cima do formulário deles, para a
          compra continuar parecendo a mesma jornada. */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="font-display text-base font-semibold tracking-tight text-ink-50">
          Astro<span className="text-gold">Tarot</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto">
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
