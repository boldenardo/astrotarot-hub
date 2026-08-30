"use client";

// O checkout da era Hotmart — a MOLDURA é nossa, o formulário é deles.
//
// A primeira versão desta troca mandava a pessoa direto para
// pay.hotmart.com, e o dono viu o que isso custou: "perdemos tudo do nosso
// checkout antigo". Tinha razão. O checkout próprio não era um formulário —
// era a garantia no topo, o resumo que continua vendendo, o selo, as fotos
// dos casais, o mural de reviews. Nada disso existe na página deles.
//
// O widget oficial da Hotmart resolve: um script que transforma o link da
// oferta num overlay aberto POR CIMA da página atual. A pessoa nunca sai
// daqui; o que é deles é só o retângulo do pagamento (e-mail, cartão,
// PayPal, conversão de moeda). Tudo o que convence continua sendo nosso.
//
// DEGRADAÇÃO É O CAMINHO NORMAL, não a exceção: se o script não carregar
// (webview estranha, bloqueador, rede ruim), o botão é uma âncora com o
// href REAL da oferta — vira redirect de página inteira, que é exatamente
// o comportamento anterior. O overlay é upgrade, nunca dependência.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Loader2, Lock } from "lucide-react";
import { trackEvent, trackPaymentInitiated } from "@/lib/analytics";
import { QUIZ_STORAGE_KEY } from "@/lib/quiz-data";
import { fmtMoney } from "@/lib/pricing";
import { useLocalPricing } from "@/lib/pricing-client";
import {
  FRONT_INCLUDES,
  FRONT_OFFER_ID,
  FRONT_PRICE_USD,
  GUARANTEE_DAYS,
} from "@/lib/offer";

// As MESMAS fotos e prints do checkout antigo (decisão do dono, 25/08:
// as imagens do checkout não saem). Os arquivos já estão no projeto.
const PROOF_PHOTOS = [
  "/social-proof/couple-1.webp",
  "/social-proof/marie/extra-05.png",
  "/social-proof/marie/extra-06.png",
  "/social-proof/marie/extra-09.png",
];
const REVIEW_SHOTS = ["/social-proof/aura-reviews.webp"];

const WIDGET_JS = "https://static.hotmart.com/checkout/widget.min.js";
const WIDGET_CSS = "https://static.hotmart.com/css/hotmart-fb.min.css";

