"use client";

// /dreams — "Tell Master Aura what you dreamed." Relato livre → 2 perguntas
// curtas → leitura estruturada (+ 3 cartas opcionais, sorteadas no servidor).
// Reutilizável toda noite: o histórico fica na conta (tabela experiences).

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import type { DreamReading } from "@/lib/experiences/types";
import AuraChat, { type ChatAnswers, type ChatStep } from "./AuraChat";
import { useExperienceCall, AuraWriting, GateNotice, Field } from "./shell";

const STEPS: ChatStep[] = [
  {
    id: "dream",
    aura: ["Tell me what you dreamed. Just as you remember it — even the parts that don't make sense."],
    question: "What happened?",
    text: { placeholder: "It started in a house I didn't recognize…", min: 12, max: 1500 },
    reaction: "Thank you. I can see it. Two quick things before I read it.",
  },
  {
    id: "feeling",
    aura: ["The feeling you woke up with matters more than the plot."],
    question: "When you woke up, what stayed?",
    options: [
      { id: "longing", label: "A longing I couldn't place" },
      { id: "dread", label: "Dread, like something was about to happen" },
      { id: "relief", label: "Relief — and then it faded" },
      { id: "confusion", label: "Confusion. It made no sense, and it won't leave" },
    ],
    reaction: "That's the thread I'll follow.",
  },
  {
    id: "repeat",
    aura: ["Last one."],
    question: "Has this dream, or something like it, come before?",
    options: [
      { id: "first", label: "No — first time" },
      { id: "sometimes", label: "A few times, spread out" },
      { id: "often", label: "Often. It keeps coming back" },
      { id: "variations", label: "Different dreams, same feeling" },
    ],
    reaction: "Good. Let me read it properly.",
  },
];

export default function DreamDecoder() {
  const [phase, setPhase] = useState<"intro" | "chat" | "loading" | "result">("intro");
  const [pullCards, setPullCards] = useState(true);
  const [answers, setAnswers] = useState<ChatAnswers | null>(null);
  const { busy, gate, result, call, reset } = useExperienceCall<DreamReading>("dreams");

  useEffect(() => {
    trackEvent("experience_view", { category: "experience", feature: "dreams" });
  }, []);

  const generate = async (a: ChatAnswers) => {
    setPhase("loading");
    const { dream, ...rest } = a.labels;
    const r = await call("/api/experiences/dream", { dream, answers: rest, pullCards });
    if (r) setPhase("result");
  };

  if (phase === "intro") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <label className="glass flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <span className="text-sm text-white/80">Also pull 3 cards about this dream</span>
          <input type="checkbox" checked={pullCards} onChange={(e) => setPullCards(e.target.checked)} className="h-5 w-5 accent-[#d4af37]" />
        </label>
        <button
          type="button"
          onClick={() => {
            trackEvent("experience_start", { category: "experience", feature: "dreams" });
            setPhase("chat");
          }}
          className="btn-gold mt-4 flex min-h-[54px] w-full items-center justify-center rounded-2xl text-base font-semibold"
        >
          Tell Master Aura what I dreamed
          <span aria-hidden className="ml-2">→</span>
        </button>
        <p className="mt-3 text-center text-[11px] text-white/40">Your dream stays in your private history · for reflection and entertainment</p>
      </div>
    );
  }

  if (phase === "chat") {
    return (
      <AuraChat
        steps={STEPS}
        outro="Reading it now…"
        onComplete={(a) => {
          setAnswers(a);
          trackEvent("dream_submitted", { category: "experience", feature: "dreams", with_cards: pullCards });
          void generate(a);
        }}
        onStep={(id, opt) => trackEvent("experience_step", { category: "experience", feature: "dreams", step: id, answer_id: opt })}
      />
    );
  }

  if (phase === "loading" || (busy && !result)) {
    if (gate) return <GateNotice gate={gate} returnTo="/dreams" onRetry={() => { reset(); if (answers) void generate(answers); }} />;
    return <AuraWriting text="Master Aura is reading your dream…" />;
  }

  if (!result) return null;

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9b86e6]">Your dream reading</p>
      <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink-50 sm:text-3xl">{result.headline}</h2>
      <div className="glass mt-5 rounded-2xl border border-[rgba(124,92,255,0.3)] p-5">
        <dl className="space-y-4">
          <Field label="Main emotional theme">{result.mainTheme}</Field>
          <Field label="Symbols that stand out">
            <ul className="mt-1 space-y-1.5">
              {result.symbols.map((s) => (
                <li key={s.symbol}><span className="font-semibold text-[#c9bde9]">{s.symbol}</span> — {s.meaning}</li>
              ))}
            </ul>
          </Field>
          <Field label="What your mind may be processing">{result.processing}</Field>
          <Field label="Relationship / life connection">{result.lifeConnection}</Field>
          <Field label="Reflection to take from the dream"><span className="italic">{result.reflection}</span></Field>
        </dl>
      </div>

      {result.cards?.length ? (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Three cards about this dream</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {result.cards.map((c, i) => (
              <motion.div key={c.number} initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ delay: 0.3 + i * 0.35, duration: 0.6 }} className="overflow-hidden rounded-xl border border-white/10">
                <Image src={`/cards/egyptian/${c.number}.jpg`} alt={c.name} width={300} height={510} className="aspect-[10/17] w-full object-cover" />
                <div className="p-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/45">{c.position}</p>
                  <p className="text-xs font-semibold text-ink-50">{c.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/70">{c.line}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {result.followUps.length > 0 && (
        <div className="glass mt-6 rounded-2xl p-4">
          <p className="text-xs text-white/60">Master Aura would also ask:</p>
          <ul className="mt-1 space-y-1 text-sm text-white/85">
            {result.followUps.map((q) => <li key={q}>— {q}</li>)}
          </ul>
          <Link href="/guia" className="mt-3 inline-block text-sm font-semibold text-gold underline underline-offset-4">Answer her in the Guide →</Link>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button type="button" onClick={() => { reset(); setPhase("intro"); }} className="btn-gold flex min-h-[50px] items-center justify-center rounded-2xl text-sm font-semibold">
          Read another dream
        </button>
        <Link href="/rituals/energy-cleanse" className="btn-ghost flex min-h-[46px] items-center justify-center rounded-2xl text-sm">
          Clear what the dream stirred — Energy Cleanse
        </Link>
      </div>
    </motion.section>
  );
}
