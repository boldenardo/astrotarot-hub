"use client";

// Execução interativa de um RitualResult. Um passo por tela, gesto por
// passo (acender, virar a carta, escrever, soltar, respirar), conclusão
// com afirmação/reflexão. Cord-cutting: o fio simbólico entre duas velas
// se solta no gesto de release — premium, íntimo, nada grotesco.

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon } from "lucide-react";
import CardBack from "@/components/CardBack";
import { trackEvent } from "@/lib/analytics";
import type { RitualResult } from "@/lib/experiences/types";

function Candle({ lit, onLight, label }: { lit: boolean; onLight?: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onLight}
      disabled={!onLight}
      aria-label={lit ? "Candle lit" : "Light the candle"}
      className="group flex flex-col items-center gap-2 disabled:cursor-default"
    >
      <div className="relative h-36 w-16">
        <AnimatePresence>
          {lit && (
            <motion.div
              key="flame"
              initial={{ opacity: 0, scale: 0.4, y: 8 }}
              animate={{ opacity: 1, scale: [1, 1.08, 0.96, 1.04, 1], y: 0 }}
              transition={{ scale: { repeat: Infinity, duration: 1.6 }, opacity: { duration: 0.5 } }}
              className="absolute left-1/2 top-0 -translate-x-1/2"
            >
              <div className="h-8 w-5 rounded-full bg-gradient-to-t from-[#f3b14b] via-[#ffd98a] to-white/90 blur-[1px] shadow-[0_0_40px_14px_rgba(243,177,75,0.35)]" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute bottom-0 left-1/2 h-24 w-8 -translate-x-1/2 rounded-t-md rounded-b-sm bg-gradient-to-b from-[#f1e7d2] to-[#cdbf9f] shadow-inner" />
        <div className="absolute bottom-[96px] left-1/2 h-2 w-[2px] -translate-x-1/2 bg-[#2a2118]" />
      </div>
      {label && <span className="text-xs text-white/60">{label}</span>}
      {!lit && onLight && (
        <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-medium text-[#e8d9a8] group-hover:bg-amber-300/20">
          Tap to light
        </span>
      )}
    </button>
  );
}

function Thread({ released }: { released: boolean }) {
  return (
    <svg viewBox="0 0 200 40" className="h-10 w-48" aria-hidden>
      <motion.path
        d="M4 20 C 60 6, 140 34, 196 20"
        fill="none"
        stroke="url(#g)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 1, opacity: 1 }}
        animate={released ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#d4af37" />
          <stop offset="1" stopColor="#7c5cff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function RitualPlayer({ ritual, onDone }: { ritual: RitualResult; onDone?: () => void }) {
  const [step, setStep] = useState(-1); // -1 = visão geral
  const [lit, setLit] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [intention, setIntention] = useState("");
  const [released, setReleased] = useState(false);
  const [holding, setHolding] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const cur = step >= 0 ? ritual.steps[step] : null;
  const isCord = ritual.type === "cord-cutting";

  useEffect(() => {
    if (step === 0) trackEvent("ritual_start", { category: "experience", feature: "rituals", label: ritual.type });
  }, [step, ritual.type]);

  // timer de respiração/pausa
  useEffect(() => {
    if (!cur || cur.seconds <= 0 || cur.action === "light" || cur.action === "card" || cur.action === "write" || cur.action === "release") {
      setCount(null);
      return;
    }
    setCount(cur.seconds);
    const id = window.setInterval(() => setCount((c) => (c != null && c > 0 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [cur]);

  const canAdvance = (() => {
    if (!cur) return true;
    switch (cur.action) {
      case "light": return lit;
      case "card": return flipped;
      case "write": return intention.trim().length >= 3;
      case "release": return released;
      default: return count == null || count <= 0;
    }
  })();

  const next = () => {
    if (step + 1 >= ritual.steps.length) {
      setDone(true);
      trackEvent("ritual_complete", { category: "experience", feature: "rituals", label: ritual.type });
      onDone?.();
      return;
    }
    setStep(step + 1);
  };

  // soltar: segurar ~1.2s
  useEffect(() => {
    if (!holding || released) return;
    const id = window.setTimeout(() => setReleased(true), 1200);
    return () => window.clearTimeout(id);
  }, [holding, released]);

  if (done) {
    return (
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg text-center">
        <div className="flex justify-center"><Candle lit label="" /></div>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-[#d4af37]">Ritual complete</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-ink-50">{ritual.affirmation}</h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/75">{ritual.reflection}</p>
        <div className="glass mt-6 rounded-2xl p-5 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">For the next days</p>
          <p className="mt-1 text-[15px] leading-relaxed text-white/85">{ritual.nextStep}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/rituals" className="btn-gold flex min-h-[52px] items-center justify-center rounded-2xl text-base font-semibold">
            Another ritual
          </Link>
          <Link href="/guia" className="btn-ghost flex min-h-[48px] items-center justify-center rounded-2xl text-sm">
            Talk to Master Aura about it
          </Link>
        </div>
      </motion.section>
    );
  }

  if (step === -1) {
    return (
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg">
        {ritual.connection && (
          <div className="glass mb-5 rounded-2xl border border-[rgba(124,92,255,0.35)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b7a6f0]">Your connection</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink-50">{ritual.connection.headline}</h2>
            <dl className="mt-4 space-y-3">
              {[
                ["Emotional attachment", ritual.connection.emotionalAttachment],
                ["Unfinished feelings", ritual.connection.unfinishedFeelings],
                ["Recurring thoughts", ritual.connection.recurringThoughts],
                ["What you're holding onto", ritual.connection.holdingOnto],
                ["What may need to be released", ritual.connection.mayNeedRelease],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{k}</dt>
                  <dd className="mt-0.5 text-[15px] leading-relaxed text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm italic text-[#c9bde9]">{ritual.connection.reflection}</p>
          </div>
        )}
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#d4af37]">Your personal ritual</p>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink-50 sm:text-3xl">{ritual.headline}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/80">{ritual.reading}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
          <Moon className="h-3.5 w-3.5 text-[#b7a6f0]" aria-hidden /> {ritual.moon.emoji} {ritual.moon.label} — {ritual.moon.guidance}
        </p>
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">What you'll need</p>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ritual.items.map((it) => (
              <li key={it.name} className="glass rounded-xl px-3.5 py-3">
                <p className="text-sm font-semibold text-ink-50">{it.name}{it.detail ? <span className="font-normal text-white/55"> · {it.detail}</span> : null}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/65">{it.meaning}</p>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={() => setStep(0)} className="btn-gold mt-7 flex min-h-[54px] w-full items-center justify-center rounded-2xl text-base font-semibold">
          {isCord ? "Begin my cord cutting ritual" : "Begin the ritual"}
          <span aria-hidden className="ml-2">→</span>
        </button>
        <p className="mt-3 text-center text-[11px] text-white/40">{ritual.steps.length} steps · for reflection and entertainment</p>
      </motion.section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-lg">
      <div className="mb-3 flex items-center justify-between text-[11px] text-white/45">
        <span>Step {step + 1} of {ritual.steps.length}</span>
        <span className="flex gap-1">
          {ritual.steps.map((_, i) => (
            <span key={i} className={`h-1.5 w-5 rounded-full ${i <= step ? "bg-[#d4af37]" : "bg-white/15"}`} />
          ))}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }} className="glass rounded-3xl p-6">
          <h2 className="font-display text-xl font-semibold text-ink-50">{cur!.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/80">{cur!.instruction}</p>

          <div className="mt-6 flex min-h-[180px] flex-col items-center justify-center">
            {cur!.action === "light" && (
              isCord ? (
                <div className="flex items-end gap-6">
                  <Candle lit={lit} onLight={() => setLit(true)} label="You" />
                  <Thread released={false} />
                  <Candle lit={lit} label="Them" />
                </div>
              ) : (
                <Candle lit={lit} onLight={() => setLit(true)} />
              )
            )}

            {cur!.action === "card" && (
              <button type="button" onClick={() => setFlipped(true)} className="w-40" aria-label="Turn the card">
                <div style={{ perspective: "1000px" }}>
                  <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.8 }} style={{ transformStyle: "preserve-3d" }} className="relative aspect-[10/17] w-full">
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                      <CardBack className="h-full w-full" />
                    </div>
                    <div className="absolute inset-0 overflow-hidden rounded-xl" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <Image src={`/cards/egyptian/${ritual.card.number}.jpg`} alt={ritual.card.name} width={400} height={680} className="h-full w-full object-cover" />
                    </div>
                  </motion.div>
                </div>
                {!flipped && <p className="mt-3 text-xs text-[#e8d9a8]">Tap to turn</p>}
                {flipped && (
                  <p className="mt-3 text-sm text-white/80"><span className="font-semibold text-gold">{ritual.card.name}</span> — {ritual.card.line}</p>
                )}
              </button>
            )}

            {cur!.action === "write" && (
              <div className="w-full">
                <textarea
                  value={intention}
                  onChange={(e) => setIntention(e.target.value.slice(0, 200))}
                  placeholder={isCord ? "What I am setting down tonight…" : "What I am inviting in…"}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-display text-lg italic text-[#e8e4f5] placeholder:text-white/30 focus:border-[rgba(212,175,55,0.5)] focus:outline-none"
                />
                <p className="mt-2 text-center text-[11px] text-white/40">Stays on this device. Nobody reads it but you.</p>
              </div>
            )}

            {cur!.action === "release" && (
              <div className="flex flex-col items-center">
                {isCord ? (
                  <div className="flex items-end gap-6">
                    <Candle lit label="You" />
                    <Thread released={released} />
                    <Candle lit={!released} label="Them" />
                  </div>
                ) : (
                  <motion.div animate={released ? { opacity: 0, y: -60, scale: 1.3 } : { opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.6 }} className="h-20 w-20 rounded-full bg-gradient-to-br from-[#d4af37] to-[#7c5cff] blur-[2px] shadow-[0_0_50px_16px_rgba(212,175,55,0.25)]" />
                )}
                {!released ? (
                  <button
                    type="button"
                    onPointerDown={() => setHolding(true)}
                    onPointerUp={() => setHolding(false)}
                    onPointerLeave={() => setHolding(false)}
                    className={`mt-5 rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${holding ? "border-[#d4af37] bg-amber-300/20 text-[#f7ecc9] scale-105" : "border-amber-300/40 bg-amber-300/10 text-[#e8d9a8]"}`}
                  >
                    {holding ? "Keep holding…" : "Press and hold to release"}
                  </button>
                ) : (
                  <p className="mt-5 text-sm text-[#c9bde9]">{isCord ? "The thread is down. What stays is yours to carry lightly." : "Released."}</p>
                )}
              </div>
            )}

            {(cur!.action === "breathe" || cur!.action === "none") && count != null && (
              <div className="relative flex h-28 w-28 items-center justify-center">
                <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute inset-0 rounded-full border border-[rgba(212,175,55,0.35)] bg-amber-300/5" />
                <span className="font-display text-3xl text-ink-50">{count}</span>
              </div>
            )}
          </div>

          <button type="button" onClick={next} disabled={!canAdvance} className="btn-gold mt-6 flex min-h-[50px] w-full items-center justify-center rounded-2xl text-sm font-semibold disabled:opacity-40">
            {step + 1 >= ritual.steps.length ? "Complete the ritual" : "Next"}
            <Sparkles className="ml-2 h-4 w-4" aria-hidden />
          </button>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
