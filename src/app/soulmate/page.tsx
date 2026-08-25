"use client";

// Draw Your Soulmate — a entrega da promessa central do funil.
//
// Três estados, nesta ordem de fricção:
//   1. sem data de nascimento → pede o dado que falta (/profile)
//   2. assinante sem retrato   → botão para desenhar (uma vez por pessoa)
//   3. assinante com retrato   → prévia desfocada + oferta de $24.99,
//      ou, com o add-on, o retrato inteiro + dossiê + download
//
// A prévia existe porque a Master Aura promete o retrato dentro do quiz:
// quem assina precisa receber algo real, não um paywall seco.

import { Suspense, useCallback, useEffect, useState } from "react";
import { FRONT_LIST_PRICE_LABEL, FRONT_LIST_PRICE_USD } from "@/lib/offer";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Lock, Sparkles, Download } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface Dossier {
  appearance: string;
  traits: string[];
  meeting_window: string;
  how_to_recognize: string;
  closing: string;
}

interface SoulmateState {
  isPremium: boolean;
  hasFullUnlock: boolean;
  hasBirthDate: boolean;
  portrait: {
    image_url: string | null;
    preview_url: string | null;
    dossier: Dossier | null;
    sign: string | null;
  } | null;
}

function SoulmateContent() {
  const [state, setState] = useState<SoulmateState | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/soulmate");
      if (res.status === 401) {
        window.location.href = "/auth/login?redirect=/soulmate";
        return;
      }
      setState(await res.json());
    } catch {
      setError("We couldn't load your reading. Please refresh.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const draw = async () => {
    if (drawing) return;
    setDrawing(true);
    setError(null);
    trackEvent("soulmate_draw_started", { category: "soulmate" });
    try {
      const res = await fetch("/api/soulmate/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "We couldn't draw your portrait right now.");
      } else {
        await load();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDrawing(false);
    }
  };

  const unlock = async () => {
    if (buying) return;
    setBuying(true);
    setError(null);
    trackEvent("soulmate_unlock_clicked", {
      category: "soulmate",
      value: FRONT_LIST_PRICE_USD,
    });
    try {
      const res = await fetch("/api/soulmate/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Could not start checkout. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    }
    setBuying(false);
  };

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" aria-hidden />
      </div>
    );
  }

  const { portrait, hasFullUnlock } = state;
  const dossier = portrait?.dossier ?? null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-24">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-300">
          Draw your soulmate
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink-50 sm:text-4xl">
          The face your chart{" "}
          <span className="text-gold">keeps pointing to</span>
        </h1>
      </header>

      {error && (
        <p
          className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-center text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* 1. Falta a data de nascimento */}
      {!state.hasBirthDate && (
        <section className="glass mt-8 rounded-3xl p-6 text-center">
          <p className="text-ink-300">
            Master Aura reads your birth chart to draw them. Add your birth
            date first and the portrait unlocks.
          </p>
          <Link
            href="/profile"
            className="btn-gold mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full px-8 font-semibold"
          >
            Add my birth date
          </Link>
        </section>
      )}

      {/* 2. Assinante sem retrato ainda */}
      {state.hasBirthDate && !portrait?.image_url && (
        <section className="glass glass-gold mt-8 rounded-3xl p-6 text-center">
          {state.isPremium || state.hasFullUnlock ? (
            <>
              <p className="text-ink-300">
                Your chart is ready. Master Aura will draw the person your
                Venus and 7th house point to. This happens once.
              </p>
              <button
                type="button"
                onClick={draw}
                disabled={drawing}
                className="btn-gold mt-5 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-8 font-semibold disabled:opacity-60"
              >
                {drawing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Drawing your soulmate...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" aria-hidden />
                    Draw my soulmate
                  </>
                )}
              </button>
              {drawing && (
                <p className="mt-3 text-xs text-ink-400">
                  This takes up to a minute. Please keep this page open.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-ink-300">
                Your soulmate portrait is part of the membership.
              </p>
              <Link
                href="/cart?plan=premium"
                className="btn-gold mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full px-8 font-semibold"
              >
                Unlock my reading
              </Link>
            </>
          )}
        </section>
      )}

      {/* 3. Retrato pronto */}
      {portrait?.image_url && (
        <section className="mt-8">
          <figure className="glass glass-gold relative overflow-hidden rounded-3xl">
            <Image
              src={hasFullUnlock ? portrait.image_url : portrait.preview_url ?? portrait.image_url}
              alt="Your soulmate portrait"
              width={1024}
              height={1024}
              className={`w-full object-cover transition-all ${
                hasFullUnlock ? "" : "scale-[1.02] blur-[6px]"
              }`}
              priority
            />
            {!hasFullUnlock && (
              <figcaption className="absolute inset-0 flex flex-col items-center justify-end gap-3 bg-gradient-to-t from-night-950 via-night-950/70 to-transparent p-6 text-center">
                <span className="flex items-center gap-2 text-sm font-medium text-gold-200">
                  <Lock className="h-4 w-4" aria-hidden />
                  Preview
                </span>
              </figcaption>
            )}
          </figure>

          {/* Dossiê: trecho para todos, inteiro para quem destravou */}
          {dossier && (
            <div className="glass mt-4 rounded-3xl p-6">
              <h2 className="font-display text-xl font-semibold text-ink-50">
                What Master Aura saw
              </h2>
              <p className="mt-3 text-ink-200">{dossier.appearance}</p>

              {hasFullUnlock ? (
                <>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {dossier.traits?.map((t) => (
                      <li
                        key={t}
                        className="flex items-start gap-2 text-sm text-ink-200"
                      >
                        <Sparkles
                          className="mt-0.5 h-4 w-4 shrink-0 text-gold-400"
                          aria-hidden
                        />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                    <div>
                      <h3 className="text-sm font-semibold text-gold-300">
                        When your paths cross
                      </h3>
                      <p className="mt-1 text-ink-200">{dossier.meeting_window}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gold-300">
                        How you&apos;ll recognize them
                      </h3>
                      <p className="mt-1 text-ink-200">
                        {dossier.how_to_recognize}
                      </p>
                    </div>
                    <p className="text-ink-300">{dossier.closing}</p>
                  </div>
                  <a
                    href={portrait.image_url}
                    download="my-soulmate.png"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full font-medium"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Save my portrait
                  </a>
                </>
              ) : (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <h3 className="font-display text-lg font-semibold text-ink-50">
                    See their face clearly
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-ink-300">
                    <li>The full portrait, sharp and unblurred</li>
                    <li>Their four defining traits</li>
                    <li>The window when your paths cross</li>
                    <li>How you&apos;ll recognize them</li>
                    <li>Your portrait saved to your phone</li>
                  </ul>
                  <button
                    type="button"
                    onClick={unlock}
                    disabled={buying}
                    className="btn-gold mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full font-semibold disabled:opacity-60"
                  >
                    {buying && (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    )}
                    Reveal their face — {FRONT_LIST_PRICE_LABEL} once
                  </button>
                  <p className="mt-2 text-center text-xs text-ink-400">
                    One payment. Yours forever, even if you cancel.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default function SoulmatePage() {
  return (
    <Suspense fallback={null}>
      <SoulmateContent />
    </Suspense>
  );
}
