"use client";

// A tirada de cinco cartas: duas viradas de graça, três trancadas.
//
// Substitui a lista SEALED da VSL, que eram cinco rótulos com cadeado e
// NADA por trás — a página afirmava a lacuna e cobrava por ela sem nunca
// demonstrar nada. Aqui as cartas existem: foram sorteadas em código a
// partir das respostas, e duas delas se abrem antes de qualquer pagamento.
//
// Renderiza os cinco VERSOS imediatamente, antes de o texto chegar. Um
// verso de carta é ritual; um spinner é erro.

import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import CardBack from "@/components/CardBack";
import { trackEvent } from "@/lib/analytics";
import {
  POSITIONS,
  type DossierField,
  type SoulmateReading,
} from "@/lib/soulmate-reading";

interface Props {
  reading: SoulmateReading | null;
  /** Primeiro nome, quando o quiz o capturou. */
  firstName?: string;
  /** Signo solar, para o recibo de derivação sob as cartas grátis. */
  sign?: string;
}

/** O texto de uma posição grátis, se já chegou. */
function freeText(
  reading: SoulmateReading | null,
  field: DossierField
): string | null {
  const v = reading?.free?.[field];
  if (typeof v === "string" && v.trim()) return v;
  return null;
}

export default function SoulmateCardSpread({ reading, firstName, sign }: Props) {
  const [turned, setTurned] = useState<Set<string>>(new Set());

  const turn = (id: string, arcanum?: number) => {
    if (turned.has(id)) return;
    setTurned((prev) => new Set(prev).add(id));
    trackEvent("soulmate_preview_card_flipped", {
      category: "quiz",
      label: id,
      value: arcanum,
    });
  };

  const cardFor = (id: string) => reading?.cards.find((c) => c.position === id);

  return (
    <div className="mt-6">
      <p className="text-[15px] leading-relaxed text-white/85">
        {firstName ? `${firstName}, five` : "Five"} cards came up. Two of them
        are already face up.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-white/75">
        Notice which two I turned over. The face-up cards are about{" "}
        <strong className="text-white">you</strong> &mdash; your pattern, your
        window. The face-down ones are about{" "}
        <strong className="text-white">him</strong>. I am not going to hand you
        a person for free. I am going to hand you enough to know whether I read
        you or guessed.
      </p>

      {/* Grade das cinco — 5 colunas no desktop, 3+2 no celular estreito. */}
      <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3">
        {POSITIONS.map((p) => {
          const card = cardFor(p.id);
          const isOpen = p.free && turned.has(p.id);
          return (
            <div key={p.id} className="text-center">
              <button
                type="button"
                disabled={!p.free || !card}
                onClick={() => turn(p.id, card?.arcanum)}
                aria-label={
                  p.free ? `Turn card ${p.id}: ${p.title}` : `${p.title} — face down`
                }
                className={`relative block w-full ${
                  p.free && !isOpen && card
                    ? "cursor-pointer transition-transform hover:scale-[1.03]"
                    : "cursor-default"
                }`}
              >
                {isOpen && card ? (
                  <span className="block overflow-hidden rounded-xl border border-gold-400/45">
                    <Image
                      src={card.image}
                      alt=""
                      width={200}
                      height={340}
                      className="h-auto w-full"
                    />
                  </span>
                ) : (
                  <span className="relative block">
                    <CardBack className="aspect-[10/17] w-full opacity-85" />
                    {!p.free && (
                      <Lock
                        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-gold"
                        aria-hidden
                      />
                    )}
                  </span>
                )}
              </button>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
                {p.id}
              </p>
              <p className="text-[11px] leading-tight text-white/55">
                {p.free
                  ? isOpen
                    ? card?.name
                    : "Tap to turn"
                  : "Face down"}
              </p>
            </div>
          );
        })}
      </div>

      {/* O texto das duas grátis, abaixo da grade. */}
      <div className="mt-6 space-y-5">
        {POSITIONS.filter((p) => p.free).map((p) => {
          const text = freeText(reading, p.field);
          const open = turned.has(p.id);
          if (!open) return null;
          return (
            <div key={p.id} className="border-l-2 border-gold-400/40 pl-4">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-gold-300">
                {p.id} &mdash; {p.title}
              </h3>
              {text ? (
                <p className="mt-1.5 text-[15px] leading-relaxed text-white/85">
                  {text}
                </p>
              ) : (
                <p className="mt-1.5 text-[15px] leading-relaxed text-white/55">
                  Master Aura is still writing this one.
                </p>
              )}
              {/* Recibo de derivação: não é alegação de acerto, é alegação de
                  ORIGEM — a única coisa que um horóscopo não consegue
                  produzir, e o que este público compra. */}
              <p className="mt-2 text-[11px] italic text-white/40">
                Read from: {sign ? `your Sun in ${sign} · ` : ""}your birth date
                {p.field === "obstacle" ? " · what you told me" : " · today's sky"}
              </p>
            </div>
          );
        })}
      </div>

      {/* A frase que ataca o refazer-o-quiz. Verdadeira: a tirada é
          idempotente por e-mail no servidor. */}
      <p className="mt-6 text-[13px] leading-relaxed text-white/50">
        These are your cards. They were drawn once, from your answers &mdash;
        and they do not change if you start over.
      </p>
    </div>
  );
}
