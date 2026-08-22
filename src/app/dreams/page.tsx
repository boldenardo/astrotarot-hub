import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import DreamDecoder from "@/components/experiences/DreamDecoder";

export const metadata: Metadata = {
  title: "Dream Interpretation — Tell Master Aura What You Dreamed",
  description:
    "Describe your dream in your own words. Master Aura finds the symbols, the emotional theme and what your mind may be processing — with an optional 3-card pull.",
  alternates: { canonical: "https://astrotarot.shop/dreams" },
};

export default function DreamsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Dreams", path: "/dreams" }])} />
      <section className="mx-auto w-full max-w-lg px-4 pb-16 pt-28">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9b86e6]">Dream interpretation</p>
        <h1 className="mt-2 font-display text-[1.9rem] font-semibold leading-[1.15] text-ink-50 sm:text-4xl">
          You woke up thinking about the same person again.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          That dream may be about something completely different than you think. Tell Master Aura what happened — she reads the symbols, the feeling you woke up with, and what your mind may be working through.
        </p>
        <div className="mt-8">
          <DreamDecoder />
        </div>
      </section>
    </main>
  );
}
