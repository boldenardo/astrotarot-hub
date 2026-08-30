"use client";

// /quiz/reveal — a página da revelação.
//
// Fica ENTRE a VSL e o pagamento, e é para onde os botões da VSL passaram a
// levar. Não é um botão a mais competindo com a oferta: é o MESMO caminho,
// com a entrega do que a porta prometeu antes da cobrança.
//
// Três estados, e a diferença entre os dois últimos é o que impede o pior
// bug possível aqui:
//
//   ready    — tem tirada: a cerimônia acontece.
//   pending  — tem respostas do quiz, mas a tirada ainda não voltou. Cinco
//              versos e uma frase honesta. NUNCA "responda o quiz": ela
//              acabou de responder, e mandá-la de volta a quinze passos
//              depois de clicar num botão que prometia cartas seria a pior
//              troca do funil.
//   none     — não tem nada neste navegador (link de e-mail em outro
//              aparelho, storage limpo). Aí sim o quiz é a saída honesta.
//
// A OFERTA EXISTE NOS TRÊS. Quem chega aqui já leu o preço na VSL e clicou
// mesmo assim; segurar o botão atrás de um ritual é exatamente o erro de
// 27/08 que custou 3 de 8 compras.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import SoulmateReveal from "@/components/quiz/SoulmateReveal";
import CardBack from "@/components/CardBack";
import { trackEvent, trackPaymentInitiated } from "@/lib/analytics";
import { QUIZ_STORAGE_KEY } from "@/lib/quiz-data";
import { fmtMoney } from "@/lib/pricing";
import { useLocalPricing } from "@/lib/pricing-client";
import {
  FRONT_ALREADY_FREE,
  FRONT_INCLUDES,
  FRONT_OFFER_ID,
  FRONT_PRICE_USD,
  GUARANTEE_DAYS,
} from "@/lib/offer";
import {
  POSITIONS,
  READING_STORAGE_KEY,
  REVEAL_HANDOFF_KEY,
  type SoulmateReading,
} from "@/lib/soulmate-reading";

