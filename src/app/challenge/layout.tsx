import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free 4-Card Tarot Reading — No Sign-Up Required",
  description:
    "Play the free 4-card Egyptian tarot reading online. Pick your cards, reveal their meanings and get insights about your present moment. 100% free, no sign-up.",
  alternates: {
    canonical: "https://astrotarot.shop/challenge",
  },
  openGraph: {
    title: "Free 4-Card Tarot Reading — No Sign-Up Required",
    description:
      "Play the free 4-card Egyptian tarot reading online. Pick your cards, reveal their meanings and get insights about your present moment. 100% free, no sign-up.",
    url: "https://astrotarot.shop/challenge",
  },
};

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free 4-Card Reading", path: "/challenge" },
        ])}
      />
      {children}
    </>
  );
}
