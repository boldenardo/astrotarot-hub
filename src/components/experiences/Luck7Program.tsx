"use client";

// O RITUAL DOS 7 DIAS DA SORTE — player do infoproduto (/rituals/luck-7).
//
// Um dia por dia de calendário: o dia N+1 abre no dia seguinte ao
// check-in do dia N (?preview=1 destrava tudo, para testes e demonstração).
// Dias 2–6 são roteiro fixo (conteúdo em luck7.ts). Dias 1 e 7 chamam a
// leitura pessoal da Aura pelo endpoint de ritual existente — login e
// crédito valem como em qualquer leitura; o check-in em si é grátis.
//
// Progresso: localStorage (imediato) + experiences via /api/experiences/
// luck7 (sobrevive à troca de aparelho). A lua exibida vem do CÓDIGO.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Lock, Moon as MoonIcon, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { moonLine } from "@/lib/experiences/moon";
import type { RitualResult } from "@/lib/experiences/types";
import {
  LUCK7_DAYS,
  LUCK7_INTENTIONS,
  type Luck7Progress,
  dayState,
  localDay,
  readLuck7,
  saveLuck7,
} from "@/lib/experiences/luck7";
import { useExperienceCall, AuraWriting, GateNotice } from "./shell";

const FEATURE = "luck7";

