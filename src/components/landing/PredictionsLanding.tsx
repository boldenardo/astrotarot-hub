import Link from "next/link";
import Navbar from "@/components/Navbar";
import FaqSection from "@/components/FaqSection";
import type { FaqItem } from "@/lib/seo";

const PREDICTIONS_FAQS: FaqItem[] = [
  {
    question: "How is this different from a regular daily horoscope?",
    answer:
      "A regular horoscope is written for everyone born under the same sun sign. This one is calculated from your exact date, time and city of birth, so the moon phase and the day's planetary transits are compared against your personal birth chart — not a generic sign description.",
  },
  {
    question: "What does the daily prediction include?",
    answer:
      "Each forecast shows today's moon phase and its meaning, energy ratings for love, career, health, finances and spirituality, the best times of day for different activities, your lucky color and number, one recommendation and one caution for the day, plus the key astrological transits affecting your chart.",
  },
  {
    question: "Why do you need my exact time of birth?",
    answer:
      "The time of birth determines your rising sign and the positions of the houses in your natal chart. Without it, transits can only be read roughly. With it, the forecast can say which areas of your life — love, work, money — each transit actually touches today.",
  },
  {
    question: "Is the daily horoscope free?",
    answer:
      "The daily personalized horoscope is a Premium feature of AstroTarot Hub. New accounts start with 4 free AI tarot readings. Unlimited Premium ($29.90/month) unlocks the daily horoscope along with numerology, birth chart, fortune and soulmate compatibility readings.",
  },
  {
    question: "What are astrological transits?",
    answer:
      "Transits are the current positions of the planets compared to where they were when you were born. When a moving planet forms an angle (an aspect) to one of your natal planets, astrologers read it as an active influence. Your forecast lists today's strongest transits, their energy and the life areas they affect.",
  },
];

// Landing pública (SEO/AEO) exibida a visitantes anônimos em /predictions.
// Usuários logados veem a ferramenta interativa (PredictionsTool) — mesma URL.
export default function PredictionsLanding() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero — resposta direta logo abaixo do H1 (formato AEO) */}
      <section className="relative px-4 pb-12 pt-28 text-center sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
            Daily Horoscope Based on Your Birth Chart
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg">
            A personalized daily horoscope compares today&apos;s planetary
            transits and moon phase with the exact positions from the moment you
            were born. Enter your birth details and get energy ratings for love,
            career, health and money — calculated for you, not for your whole
            zodiac sign.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="btn-gold flex w-full items-center justify-center rounded-full px-8 py-4 sm:w-auto"
            >
              Create your free account
            </Link>
            <Link
              href="/auth/login"
              className="btn-ghost flex w-full items-center justify-center rounded-full px-8 py-4 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-600">
            Daily horoscope available with Unlimited Premium &bull; 4 free tarot
            readings for every new account
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-ink-50">
            How your daily prediction works
          </h2>
          <ol className="space-y-5">
            {[
              "Create your free account — it takes less than a minute.",
              "Enter your name plus your date, time and city of birth, so we can calculate your natal chart.",
              "We map today's moon phase and planetary transits against your chart.",
              "You get a forecast for the day: energy ratings, best times, lucky elements, one recommendation and one caution.",
            ].map((step, i) => (
              <li key={i} className="glass flex items-start gap-4 rounded-3xl p-5">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-600 font-semibold text-night-900">
                  {i + 1}
                </span>
                <p className="text-ink-200">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What you get */}
      <section className="relative px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-ink-50">
            What you get in every forecast
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              "Today's moon phase and what it means for you",
              "Energy ratings for love, career, health, finances and spirituality",
              "Best times of day — morning, afternoon and evening",
              "Lucky color and lucky number for the day",
              "A recommendation and a caution to guide your decisions",
              "The key planetary transits active in your chart today",
            ].map((item) => (
              <li key={item} className="glass rounded-3xl p-5 text-ink-200">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-ink-400">
            Also explore:{" "}
            <Link href="/tarot" className="text-gold-300 hover:underline">
              tarot readings
            </Link>
            ,{" "}
            <Link href="/compatibility" className="text-gold-300 hover:underline">
              love compatibility
            </Link>{" "}
            and{" "}
            <Link href="/numerology" className="text-gold-300 hover:underline">
              numerology
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection faqs={PREDICTIONS_FAQS} />

      <p className="px-4 pb-16 text-center text-sm text-ink-600">
        Learn more{" "}
        <Link href="/about" className="text-gold-300 hover:underline">
          about how AstroTarot Hub works
        </Link>
        .
      </p>
    </main>
  );
}
