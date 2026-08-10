"use client";

// Player único da VSL — usado na página comercial (placement="sales_page")
// e no final do funil de quiz (placement="quiz_result").
//
// Decisões:
// - <video> HTML5 nativo, sem lib de player (58 MB ficam no Cloudflare R2;
//   o browser fala direto com o R2 via range requests).
// - preload="none": NENHUM byte do MP4 é baixado até o usuário dar Play.
// - Eventos de progresso (25/50/75/90/complete) disparam UMA única vez cada
//   (timeupdate roda várias vezes por segundo — o Set em ref deduplica).
// - ctaRevealSeconds (opcional): se informado junto com children, o bloco de
//   CTA só aparece após N segundos assistidos (ou ao fim do vídeo). Sem a
//   prop, os children renderizam sempre — comportamento atual preservado.

import { useCallback, useRef, useState } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { VSL_URL, VSL_POSTER } from "@/lib/vsl";

export type VSLPlacement = "sales_page" | "quiz_result";

const PROGRESS_MARKS: ReadonlyArray<{ pct: number; event: AnalyticsEvent }> = [
  { pct: 25, event: "vsl_25" },
  { pct: 50, event: "vsl_50" },
  { pct: 75, event: "vsl_75" },
  { pct: 90, event: "vsl_90" },
];

interface VSLPlayerProps {
  placement: VSLPlacement;
  /** Segundos assistidos para revelar os children (CTA). Omitido = sempre visível. */
  ctaRevealSeconds?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function VSLPlayer({
  placement,
  ctaRevealSeconds,
  className,
  children,
}: VSLPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Eventos já disparados nesta montagem (dedupe de timeupdate/replay).
  const firedRef = useRef<Set<string>>(new Set());
  const [ctaRevealed, setCtaRevealed] = useState(ctaRevealSeconds == null);

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

  const handlePlay = useCallback(() => {
    fireOnce("vsl_play");
  }, [fireOnce]);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.duration || Number.isNaN(el.duration)) return;
    const pct = (el.currentTime / el.duration) * 100;
    for (const mark of PROGRESS_MARKS) {
      if (pct >= mark.pct) fireOnce(mark.event);
    }
    if (
      ctaRevealSeconds != null &&
      !ctaRevealed &&
      el.currentTime >= ctaRevealSeconds
    ) {
      setCtaRevealed(true);
    }
  }, [fireOnce, ctaRevealSeconds, ctaRevealed]);

  const handleEnded = useCallback(() => {
    fireOnce("vsl_complete");
    setCtaRevealed(true);
  }, [fireOnce]);

  return (
    <div className={className}>
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          controls
          playsInline
          preload="none"
          poster={VSL_POSTER}
          onPlay={handlePlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          aria-label="AstroTarot video presentation"
          className="aspect-video w-full object-contain"
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
      </div>
      {children != null && ctaRevealed && children}
    </div>
  );
}
