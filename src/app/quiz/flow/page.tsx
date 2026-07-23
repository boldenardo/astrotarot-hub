"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleCheck, Loader2, Lock, Moon, Star } from "lucide-react";
import {
  LUNA,
  STEPS,
  computeScore,
  getAnalyzingStages,
  loadQuizState,
  resolveReactionText,
  saveQuizState,
  signFromDate,
  type QuizState,
  type QuizStep,
} from "@/lib/quiz-data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -48 : 48 }),
};

export default function QuizFlowPage() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>({ answers: {} });
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  /** Luna's reaction currently on screen (keyed to the step it belongs to). */
  const [reaction, setReaction] = useState<{
    stepId: string;
    text: string;
  } | null>(null);
  const advancingRef = useRef(false);
  const reactionTimerRef = useRef<number | null>(null);

  // Clear any pending reaction timer on unmount.
  useEffect(() => {
    return () => {
      if (reactionTimerRef.current !== null) {
        window.clearTimeout(reactionTimerRef.current);
      }
    };
  }, []);

  // Restore persisted state on mount.
  useEffect(() => {
    setState(loadQuizState());
    setHydrated(true);
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (hydrated) saveQuizState(state);
  }, [state, hydrated]);

  const step: QuizStep = STEPS[Math.min(stepIndex, STEPS.length - 1)];
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);
  const isAnalyzing = step.id === "analyzing";

  const goNext = useCallback(() => {
    advancingRef.current = false;
    setReaction(null);
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    // Back during Luna's reaction cancels it and returns to the options.
    if (reaction !== null) {
      setReaction(null);
      advancingRef.current = false;
      return;
    }
    advancingRef.current = false;
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [reaction]);

  const handleAnswer = useCallback(
    (questionId: string, value: string) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
        ...(questionId === "q_sign" ? { sign: value } : null),
      }));

      const stepConfig = STEPS.find((s) => s.id === questionId);
      const raw =
        stepConfig?.kind === "question"
          ? stepConfig.reactions?.[value] ?? stepConfig.reactionDefault
          : undefined;

      if (raw) {
        const text = resolveReactionText(raw, {
          name: state.name,
          sign: questionId === "q_sign" ? value : state.sign,
        });
        // Brief selected flash, then Luna reacts in place.
        reactionTimerRef.current = window.setTimeout(() => {
          reactionTimerRef.current = null;
          setReaction({ stepId: questionId, text });
        }, 150);
      } else {
        // Brief selected flash, then auto-advance.
        window.setTimeout(goNext, 150);
      }
    },
    [goNext, state.name, state.sign]
  );

  const handleBirthdate = useCallback(
    (birthDate: string) => {
      const derived = signFromDate(birthDate);
      setState((prev) => ({
        ...prev,
        birthDate,
        sign: derived ?? prev.sign,
      }));
      goNext();
    },
    [goNext]
  );

  const handleEmail = useCallback(
    (email: string, name: string) => {
      setState((prev) => ({
        ...prev,
        email,
        name: name.trim() || undefined,
      }));
      goNext();
    },
    [goNext]
  );

  const handleAnalyzingDone = useCallback(() => {
    setState((prev) => {
      const next: QuizState = { ...prev, score: computeScore(prev.answers) };
      saveQuizState(next); // flush before navigation
      return next;
    });
    router.push("/quiz/vsl");
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Progress bar */}
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
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      {/* Back arrow */}
      <div className="flex h-11 items-center">
        {(stepIndex > 0 || reaction !== null) && !isAnalyzing && (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="btn-ghost flex h-11 w-11 items-center justify-center rounded-full"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center py-4">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {isAnalyzing ? (
              <AnalyzingScreen name={state.name} onDone={handleAnalyzingDone} />
            ) : step.kind === "question" ? (
              <QuestionStep
                step={step}
                selectedValue={state.answers[step.id]}
                onSelect={handleAnswer}
                reactionText={
                  reaction?.stepId === step.id ? reaction.text : null
                }
                onReactionDone={goNext}
              />
            ) : step.kind === "interstitial" ? (
              <InterstitialStep step={step} onContinue={goNext} />
            ) : step.kind === "birthdate" ? (
              <BirthdateStep
                initialValue={state.birthDate ?? ""}
                onContinue={handleBirthdate}
              />
            ) : (
              <EmailStep
                initialEmail={state.email ?? ""}
                initialName={state.name ?? ""}
                onContinue={handleEmail}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------- Question ------------------------------- */

function QuestionStep({
  step,
  selectedValue,
  onSelect,
  reactionText,
  onReactionDone,
}: {
  step: Extract<QuizStep, { kind: "question" }>;
  selectedValue?: string;
  onSelect: (questionId: string, value: string) => void;
  reactionText: string | null;
  onReactionDone: () => void;
}) {
  const [tapped, setTapped] = useState<string | null>(null);
  const isSignGrid = step.id === "q_sign";
  const hasReactions = Boolean(step.reactions || step.reactionDefault);
  const reacting = reactionText !== null;

  return (
    <div>
      <h2 className="text-balance text-center text-2xl leading-snug sm:text-3xl">
        {step.question}
      </h2>
      {step.subtitle && (
        <p className="mt-2 text-center text-sm text-[#b9b2d0]">
          {step.subtitle}
        </p>
      )}

      <div
        className={`${
          isSignGrid ? "mt-6 grid grid-cols-2 gap-3" : "mt-6 flex flex-col gap-3"
        } transition-all duration-300 ${
          reacting ? "pointer-events-none scale-[0.985] opacity-50" : ""
        }`}
        aria-hidden={reacting || undefined}
      >
        {step.options.map((option) => {
          const isActive =
            tapped === option.value ||
            (tapped === null && selectedValue === option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={reacting}
              onClick={() => {
                setTapped(option.value);
                onSelect(step.id, option.value);
              }}
              aria-pressed={isActive}
              className={`glass flex min-h-[56px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base transition-colors duration-150 ${
                isActive
                  ? "glass-gold bg-[rgba(212,175,55,0.12)]"
                  : "hover:border-[rgba(212,175,55,0.35)]"
              }`}
            >
              {option.symbol && (
                <span
                  aria-hidden="true"
                  className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(212,175,55,0.3)] bg-gradient-to-br from-[rgba(212,175,55,0.18)] to-[rgba(124,92,255,0.15)] text-lg font-semibold text-[#d4af37]"
                >
                  {option.symbol}
                </span>
              )}
              <span className="flex-1">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reserved area for Luna's bubble so options never shift. */}
      {hasReactions && (
        <div className="mt-4 min-h-[124px]">
          <AnimatePresence>
            {reacting && (
              <LunaBubble
                key={step.id}
                text={reactionText}
                onDone={onReactionDone}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Luna reaction ---------------------------- */

const TYPING_DOTS_MS = 800; // pulsing-dots pause before Luna "speaks"
const CHAR_MS = 18; // typewriter speed per character
const TYPE_TOTAL_CAP_MS = 1400; // long texts speed up to fit this budget
const ADVANCE_AFTER_MS = 1400; // auto-advance once the text is complete

function LunaBubble({ text, onDone }: { text: string; onDone: () => void }) {
  const [phase, setPhase] = useState<"dots" | "typing" | "done">("dots");
  const [shownChars, setShownChars] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Phase 1: typing indicator.
  useEffect(() => {
    if (phase !== "dots") return;
    const t = window.setTimeout(() => setPhase("typing"), TYPING_DOTS_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Phase 2: typewriter reveal (long texts speed up to stay under the cap).
  useEffect(() => {
    if (phase !== "typing") return;
    const perChar = Math.max(
      6,
      Math.min(CHAR_MS, Math.floor(TYPE_TOTAL_CAP_MS / Math.max(1, text.length)))
    );
    const interval = window.setInterval(() => {
      setShownChars((c) => {
        if (c + 1 >= text.length) {
          window.clearInterval(interval);
          setPhase("done");
          return text.length;
        }
        return c + 1;
      });
    }, perChar);
    return () => window.clearInterval(interval);
  }, [phase, text]);

  // Phase 3: auto-advance shortly after the full text is visible.
  useEffect(() => {
    if (phase !== "done") return;
    const t = window.setTimeout(() => onDoneRef.current(), ADVANCE_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const skip = useCallback(() => {
    if (phase === "done") {
      onDoneRef.current();
    } else {
      // Reveal everything at once; the auto-advance timer takes over.
      setShownChars(text.length);
      setPhase("done");
    }
  }, [phase, text.length]);

  // Keyboard: Enter skips typing / advances, wherever focus is.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={skip}
        aria-label={
          phase === "done" ? "Continue" : "Skip to the full message"
        }
        className="glass w-full rounded-2xl border border-[rgba(212,175,55,0.4)] p-4 text-left"
      >
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #edd9a3, #d4af37 60%, #a9822f)",
            }}
          >
            <Moon className="h-[18px] w-[18px] text-[#1a1430]" />
          </span>
          <span className="text-sm font-medium text-[#e8d9a8]">
            {LUNA.name} <span aria-hidden="true">&middot;</span>{" "}
            <span className="font-normal text-[#b9b2d0]">{LUNA.role}</span>
          </span>
        </span>

        <span className="mt-3 block min-h-[24px] text-base leading-relaxed text-[#e8e4f5]">
          {phase === "dots" ? (
            <span
              className="flex h-6 items-center gap-1.5 pl-1"
              aria-hidden="true"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4af37]"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </span>
          ) : (
            <span className="relative block">
              {/* Invisible full text keeps the bubble height stable while typing. */}
              <span aria-hidden="true" className="invisible block">
                {text}
              </span>
              <span aria-hidden="true" className="absolute inset-0">
                {text.slice(0, shownChars)}
              </span>
            </span>
          )}
          <span className="sr-only" aria-live="polite">
            {text}
          </span>
        </span>
      </button>
    </motion.div>
  );
}

/* ----------------------------- Interstitial ----------------------------- */

function InterstitialStep({
  step,
  onContinue,
}: {
  step: Extract<QuizStep, { kind: "interstitial" }>;
  onContinue: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-balance text-2xl leading-snug sm:text-3xl">
        {step.title}
      </h2>

      {step.testimonial && (
        <figure className="glass glass-gold mt-6 rounded-2xl p-5 text-left">
          <div className="flex items-center gap-3">
            {step.testimonial.photo && (
              <Image
                src={step.testimonial.photo}
                alt={step.testimonial.author}
                width={96}
                height={96}
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.4)]"
              />
            )}
            <div className="flex items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: step.testimonial.stars }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-[#d4af37] text-[#d4af37]"
                />
              ))}
            </div>
          </div>
          <blockquote className="mt-3 text-base leading-relaxed text-[#e8e4f5]">
            &ldquo;{step.testimonial.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-3 text-sm font-medium text-[#b9b2d0]">
            {step.testimonial.author}
          </figcaption>
        </figure>
      )}

      <p className="mt-5 text-balance text-base leading-relaxed text-[#b9b2d0]">
        {step.body}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="btn-gold mt-8 flex min-h-[56px] w-full items-center justify-center rounded-xl px-8 text-base"
      >
        Continue
      </button>
    </div>
  );
}

/* ------------------------------- Birthdate ------------------------------ */

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
    <form onSubmit={submit} className="text-center" noValidate>
      <h2 className="text-balance text-2xl leading-snug sm:text-3xl">
        Your birth date unlocks the{" "}
        <span className="text-gold">precise part</span> of your reading
      </h2>
      <p className="mt-2 text-sm text-[#b9b2d0]">
        Picked a sign earlier? No problem — we&apos;ll use your exact date.
      </p>

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
        className="glass glass-gold mt-6 block min-h-[56px] w-full rounded-xl px-4 text-base text-[#e8e4f5] outline-none focus:border-[#d4af37] [color-scheme:dark]"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-gold mt-6 flex min-h-[56px] w-full items-center justify-center rounded-xl px-8 text-base"
      >
        Continue
      </button>
    </form>
  );
}

/* --------------------------------- Email -------------------------------- */

function EmailStep({
  initialEmail,
  initialName,
  onContinue,
}: {
  initialEmail: string;
  initialName: string;
  onContinue: (email: string, name: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    onContinue(trimmed, name);
  };

  return (
    <form onSubmit={submit} className="text-center" noValidate>
      <h2 className="text-balance text-2xl leading-snug sm:text-3xl">
        Where should we send your{" "}
        <span className="text-gold">2026 Cosmic Plan</span>?
      </h2>
      <p className="mt-2 text-sm text-[#b9b2d0]">
        Your full reading is ready to be compiled.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <div>
          <label htmlFor="quiz-name" className="sr-only">
            First name (optional)
          </label>
          <input
            id="quiz-name"
            type="text"
            autoComplete="given-name"
            placeholder="First name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass glass-gold block min-h-[56px] w-full rounded-xl px-4 text-base text-[#e8e4f5] placeholder:text-[rgba(185,178,208,0.6)] outline-none focus:border-[#d4af37]"
          />
        </div>
        <div>
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
            className="glass glass-gold block min-h-[56px] w-full rounded-xl px-4 text-base text-[#e8e4f5] placeholder:text-[rgba(185,178,208,0.6)] outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-gold mt-6 flex min-h-[56px] w-full items-center justify-center rounded-xl px-8 text-base"
      >
        Reveal my results
      </button>

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
        Reading your <span className="text-gold">cosmic signature</span>
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
                  <CircleCheck
                    className="h-5 w-5 text-[#d4af37]"
                    aria-hidden="true"
                  />
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
