import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Your 2026 Cosmic Reading | AstroTarot",
  description:
    "Take the 2-minute cosmic reading and get your personalized 2026 plan for love, money and purpose.",
};

// Funnel layout: no navbar, no footer, no exits. Brand mark is NOT a link.
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(700px 420px at 50% -8%, rgba(124, 92, 255, 0.16), transparent 60%), radial-gradient(520px 340px at 88% 12%, rgba(212, 175, 55, 0.08), transparent 55%), radial-gradient(600px 420px at 8% 92%, rgba(124, 92, 255, 0.08), transparent 60%)",
        }}
      />

      {/* Fixed brand mark (not a link — the funnel has no exits) */}
      <div className="fixed inset-x-0 top-0 z-40 flex justify-center pt-4">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Image
            src="/brand/astrotarot-logo.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-6 w-6 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.35)]"
          />
          <span className="text-gold">AstroTarot</span>
        </span>
      </div>

      {/* Centered content column */}
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-10 pt-16">
        {children}
      </main>
    </div>
  );
}