interface Store {
  name?: string;
  email?: string;
  variant?: string;
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

export default function HotmartCheckout() {
  const cur = useLocalPricing();
  const fmt = (v: number) => fmtMoney(cur, v);
  const [store, setStore] = useState<Store>({});
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openedRef = useRef(false);

  // 1) A URL da oferta vem do SERVIDOR — mesma rota de sempre, que embute
  //    o e-mail e o rastreio `sck`. O código nunca monta link de cobrança
  //    no cliente: se o servidor disser 503, o botão diz o erro em vez de
  //    chutar uma oferta.
  useEffect(() => {
    const s = readStore();
    setStore(s);
    trackEvent("checkout_form_opened", {
      category: "checkout",
      label: "hotmart_framed",
    });
    void (async () => {
      try {
        const res = await fetch("/api/quiz/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: "FRONT_READING",
            email: s.email ?? "",
            variant: s.variant ?? null,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          provider?: string;
          error?: string;
        };
        if (data.provider === "hotmart" && data.url) {
          // checkoutMode=2 é o modo overlay do widget. Na degradação (sem
          // script) o parâmetro é inofensivo: a página deles abre normal.
          const u = new URL(data.url);
          u.searchParams.set("checkoutMode", "2");
          setPayUrl(u.toString());
          return;
        }
        setError(data.error || "We couldn't open the checkout. Please try again.");
      } catch {
        setError("We couldn't open the checkout. Please try again.");
      }
    })();
  }, []);

  // 2) O widget entra DEPOIS de o link existir no DOM — ele varre a página
  //    por âncoras .hotmart-fb no load, então a ordem importa. CSS junto,
  //    para o overlay não abrir sem estilo.
  useEffect(() => {
    if (!payUrl) return;
    if (!document.querySelector(`link[href="${WIDGET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = WIDGET_CSS;
      document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${WIDGET_JS}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_JS;
      script.async = true;
      document.body.appendChild(script);
    }
  }, [payUrl]);

  const onPay = () => {
    // Um disparo por sessão: reabrir o overlay não é nova intenção.
    if (!openedRef.current) {
      openedRef.current = true;
      trackEvent("checkout_cta_clicked", {
        category: "checkout",
        label: "FRONT_READING",
        offer: FRONT_OFFER_ID,
        cta_position: "checkout_pay",
        surface: "hotmart",
        value: FRONT_PRICE_USD,
      });
      trackPaymentInitiated("FRONT_READING", FRONT_PRICE_USD);
    }
  };

  const name = store.name?.trim().split(/\s+/)[0];

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

      {/* Risco zero no topo */}
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
              <span className="text-[15px] font-bold text-gold">
                {fmt(cur.front)}
              </span>{" "}
              once &middot; yours to keep
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">
              A private psychic session ends when the call ends. This one you
              keep.
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
          {FRONT_INCLUDES.slice(0, 4).map((i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-white/75">
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400"
                aria-hidden
              />
              {i}
            </li>
          ))}
        </ul>
      </div>

      {/* Destino da entrega — o e-mail que o quiz capturou. A Hotmart
          coleta o dela de qualquer forma; este bloco existe para dizer ONDE
          a leitura cai, que era a pergunta sem resposta do fluxo antigo. */}
      {store.email && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            Your reading goes to
          </p>
          <p className="mt-0.5 truncate text-[15px] text-white">{store.email}</p>
          <p className="mt-0.5 text-[11px] text-white/45">
            Use this same email on the payment form so your reading lands in
            the right place.
          </p>
        </div>
      )}

      {/* ── PAGAMENTO ─────────────────────────────────────────────────────
          Âncora, não botão: com o widget carregado o clique abre o overlay
          da Hotmart por cima desta página; sem ele, navegação nativa para a
          página da oferta — o comportamento antigo, nunca um clique morto. */}
      <div className="mt-6">
        {payUrl ? (
          <a
            href={payUrl}
            onClick={onPay}
            className="hotmart-fb btn-gold flex w-full min-h-[60px] items-center justify-center gap-2 rounded-full px-6 text-center text-[15px] font-bold uppercase tracking-[0.06em]"
          >
            Get my reading — {fmt(cur.front)} &middot; risk-free
          </a>
        ) : error ? (
          <div className="text-center">
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-ghost mt-3 min-h-[48px] rounded-full px-8 font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex min-h-[60px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <Loader2 className="h-5 w-5 animate-spin text-gold-400" aria-hidden />
          </div>
        )}
        <p className="mt-2.5 text-center text-xs leading-relaxed text-white/55">
          One payment of {fmt(cur.front)} &middot; Instant access &middot;{" "}
          {GUARANTEE_DAYS}-day money back
        </p>
        <p className="mt-1 text-center text-[11px] text-white/40">
          Charged in your local currency at checkout.
        </p>
      </div>

      {/* SELO de garantia — o carimbo dourado, claim real */}
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

      {/* Bandeiras — agora com PayPal, que é o que a Hotmart traz de novo:
          a saída de quem tem o cartão bloqueado para e-commerce
          internacional. "Powered by Stripe" saiu junto com a Stripe. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {["VISA", "Mastercard", "AMEX", "PayPal", "Google Pay"].map((b) => (
          <span
            key={b}
            className="rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/70"
          >
            {b}
          </span>
        ))}
        <span className="flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/70">
          <Lock className="h-3 w-3" aria-hidden /> Secured by Hotmart
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
            <div
              key={p}
              className="overflow-hidden rounded-xl border border-white/10"
            >
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

        {/* Mural de reviews */}
        <div className="mt-4 space-y-2">
          {REVIEW_SHOTS.map((p) => (
            <div
              key={p}
              className="overflow-hidden rounded-xl border border-white/10 bg-white"
            >
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
