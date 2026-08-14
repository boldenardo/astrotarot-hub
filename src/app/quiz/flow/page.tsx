"use client";

// Funil de alma gêmea em formato de conversa (DM).
//
// Regras de ritmo:
// - A Master Aura NÃO comenta cada resposta: fala em momentos-chave, no
//   tempo de quem digita de verdade (ver typingDelayFor) — a espera é o
//   que cria a sensação de conversa íntima.
// - Quem não quer esperar toca na conversa e revela tudo de uma vez.
// - Perguntas avançam sozinhas ao toque (sem botão "continuar").
// - Estado e posição persistem em localStorage; um refresh volta para a
//   MESMA tela, inclusive nas que não têm resposta (vídeo, cidade).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CircleCheck,
  Heart,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  MapPin,
  Sparkles,
  Star,
  Sun,
  Volume2,
} from "lucide-react";
import {
  MASTER_AURA,
  SIGN_LOVE_TRAIT,
  STEPS,
  ZODIAC_SIGNS,
  computeScore,
  getAnalyzingStages,
  loadQuizState,
  resolveReactionText,
  resumeIndex,
  saveQuizState,
  signFromDate,
  type QuizState,
  type QuizStep,
} from "@/lib/quiz-data";
import { trackEvent } from "@/lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GUIDE_PHOTO = "/luna.jpg";

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -40 : 40 }),
};

