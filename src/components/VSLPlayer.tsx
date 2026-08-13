"use client";

// Player único da VSL — usado na página comercial (placement="sales_page")
// e no final do funil de quiz (placement="quiz_result").
//
// Decisões:
// - <video> HTML5 nativo SEM `controls`: uma VSL não pode permitir seek.
//   Controles próprios = só play/pause e som. Sem barra arrastável, sem
//   ±10s, sem velocidade, sem download, sem PiP.
// - Seek é bloqueado no evento `seeking` (defesa contra atalhos de teclado,
//   media keys e controles do sistema): qualquer salto adiante volta para
//   o ponto máximo realmente assistido.
// - preload="none": NENHUM byte do MP4 é baixado até o usuário dar Play
//   (o arquivo tem ~58 MB e mora no Cloudflare R2).
// - Eventos de progresso (25/50/75/90/complete) disparam UMA vez cada.
// - ctaRevealSeconds: revela os children (CTA/oferta) após N segundos.

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { VSL_URL, VSL_POSTER, VSL_ASPECT } from "@/lib/vsl";

export type VSLPlacement = "sales_page" | "quiz_result";

const PROGRESS_MARKS: ReadonlyArray<{ pct: number; event: AnalyticsEvent }> = [
  { pct: 25, event: "vsl_25" },
  { pct: 50, event: "vsl_50" },
  { pct: 75, event: "vsl_75" },
  { pct: 90, event: "vsl_90" },
];

// Tolerância para o bloqueio de seek: o próprio playback avança o
// currentTime entre um timeupdate e outro, então só tratamos como "pulo"
// saltos maiores que isso.
const SEEK_TOLERANCE_S = 1.5;

interface VSLPlayerProps {
  placement: VSLPlacement;
  /** Segundos assistidos para revelar os children (CTA). Omitido = sempre visível. */
  ctaRevealSeconds?: number;
  /** Chamado UMA vez quando o gate de ctaRevealSeconds abre (ou o vídeo termina). */
  onCtaReveal?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function VSLPlayer({
  placement,
  ctaRevealSeconds,
  onCtaReveal,
  className,
  children,
}: VSLPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Eventos já disparados nesta montagem (dedupe de timeupdate/replay).
  const firedRef = useRef<Set<string>>(new Set());
  // Ponto máximo realmente assistido — âncora do bloqueio de seek.
  const maxWatchedRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [ctaRevealed, setCtaRevealed] = useState(ctaRevealSeconds == null);

  const onCtaRevealRef = useRef(onCtaReveal);
  onCtaRevealRef.current = onCtaReveal;

  const reveal = useCallback(() => {
    setCtaRevealed((prev) => {
      if (!prev) onCtaRevealRef.current?.();
      return true;
    });
  }, []);

  const fireOnce = useCallback(
    (event: AnalyticsEvent) => {
      if (firedRef.current.has(event)) return;
      firedRef.current.add(event);
      // label duplica o placement porque o react-ga4 só encaminha
      // category/label/value ao GA; o Meta Pixel recebe o objeto completo.
      trackEvent(event, { category: "vsl", label: placement, placement });
    },
    [placement]
  );

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {
        // autoplay/gesto negado — o usuário toca de novo
      });
    } else {
      el.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  const handlePlay = useCallback(() => {
    setStarted(true);
    setPlaying(true);
    fireOnce("vsl_play");
  }, [fireOnce]);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.currentTime > maxWatchedRef.current) {
      maxWatchedRef.current = el.currentTime;
    }

    if (el.duration && !Number.isNaN(el.duration)) {
      const pct = (el.currentTime / el.duration) * 100;
      setProgressPct(Math.min(100, pct));
      for (const mark of PROGRESS_MARKS) {
        if (pct >= mark.pct) fireOnce(mark.event);
      }
    }

    if (
      ctaRevealSeconds != null &&
      !ctaRevealed &&
      el.currentTime >= ctaRevealSeconds
    ) {
      reveal();
    }
  }, [fireOnce, ctaRevealSeconds, ctaRevealed, reveal]);

  // Bloqueio de seek: qualquer tentativa de avançar além do ponto assistido
  // é revertida. Voltar atrás também é revertido — é uma VSL, não um vídeo.
  const handleSeeking = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const target = el.currentTime;
    const maxAllowed = maxWatchedRef.current;
    if (Math.abs(target - maxAllowed) > SEEK_TOLERANCE_S) {
      el.currentTime = maxAllowed;
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    fireOnce("vsl_complete");
    reveal();
  }, [fireOnce, reveal]);

  // Media keys / controles do sistema podem mudar a taxa de reprodução:
  // trava em 1x sempre que alguém tentar acelerar.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onRateChange = () => {
      if (el.playbackRate !== 1) el.playbackRate = 1;
    };
    el.addEventListener("ratechange", onRateChange);
    return () => el.removeEventListener("ratechange", onRateChange);
  }, []);

  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
        style={{ aspectRatio: VSL_ASPECT }}
      >
        <video
          ref={videoRef}
          playsInline
          preload="none"
          poster={VSL_POSTER}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onPlay={handlePlay}
          onPause={() => setPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onEnded={handleEnded}
          onClick={togglePlay}
          aria-label="AstroTarot video presentation"
          className="h-full w-full cursor-pointer object-cover"
        >
          <source src={VSL_URL} type="video/mp4" />
          {/* Fallback para browsers sem suporte a video */}
          <p className="p-6 text-center text-sm text-white/70">
            Your browser can&apos;t play this video.{" "}
            <a href={VSL_URL} className="text-gold underline">
              Watch it here
            </a>
            .
          </p>
        </video>

        {/* Capa: botão grande de play antes do primeiro toque */}
        {!started && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play video"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 transition hover:bg-black/35"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-400/90 shadow-[0_0_40px_rgba(212,175,55,0.45)]">
              <Play
                className="ml-1 h-9 w-9 fill-night-900 text-night-900"
                aria-hidden
              />
            </span>
            <span className="text-sm font-medium text-white/90">
              Tap to watch
            </span>
          </button>
        )}

        {/* Controles próprios: só play/pause e som. Sem barra arrastável. */}
        {started && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
            {/* Progresso apenas informativo (não é interativo de propósito) */}
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Video progress"
            >
              <div
                className="h-full bg-gold-400 transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="pointer-events-auto mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
              >
                {playing ? (
                  <Pause className="h-4 w-4 fill-current" aria-hidden />
                ) : (
                  <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
              >
                {muted ? (
                  <VolumeX className="h-4 w-4" aria-hidden />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      {children != null && ctaRevealed && children}
    </div>
  );
}
