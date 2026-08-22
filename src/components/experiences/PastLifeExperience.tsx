"use client";

// /past-lives — Past Life Reading (arquétipo pessoal) ou Past Life
// Connection (alguém que pareceu familiar cedo demais). Linguagem
// simbólica por construção; estética "memória de arquivo".

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import type { PastLifeReading } from "@/lib/experiences/types";
import AuraChat, { type ChatAnswers, type ChatStep } from "./AuraChat";
import { useExperienceCall, AuraWriting, GateNotice, Field } from "./shell";

type Mode = "self" | "connection";

const SEASON: ChatStep = {
  id: "season",
  aura: ["I don't need your birth date. The season is enough for the archetype."],
  question: "When were you born?",
  options: [
    { id: "winter", label: "Winter" },
    { id: "spring", label: "Spring" },
    { id: "summer", label: "Summer" },
    { id: "autumn", label: "Autumn" },
  ],
  reaction: "Noted. That changes the texture of what I see.",
};

const SELF: ChatStep[] = [
  {
    id: "pull",
    aura: ["Some things pull at people for no reason they can explain.", "Tell me yours."],
    question: "Which has always pulled at you?",
    options: [
      { id: "sea", label: "The sea, ships, far coasts" },
      { id: "old", label: "Old houses, letters, things with a history" },
      { id: "roads", label: "Roads, leaving, starting over somewhere" },
      { id: "quiet", label: "Candlelight, silence, being the one who keeps watch" },
    ],
    reaction: "That pull is usually the first thread of an archetype.",
  },
  {
    id: "lesson",
    aura: ["Now the pattern."],
    question: "What keeps repeating in your life, no matter where you are?",
    options: [
      { id: "leave", label: "I leave before I'm left" },
      { id: "stay", label: "I stay too long" },
      { id: "carry", label: "I carry everyone — and no one carries me" },
      { id: "promise", label: "I keep promises that cost me" },
    ],
    reaction: "That's the lesson the archetype is built around.",
  },
  {
    id: "fear",
    aura: ["And the fear underneath it."],
    question: "Which fear feels older than your life?",
    options: [
      { id: "lost", label: "Losing someone suddenly" },
      { id: "forgotten", label: "Being forgotten" },
      { id: "trapped", label: "Being trapped somewhere I didn't choose" },
      { id: "betrayed", label: "Trusting the wrong person" },
    ],
    reaction: "Thank you. I have what I need for the archetype.",
  },
  SEASON,
];

const CONNECTION: ChatStep[] = [
  {
    id: "who",
    aura: ["Some people feel familiar before you know anything about them.", "Tell me who this is."],
    question: "Who is this person to you today?",
    options: [
      { id: "ex", label: "Someone I was with" },
      { id: "current", label: "Someone I'm with now" },
      { id: "new", label: "Someone I met recently" },
      { id: "never", label: "Someone it never became — and should have" },
    ],
    reaction: "Okay. I'll read the bond, not the person.",
  },
  {
    id: "first",
    aura: ["Go back to the first time."],
    question: "What happened when you first met?",
    options: [
      { id: "known", label: "I felt like I already knew them" },
      { id: "unease", label: "A strange unease, almost a warning" },
      { id: "home", label: "Calm — like arriving somewhere" },
      { id: "pull", label: "A pull I couldn't justify" },
    ],
    reaction: "That first minute is where the archetype shows itself.",
  },
  {
    id: "repeat",
    aura: ["Now the loop."],
    question: "What keeps repeating between you?",
    options: [
      { id: "almost", label: "We almost get there, then something breaks" },
      { id: "timing", label: "The timing is always wrong" },
      { id: "roles", label: "One of us always leaves first" },
      { id: "silence", label: "Long silences that never feel final" },
    ],
    reaction: "People usually describe one of two patterns here — yours leans toward the one that doesn't close.",
  },
  {
    id: "fear",
    aura: ["And the fear."],
    question: "What are you afraid this connection means?",
    options: [
      { id: "again", label: "That I'll lose them again" },
      { id: "debt", label: "That I owe them something" },
      { id: "lesson", label: "That they're a lesson, not a person" },
      { id: "only", label: "That there won't be another like this" },
    ],
    reaction: "Thank you. I'll write the archetype and the bond.",
  },
  SEASON,
];