export default function QuizFlowPage() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>({ answers: {} });
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const advancingRef = useRef(false);
  const startedRef = useRef(false);

  // Restaura o estado e retoma exatamente onde a pessoa parou.
  useEffect(() => {
    const restored = loadQuizState();
    setState(restored);
    setStepIndex(resumeIndex(restored));
    setHydrated(true);
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("quiz_started", { category: "quiz" });
    }
  }, []);

  // Persiste estado + posição (o passo entra no mesmo objeto para que um
  // refresh volte para a mesma tela, inclusive nas telas sem resposta).
  useEffect(() => {
    if (hydrated) saveQuizState({ ...state, stepIndex });
  }, [state, stepIndex, hydrated]);

  const step: QuizStep = STEPS[Math.min(stepIndex, STEPS.length - 1)];
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);
  const isAnalyzing = step.id === "analyzing";
  const firstName = state.name?.trim().split(/\s+/)[0];

  // Trava de transição: com AnimatePresence mode="wait", trocar a key
  // durante a animação de saída deixa a tela presa. Duplo clique / duplo
  // submit é comum no mobile, então bloqueamos avanços em sequência.
  const transitionLockRef = useRef(false);
  const withTransitionLock = useCallback((move: () => void) => {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    move();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
      window.setTimeout(() => {
        transitionLockRef.current = false;
      }, 400);
    } else {
      transitionLockRef.current = false;
    }
  }, []);

  const goNext = useCallback(() => {
    withTransitionLock(() => {
      advancingRef.current = false;
      setDirection(1);
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    });
  }, [withTransitionLock]);

  const goBack = useCallback(() => {
    withTransitionLock(() => {
      advancingRef.current = false;
      setDirection(-1);
      setStepIndex((i) => Math.max(i - 1, 0));
    });
  }, [withTransitionLock]);

  const handleAnswer = useCallback(
    (questionId: string, value: string) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
        ...(questionId === "q_sign" ? { sign: value } : null),
      }));
      // Flash de seleção e segue — sem reação por resposta.
      window.setTimeout(goNext, 220);
    },
    [goNext]
  );

  const handleName = useCallback(
    (name: string) => {
      setState((prev) => ({ ...prev, name: name.trim() || undefined }));
      goNext();
    },
    [goNext]
  );

  const handleBirthdate = useCallback(
    (birthDate: string) => {
      const derived = signFromDate(birthDate);
      setState((prev) => ({ ...prev, birthDate, sign: derived ?? prev.sign }));
      goNext();
    },
    [goNext]
  );

  const handleEmail = useCallback(
    (email: string) => {
      setState((prev) => ({ ...prev, email }));
      goNext();
    },
    [goNext]
  );

  const handleAnalyzingDone = useCallback(() => {
    setState((prev) => {
      const next: QuizState = { ...prev, score: computeScore(prev.answers) };
      saveQuizState(next); // flush antes de navegar
      return next;
    });
    trackEvent("quiz_completed", { category: "quiz" });
    router.push("/quiz/vsl");
  }, [router]);

  const vars = useMemo(
    () => ({ name: firstName, sign: state.sign }),
    [firstName, state.sign]
  );

  // Sem gate de hidratação: a primeira tela precisa aparecer no HTML inicial.
  // Bloquear tudo até `hydrated` mostrava um spinner em conexões lentas —
  // custo direto de conversão logo na entrada do funil. O passo salvo é
  // aplicado no effect acima, logo após a hidratação.
  return (
    <div className="flex flex-1 flex-col">
      {/* Progresso */}
      <div
        className="mb-3 mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Quiz progress"
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #edd9a3, #d4af37 60%, #a9822f)",
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Voltar */}
      {stepIndex > 0 && !isAnalyzing && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] text-[#b9b2d0] transition-colors hover:text-[#e8e4f5]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
      )}

      <div className="relative flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full"
          >
            {step.kind === "name" && (
              <NameStep
                messages={step.messages}
                placeholder={step.placeholder}
                cta={step.cta}
                initialValue={state.name ?? ""}
                onContinue={handleName}
              />
            )}

            {step.kind === "chat" && (
              <ChatStep
                messages={step.messages.map((m) => resolveReactionText(m, vars))}
                cta={step.cta}
                onContinue={goNext}
              />
            )}

            {step.kind === "question" && (
              <QuestionStep
                step={step}
                selected={state.answers[step.id]}
                vars={vars}
                onAnswer={handleAnswer}
              />
            )}

            {step.kind === "reveal" && (
              <RevealStep step={step} sign={state.sign} onContinue={goNext} />
            )}

            {step.kind === "proof" && (
              <ProofStep step={step} onContinue={goNext} />
            )}

            {step.kind === "media" && (
              <MediaStep
                step={step}
                vars={vars}
                onContinue={goNext}
              />
            )}

            {step.kind === "location" && (
              <LocationStep
                cta={step.cta}
                name={firstName}
                onContinue={goNext}
              />
            )}

            {step.kind === "birthdate" && (
              <BirthdateStep
                initialValue={state.birthDate ?? ""}
                onContinue={handleBirthdate}
              />
            )}

            {step.kind === "email" && (
              <EmailStep
                initialEmail={state.email ?? ""}
                name={firstName}
                onContinue={handleEmail}
              />
            )}

            {isAnalyzing && (
              <AnalyzingScreen name={state.name} onDone={handleAnalyzingDone} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------ Chat bubbles ----------------------------- */

/** Bolha da guia com avatar — o bloco visual base da conversa. */
function GuideBubble({
  children,
  showAvatar = true,
}: {
  children: React.ReactNode;
  showAvatar?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      {showAvatar ? (
        <Image
          src={GUIDE_PHOTO}
          alt=""
          width={72}
          height={72}
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
        />
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden />
      )}
      <div className="glass max-w-[85%] rounded-2xl rounded-bl-md border border-[rgba(212,175,55,0.25)] px-4 py-3 text-left text-[15px] leading-relaxed text-[#e8e4f5]">
        {children}
      </div>
    </div>
  );
}

/** Três pontinhos de "digitando". */
function TypingBubble() {
  return (
    <GuideBubble>
      <span className="flex h-5 items-center gap-1.5" aria-label="Typing">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </span>
    </GuideBubble>
  );
}

// Ritmo de digitação: proporcional ao tamanho da mensagem, como uma pessoa
// escrevendo de verdade. Uma frase curta leva ~1,2s; uma longa, até 4,5s.
// Conversa íntima > velocidade: a espera é o que cria a sensação de que
// alguém está do outro lado pensando na resposta.
const MS_PER_CHAR = 32;
const TYPING_MIN_MS = 1200;
const TYPING_MAX_MS = 4500;

function typingDelayFor(message: string | undefined): number {
  const len = message?.length ?? 60;
  return Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, len * MS_PER_CHAR));
}

