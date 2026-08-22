import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import PastLifeExperience from "@/components/experiences/PastLifeExperience";

export const metadata: Metadata = {
  title: "Past Life Reading & Past Life Connection | AstroTarot",
  description:
    "Why did this person feel familiar before you even knew them? A symbolic past-life archetype reading with Master Aura — your era, role, central lesson and the pattern you carry forward.",
  alternates: { canonical: "https://astrotarot.shop/past-lives" },
};

export default async function PastLivesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Past Lives", path: "/past-lives" }])} />
      <section className="mx-auto w-full max-w-lg px-4 pb-16 pt-28">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#d4af37]">Past lives</p>
        <h1 className="mt-2 font-display text-[1.9rem] font-semibold leading-[1.15] text-ink-50 sm:text-4xl">
          Have you ever met someone who felt familiar too quickly?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          Not déjà vu. Recognition. Master Aura reads the archetype you may be carrying — and, if there&apos;s someone, why the bond feels older than it is.
        </p>
        <div className="mt-8">
          <PastLifeExperience initialMode={mode === "connection" ? "connection" : "self"} />
        </div>
      </section>
    </main>
  );
}
