import type { Metadata } from "next";
import { Show } from "@clerk/nextjs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import PredictionsLanding from "@/components/landing/PredictionsLanding";

export const metadata: Metadata = {
  title: "Personalized Daily Horoscope Based on Your Birth Chart",
  description:
    "Get a daily horoscope calculated from your exact date, time and city of birth: moon phase, energy ratings, best times and key transits for your day.",
  alternates: {
    canonical: "https://astrotarot.shop/predictions",
  },
  openGraph: {
    title: "Personalized Daily Horoscope Based on Your Birth Chart",
    description:
      "Get a daily horoscope calculated from your exact date, time and city of birth: moon phase, energy ratings, best times and key transits for your day.",
    url: "https://astrotarot.shop/predictions",
  },
};

export default function PredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Daily Horoscope", path: "/predictions" },
        ])}
      />
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <PredictionsLanding />
      </Show>
    </>
  );
}