/**
 * Revela as mensagens uma a uma com "digitando" entre elas, no ritmo de
 * quem realmente escreve. Retorna quantas já apareceram e se terminou.
 */
function useMessageReveal(messages: string[]) {
  const count = messages.length;
  // A PRIMEIRA mensagem já nasce visível (inclusive no HTML do servidor):
  // esperar para a tela ter conteúdo custa conversão na entrada.
  // As seguintes é que ganham o efeito de "digitando".
  const [shown, setShown] = useState(count > 0 ? 1 : 0);
  const [typing, setTyping] = useState(count > 1);

  // Os textos entram por ref: os componentes montam o array a cada render
  // (map + interpolação de nome), e usá-lo como dependência reiniciaria o
  // timer a cada render — a conversa nunca avançaria.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    setShown(count > 0 ? 1 : 0);
    setTyping(count > 1);
  }, [count]);

  useEffect(() => {
    if (shown >= count) {
      setTyping(false);
      return;
    }
    setTyping(true);
    // O tempo é o da PRÓXIMA mensagem (a que está sendo "digitada").
    const t = window.setTimeout(() => {
      setShown((s) => s + 1);
    }, typingDelayFor(messagesRef.current[shown]));
    return () => window.clearTimeout(t);
  }, [shown, count]);

  /** Revela tudo de uma vez — para quem não quer esperar o ritmo lento. */
  const revealAll = useCallback(() => setShown(count), [count]);

  return {
    shown,
    typing: typing && shown < count,
    done: shown >= count,
    revealAll,
  };
}

/**
 * Conversa da guia. É a ÚNICA dona do estado de revelação — avisa o passo
 * pai via `onDone` para ele mostrar o input/botão. Antes cada passo
 * chamava o hook por conta própria e, ao pular a digitação, o conteúdo
 * seguinte não aparecia.
 */
function GuideConversation({
  messages,
  onDone,
}: {
  messages: string[];
  onDone?: () => void;
}) {
  const { shown, typing, done, revealAll } = useMessageReveal(messages);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  return (
    // Tocar em qualquer lugar da conversa adianta as mensagens: o ritmo
    // lento cria intimidade, mas ninguém pode ficar preso esperando.
    <div
      className="flex flex-col gap-2"
      onClick={typing ? revealAll : undefined}
      role={typing ? "button" : undefined}
      tabIndex={typing ? 0 : undefined}
      aria-label={typing ? "Show all messages" : undefined}
      onKeyDown={
        typing
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                revealAll();
              }
            }
          : undefined
      }
    >
      {messages.slice(0, shown).map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GuideBubble showAvatar={i === 0}>{m}</GuideBubble>
        </motion.div>
      ))}
      {typing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TypingBubble />
        </motion.div>
      )}
    </div>
  );
}

/** Botão primário do funil (pill dourado, largura total). */
function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="btn-gold mt-6 flex min-h-[56px] w-full items-center justify-center rounded-full px-8 text-base disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/* --------------------------------- Name --------------------------------- */

