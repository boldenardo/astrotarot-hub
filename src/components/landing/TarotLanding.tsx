import Link from "next/link";
import Navbar from "@/components/Navbar";
import FaqSection from "@/components/FaqSection";
import type { FaqItem } from "@/lib/seo";

const TAROT_FAQS: FaqItem[] = [
  {
    question: "What is a 3-card tarot reading?",
    answer:
      "A 3-card tarot reading is the most popular tarot spread: the first card represents your past, the second your present, and the third your future. On AstroTarot Hub you draw the cards yourself and our AI interprets them together as one coherent story about your situation.",
  },
  {
    question: "What is the Egyptian tarot deck?",
    answer:
      "The Egyptian tarot is a deck based on the 22 Major Arcana, rooted in ancient Egyptian symbolism and Kabbalistic tradition. Each card — like The Magician, The High Priestess or The Sun — represents an archetypal force. AstroTarot Hub uses the Egyptian Major Arcana for its readings.",
  },
  {
    question: "Do I need to know tarot to use this?",
    answer:
      "No. You simply choose how many cards to draw (1 to 22), pick them from the shuffled deck, and the AI explains each card's meaning and how they connect. No prior tarot knowledge is required.",
  },
  {
    question: "How many free tarot readings do I get?",
    answer:
      "Every new account includes 4 free tarot readings with full AI interpretation — no credit card required. After that, you can buy a 5-Reading Pack ($9.99 one-time) or subscribe to Unlimited Premium ($14.99/month).",
  },
  {
    question: "Can I ask the tarot about love or money?",
    answer:
      "Yes. You can focus your reading on love, relationships, career or money. The AI takes your question's context into account when interpreting the cards you draw.",
  },
];

// Landing pública (SEO/AEO) exibida a visitantes anônimos em /tarot.
// Usuários logados veem a ferramenta interativa (TarotTool) — mesma URL.
export default function TarotLanding() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero — resposta direta logo abaixo do H1 (formato AEO) */}
      <section className="relative px-4 pb-12 pt-28 text-center sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
            Free AI Tarot Reading Online
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg">
            An AI tarot reading combines the symbolism of the Egyptian Major
            Arcana with your personal context. You draw the cards — the AI
            explains what they mean for your love life, career and decisions.
            Your first 4 readings are free.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="btn-gold flex w-full items-center justify-center rounded-full px-8 py-4 sm:w-auto"
            >
              Start your free reading
            </Link>
            <Link
              href="/auth/login"
              className="btn-ghost flex w-full items-center justify-center rounded-full px-8 py-4 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-600">
            4 free readings &bull; No credit card required
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-ink-50">
            How your tarot reading works
          </h2>
          <ol className="space-y-5">
            {[
              "Create your free account — it takes less than a minute.",
              "Choose your spread: 1 card for a quick answer, 3 cards for past/present/future, or up to 22 for a deep reading.",
              "Draw your cards from the shuffled Egyptian deck.",
              "Receive a personalized AI interpretation connecting the cards to your question.",
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
              "The meaning of each card in its position",
              "A unified interpretation of the full spread",
              "Guidance focused on love, career or money",
              "A saved history of your past readings",
            ].map((item) => (
              <li key={item} className="glass rounded-3xl p-5 text-ink-200">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-ink-400">
            Also explore:{" "}
            <Link href="/compatibility" className="text-gold-300 hover:underline">
              love compatibility
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

      <FaqSection faqs={TAROT_FAQS} />

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
