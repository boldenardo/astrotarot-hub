"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shuffle, ArrowLeft, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EGYPTIAN_DECK } from "@/lib/tarot-data";
import { createTarotReading, TarotApiError } from "@/lib/tarot-client";
import Image from "next/image";

interface DrawnCard {
  id: number;
  name: string;
  image: string;
  position: string;
  interpretation?: string;
}

export default function EgyptianTarotPage() {
  const router = useRouter();
  const [numCards, setNumCards] = useState<number>(3);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [aiError, setAiError] = useState<string>("");
  const [noReadingsLeft, setNoReadingsLeft] = useState(false);
  const [readingsLeft, setReadingsLeft] = useState<
    number | "unlimited" | null
  >(null);

  // Access to /tarot is protected by Clerk middleware, so no client-side
  // session check is needed here.

  const spreadTypes: { [key: number]: string[] } = {
    1: ["Present"],
    3: ["Past", "Present", "Future"],
    5: [
      "Situation",
      "Obstacle",
      "Guidance",
      "Near Outcome",
      "Final Outcome",
    ],
    7: [
      "Past",
      "Present",
      "Future",
      "You",
      "Environment",
      "Hopes",
      "Outcome",
    ],
  };

  const drawCards = async () => {
    if (numCards > 22 || numCards < 1) {
      alert("Choose between 1 and 22 cards.");
      return;
    }

    setIsDrawing(true);
    setShowCards(false);
    setAiInterpretation("");
    setAiError("");
    setNoReadingsLeft(false);

    // Simulate shuffling
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Draw unique cards
    const shuffled = [...EGYPTIAN_DECK].sort(() => Math.random() - 0.5);
    const positions =
      spreadTypes[numCards] ||
      Array.from({ length: numCards }, (_, i) => `Position ${i + 1}`);

    const selected: DrawnCard[] = shuffled
      .slice(0, numCards)
      .map((card, index) => ({
        id: card.id,
        name: card.name,
        image: card.imageUrl,
        position: positions[index] || `Position ${index + 1}`,
      }));

    setDrawnCards(selected);
    setIsDrawing(false);
    setShowCards(true);

    // Generate the AI interpretation
    await generateAIInterpretation(selected);
  };

  const generateAIInterpretation = async (cards: DrawnCard[]) => {
    setIsLoadingAI(true);
    setAiError("");
    setNoReadingsLeft(false);

    try {
      const result = await createTarotReading({
        selectedCards: cards.map((c) => ({
          name: c.name,
          number: c.id,
        })),
        question: "General interpretation of the spread",
      });

      setAiInterpretation(result.reading?.interpretation || "");
      setReadingsLeft(result.readingsLeft ?? null);
    } catch (error) {
      console.error("Error generating interpretation:", error);

      if (error instanceof TarotApiError) {
        if (error.status === 401 || error.code === "AUTH_REQUIRED") {
          router.push("/auth/login");
          return;
        }
        if (error.status === 402 || error.code === "NO_READINGS_LEFT") {
          setNoReadingsLeft(true);
          return;
        }
      }

      setAiError(
        "We couldn't generate the interpretation of your cards right now. Please try again in a moment."
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-ink-200">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,92,255,0.10),transparent_60%)]" />
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-gold-300/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <div className="fixed left-6 top-6 z-50">
        <Link
          href="/"
          className="glass glass-gold flex items-center gap-2 rounded-full px-4 py-2 text-ink-200 transition-colors hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-gold-300" />
            <h1 className="font-display text-5xl font-semibold text-ink-50 md:text-6xl">
              Egyptian <span className="text-gold">Tarot</span>
            </h1>
            <Sparkles className="h-8 w-8 text-gold-300" />
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
            Major Arcana
          </p>
          <p className="mx-auto max-w-3xl text-sm italic text-ink-600">
            &ldquo;The Kabbalah is lost in the night of ages, where the Universe
            was conceived in the womb of Maha Kundalini, the Great Mother. The
            Angel Metatron left us the Tarot, in which all Divine Wisdom is
            contained.&rdquo;
          </p>
        </motion.div>

        {/* Card selection */}
        {!showCards && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass glass-gold mx-auto max-w-md rounded-3xl p-8 shadow-glass"
          >
            <h2 className="mb-6 text-center font-display text-2xl font-semibold text-ink-50">
              How many cards would you like to draw?
            </h2>

            <div className="mb-6 space-y-4">
              {[1, 3, 5, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumCards(num)}
                  className={`w-full rounded-2xl px-6 py-3 font-semibold transition-all ${
                    numCards === num
                      ? "scale-[1.02] bg-gradient-to-br from-gold-200 to-gold-600 text-night-900 shadow-gold"
                      : "border border-white/10 bg-white/5 text-ink-200 hover:border-gold-400/40 hover:text-gold-300"
                  }`}
                >
                  {num} {num === 1 ? "Card" : "Cards"} -{" "}
                  {spreadTypes[num]?.[0] || "Custom Spread"}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm text-ink-400">
                Or choose a number (1-22):
              </label>
              <input
                type="number"
                min="1"
                max="22"
                value={numCards}
                onChange={(e) =>
                  setNumCards(
                    Math.min(22, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-night-900/60 px-4 py-3 text-ink-100 focus:border-gold-400/40 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>

            <button
              onClick={drawCards}
              disabled={isDrawing}
              className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDrawing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Shuffle className="h-5 w-5" />
                  </motion.div>
                  Shuffling...
                </>
              ) : (
                <>
                  <Shuffle className="h-5 w-5" />
                  Draw Cards
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Drawn cards display */}
        <AnimatePresence>
          {showCards && drawnCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Cards grid */}
              <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {drawnCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 50, rotateY: 180 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                    className="group relative"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-gold-400/30 shadow-gold transition-all hover:scale-105 hover:border-gold-400/60">
                      <Image
                        src={card.image}
                        alt={card.name}
                        fill
                        className="object-cover grayscale-[35%] transition-all duration-500 group-hover:grayscale-0 group-hover:brightness-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="mb-1 text-xs font-semibold text-gold-300">
                          {card.position}
                        </p>
                        <h3 className="text-lg font-bold text-ink-50">
                          {card.name}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Interpretation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: drawnCards.length * 0.2 + 0.3 }}
                className="glass glass-gold mx-auto max-w-4xl rounded-3xl p-8 shadow-glass md:p-12"
              >
                <div className="mb-6 flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-gold-300" />
                  <h2 className="font-display text-3xl font-semibold text-gold">
                    Mystic Interpretation
                  </h2>
                </div>

                {isLoadingAI ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mb-4 h-16 w-16 rounded-full border-4 border-gold-400/40 border-t-gold-400"
                    />
                    <p className="text-ink-400">
                      Consulting the cosmic energies...
                    </p>
                  </div>
                ) : noReadingsLeft ? (
                  <div className="py-6 text-center">
                    <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10">
                      <Moon className="h-8 w-8 text-gold-300" />
                    </span>
                    <h3 className="mb-2 font-display text-2xl font-semibold text-ink-50">
                      You have no readings left
                    </h3>
                    <p className="mx-auto mb-8 max-w-md text-ink-400">
                      You&apos;ve used all of your available readings. Choose an
                      option to keep consulting the Egyptian Tarot:
                    </p>
                    <div className="mx-auto flex max-w-md flex-col gap-4">
                      <Link
                        href="/cart?plan=pack5"
                        className="btn-gold w-full rounded-full py-4 text-center font-semibold"
                      >
                        5-Reading Pack — $9.99
                      </Link>
                      <Link
                        href="/cart?plan=premium"
                        className="btn-ghost w-full rounded-full py-4 text-center font-semibold"
                      >
                        Unlimited Premium — $29.90/month
                      </Link>
                    </div>
                  </div>
                ) : aiError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-center text-red-200">
                    {aiError}
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-line text-lg leading-relaxed text-ink-200">
                      {aiInterpretation}
                    </p>
                    {readingsLeft !== null && (
                      <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-300">
                        <Sparkles className="h-4 w-4" />
                        {readingsLeft === "unlimited"
                          ? "Readings: unlimited"
                          : `Readings left: ${readingsLeft}`}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* New reading button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setShowCards(false);
                    setDrawnCards([]);
                    setAiInterpretation("");
                  }}
                  className="btn-ghost rounded-full px-8 py-3 font-semibold"
                >
                  New Reading
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
