import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import RitualExperience from "@/components/experiences/RitualExperience";
import { RITUAL_LABELS } from "@/lib/experiences/prompts";
import { isRitualType, RITUAL_TYPES } from "@/lib/experiences/types";

type Params = Promise<{ type: string }>;

export function generateStaticParams() {
  return RITUAL_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  if (!isRitualType(type)) return { title: "Rituals" };
  const meta = RITUAL_LABELS[type];
  return {
    title: `${meta.title} — written for you by Master Aura`,
    description: `${meta.tagline} A short conversation, then a personal ritual: candle, card, intention and tonight's moon.`,
    alternates: { canonical: `https://astrotarot.shop/rituals/${type}` },
  };
}

const OPENERS: Record<string, { line: string; sub: string }> = {
  luck: { line: "Things don't go wrong for you. They go almost right.", sub: "Tonight we make room for the part that keeps slipping." },
  money: { line: "It's not the number. It's the rhythm.", sub: "A ritual for the month that always ends the same way." },
  love: { line: "You can open without chasing.", sub: "A ritual for the window, not the door." },
  "cord-cutting": { line: "You haven't spoken in months. So why does it still feel unfinished?", sub: "Master Aura reads the connection from your side — then you release what's yours to release." },
  protection: { line: "You've felt exposed lately.", sub: "No curses, no enemies. Just a circle built around you." },
  "energy-cleanse": { line: "Something has been draining you.", sub: "Water, salt, breath — and a ritual that names the leak." },
  "new-beginning": { line: "A beginning is only honest if something gets closed.", sub: "Tonight has two halves. We'll give the first one its due." },
  moon: { line: "Tonight's moon is already part of this.", sub: "You bring the intention. The moon picks the tone." },
};

export default async function RitualTypePage({ params }: { params: Params }) {
  const { type } = await params;
  if (!isRitualType(type)) notFound();
  const meta = RITUAL_LABELS[type];
  const opener = OPENERS[type];

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <section className="mx-auto w-full max-w-lg px-4 pb-16 pt-28">
        <Link href="/rituals" className="text-xs text-white/45 underline underline-offset-4">← All rituals</Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-[#d4af37]">{meta.title}</p>
        <h1 className="mt-2 font-display text-[1.9rem] font-semibold leading-[1.15] text-ink-50 sm:text-4xl">{opener.line}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">{opener.sub}</p>
        <div className="mt-8">
          <RitualExperience type={type} title={meta.title} />
        </div>
      </section>
    </main>
  );
}
