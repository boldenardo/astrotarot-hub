"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface TarotCard {
  id: number;
  name: string;
  meaning: string;
  keywords: string[];
  description: string;
  frontImage: string;
}

const cards: TarotCard[] = [
  {
    id: 1,
    name: "The Lovers",
    meaning: "Love • Connection • Choice",
    keywords: ["love", "connection", "choice"],
    description:
      "The Sun and the Moon chase each other across the sky in endless devotion and adoration. These Lovers have finally found a cosmic embrace, embodying the love available to all who live beneath their light. Falling in love can feel like destiny—as if you have found your other half. This card speaks more to the act of loving: of caring for and continually choosing commitment to another.",
    frontImage: "/cards/lovers.jpg",
  },
  {
    id: 2,
    name: "Eight of Swords",
    meaning: "Paralyzed • Fixation • Liberation",
    keywords: ["paralyzed", "fixation", "liberation"],
    description:
      "Loosen the bindings of your mind: there is more room to move than you thought. Blindfolded and hemmed in by perilous swords, a woman is caught in a loop of thoughts that feels suffocating and confining. But are her hands truly bound, or has she simply lost belief in her own abilities? This card invites you to look beyond a mental fixation.",
    frontImage: "/cards/swords.jpg",
  },
  {
    id: 3,
    name: "Death",
    meaning: "Release • Endings • Rebirth",
    keywords: ["release", "endings", "rebirth"],
    description:
      "All things must die to be reborn. Adorned with flowers and scythes, Death reminds us of the decay inherent in life. Though Death is an ending, it is also a beginning: a transformation of something that was ready to evolve. If you draw this card, it is time to let go of what you are no longer meant to carry.",
    frontImage: "/cards/death.jpg",
  },
  {
    id: 4,
    name: "The Fool",
    meaning: "Potential • Innocence • A New Journey",
    keywords: ["potential", "innocence", "new journey"],
    description:
      "The Fool balances on the edge of the clouds, preparing to leap into the unknown. He carries his potential in his knapsack and his innocence in the rose he holds. He does not know what comes next, but he is ready to begin a new journey. This card is an invitation to step boldly and eagerly toward something new.",
    frontImage: "/cards/fool.jpg",
  },
];

export default function TarotCardSelector() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  const handleCardClick = (cardId: number) => {
    if (flippedCard === cardId) {
      // Clicking the same card flips it back
      setFlippedCard(null);
      setSelectedCard(null);
    } else {
      // Flip the new card
      setFlippedCard(cardId);
      setSelectedCard(cardId);
    }
  };

  const selectedCardData = cards.find((c) => c.id === selectedCard);

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-ink-200">
      {/* Background Stars */}
      <div className="stars-container pointer-events-none fixed inset-0">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="star absolute h-1.5 w-1.5 rounded-full bg-gold-300/80"
            style={{
              left: `${i * 10 + 5}%`,
              bottom: "-10%",
            }}
            animate={{
              bottom: ["110%", "-10%"],
              x: [0, 80, 0],
            }}
            transition={{
              duration: 10,
              delay: i * 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pb-8 pt-16"
      >
        <h1 className="mb-4 text-center font-display text-5xl font-semibold text-ink-50 md:text-6xl">
          AstroTarot <span className="text-gold">Mystic</span>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mb-12 text-center font-display text-3xl font-light text-ink-400 md:text-4xl"
        >
          — Select your card —
        </motion.p>
      </motion.div>

      {/* Cards Container */}
      <div className="mb-8 flex items-center justify-center gap-4 px-4 md:gap-8">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1 + index * 0.3,
              duration: 0.6,
              type: "spring",
            }}
            className="group relative cursor-pointer"
            onClick={() => handleCardClick(card.id)}
            style={{
              perspective: "1000px",
            }}
          >
            {/* Glow Effect on Hover */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-3xl opacity-0 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(212,175,55,0.55), rgba(169,130,47,0.3))",
                filter: "blur(30px)",
                width: "calc(100% + 4px)",
                height: "calc(100% + 4px)",
                left: "-2px",
                top: "-2px",
              }}
              animate={{
                backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Card */}
            <motion.div
              className="relative h-52 w-32 md:h-[420px] md:w-64"
              animate={{
                rotateY: flippedCard === card.id ? 180 : 0,
              }}
              transition={{ duration: 0.8 }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Card Back */}
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  backfaceVisibility: "hidden",
                  background:
                    "url(https://i.pinimg.com/originals/8c/de/fb/8cdefb154d4d30cf5e5ef00d1b998b6c.jpg)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  boxShadow: "0px 5px 25px 0px rgba(212,175,55,0.35)",
                }}
              />

              {/* Card Front */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-3xl border border-gold-400/30 bg-night-900 p-4"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  boxShadow: "0px 5px 25px 0px rgba(212,175,55,0.35)",
                }}
              >
                <div className="text-center">
                  <Sparkles className="mx-auto mb-4 h-12 w-12 text-gold-300 md:h-16 md:w-16" />
                  <h3 className="mb-2 text-lg font-bold text-ink-50 md:text-2xl">
                    {card.name}
                  </h3>
                  <p className="text-xs text-gold-300 md:text-sm">
                    {card.meaning}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Description */}
      <AnimatePresence mode="wait">
        {selectedCardData ? (
          <motion.div
            key={selectedCardData.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl px-8 pb-16 text-center"
          >
            <h3 className="mb-4 font-display text-2xl font-semibold text-gold md:text-3xl">
              {selectedCardData.meaning}
            </h3>
            <p className="text-base leading-relaxed text-ink-200 md:text-lg">
              {selectedCardData.description}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {selectedCardData.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-2 text-sm text-gold-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="pb-16 text-center text-lg text-ink-400 md:text-xl"
          >
            ( May fortune favor you )
          </motion.p>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .star {
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8),
            0 0 20px rgba(212, 175, 55, 0.5);
        }

        .stars-container {
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