function NameStep({
  messages,
  placeholder,
  cta,
  initialValue,
  onContinue,
}: {
  messages: string[];
  placeholder?: string;
  cta?: string;
  initialValue: string;
  onContinue: (name: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return; // evita duplo submit (Enter + clique)
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Please tell me your name so I can read your chart.");
      return;
    }
    setSubmitted(true);
    onContinue(trimmed);
  };

  return (
    <form onSubmit={submit} noValidate>
      <GuideConversation messages={messages} onDone={() => setDone(true)} />
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <label htmlFor="quiz-name" className="sr-only">
            Your first name
          </label>
          <input
            id="quiz-name"
            type="text"
            autoComplete="given-name"
            autoFocus
            placeholder={placeholder ?? "Your first name"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            className="glass glass-gold mt-6 block min-h-[56px] w-full min-w-0 rounded-2xl px-4 text-center text-base text-[#e8e4f5] placeholder:text-[rgba(185,178,208,0.6)] outline-none focus:border-[#d4af37]"
          />
          {error && (
            <p role="alert" className="mt-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" disabled={submitted}>
            {cta ?? "Continue"}
          </PrimaryButton>
        </motion.div>
      )}
    </form>
  );
}

/* --------------------------------- Chat --------------------------------- */

function ChatStep({
  messages,
  cta,
  onContinue,
}: {
  messages: string[];
  cta?: string;
  onContinue: () => void;
}) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <GuideConversation messages={messages} onDone={() => setDone(true)} />
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PrimaryButton onClick={onContinue}>{cta ?? "Continue"}</PrimaryButton>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------- Question -------------------------------- */

function QuestionStep({
  step,
  selected,
  vars,
  onAnswer,
}: {
  step: Extract<QuizStep, { kind: "question" }>;
  selected?: string;
  vars: { name?: string; sign?: string };
  onAnswer: (questionId: string, value: string) => void;
}) {
  const intro = step.intro?.map((m) => resolveReactionText(m, vars));
  const [introDone, setIntroDone] = useState(false);
  const showOptions = !intro || introDone;
  const isSignGrid = step.id === "q_sign";

  return (
    <div>
      {intro && (
        <GuideConversation messages={intro} onDone={() => setIntroDone(true)} />
      )}

      {showOptions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={intro ? "mt-6" : ""}
        >
          <h2 className="text-balance text-center text-xl font-semibold leading-snug text-[#e8e4f5] sm:text-2xl">
            {step.question}
          </h2>
          {step.subtitle && (
            <p className="mt-2 text-center text-sm text-[#b9b2d0]">
              {step.subtitle}
            </p>
          )}

          <div
            className={`mt-5 grid gap-2.5 ${
              isSignGrid ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {step.options.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onAnswer(step.id, opt.value)}
                  className={`glass flex min-h-[60px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? "glass-gold ring-1 ring-[#d4af37]"
                      : "hover:border-[rgba(212,175,55,0.4)]"
                  }`}
                >
                  {opt.symbol && (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.12)] text-lg text-[#e8d9a8]"
                      aria-hidden
                    >
                      {opt.symbol}
                    </span>
                  )}
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium text-[#e8e4f5]">
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="text-xs text-[#b9b2d0]">{opt.hint}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* -------------------------------- Reveal --------------------------------- */

const REVEAL_ICONS = {
  sun: Sun,
  venus: Heart,
  house: InfinityIcon,
} as const;

function RevealStep({
  step,
  sign,
  onContinue,
}: {
  step: Extract<QuizStep, { kind: "reveal" }>;
  sign?: string;
  onContinue: () => void;
}) {
  const signData = ZODIAC_SIGNS.find((s) => s.name === sign);
  const trait = sign ? SIGN_LOVE_TRAIT[sign] : undefined;
  const vars = { sign, trait };

  const fill = (text: string) =>
    text
      .replace("{sign}", sign ?? "your sign")
      .replace("{trait}", vars.trait ?? "you love with your whole heart");

  return (
    <div className="text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {step.eyebrow}
      </p>

      {/* Card do signo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass glass-gold relative mt-4 overflow-hidden rounded-3xl px-6 py-8"
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.18),transparent_60%)]"
        />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#edd9a3] to-[#a9822f] text-3xl text-[#1a1330]">
            {signData?.symbol ?? "✦"}
          </span>
          <p className="mt-3 font-display text-3xl font-semibold text-[#e8e4f5]">
            {sign ?? "Your sign"}
          </p>
          {signData && (
            <p className="mt-1 text-sm text-[#b9b2d0]">
              {signData.element} · {signData.dates}
            </p>
          )}
        </div>
      </motion.div>

      {/* Leituras do mapa */}
      <ul className="mt-4 flex flex-col gap-2.5 text-left">
        {step.lines.map((line, i) => {
          const Icon = REVEAL_ICONS[line.icon];
          return (
            <motion.li
              key={line.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.35, duration: 0.35 }}
              className="glass flex items-start gap-3 rounded-2xl px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(212,175,55,0.14)]">
                <Icon className="h-4 w-4 text-[#d4af37]" aria-hidden />
              </span>
              <span className="text-[15px] leading-snug text-[#e8e4f5]">
                <span className="font-semibold">{fill(line.title)}</span>{" "}
                <span className="text-[#b9b2d0]">— {fill(line.text)}</span>
              </span>
            </motion.li>
          );
        })}
      </ul>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
      >
        <p className="glass mt-4 rounded-2xl px-5 py-4 text-[15px] leading-relaxed text-[#e8e4f5]">
          {step.closing.split("I can finally visualize their face")[0]}
          <span className="font-semibold text-[#d4af37]">
            I can finally visualize their face.
          </span>
        </p>
        <PrimaryButton onClick={onContinue}>{step.cta ?? "Continue"}</PrimaryButton>
      </motion.div>
    </div>
  );
}

/* --------------------------------- Proof --------------------------------- */

const PROOF_COUPLES = [
  {
    photo: "/social-proof/couple-1.webp",
    quote: "After years of waiting, I found him — exactly like the reading said.",
    author: "Sarah C.",
  },
  {
    photo: "/social-proof/couple-2.webp",
    quote: "I found my husband right after my soulmate reading.",
    author: "Ellen T.",
  },
  {
    photo: "/social-proof/couple-3.webp",
    quote:
      "It described him so perfectly I thought it was a coincidence — until we met.",
    author: "Megan R.",
  },
  {
    photo: "/social-proof/couple-4.webp",
    quote: "Aura described my partner perfectly. Now I know he's the one.",
    author: "Priya N.",
  },
];

function ProofStep({
  step,
  onContinue,
}: {
  step: Extract<QuizStep, { kind: "proof" }>;
  onContinue: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-[#e8e4f5]">
        {step.title.replace(" soon", "")}{" "}
        <span className="text-gold">soon</span>
      </h2>
      {step.subtitle && (
        <p className="mt-2 text-sm text-[#b9b2d0]">{step.subtitle}</p>
      )}

      <div className="glass mt-5 flex items-center justify-center gap-6 rounded-2xl px-4 py-4">
        <div>
          <p className="font-display text-2xl font-semibold text-[#e8d9a8]">
            74,000+
          </p>
          <p className="text-xs text-[#b9b2d0]">readings delivered</p>
        </div>
        <span className="h-8 w-px bg-[rgba(255,255,255,0.12)]" aria-hidden />
        <div>
          <p className="flex items-center justify-center gap-1 font-display text-2xl font-semibold text-[#e8d9a8]">
            4.9
            <Star className="h-4 w-4 fill-[#d4af37] text-[#d4af37]" aria-hidden />
          </p>
          <p className="text-xs text-[#b9b2d0]">average rating</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {PROOF_COUPLES.map((c, i) => (
          <motion.figure
            key={c.author}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.3 }}
            className="glass overflow-hidden rounded-2xl text-left"
          >
            <Image
              src={c.photo}
              alt=""
              width={320}
              height={320}
              aria-hidden
              className="aspect-square w-full object-cover"
            />
            <figcaption className="p-3">
              <span className="flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-3 w-3 fill-[#d4af37] text-[#d4af37]"
                    aria-hidden
                  />
                ))}
              </span>
              <p className="mt-1.5 text-xs leading-snug text-[#d6d0e8]">
                &ldquo;{c.quote}&rdquo;
              </p>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-[#b9b2d0]">
                {c.author}
                <BadgeCheck className="h-3 w-3 text-emerald-300" aria-hidden />
              </p>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <PrimaryButton onClick={onContinue}>{step.cta ?? "Continue"}</PrimaryButton>
    </div>
  );
}

/* --------------------------------- Media --------------------------------- */

function MediaStep({
  step,
  vars,
  onContinue,
}: {
  step: Extract<QuizStep, { kind: "media" }>;
  vars: { name?: string; sign?: string };
  onContinue: () => void;
}) {
  const messages = step.messages.map((m) => resolveReactionText(m, vars));
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Autoplay com som pode ser bloqueado; nesse caso oferecemos um botão.
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    if (!done || !step.audio) return;
    const el = audioRef.current;
    if (!el) return;
    el.play().catch(() => setNeedsTap(true));
    return () => {
      el.pause();
      el.currentTime = 0;
    };
  }, [done, step.audio]);

  const playAudio = useCallback(() => {
    audioRef.current
      ?.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
  }, []);

  return (
    <div>
      <GuideConversation messages={messages} onDone={() => setDone(true)} />

      {done && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="relative mt-5 overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.25)] bg-black"
            style={{ aspectRatio: step.aspect }}
          >
            <video
              src={step.src}
              poster={step.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              className="h-full w-full object-cover"
            />
            {step.audio && needsTap && (
              <button
                type="button"
                onClick={playAudio}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 text-white"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d4af37]/90">
                  <Volume2 className="h-6 w-6 text-[#1a1330]" aria-hidden />
                </span>
                <span className="text-sm font-medium">
                  Tap to hear Master Aura
                </span>
              </button>
            )}
          </div>
          {step.audio && (
            // Narração da guia sincronizada com a animação.
            <audio ref={audioRef} src={step.audio} preload="auto" />
          )}
          {step.caption && (
            <p className="mt-2 text-center text-xs text-[#b9b2d0]">
              {step.caption}
            </p>
          )}
          <PrimaryButton onClick={onContinue}>
            {step.cta ?? "Continue"}
          </PrimaryButton>
        </motion.div>
      )}
    </div>
  );
}

/* -------------------------------- Location ------------------------------- */

function LocationStep({
  cta,
  name,
  onContinue,
}: {
  cta?: string;
  name?: string;
  onContinue: () => void;
}) {
  const [place, setPlace] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { city?: string | null; region?: string | null }) => {
        if (!alive) return;
        const label = [d.city, d.region].filter(Boolean).join(", ");
        setPlace(label || null);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const messages = [
    place
      ? `Your birth chart shows that you are likely to meet your soulmate near to 📍 ${place}. I have prepared a special revelation for you, let's see it right now. ✨`
      : `Your birth chart shows the meeting point is close to where you are right now${
          name ? `, ${name}` : ""
        }. I have prepared a special revelation for you, let's see it right now. ✨`,
  ];

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <MapPin className="h-6 w-6 animate-pulse text-[#d4af37]" aria-hidden />
        <p className="mt-3 text-sm text-[#b9b2d0]">
          Locating the meeting point in your chart...
        </p>
      </div>
    );
  }

  return (
    <div>
      <GuideConversation messages={messages} onDone={() => setDone(true)} />
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PrimaryButton onClick={onContinue}>
            {cta ?? "Show me the revelation ✨"}
          </PrimaryButton>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------- Birthdate ------------------------------- */

function BirthdateStep({
  initialValue,
  onContinue,
}: {
  initialValue: string;
  onContinue: (birthDate: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [maxDate, setMaxDate] = useState<string>();

  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setMaxDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !signFromDate(value)) {
      setError("Please enter your full birth date.");
      return;
    }
    if (maxDate && value > maxDate) {
      setError("Your birth date can't be in the future.");
      return;
    }
    onContinue(value);
  };

  return (
    <form onSubmit={submit} noValidate>
      <GuideConversation
        messages={[
          "Your exact birth date is what turns a reading into a portrait — it fixes the position of Venus at the moment you were born.",
        ]}
      />
      <label htmlFor="quiz-birthdate" className="sr-only">
        Birth date
      </label>
      <input
        id="quiz-birthdate"
        type="date"
        required
        max={maxDate}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        // appearance-none + min-w-0/max-w-full: o iOS Safari dá largura
        // intrínseca ao controle nativo de data e estoura o w-full sem isso.
        className="glass glass-gold mt-6 block min-h-[56px] w-full min-w-0 max-w-full appearance-none rounded-2xl px-4 text-center text-base text-[#e8e4f5] outline-none focus:border-[#d4af37] [color-scheme:dark] [&::-webkit-date-and-time-value]:text-center"
      />
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
      <PrimaryButton type="submit">Continue</PrimaryButton>
    </form>
  );
}

/* --------------------------------- Email -------------------------------- */

function EmailStep({
  initialEmail,
  name,
  onContinue,
}: {
  initialEmail: string;
  name?: string;
  onContinue: (email: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    onContinue(trimmed);
  };

  return (
    <form onSubmit={submit} noValidate>
      <GuideConversation
        messages={[
          name
            ? `${name}, your portrait is ready. Where should I send your full Soulmate Reading?`
            : "Your portrait is ready. Where should I send your full Soulmate Reading?",
        ]}
      />

      <label htmlFor="quiz-email" className="sr-only">
        Email address
      </label>
      <input
        id="quiz-email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        className="glass glass-gold mt-6 block min-h-[56px] w-full min-w-0 rounded-2xl px-4 text-center text-base text-[#e8e4f5] placeholder:text-[rgba(185,178,208,0.6)] outline-none focus:border-[#d4af37]"
      />
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}

      <PrimaryButton type="submit">Reveal my soulmate</PrimaryButton>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#b9b2d0]">
        <Lock className="h-3 w-3" aria-hidden="true" />
        No spam. Your reading stays private.
      </p>
    </form>
  );
}

/* ------------------------------- Analyzing ------------------------------ */

const STAGE_INTERVAL_MS = 1100; // 4 stages ≈ 4.4s + exit pause

function AnalyzingScreen({
  name,
  onDone,
}: {
  name?: string;
  onDone: () => void;
}) {
  const [completed, setCompleted] = useState(0);
  const doneRef = useRef(false);
  const stages = getAnalyzingStages(name);
  const firstName = name?.trim();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCompleted((c) => {
        if (c >= stages.length) return c;
        return c + 1;
      });
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [stages.length]);

  useEffect(() => {
    if (completed >= stages.length && !doneRef.current) {
      doneRef.current = true;
      const timeout = window.setTimeout(onDone, 700);
      return () => window.clearTimeout(timeout);
    }
  }, [completed, stages.length, onDone]);

  const pct = Math.min(100, Math.round((completed / stages.length) * 100));

  return (
    <div className="text-center" aria-live="polite">
      <h2 className="text-balance text-2xl leading-snug sm:text-3xl">
        Reading your <span className="text-gold">soulmate signature</span>
      </h2>
      <p className="mt-2 text-sm text-[#b9b2d0]">
        {firstName
          ? `Hold on, ${firstName} — this takes a few seconds.`
          : "Hold on — this takes a few seconds."}
      </p>

      <div className="mx-auto mt-8 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #edd9a3, #d4af37 60%, #a9822f)",
          }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      </div>

      <ul className="mt-6 flex flex-col gap-3 text-left">
        {stages.map((stage, i) => {
          const isDone = i < completed;
          const isCurrent = i === completed;
          return (
            <li
              key={stage}
              className={`glass flex min-h-[52px] items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors duration-300 ${
                isDone ? "glass-gold" : ""
              } ${isDone || isCurrent ? "text-[#e8e4f5]" : "text-[rgba(185,178,208,0.5)]"}`}
            >
              {isDone ? (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex shrink-0"
                >
                  <CircleCheck className="h-5 w-5 text-[#d4af37]" aria-hidden="true" />
                </motion.span>
              ) : isCurrent ? (
                <Loader2
                  className="h-5 w-5 shrink-0 animate-spin text-[#b9b2d0]"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-[rgba(255,255,255,0.15)]"
                  aria-hidden="true"
                />
              )}
              <span>{stage}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
