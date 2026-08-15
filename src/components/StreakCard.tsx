"use client";

// Streak de login — o gancho de retorno diário.
//
// Faz o check-in ao montar e mostra a sequência. O que puxa a volta não
// é o número, é ver o quanto falta para o próximo marco: por isso a
// barra de progresso e os sete pontos da semana ficam sempre visíveis.

import { useEffect, useState } from "react";
import { Flame, Gift, Sparkles } from "lucide-react";
import type { StreakReward } from "@/lib/streak-rewards";
import { trackEvent } from "@/lib/analytics";

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  points: number;
  isNewCheckin: boolean;
  rewards: StreakReward[];
  next: StreakReward | null;
  message: string | null;
}

export default function StreakCard() {
  const [state, setState] = useState<StreakState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/streak/checkin", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: StreakState | null) => {
        if (cancelled || !data) return;
        setState(data);
        if (data.isNewCheckin) {
          trackEvent("streak_checkin", {
            category: "retention",
            value: data.currentStreak,
          });
        }
      })
      .catch(() => {
        // Silencioso: a ausência do card nunca deve chamar atenção.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || state.currentStreak < 1) return null;

  const { currentStreak, points, next, rewards, message } = state;
  const toGo = next ? next.milestone - currentStreak : 0;
  const progress = next
    ? Math.min(100, Math.round((currentStreak / next.milestone) * 100))
    : 100;

  return (
    <section className="glass glass-gold rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold">
            <Flame className="h-6 w-6 text-night-900" aria-hidden />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold text-ink-50">
              {currentStreak}{" "}
              <span className="text-base font-normal text-ink-300">
                {currentStreak === 1 ? "day" : "days"} in a row
              </span>
            </p>
            <p className="text-xs text-ink-400">
              {points.toLocaleString("en-US")} points
            </p>
          </div>
        </div>

        {/* Semana visível: sete marcas, as cumpridas acesas. */}
        <div className="flex items-center gap-1.5 pt-1" aria-hidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < currentStreak % 7 || (currentStreak % 7 === 0 && currentStreak > 0)
                  ? "bg-gold-400"
                  : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {message && (
        <p className="mt-4 border-l-2 border-gold-400/40 pl-3 text-sm italic leading-relaxed text-ink-200">
          &ldquo;{message}&rdquo;
          <span className="mt-1 block text-xs not-italic text-ink-400">
            Master Aura
          </span>
        </p>
      )}

      {next && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs text-ink-400">
            <span>{next.title}</span>
            <span>
              {toGo} {toGo === 1 ? "day" : "days"} to go
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {rewards.length > 0 && (
        <ul className="mt-4 space-y-2">
          {rewards.map((r) => (
            <li
              key={r.milestone}
              className="flex items-start gap-2.5 rounded-2xl border border-gold-400/30 bg-gold-400/10 px-4 py-3"
            >
              {r.kind === "wallpaper" ? (
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold-300"
                  aria-hidden
                />
              ) : (
                <Gift className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden />
              )}
              <span>
                <span className="block text-sm font-semibold text-ink-50">
                  {r.title}
                </span>
                <span className="block text-xs text-ink-300">
                  {r.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
