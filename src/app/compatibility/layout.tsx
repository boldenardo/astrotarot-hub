import type { Metadata } from "next";
import { Show } from "@clerk/nextjs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import CompatibilityLanding from "@/components/landing/CompatibilityLanding";

export const metadata: Metadata = {
  title: "Love Compatibility Reading — Synastry & Soulmate Test Online",
  description:
    "Compare two birth charts with a full synastry reading: love, communication, values and long-term scores, plus the strengths and challenges of your match.",
  alternates: {
    canonical: "https://astrotarot.shop/compatibility",
  },
  openGraph: {
    title: "Love Compatibility Reading — Synastry & Soulmate Test Online",
    description:
      "Compare two birth charts with a full synastry reading: love, communication, values and long-term scores, plus the strengths and challenges of your match.",
    url: "https://astrotarot.shop/compatibility",
  },
};

export default function CompatibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Compatibility", path: "/compatibility" },
        ])}
      />
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <CompatibilityLanding />
      </Show>
    </>
  );
}