interface Store {
  name?: string;
  email?: string;
  birthDate?: string;
  sign?: string;
  answers?: Record<string, string>;
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

/**
 * A tirada, em três fontes e nesta ordem.
 *
 * O handoff do sessionStorage existe porque a tirada da VSL pode viver só
 * em memória (storage bloqueado), e uma navegação de página inteira a joga
 * fora — a pessoa clicaria "vire minhas cartas" e chegaria numa cerimônia
 * vazia tendo acabado de ver as cartas na tela anterior.
 */
function cachedReading(): SoulmateReading | null {
  for (const [store, key] of [
    [sessionStorage, REVEAL_HANDOFF_KEY],
    [localStorage, READING_STORAGE_KEY],
  ] as const) {
    try {
      const raw = store.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as SoulmateReading;
      if (parsed?.cards?.length) return parsed;
    } catch {
      // fonte indisponível ou corrompida: tenta a próxima
    }
  }
  return null;
}

type State = "loading" | "ready" | "pending" | "none";

export default function RevealClient({ hotmart }: { hotmart: boolean }) {
  const [reading, setReading] = useState<SoulmateReading | null>(null);
  const [state, setState] = useState<State>("loading");
  const [store, setStore] = useState<Store>({});
  // UMA página de dinheiro (26/08, reafirmado 30/08): o botão leva SEMPRE
  // para /quiz/checkout — que agora É a moldura da Hotmart, com o resumo,
  // a garantia e a prova que a página deles não tem. O desvio direto para
  // pay.hotmart.com durou um dia e o dono viu o custo: "perdemos tudo do
  // nosso checkout antigo".
  const payHref = "/quiz/checkout";
  const cur = useLocalPricing();

  const load = useCallback(async (s: Store) => {
    const cached = cachedReading();
    if (cached) {
      setReading(cached);
      setState("ready");
      return;
    }
    // Sem respostas não há tirada possível, e fabricar cinco cartas para
    // fingir que sempre foram dela é a única coisa que esta página não
    // pode fazer — ela existe para provar procedência.
    if (!s.email || !s.birthDate || !s.answers) {
      setState("none");
      return;
    }
    setState("pending");
    try {
      const res = await fetch("/api/quiz/soulmate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: s.email,
          name: s.name,
          birthDate: s.birthDate,
          answers: s.answers,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as SoulmateReading;
      if (!data?.cards?.length) return;
      try {
        localStorage.setItem(READING_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // sem storage: vale só nesta visita
      }
      setReading(data);
      setState("ready");
    } catch {
      // fica em pending: cinco versos e um botão de tentar de novo, nunca
      // um quiz de quinze passos para quem acabou de respondê-lo
    }
  }, []);

  useEffect(() => {
    const s = readStore();
    setStore(s);
    void load(s);
  }, [load]);

  const onBuy = () => {
    trackEvent("checkout_cta_clicked", {
      category: "checkout",
      label: "FRONT_READING",
      offer: FRONT_OFFER_ID,
      cta_position: "reveal",
      surface: hotmart ? "hotmart" : "custom",
      value: FRONT_PRICE_USD,
    });
    // Saiu da VSL junto com o CTA: o "pagamento iniciado" é aqui, que é
    // onde o clique de fato leva a uma tela de cobrança.
    trackPaymentInitiated("FRONT_READING", FRONT_PRICE_USD);
  };

  const offer = (
    <div className="rounded-3xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.07] to-transparent p-6">
      <h2 className="font-display text-[1.35rem] leading-tight text-white">
        The three cards, and the face
      </h2>
      <ul className="mt-4 space-y-2.5">
        {/* Mesma fonte da VSL (src/lib/offer.ts) para as duas páginas não
            poderem divergir sobre o que a compra entrega. */}
        {FRONT_INCLUDES.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            <span className="text-[15px] leading-snug text-white/85">{item}</span>
          </li>
        ))}
      </ul>
      {/* Só para quem TEM tirada. No estado `none` ela não recebeu carta
          nenhuma, e prometer que duas já são dela seria a mesma mentira que
          a landing fazia antes desta página existir. */}
      {state !== "none" && (
        <p className="mt-3 text-[13px] italic text-white/55">
          {FRONT_ALREADY_FREE}
        </p>
      )}

      {/* O medo dela não é perder o dinheiro — é pagar por um horóscopo
          genérico com o nome dela colado. Esta é a mesma frase da VSL, e
          está aqui porque é a objeção que fica DEPOIS de ler duas cartas. */}
      <p className="mt-5 text-[15px] leading-relaxed text-white/75">
        Here is the failure case, said out loud: you open it and it describes
        nobody. Someone tall. Someone kind. A Tuesday. If that is what lands,
        write to us and say so &mdash; all {fmtMoney(cur, cur.front)} back,{" "}
        {GUARANTEE_DAYS} days, no questions, and the portrait stays yours either
        way.
      </p>

      {/* Âncora, não botão com handler: a webview do Facebook engole
          navegação por script e não engole navegação nativa. */}
      <a
        href={payHref}
        onClick={onBuy}
        className="btn-gold mt-7 flex w-full min-h-[60px] items-center justify-center gap-2 rounded-full px-6 text-center text-[15px] font-bold uppercase tracking-[0.06em]"
      >
        Reveal my full reading and the portrait &mdash;{" "}
        {fmtMoney(cur, cur.front)}
      </a>
      <p className="mt-2.5 text-center text-[12px] leading-relaxed text-white/55">
        One payment of {fmtMoney(cur, cur.front)}
        {state !== "none" ? " · Cards III and IV stay yours either way" : ""}{" "}
        &middot; {GUARANTEE_DAYS}-day money back
      </p>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-white/45">
        <ShieldCheck className="h-3.5 w-3.5 text-gold-400/70" aria-hidden />
        Secure checkout
      </p>
    </div>
  );

  return (
    // O gateway resolvido fica legível no DOM: sem isto, "o botão foi para
    // o lugar errado" só se diagnostica por adivinhação.
    <main
      className="mx-auto w-full max-w-lg px-4 pb-24 pt-8"
      data-gateway={hotmart ? "hotmart" : "stripe"}
    >
      {state === "loading" && (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-gold-400" aria-hidden />
        </div>
      )}

      {state === "ready" && reading && (
        <SoulmateReveal
          reading={reading}
          firstName={store.name}
          sign={store.sign}
          offerSlot={offer}
        />
      )}

      {/* A tirada ainda está voltando. Ela TEM respostas — o que falta é a
          rede, não o quiz. */}
      {state === "pending" && (
        <>
          <header className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
              Your spread
            </p>
            <h1 className="mt-3 font-display text-[1.7rem] leading-tight text-white">
              {store.name ? `${store.name}, the draw is still coming back.` : "The draw is still coming back."}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
              Five cards came up for you &mdash; they were drawn once and they
              do not change. Stay here and they will open.
            </p>
          </header>
          <div className="mt-8 grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {POSITIONS.map((p) => (
              <div key={p.id} className="text-center">
                <CardBack className="aspect-[10/17] w-full opacity-70" />
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
                  {p.id}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center">
            <button
              type="button"
              onClick={() => void load(readStore())}
              className="text-[13px] text-white/55 underline underline-offset-4 hover:text-white/80"
            >
              Try the draw again
            </button>
          </p>
          <div className="mt-10">{offer}</div>
        </>
      )}

      {/* Nada neste navegador. Aqui o quiz é a saída honesta — e a compra
          continua possível, porque quem volta de um checkout cancelado tem
          dados no servidor e não pode ser obrigada a refazer quinze passos. */}
      {state === "none" && (
        <>
          <header className="text-center">
            <h1 className="font-display text-[1.6rem] leading-tight text-white">
              There are no cards on this screen
              {store.name ? `, ${store.name}` : ""}.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
              A spread comes out of your answers, and I do not have yours in
              this browser &mdash; either you opened this from an email on
              another phone, or you came back from a checkout you did not
              finish. I am not going to draw five cards and pretend they were
              always yours.
            </p>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
              It takes about two minutes. And if you have answered before, the
              same five cards come back &mdash; they were only drawn once.
            </p>
          </header>
          <Link
            href="/quiz/flow"
            className="btn-gold mt-7 flex min-h-[56px] w-full items-center justify-center rounded-full px-6 text-[15px] font-bold uppercase tracking-[0.06em]"
          >
            Answer the questions
          </Link>
          <div className="mt-10">{offer}</div>
        </>
      )}

      {state !== "loading" && (
        <p className="mt-8 text-center">
          <Link
            href="/quiz/vsl-v2"
            className="text-[13px] text-white/40 underline underline-offset-4 hover:text-white/65"
          >
            Back to what your answers turned up
          </Link>
        </p>
      )}
    </main>
  );
}
