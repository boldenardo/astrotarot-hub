"use client";

// A REVELAÇÃO — as duas cartas grátis, viradas uma de cada vez.
//
// Por que existe como página, e não como bloco da VSL: na VSL as duas
// cartas grátis viravam ao lado das três trancadas, no meio de uma página
// de venda de mil e quinhentas linhas. O dono olhou e disse "está
// praticamente igual" — e estava: virar uma carta entre um parágrafo de
// preço e um bloco de FAQ não é revelação, é um acordeão. Aqui a página
// inteira é a tirada, e ela acontece em três tempos.
//
// ── A CICATRIZ QUE ESTE ARQUIVO RESPEITA ────────────────────────────────
//
// Em 27/08 uma tela de cartas ANTES do formulário de pagamento matou 3 de
// 8 pessoas que já tinham decidido comprar (ver CustomCheckout.tsx). A
// lição não foi "cartas não funcionam" — foi que ninguém pode ser obrigado
// a jogar para chegar ao pagamento. Então: a oferta e o botão de compra
// existem desde o primeiro paint, abaixo da tirada, e a cerimônia nunca é
// um portão. Quem rolar direto para o botão compra sem virar nada.
//
// ── E A CICATRIZ DO WATCHDOG ────────────────────────────────────────────
//
// Nada aqui espera callback de animação. O sequenciamento é estado do
// React; o giro é CSS que pode simplesmente não rodar. Num aparelho fraco
// (prefersNoTransitions) as cartas trocam de face instantaneamente e a
// cerimônia continua existindo — porque o que a compõe é o que está na
// tela, não o que se move: a carta IV não é renderizada antes da III
// virar, e as três trancadas não existem no DOM antes da IV.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import CardBack from "@/components/CardBack";
import { trackEvent } from "@/lib/analytics";
import { prefersNoTransitions } from "@/lib/funnel-variant";
import {
  FREE_POSITIONS,
  POSITIONS,
  REVEAL_DONE_KEY,
  deckLine,
  type DossierField,
  type PositionId,
  type SoulmateReading,
} from "@/lib/soulmate-reading";

interface Props {
  reading: SoulmateReading;
  firstName?: string;
  sign?: string;
  /** A oferta e o botão de compra. Existem desde o primeiro paint. */
  offerSlot: React.ReactNode;
}

/** O que cada carta trancada promete — o suficiente para querer, não para
 *  satisfazer. Nenhuma delas solta um adjetivo sobre ELE, que é a regra em
 *  que todo o resto da prévia se apoia (ver DOSSIER_SYSTEM). */
const LOCKED_LINE: Record<string, string> = {
  I: "His face, his build, and what a room does when he walks into it. The portrait comes unblurred with it.",
  II: "Four of them, in the words the cards used. Not tall. Not kind. Four you could pick him out with.",
  V: "One thing to do, and it sits inside the dates card IV just gave you.",
};

type Stage = "closed" | "third" | "fourth" | "all";

const ORDER: Stage[] = ["closed", "third", "fourth", "all"];
const atLeast = (s: Stage, min: Stage) => ORDER.indexOf(s) >= ORDER.indexOf(min);

