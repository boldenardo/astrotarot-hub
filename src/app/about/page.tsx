import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "About — How AstroTarot Hub Works",
  description:
    "AstroTarot Hub combines real astronomical data with AI to deliver personalized tarot readings, birth charts, compatibility, numerology and daily predictions.",
  alternates: {
    canonical: "https://astrotarot.shop/about",
  },
  openGraph: {
    title: "About — How AstroTarot Hub Works",
    description:
      "AstroTarot Hub combines real astronomical data with AI to deliver personalized tarot readings, birth charts, compatibility, numerology and daily predictions.",
    url: "https://astrotarot.shop/about",
  },
};

// Página institucional (E-E-A-T): explica o que o produto faz, como a IA é
// usada e onde encontrar cada recurso. Conteúdo estático, server component.
export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <article className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <h1 className="font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
          About AstroTarot Hub
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink-200">
          AstroTarot Hub is a web app that combines real astrological data
          with artificial intelligence to deliver personalized tarot readings,
          birth charts, love compatibility, numerology and daily predictions.
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold text-gold-300">
          How it works
        </h2>
        <p className="mt-4 leading-relaxed text-ink-200">
          Every reading starts from your real birth data — date, time and
          city. Birth charts and planetary positions are calculated from
          astronomical ephemeris data, not generated at random. The AI layer
          then interprets those charts and the tarot cards you draw, turning
          traditional symbolism into clear, personal guidance about love,
          career, money and purpose.
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold text-gold-300">
          What you can do here
        </h2>
        <ul className="mt-4 space-y-3 text-ink-200">
          <li>
            <Link href="/tarot" className="text-gold-300 hover:underline">
              AI Tarot readings
            </Link>{" "}
            — draw cards from the Egyptian Major Arcana and receive a
            personalized interpretation. 4 free readings for every new
            account.
          </li>
          <li>
            <Link href="/challenge" className="text-gold-300 hover:underline">
              Free 4-card reading
            </Link>{" "}
            — a quick interactive reading, no sign-up required.
          </li>
          <li>
            <Link href="/compatibility" className="text-gold-300 hover:underline">
              Love compatibility
            </Link>{" "}
            — synastry analysis between two birth charts.
          </li>
          <li>
            <Link href="/numerology" className="text-gold-300 hover:underline">
              Numerology
            </Link>{" "}
            — your life path number and lucky numbers.
          </li>
          <li>
            <Link href="/predictions" className="text-gold-300 hover:underline">
              Daily predictions
            </Link>{" "}
            — a personalized daily horoscope based on your birth chart.
          </li>
        </ul>

        <h2 className="mt-12 font-display text-2xl font-semibold text-gold-300">
          Pricing
        </h2>
        <p className="mt-4 leading-relaxed text-ink-200">
          Every account starts free: 4 tarot readings, Egyptian Tarot insights
          and the AI Spiritual Guide, with no credit card required. For more,
          there is a 5-Reading Pack ($9.99 one-time payment) and the Unlimited
          Premium subscription ($29.90/month), which unlocks unlimited
          readings, the daily horoscope, soulmate compatibility, your complete
          birth chart and your lucky numbers.
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold text-gold-300">
          Privacy
        </h2>
        <p className="mt-4 leading-relaxed text-ink-200">
          Your birth data and readings belong to your private account and are
          never sold or shared. Conversations with the AI Spiritual Guide are
          confidential.
        </p>

        <p className="mt-12 text-sm text-ink-600">
          AstroTarot Hub is an entertainment and self-reflection tool. It does
          not replace professional medical, legal or financial advice.
        </p>
      </article>
    </main>
  );
}
