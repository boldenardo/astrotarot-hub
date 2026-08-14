import Link from "next/link";
import Navbar from "@/components/Navbar";
import FaqSection from "@/components/FaqSection";
import type { FaqItem } from "@/lib/seo";

const COMPATIBILITY_FAQS: FaqItem[] = [
  {
    question: "What is a synastry (compatibility) reading?",
    answer:
      "Synastry is the astrological comparison of two birth charts. By overlaying the planetary positions of both people at the moment they were born, it reveals how your energies interact — where you naturally flow together and where friction tends to appear.",
  },
  {
    question: "Why do you need the exact birth time and city?",
    answer:
      "The Moon, the Ascendant and the house positions move quickly — they change within hours. Birth time and city let the calculation place each planet precisely in both charts, which makes the difference between a generic zodiac match and a real synastry analysis.",
  },
  {
    question: "What does the compatibility score actually measure?",
    answer:
      "You get an overall percentage plus four separate scores: love, communication, values and long-term potential. Each score comes from specific planetary aspects between the two charts — for example, Venus–Mars contacts for chemistry and Mercury aspects for communication.",
  },
  {
    question: "Is a low score a verdict on the relationship?",
    answer:
      "No. Synastry shows dynamics, not destiny. The reading highlights your strengths and your challenges explicitly — many lasting couples have 'difficult' charts and simply learned to work with them. Use it as a map, not a sentence.",
  },
  {
    question: "Is the soulmate reading free?",
    answer:
      "The compatibility (soulmate) reading is part of the Unlimited Premium plan ($19.99/month), which also includes daily horoscopes, numerology, birth charts and fortune readings. New accounts start with 4 free tarot readings so you can try the platform first — no credit card required.",
  },
];

// Landing pública (SEO/AEO) exibida a visitantes anônimos em /compatibility.
// Usuários logados veem a ferramenta interativa (CompatibilityTool) — mesma URL.
export default function CompatibilityLanding() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero — resposta direta logo abaixo do H1 (formato AEO) */}
      <section className="relative px-4 pb-12 pt-28 text-center sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
            Love Compatibility &amp; Soulmate Reading
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg">
            A compatibility reading compares the birth charts of two people —
            a technique astrologers call synastry. Enter both birth dates,
            times and cities, and the AI calculates how your planets interact:
            attraction, communication, values and long-term potential, with a
            clear score for each.
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
            Soulmate readings are available with Premium Unlimited &bull; 4
            free tarot readings to start
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-ink-50">
            How the compatibility reading works
          </h2>
          <ol className="space-y-5">
            {[
              "Create your account — it takes less than a minute.",
              "Enter your birth details: date, time and city of birth.",
              "Enter the same details for the person you're curious about.",
              "Receive a full synastry analysis with scores, strengths, challenges and a final verdict on the match.",
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
            What you get in every soulmate reading
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              "An overall compatibility score plus love, communication, values and long-term scores",
              "The strengths that hold you together — and the challenges to watch",
              "A breakdown of your emotional connection, chemistry and communication style",
              "A final verdict on the match, written for your two charts specifically",
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
            <Link href="/numerology" className="text-gold-300 hover:underline">
              numerology
            </Link>{" "}
            and{" "}
            <Link href="/predictions" className="text-gold-300 hover:underline">
              daily predictions
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection faqs={COMPATIBILITY_FAQS} />

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