export default function SoulmateReveal({
  reading,
  firstName,
  sign,
  offerSlot,
}: Props) {
  const [stage, setStage] = useState<Stage>("closed");
  const [degraded, setDegraded] = useState(false);
  const timers = useRef<number[]>([]);
  const firedRef = useRef(false);

  const cardOf = useCallback(
    (id: PositionId) => reading.cards.find((c) => c.position === id),
    [reading]
  );

  /** O texto de uma carta grátis. Nunca fica vazio: sem dossiê, o baralho
   *  ainda tem o que dizer sobre a própria carta. A janela solar é null em
   *  leituras gravadas antes de 28/08 e em datas que não parseiam — e o
   *  clímax da cerimônia não pode ser "ainda estou escrevendo". */
  const textOf = useCallback(
    (field: DossierField, id: PositionId, ordinalWord: string): string => {
      const v = reading.free?.[field];
      if (typeof v === "string" && v.trim()) return v;
      return deckLine(cardOf(id), ordinalWord);
    },
    [reading, cardOf]
  );

  const hasWindow = Boolean(reading.window);

  // Pré-carrega as artes que vão virar.
  //
  // Sem isto o giro de 0,85s termina numa face BRANCA e a arte aparece
  // depois, porque o next/image das faces é lazy por padrão e a face de
  // trás só entra na viewport quando já virou. Uma carta que se abre vazia
  // e preenche meio segundo depois não é revelação — é carregamento. As
  // duas juntas são alguns KB e ninguém as vê chegar.
  useEffect(() => {
    for (const c of reading.cards) {
      // Só as grátis: são as únicas que chegam a virar.
      if (!FREE_POSITIONS.includes(c.position)) continue;
      const img = new window.Image();
      img.src = c.image;
    }
  }, [reading]);

  // Retomada: quem volta do checkout não deve refazer o ritual. Monta no
  // estado final e NÃO dispara os eventos de virada — "alguém virou uma
  // carta" tem de significar isso, ou não significa nada.
  useEffect(() => {
    setDegraded(prefersNoTransitions());
    let done = false;
    try {
      done = localStorage.getItem(REVEAL_DONE_KEY) === "1";
    } catch {
      // storage bloqueado: a cerimônia roda de novo, o que é inofensivo
    }
    if (done) {
      setStage("all");
      trackEvent("soulmate_reveal_resumed", { category: "quiz" });
    }
    trackEvent("soulmate_reveal_viewed", {
      category: "quiz",
      label: reading.source,
    });
    const t = timers.current;
    return () => {
      for (const id of t) window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Timer rastreado. Em aparelho fraco o atraso é zero: o intervalo é
   *  respiro, e respiro num telefone que engasga vira travamento. */
  const later = useCallback(
    (fn: () => void, ms: number) => {
      if (degraded) {
        fn();
        return;
      }
      timers.current.push(window.setTimeout(fn, ms));
    },
    [degraded]
  );

  const markDone = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    try {
      localStorage.setItem(REVEAL_DONE_KEY, "1");
    } catch {
      // sem storage: vale só nesta visita
    }
    trackEvent("soulmate_reveal_completed", { category: "quiz" });
  }, []);

  const turn = useCallback(
    (id: PositionId) => {
      const card = cardOf(id);
      trackEvent("soulmate_preview_card_flipped", {
        category: "quiz",
        label: id,
        value: card?.arcanum,
      });
      if (id === "III") {
        setStage("third");
        return;
      }
      setStage("fourth");
      // As três trancadas entram como consequência da IV ter virado, não
      // junto com ela: é a batida que faz a pergunta "e as outras?".
      later(() => {
        setStage("all");
        markDone();
      }, 900);
    },
    [cardOf, later, markDone]
  );

  /** Saída. Nunca prender: quem quer o preço agora tem como chegar nele. */
  const skip = useCallback(() => {
    trackEvent("soulmate_reveal_skipped", { category: "quiz" });
    setStage("all");
    markDone();
  }, [markDone]);

  const name = firstName?.trim();

  const receipt = useMemo(
    () =>
      (field: DossierField) =>
        `Read from: ${sign ? `your Sun in ${sign} · ` : ""}your birth date${
          field === "obstacle" ? " · what you told me" : " · today's sky"
        }`,
    [sign]
  );

  const showAll = stage === "all";

  return (
    <div className={degraded ? "sm-degraded" : undefined}>
      {/* ── ABERTURA ────────────────────────────────────────────────── */}
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
          Your spread
        </p>
        <h1 className="mt-3 font-display text-[1.7rem] leading-tight text-white sm:text-[2rem]">
          {name ? `${name}, five cards came up for you.` : "Five cards came up for you."}
        </h1>
        {/* Antes dizia "tiradas das suas respostas". Não é verdade: o
            sorteio é aleatório em código (drawEgyptian) e são as respostas
            que escrevem o TEXTO, não que escolhem as cartas. O que é
            verdade — e é o que desarma refazer o quiz — é que elas foram
            tiradas uma vez e ficam. */}
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
          They came up once, and they have not moved since. Two of them open
          here. The other three do not.
        </p>
      </header>

      {/* ── AS CINCO ────────────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {POSITIONS.map((p) => {
          const card = cardOf(p.id);
          // SÓ as duas grátis viram. Nunca as trancadas.
          //
          // A primeira versão abria as cinco no fim da cerimônia — arte
          // visível, texto trancado — na ideia de que ver a carta que
          // representa ele aumentaria o desejo. Errado, e o dono pegou: com
          // as cinco abertas a tela DIZ que a revelação acabou, e ninguém
          // paga para terminar o que parece terminado. O que vende é o que
          // continua virado para baixo.
          const faceUp =
            (p.id === "III" && atLeast(stage, "third")) ||
            (p.id === "IV" && atLeast(stage, "fourth"));
          const isNext =
            (p.id === "III" && stage === "closed") ||
            (p.id === "IV" && stage === "third");
          return (
            <div key={p.id} className="text-center">
              <button
                type="button"
                disabled={!isNext || !card}
                onClick={() => turn(p.id)}
                aria-label={
                  isNext
                    ? `Turn card ${p.id}: ${p.title}`
                    : `Card ${p.id}: ${p.title}`
                }
                className={`sm-flip block w-full ${
                  isNext
                    ? "cursor-pointer transition-transform hover:scale-[1.04]"
                    : "cursor-default"
                } ${isNext && !degraded ? "animate-pulse" : ""}`}
                data-face={faceUp ? "up" : "down"}
              >
                <span className="sm-flip-inner block">
                  <span className="sm-flip-face block">
                    <CardBack
                      className={`h-full w-full ${
                        isNext ? "opacity-100" : "opacity-70"
                      }`}
                    />
                    {!p.free && (
                      <Lock
                        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-gold"
                        aria-hidden
                      />
                    )}
                  </span>
                  {/* A face virada só EXISTE para as duas grátis. Nas
                      trancadas ela ficava no DOM escondida por
                      backface-visibility — invisível na tela e visível em
                      dois cliques no inspetor, além de baixar três imagens
                      que ninguém ia ver, num funil que é quase todo
                      celular. O que não pode ser visto não é renderizado. */}
                  <span className="sm-flip-face sm-flip-face--back block overflow-hidden rounded-xl border border-gold-400/45">
                    {p.free && card && (
                      <Image
                        src={card.image}
                        alt=""
                        width={200}
                        height={340}
                        loading="eager"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>
                </span>
              </button>
              {/* translate="no": o tradutor do navegador transforma o
                  algarismo romano "I" em "EU" e "IV" em "4" — foi o que o
                  dono viu no print. Os rótulos das posições não são texto
                  para traduzir, são numeração. */}
              <p
                translate="no"
                className="notranslate mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300"
              >
                {p.id}
              </p>
              <p className="text-[10px] leading-tight text-white/50">
                {isNext ? "Tap to turn" : faceUp ? card?.name : "Sealed"}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── TEMPO 1: o convite ──────────────────────────────────────── */}
      {stage === "closed" && (
        <div className="mt-7 text-center">
          <p className="text-[16px] font-semibold leading-snug text-white">
            Start with the third. Put your thumb on it.
          </p>
          <p className="mx-auto mt-2.5 max-w-md text-[14px] leading-relaxed text-white/65">
            This one is about you, not about him. You will know inside a
            sentence whether I read you or guessed.
          </p>
        </div>
      )}

      {/* ── TEMPO 2: a carta III ────────────────────────────────────── */}
      {atLeast(stage, "third") && (
        <div className="sm-enter mt-8 border-l-2 border-gold-400/40 pl-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gold-300">
            <span translate="no" className="notranslate">III</span> &mdash;{" "}
            {POSITIONS[2].title}
          </h2>
          <p className="mt-2 text-[16px] leading-relaxed text-white/90">
            {textOf("obstacle", "III", "third")}
          </p>
          {/* Recibo de DERIVAÇÃO, não de acerto: a origem é a única coisa
              que um horóscopo genérico não consegue produzir. */}
          <p className="mt-2.5 text-[11px] italic text-white/40">
            {receipt("obstacle")}
          </p>
        </div>
      )}

      {/* ── A ponte para a IV ───────────────────────────────────────── */}
      {stage === "third" && (
        <div className="sm-enter mt-8 text-center">
          <p className="text-[15px] leading-relaxed text-white/75">
            Sit with that one before you move.
          </p>
          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-white/75">
            The third card told you what has been standing in the doorway. The
            fourth tells you when the doorway is open
            {hasWindow ? " — and that one is a date, not a feeling" : ""}.
          </p>
        </div>
      )}

      {/* ── TEMPO 3: a carta IV ─────────────────────────────────────── */}
      {atLeast(stage, "fourth") && (
        <div className="sm-enter mt-8 border-l-2 border-gold-400/40 pl-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gold-300">
            <span translate="no" className="notranslate">IV</span> &mdash;{" "}
            {POSITIONS[3].title}
          </h2>
          <p className="mt-2 text-[16px] leading-relaxed text-white/90">
            {textOf("meeting_window", "IV", "fourth")}
          </p>
          <p className="mt-2.5 text-[11px] italic text-white/40">
            {receipt("meeting_window")}
          </p>
        </div>
      )}

      {/* ── O PIVÔ: as três que sobraram ────────────────────────────── */}
      {showAll && (
        <div className="sm-enter mt-10">
          <p className="text-[15px] leading-relaxed text-white/75">
            Those two were about you &mdash; your pattern, and your timing. They
            are the two you could check.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            The three still face down are the ones with a person in them. They
            stay face down until you ask for them.
          </p>

          <div className="mt-6 space-y-3">
            {POSITIONS.filter((p) => !p.free).map((p) => {
              return (
                <div
                  key={p.id}
                  className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  {/* Verso e cadeado. Nem a arte, nem o nome do arcano: o
                      que ela não pode ver é o que a faz pagar. */}
                  <span className="relative block w-14 shrink-0">
                    <CardBack className="aspect-[10/17] w-full opacity-75" />
                    <Lock
                      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-gold"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      translate="no"
                      className="notranslate text-[11px] font-semibold uppercase tracking-wide text-gold-300"
                    >
                      {p.id}
                    </p>
                    <p className="mt-0.5 text-[14px] font-medium leading-snug text-white/90">
                      {p.title}
                    </p>
                    <p className="mt-1 flex items-start gap-1.5 text-[13px] leading-snug text-white/55">
                      <Lock
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400/70"
                        aria-hidden
                      />
                      {LOCKED_LINE[p.id]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-[15px] font-semibold leading-relaxed text-white">
            I turned the two that let you test me. I kept the three you came
            here for.
          </p>
        </div>
      )}

      {/* ── A OFERTA ────────────────────────────────────────────────── */}
      {/* Sempre montada. Foi o conserto de 27/08: um ritual que precisa ser
          jogado até o fim para o pagamento aparecer custou 3 de 8 compras. */}
      <div className="mt-10">{offerSlot}</div>

      {/* Saída explícita, só enquanto a cerimônia está em curso. */}
      {!showAll && (
        <p className="mt-6 text-center">
          <button
            type="button"
            onClick={skip}
            className="text-[13px] text-white/45 underline underline-offset-4 hover:text-white/70"
          >
            Show me the rest of the spread
          </button>
        </p>
      )}
    </div>
  );
}
