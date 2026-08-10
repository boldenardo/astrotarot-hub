import Link from "next/link";
import Navbar from "@/components/Navbar";
import FaqSection from "@/components/FaqSection";
import type { FaqItem } from "@/lib/seo";

const NUMEROLOGY_FAQS: FaqItem[] = [
  {
    question: "What is a Life Path number?",
    answer:
      "Your Life Path number is the most important number in numerology. It is calculated by reducing your full birth date (day, month and year) to a single digit — or to a Master Number like 11, 22 or 33. It describes your core life theme: the lessons, strengths and direction that tend to repeat throughout your life.",
  },
  {
    question: "Why does numerology use my full birth name?",
    answer:
      "The Expression and Soul Urge numbers are derived from the letters of your name exactly as it was given at birth, because numerology treats that original name as your energetic signature — not a nickname or married name. Each letter maps to a number, and the totals reveal your natural talents (Expression) and inner desires (Soul Urge).",
  },
  {
    question: "What are Master Numbers 11, 22 and 33?",
    answer:
      "Master Numbers are double-digit numbers that are not reduced further during a numerology calculation. They are considered intensified versions of their root numbers: 11 relates to intuition and insight, 22 to building something lasting, and 33 to compassion and teaching. If your calculation lands on one, AstroTarot Hub flags it as a Master Number in your result.",
  },
  {
    question: "Is the numerology reading free?",
    answer:
      "The numerology and lucky numbers reading is part of the Unlimited Premium plan ($29.90/month), which also includes the daily horoscope, birth chart, fortune reading and soulmate compatibility reading. Creating an account is free and includes 4 free tarot readings, so you can try the platform before upgrading.",
  },
  {
    question: "Can numerology really predict my future?",
    answer:
      "Numerology does not predict specific events. It maps recurring themes — your strengths, motivations and cycles — based on your name and birth date. Many people use it as a mirror for self-reflection and decision-making rather than a fixed forecast. Think of it as a symbolic language, not a guarantee.",
  },
];

// Landing pública (SEO/AEO) exibida a visitantes anônimos em /numerology.
// Usuários logados veem a ferramenta interativa (NumerologyTool) — mesma URL.
export default function NumerologyLanding() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero — resposta direta logo abaixo do H1 (formato AEO) */}
      <section className="relative px-4 pb-12 pt-28 text-center sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
            Numerology Reading &amp; Lucky Numbers
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg">
            Numerology turns your birth name and birth date into five core
            numbers — Life Path, Expression, Soul Urge, Personality and
            Birthday — that describe your talents, motivations and life theme.
            Enter your details and the AI explains what each number means for
            you.
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
            Numerology is included with Unlimited Premium &bull; $29.90/month
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-ink-50">
            How your numerology reading works
          </h2>
          <ol className="space-y-5">
            {[
              "Create your free account — it takes less than a minute.",
              "Enter your full name exactly as given at birth and your birth date.",
              "Your five core numbers are calculated instantly, with Master Numbers (11, 22, 33) detected automatically.",
              "Receive a personalized AI interpretation connecting your numbers into one coherent profile.",
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
            What you get in every reading
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              "Your Life Path number — your core life theme",
              "Expression, Soul Urge, Personality and Birthday numbers",
              "Master Number detection with its special meaning",
              "A personalized AI interpretation of your full profile",
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
            <Link href="/predictions" className="text-gold-300 hover:underline">
              daily predictions
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection faqs={NUMEROLOGY_FAQS} />

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
