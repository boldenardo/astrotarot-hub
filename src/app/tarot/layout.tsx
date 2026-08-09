import type { Metadata } from "next";
import { Show } from "@clerk/nextjs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import TarotLanding from "@/components/landing/TarotLanding";

export const metadata: Metadata = {
  title: "Free AI Tarot Reading Online — Egyptian Tarot & 3-Card Spreads",
  description:
    "Draw cards from the Egyptian Major Arcana and get a personalized AI tarot reading about love, career and decisions. 4 free readings — no credit card required.",
  alternates: {
    canonical: "https://astrotarot.shop/tarot",
  },
  openGraph: {
    title: "Free AI Tarot Reading Online — Egyptian Tarot & 3-Card Spreads",
    description:
      "Draw cards from the Egyptian Major Arcana and get a personalized AI tarot reading about love, career and decisions. 4 free readings — no credit card required.",
    url: "https://astrotarot.shop/tarot",
  },
};

// Gate server-side: a ferramenta (children) só renderiza com sessão;
// anônimos e Googlebot recebem a landing pública no HTML SSR. Mesma URL.
export default function TarotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tarot Reading", path: "/tarot" },
        ])}
      />
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <TarotLanding />
      </Show>
    </>
  );
}
