"use client";

// Vibes & Meditations — add-on de $9.99/mês dentro da assinatura.
//
// Enquanto não houver faixas no catálogo, a página mostra "em breve" e
// NÃO oferece a cobrança: cobrar por prateleira vazia gera reembolso e
// queima a confiança que o resto do funil construiu.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Play, Pause, Lock, Waves } from "lucide-react";
import { tracksByIntention, VIBE_TRACKS, type VibeTrack } from "@/lib/vibes-catalog";
import { trackEvent } from "@/lib/analytics";

interface VibesState {
  active: boolean;
  isPremium: boolean;
  configured: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VibesPage() {
  const [state, setState] = useState<VibesState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/vibes");
      if (res.status === 401) {
        window.location.href = "/auth/login?redirect=/vibes";
        return;
      }
      setState(await res.json());
    } catch {
      setError("We couldn't load this page. Please refresh.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Um áudio por vez: tocar outro para o anterior.
  useEffect(() => () => audio?.pause(), [audio]);

  const toggle = (track: VibeTrack) => {
    if (playing === track.id) {
      audio?.pause();
      setPlaying(null);
      return;
    }
    audio?.pause();
    const next = new Audio(track.src);
    next.play().catch(() => setError("This track couldn't play."));
    next.onended = () => setPlaying(null);
    setAudio(next);
    setPlaying(track.id);
  };

  const subscribe = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    trackEvent("vibes_subscribe_clicked", { category: "vibes", value: 9.99 });
    try {
      const res = await fetch("/api/vibes", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await load();
      } else {
        setError(data.error || "We couldn't add Vibes to your plan.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  };

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" aria-hidden />
      </div>
    );
  }

  const groups = tracksByIntention();
  const hasContent = VIBE_TRACKS.length > 0;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-24">
      <header className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-400/25 bg-gold-400/10">
          <Waves className="h-7 w-7 text-gold-300" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink-50 sm:text-4xl">
          Vibes &amp; <span className="text-gold">Meditations</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-300">
          Frequencies and guided meditations for abundance, love and the law
          of attraction. Put the headphones on and let the day change.
        </p>
      </header>

      {error && (
        <p
          className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-center text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      {!hasContent && (
        <section className="glass mt-8 rounded-3xl p-6 text-center">
          <p className="text-ink-300">
            The first sessions are being recorded. This space opens soon.
          </p>
        </section>
      )}

      {hasContent && !state.active && (
        <section className="glass glass-gold mt-8 rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-300">
            Add to your plan
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink-50">
            $9.99/month <span className="text-base font-normal text-ink-300">on top of your membership</span>
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-ink-200">
            <li>{VIBE_TRACKS.length} guided sessions, new ones every month</li>
            <li>Frequencies for abundance, love, sleep, focus and release</li>
            <li>Same invoice as your plan. Remove it any time.</li>
          </ul>
          {state.isPremium ? (
            <button
              type="button"
              onClick={subscribe}
              disabled={busy || !state.configured}
              className="btn-gold mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full font-semibold disabled:opacity-60"
            >
              {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              Add Vibes to my plan
            </button>
          ) : (
            <Link
              href="/cart?plan=premium"
              className="btn-gold mt-5 flex min-h-[52px] w-full items-center justify-center rounded-full font-semibold"
            >
              Start my membership first
            </Link>
          )}
        </section>
      )}

      {hasContent && (
        <div className="mt-8 space-y-8">
          {groups.map((group) => (
            <section key={group.intention}>
              <h2 className="font-display text-xl font-semibold text-ink-50">
                {group.label}
              </h2>
              <p className="mt-1 text-sm text-ink-400">{group.description}</p>
              <ul className="mt-3 space-y-2">
                {group.tracks.map((track) => (
                  <li key={track.id}>
                    <button
                      type="button"
                      onClick={() => state.active && toggle(track)}
                      disabled={!state.active}
                      className="glass flex min-h-[64px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all enabled:hover:border-gold-400/40 disabled:opacity-60"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                        {!state.active ? (
                          <Lock className="h-4 w-4" aria-hidden />
                        ) : playing === track.id ? (
                          <Pause className="h-4 w-4" aria-hidden />
                        ) : (
                          <Play className="h-4 w-4" aria-hidden />
                        )}
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-ink-50">
                          {track.title}
                        </span>
                        <span className="text-xs text-ink-400">
                          {formatDuration(track.duration)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
