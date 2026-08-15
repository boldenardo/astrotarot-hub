// Verso de carta de tarot 100% local (CSS + logo) — substitui as imagens
// hotlinkadas do Pinterest, que podiam quebrar/sumir a qualquer momento e
// vazavam referer do site para terceiros.

import Image from "next/image";

export default function CardBack({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-gold-400/30 bg-gradient-to-br from-[#2a1f4d] via-[#1b1438] to-[#0f0b24] shadow-gold ${className}`}
      aria-hidden
    >
      {/* Moldura interna */}
      <div className="absolute inset-2 rounded-xl border border-gold-400/25" />
      <div className="absolute inset-3 rounded-lg border border-gold-400/10" />
      {/* Brilho central */}
      <div className="absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amethyst-500/15 blur-2xl" />
      {/* Marca d'água */}
      <Image
        src="/brand/astrotarot-logo.png"
        alt=""
        width={96}
        height={96}
        className="relative z-10 h-1/3 w-auto object-contain opacity-70 drop-shadow-[0_0_14px_rgba(212,175,55,0.35)]"
      />
    </div>
  );
}
