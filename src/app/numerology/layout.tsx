import type { Metadata } from "next";
import { Show } from "@clerk/nextjs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import NumerologyLanding from "@/components/landing/NumerologyLanding";

export const metadata: Metadata = {
  title: "Numerology Reading & Lucky Numbers — Life Path Calculator",
  description:
    "Discover your life path number, lucky numbers and what your birth date reveals about love, career and money. Personalized numerology reading.",
  alternates: {
    canonical: "https://astrotarot.shop/numerology",
  },
  openGraph: {
    title: "Numerology Reading & Lucky Numbers — Life Path Calculator",
    description:
      "Discover your life path number, lucky numbers and what your birth date reveals about love, career and money. Personalized numerology reading.",
    url: "https://astrotarot.shop/numerology",
  },
};

export default function NumerologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Numerology", path: "/numerology" },
        ])}
      />
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <NumerologyLanding />
      </Show>
    </>
  );
}