export default function PastLifeExperience({ initialMode = "self" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [phase, setPhase] = useState<"intro" | "chat" | "loading" | "result">("intro");
  const [answers, setAnswers] = useState<ChatAnswers | null>(null);
  const { busy, gate, result, call, reset } = useExperienceCall<PastLifeReading>("past_lives");

  useEffect(() => {
    trackEvent("experience_view", { category: "experience", feature: "past_lives", label: mode });
  }, [mode]);

  const generate = async (a: ChatAnswers) => {
    setPhase("loading");
    const { season, ...rest } = a.labels;
    const r = await call("/api/experiences/past-life", { mode, answers: rest, birthSeason: a.ids.season ?? season });
    if (r) setPhase("result");
  };

  if (phase === "intro") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <div className="grid grid-cols-2 gap-2">
          {(["self", "connection"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-2xl border px-3 py-3 text-left text-sm transition-all ${mode === m ? "border-[#d4af37]/70 bg-amber-300/[0.09] text-ink-50" : "border-white/10 bg-white/[0.03] text-white/70"}`}
            >
              <span className="block font-semibold">{m === "self" ? "My past-life archetype" : "A past-life connection"}</span>
              <span className="mt-0.5 block text-xs text-white/55">{m === "self" ? "The pattern you carry" : "Why this person felt familiar"}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            trackEvent("experience_start", { category: "experience", feature: "past_lives", label: mode });
            setPhase("chat");
          }}
          className="btn-gold mt-4 flex min-h-[54px] w-full items-center justify-center rounded-2xl text-base font-semibold"
        >
          Start with Master Aura
          <span aria-hidden className="ml-2">→</span>
        </button>
        <p className="mt-3 text-center text-[11px] text-white/40">Symbolic archetype reading · 4–5 questions · for reflection and entertainment</p>
      </div>
    );
  }

  if (phase === "chat") {
    return (
      <AuraChat
        steps={mode === "self" ? SELF : CONNECTION}
        intro={mode === "self" ? ["This isn't history. It's an archetype — a shape you may have carried for a long time."] : ["I won't tell you who they were. I'll read why the bond feels older than it is."]}
        outro="Let me find the archetype…"
        onComplete={(a) => { setAnswers(a); void generate(a); }}
        onStep={(id, opt) => trackEvent("experience_step", { category: "experience", feature: "past_lives", step: id, answer_id: opt })}
      />
    );
  }

  if (phase === "loading" || (busy && !result)) {
    if (gate) return <GateNotice gate={gate} returnTo="/past-lives" onRetry={() => { reset(); if (answers) void generate(answers); }} />;
    return <AuraWriting text="Master Aura is finding the archetype…" />;
  }

  if (!result) return null;

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#d4af37]">Your past-life archetype</p>
      <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-50">{result.archetype}</h2>
      <p className="mt-1 text-[15px] italic text-[#c9bde9]">{result.headline}</p>
      <div className="mt-5 rounded-2xl border border-[rgba(212,175,55,0.25)] bg-[linear-gradient(180deg,rgba(212,175,55,0.06),transparent)] p-5 [filter:sepia(0.12)]">
        <dl className="space-y-4">
          <Field label="Era / atmosphere">{result.era}</Field>
          <Field label="Role or archetype">{result.role}</Field>
          <Field label="Central lesson">{result.centralLesson}</Field>
          <Field label="Emotional pattern carried forward">{result.emotionalPattern}</Field>
          <Field label="Relationship pattern">{result.relationshipPattern}</Field>
          <Field label="What this may represent today">{result.today}</Field>
        </dl>
      </div>
      {result.connection && (
        <div className="glass mt-5 rounded-2xl border border-[rgba(124,92,255,0.35)] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b7a6f0]">Past life connection</p>
          <dl className="mt-3 space-y-3.5">
            <Field label="The bond">{result.connection.bond}</Field>
            <Field label="Why they felt familiar">{result.connection.whyFamiliar}</Field>
            <Field label="What repeats">{result.connection.whatRepeats}</Field>
            <Field label="What it may be asking of you">{result.connection.whatItAsks}</Field>
          </dl>
        </div>
      )}
      <p className="mt-5 text-sm italic text-white/70">{result.reflection}</p>
      <div className="mt-8 flex flex-col gap-3">
        {result.connection ? (
          <Link href="/soulmate" className="btn-gold flex min-h-[50px] items-center justify-center rounded-2xl text-sm font-semibold">
            See who the cards point to — Draw My Soulmate
          </Link>
        ) : (
          <Link href="/tarot" className="btn-gold flex min-h-[50px] items-center justify-center rounded-2xl text-sm font-semibold">
            Ask the cards about this pattern
          </Link>
        )}
        <button type="button" onClick={() => { reset(); setPhase("intro"); }} className="btn-ghost flex min-h-[46px] items-center justify-center rounded-2xl text-sm">
          Read another
        </button>
      </div>
      <p className="mt-6 text-[11px] text-white/40">A symbolic archetype for reflection — not a factual account of anyone&apos;s past.</p>
    </motion.section>
  );
}
