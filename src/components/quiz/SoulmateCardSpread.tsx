"use client";

// A tirada na VSL — cinco versos, e o convite para virá-los.
//
// ANTES (28/08) as duas cartas grátis viravam AQUI, no meio da página de
// venda. O dono olhou o resultado e disse "está praticamente igual": e
// estava. Uma carta que se abre entre um parágrafo de preço e um bloco de
// FAQ não é revelação — é um acordeão. A cerimônia mudou-se para
// /quiz/reveal, onde a página inteira é a tirada.
//
// O que fica aqui é o que a página de venda precisa: a prova de que as
// cartas EXISTEM, saíram e estão paradas esperando — cinco versos reais,
// não cinco rótulos com cadeado, que era a lista SEALED que este componente
// substituiu justamente por afirmar a lacuna sem demonstrar nada.
//
// Tocar numa carta é o mesmo que tocar no botão: leva para a revelação.
// Uma carta que parece clicável e não faz nada custa mais confiança do que
// uma carta que não parece clicável.

import { Lock } from "lucide-react";
import CardBack from "@/components/CardBack";
import { POSITIONS, type SoulmateReading } from "@/lib/soulmate-reading";

interface Props {
  reading: SoulmateReading;
  /** Primeiro nome, quando o quiz o capturou. */
  firstName?: string;
  /** Levar para a revelação — o mesmo caminho do CTA, com a mesma medição. */
  onOpen: () => void;
}

export default function SoulmateCardSpread({
  reading,
  firstName,
  onOpen,
}: Props) {
  const cardFor = (id: string) => reading.cards.find((c) => c.position === id);

  return (
    <div className="mt-6">
      <p className="text-[15px] leading-relaxed text-white/85">
        {firstName ? `${firstName}, five` : "Five"} cards came up. They came up
        once, and they have not moved since.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-white/75">
        Two of them are yours to read for nothing &mdash; the two that are about{" "}
        <strong className="text-white">you</strong>, your pattern and your
        timing. The other three are about{" "}
        <strong className="text-white">him</strong>. I am not going to hand you
        a person for free. I am going to hand you enough to know whether I read
        you or guessed.
      </p>

      {/* Grade das cinco. Colunas fixas: cinco cartas em 3+2 quebravam a
          leitura da tirada como UMA coisa. */}
      <div className="mt-6 grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {POSITIONS.map((p) => {
          const card = cardFor(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={onOpen}
              aria-label={
                p.free
                  ? `Open your reading: card ${p.id}, ${p.title}`
                  : `Card ${p.id}, ${p.title} — sealed`
              }
              className="block w-full cursor-pointer text-center transition-transform hover:scale-[1.04]"
            >
              <span className="relative block">
                <CardBack
                  className={`aspect-[10/17] w-full ${
                    p.free ? "opacity-100" : "opacity-60"
                  }`}
                />
                {!p.free && (
                  <Lock
                    className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-gold"
                    aria-hidden
                  />
                )}
                {/* A carta existe e tem nome — o verso é o que ela ainda
                    não mostrou, não um placeholder. */}
                {card && p.free && (
                  <span className="absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/80 to-transparent px-1 pb-1 pt-4">
                    <span className="block text-[9px] font-semibold uppercase tracking-wide text-gold-200">
                      Opens next
                    </span>
                  </span>
                )}
              </span>
              <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gold-300">
                {p.id}
              </span>
              <span className="block text-[10px] leading-tight text-white/50">
                {p.free ? "Free" : "Sealed"}
              </span>
            </button>
          );
        })}
      </div>

      {/* A frase que ataca o refazer-o-quiz — 27% dos que começam o quiz o
          refazem. É verdadeira: a tirada é idempotente por e-mail no
          servidor, então refazer devolve exatamente estas cartas.
          O que NÃO se diz mais é que elas foram "tiradas das suas
          respostas": o sorteio é aleatório em código (drawEgyptian) e são
          as respostas que escrevem o TEXTO de cada posição, não que
          escolhem os arcanos. A alegação de origem vive no recibo sob cada
          carta grátis, onde ela se sustenta. */}
      <p className="mt-5 text-[13px] leading-relaxed text-white/50">
        These are your cards. They do not change if you start over.
      </p>
    </div>
  );
}
