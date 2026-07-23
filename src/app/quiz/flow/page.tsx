"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleCheck, Loader2, Lock, Star } from "lucide-react";
import {
  ANALYZING_STAGES,
  STEPS,
  computeScore,
  loadQuizState,
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
  const advancingRef = useRef(false);

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
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    advancingRef.current = false;
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleAnswer = useCallback(
    (questionId: string, value: string) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
        ...(questionId === "q_sign" ? { sign: value } : null),
      }));
      // Brief selected flash, then auto-advance.
      window.setTimeout(goNext, 150);
    },
    [goNext]
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
        {stepIndex > 0 && !isAnalyzing && (
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
              <AnalyzingScreen onDone={handleAnalyzingDone} />
            ) : step.kind === "question" ? (
              <QuestionStep
                step={step}
                selectedValue={state.answers[step.id]}
                onSelect={handleAnswer}
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
}: {
  step: Extract<QuizStep, { kind: "question" }>;
  selectedValue?: string;
  onSelect: (questionId: string, value: string) => void;
}) {
  const [tapped, setTapped] = useState<string | null>(null);
  const isSignGrid = step.id === "q_sign";

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
        className={
          isSignGrid ? "mt-6 grid grid-cols-2 gap-3" : "mt-6 flex flex-col gap-3"
        }
      >
        {step.options.map((option) => {
          const isActive =
            tapped === option.value ||
            (tapped === null && selectedValue === option.value);
          return (
            <button
              key={option.value}
              type="button"
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.08)] text-lg text-[#d4af37]"
                >
                  {option.symbol}
                </span>
              )}
              <span className="flex-1">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
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
          <div className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: step.testimonial.stars }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-[#d4af37] text-[#d4af37]" />
            ))}
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

function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  const [completed, setCompleted] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCompleted((c) => {
        if (c >= ANALYZING_STAGES.length) return c;
        return c + 1;
      });
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed >= ANALYZING_STAGES.length && !doneRef.current) {
      doneRef.current = true;
      const timeout = window.setTimeout(onDone, 700);
      return () => window.clearTimeout(timeout);
    }
  }, [completed, onDone]);

  const pct = Math.min(
    100,
    Math.round((completed / ANALYZING_STAGES.length) * 100)
  );

  return (
    <div className="text-center" aria-live="polite">
      <h2 className="text-balance text-2xl leading-snug sm:text-3xl">
        Reading your <span className="text-gold">cosmic signature</span>
      </h2>
      <p className="mt-2 text-sm text-[#b9b2d0]">
        Hold on — this takes a few seconds.
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
        {ANALYZING_STAGES.map((stage, i) => {
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