export default function Luck7Program() {
  const search = useSearchParams();
  const preview = search.get("preview") === "1";

  const [progress, setProgress] = useState<Luck7Progress>({ done: {} });
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [intention, setIntention] = useState<string>("");
  const [sentence, setSentence] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const { busy, gate, result, call, reset } = useExperienceCall<RitualResult>(FEATURE);

  // Carrega o progresso: localStorage primeiro (instantâneo), servidor
  // depois (merge — o servidor nunca apaga um dia feito localmente).
  useEffect(() => {
    const local = readLuck7();
    setProgress(local);
    if (local.intention) setIntention(local.intention);
    trackEvent("experience_view", { category: "experience", feature: FEATURE });
    void (async () => {
      try {
        const res = await fetch("/api/experiences/luck7");
        if (!res.ok) return;
        const data = (await res.json()) as { done?: Record<string, string> };
        if (!data.done || !Object.keys(data.done).length) return;
        setProgress((p) => {
          const merged = { ...p, done: { ...data.done, ...p.done } };
          saveLuck7(merged);
          return merged;
        });
      } catch {
        // sem rede/login: o localStorage já segura o progresso
      }
    })();
  }, []);

  const doneCount = Object.keys(progress.done).length;
  const moon = useMemo(() => moonLine(), []);

  const completeDay = useCallback(
    async (day: number) => {
      setCheckingIn(true);
      const next: Luck7Progress = {
        ...progress,
        done: { ...progress.done, [String(day)]: localDay() },
        ...(day === 1 ? { intention, sentence, startedAt: progress.startedAt ?? localDay() } : {}),
      };
      setProgress(next);
      saveLuck7(next);
      trackEvent("ritual_complete", { category: "experience", feature: FEATURE, day });
      try {
        await fetch("/api/experiences/luck7", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day, ...(day === 1 && intention ? { intention } : {}) }),
        });
      } catch {
        // best-effort — o localStorage já registrou
      }
      setCheckingIn(false);
      setOpenDay(null);
      reset();
    },
    [progress, intention, sentence, reset]
  );

  const auraReading = useCallback(
    async (day: number) => {
      const d = LUCK7_DAYS[day - 1];
      trackEvent("experience_start", { category: "experience", feature: FEATURE, day });
      await call("/api/experiences/ritual", {
        type: "luck",
        intention: intention || progress.intention || "Luck",
        answers: {
          program: "7-Day Luck Ritual",
          moment: d.aura === "opening" ? "day 1 of 7 — opening" : "day 7 of 7 — sealing",
          ...(sentence || progress.sentence
            ? { sentence: sentence || progress.sentence }
            : {}),
        },
      });
    },
    [call, intention, sentence, progress.intention, progress.sentence]
  );

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Progresso */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          {LUCK7_DAYS.map((d) => {
            const st = dayState(d.day, progress, preview);
            return (
              <span
                key={d.day}
                aria-label={`Day ${d.day}: ${st}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  st === "done"
                    ? "border-gold-400 bg-gold-400/20 text-gold-300"
                    : st === "open"
                      ? "border-gold-400/60 text-white/85"
                      : "border-white/15 text-white/35"
                }`}
              >
                {st === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : d.day}
              </span>
            );
          })}
        </div>
        <span className="text-xs text-white/55">{doneCount}/7</span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-white/45">
        <MoonIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {moon}
      </p>

      {/* Dias */}
      <div className="mt-5 space-y-3">
        {LUCK7_DAYS.map((d) => {
          const st = dayState(d.day, progress, preview);
          const isOpen = openDay === d.day;
          return (
            <div
              key={d.day}
              className={`rounded-2xl border ${
                isOpen ? "border-gold-400/50 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <button
                type="button"
                disabled={st === "locked"}
                onClick={() => {
                  if (st === "locked") return;
                  reset();
                  setOpenDay(isOpen ? null : d.day);
                  if (!isOpen)
                    trackEvent("experience_step", { category: "experience", feature: FEATURE, day: d.day });
                }}
                className="flex w-full items-start gap-3 p-4 text-left disabled:cursor-not-allowed"
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                    st === "done"
                      ? "border-gold-400 bg-gold-400/20 text-gold-300"
                      : st === "open"
                        ? "border-gold-400/60 text-white"
                        : "border-white/15 text-white/40"
                  }`}
                >
                  {st === "done" ? <Check className="h-4 w-4" aria-hidden /> : st === "locked" || st === "tomorrow" ? <Lock className="h-3.5 w-3.5" aria-hidden /> : d.day}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-white/90">
                    Day {d.day} — {d.title}
                    {d.aura && <Sparkles className="h-3.5 w-3.5 text-gold-400" aria-hidden />}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-white/55">
                    {st === "tomorrow" ? "Done for today — this day opens tomorrow." : d.tagline}
                  </span>
                </span>
              </button>

              {isOpen && st !== "locked" && (
                <div className="border-t border-white/10 px-4 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-white/75">{d.intro}</p>

                  <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
                    You&apos;ll need
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {d.needs.map((n) => (
                      <li key={n} className="text-sm text-white/70">
                        · {n}
                      </li>
                    ))}
                  </ul>

                  {/* Dia 1: intenção + frase */}
                  {d.day === 1 && st !== "done" && (
                    <div className="mt-4">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
                        This week is for
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {LUCK7_INTENTIONS.map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setIntention(i)}
                            className={`rounded-full border px-3.5 py-1.5 text-sm ${
                              intention === i
                                ? "border-gold-400 bg-gold-400/15 text-gold-300"
                                : "border-white/15 text-white/70 hover:border-white/35"
                            }`}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={sentence}
                        onChange={(e) => setSentence(e.target.value.slice(0, 120))}
                        placeholder="This week I am making room for…"
                        className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold-400/60 focus:outline-none"
                      />
                    </div>
                  )}

                  <ol className="mt-4 space-y-3">
                    {d.steps.map((s, i) => (
                      <li key={s.title} className="flex items-start gap-3">
                        <span className="mt-px w-5 shrink-0 font-mono text-[11px] font-semibold text-gold-400/70">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-white/80">
                          <span className="font-semibold text-white/90">{s.title}.</span> {s.text}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <blockquote className="mt-4 rounded-xl border border-gold-400/25 bg-gold-400/[0.06] px-4 py-3 text-sm italic leading-relaxed text-gold-200">
                    &ldquo;{d.say}&rdquo;
                  </blockquote>

                  {/* Leitura da Aura (dias 1 e 7) */}
                  {d.aura && (
                    <div className="mt-4">
                      {busy ? (
                        <AuraWriting text="Master Aura is writing your reading…" />
                      ) : result ? (
                        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
                          <p className="font-display text-lg font-semibold text-ink-50">{result.headline}</p>
                          <p className="mt-2 text-sm leading-relaxed text-white/80">{result.reading}</p>
                          {d.aura === "sealing" && result.card && (
                            <p className="mt-3 text-sm text-white/70">
                              <span className="font-semibold text-gold">{result.card.name}</span> — {result.card.line}
                            </p>
                          )}
                          <p className="mt-3 text-sm italic text-gold-200">{result.affirmation}</p>
                        </div>
                      ) : gate ? (
                        <GateNotice gate={gate} returnTo="/rituals/luck-7" onRetry={() => void auraReading(d.day)} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => void auraReading(d.day)}
                          className="btn-gold flex min-h-[48px] w-full items-center justify-center rounded-2xl text-sm font-semibold"
                        >
                          {d.aura === "opening" ? "Open the week with Master Aura" : "Ask Master Aura to seal the week"}
                          <span aria-hidden className="ml-2">→</span>
                        </button>
                      )}
                    </div>
                  )}

                  <p className="mt-4 text-[13px] leading-relaxed text-white/50">
                    <span className="font-medium text-white/65">Reflection:</span> {d.reflection}
                  </p>

                  {st !== "done" ? (
                    <button
                      type="button"
                      disabled={checkingIn || (d.day === 1 && !intention)}
                      onClick={() => void completeDay(d.day)}
                      className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-gold-400/50 text-sm font-semibold text-gold-300 hover:bg-gold-400/10 disabled:opacity-50"
                    >
                      {d.day === 1 && !intention ? "Choose your intention first" : `Mark day ${d.day} complete`}
                    </button>
                  ) : (
                    <p className="mt-4 text-center text-sm text-gold-300">
                      Day {d.day} sealed{progress.done[String(d.day)] ? ` · ${progress.done[String(d.day)]}` : ""}.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {doneCount === 7 && (
        <div className="mt-6 rounded-2xl border border-gold-400/40 bg-gold-400/[0.08] p-5 text-center">
          <p className="font-display text-lg font-semibold text-ink-50">Seven days. Sealed.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75">
            Keep the sentence and the coin. When &ldquo;almost&rdquo; shows up again, you know where the ritual lives.
          </p>
          <Link
            href="/rituals"
            className="mt-3 inline-block text-sm font-semibold text-gold underline underline-offset-4"
          >
            Choose your next ritual →
          </Link>
        </div>
      )}
    </div>
  );
}
