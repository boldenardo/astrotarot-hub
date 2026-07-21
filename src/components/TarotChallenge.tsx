"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shuffle, Sparkles } from "lucide-react";
import Image from "next/image";

interface TarotCard {
  id: number;
  name: string;
  meaning: string;
  description: string;
  keywords: string[];
  image: string;
  rotation?: number;
}

const cards: TarotCard[] = [
  {
    id: 1,
    name: "The Hermit",
    meaning: "Introspection • Wisdom • Solitude",
    description:
      "The Hermit represents the inner quest, a period of deep reflection and solitude needed to find answers. Carrying his lantern of wisdom, he reminds us that sometimes we must step away from the outer world to illuminate our inner one. This card invites you into a moment of pause, meditation, and self-knowledge.",
    keywords: ["introspection", "wisdom", "solitude", "reflection", "inner guide"],
    image:
      "https://cdn.pixabay.com/photo/2021/02/15/07/52/hermit-6016941_960_720.jpg",
    rotation: -3,
  },
  {
    id: 2,
    name: "Temperance",
    meaning: "Balance • Moderation • Harmony",
    description:
      "Temperance symbolizes the perfect balance between opposites. The angel pours water between two cups, blending elements with grace and patience. This card teaches us about moderation, patience, and the art of finding the middle ground. It appears when you need to integrate different aspects of your life or find harmony amid conflicting situations.",
    keywords: ["balance", "moderation", "harmony", "patience", "integration"],
    image:
      "https://cdn.pixabay.com/photo/2021/02/15/07/42/temperance-6016917_960_720.jpg",
    rotation: 4,
  },
  {
    id: 3,
    name: "The Hanged Man",
    meaning: "Suspension • Perspective • Sacrifice",
    description:
      "The Hanged Man shows us that sometimes we must completely shift our perspective. Suspended upside down, he sees the world differently. This card suggests a period of purposeful waiting, where you release control and allow things to unfold. It is about voluntary sacrifice that leads to profound insight and spiritual transformation.",
    keywords: ["perspective", "suspension", "sacrifice", "surrender", "vision"],
    image:
      "https://cdn.pixabay.com/photo/2021/02/15/07/52/hanged-man-6016939_960_720.jpg",
    rotation: 10,
  },
  {
    id: 4,
    name: "The Hierophant",
    meaning: "Tradition • Knowledge • Guidance",
    description:
      "The Hierophant represents the wisdom of traditions, knowledge passed down through generations, and spiritual guidance. As guardian of the sacred mysteries, he connects us with larger structures of meaning. This card appears when you seek formal education, counsel from mentors, or when you need to follow the established path before forging your own.",
    keywords: ["tradition", "knowledge", "guidance", "spirituality", "mentor"],
    image:
      "https://cdn.pixabay.com/photo/2021/02/15/07/53/hierophant-6016942_960_720.jpg",
    rotation: 4,
  },
];

const CARD_BACK_IMAGE =
  "https://i.pinimg.com/originals/8c/de/fb/8cdefb154d4d30cf5e5ef00d1b998b6c.jpg";

export default function TarotChallenge() {
  const [cardStack, setCardStack] = useState<number[]>([0, 1, 2, 3]);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);

  // Randomize the card order when the component mounts
  useEffect(() => {
    const shuffled = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    setCardStack(shuffled);
  }, []);

  const handleCardClick = (index: number) => {
    // Grab the card on top
    const topCardIndex = cardStack[cardStack.length - 1];
    const clickedCardIndex = cardStack.indexOf(index);

    // If it is not the top card, do nothing
    if (clickedCardIndex !== cardStack.length - 1) return;

    // Shuffle the stack: move the top card to the bottom
    const newStack = [...cardStack];
    const movedCard = newStack.pop();
    if (movedCard !== undefined) {
      newStack.unshift(movedCard);
      setCardStack(newStack);
      setShuffleCount(shuffleCount + 1);
    }
  };

  const handleCardReveal = (card: TarotCard) => {
    setSelectedCard(card);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden px-4 py-16 text-ink-200">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06),transparent_60%)]" />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-gold-300/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear",
          }}
        />
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 mb-12 text-center"
      >
        <h2 className="mb-4 font-display text-4xl font-semibold text-ink-50 md:text-5xl">
          The Four-Card <span className="text-gold">Challenge</span>
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-ink-400 md:text-xl">
          Click the cards to shuffle, then reveal their profound meanings.
        </p>
        {shuffleCount > 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold-300"
          >
            <Shuffle className="h-4 w-4" />
            Shuffled {shuffleCount} times
          </motion.p>
        )}
      </motion.div>

      {/* Cards Container */}
      <div
        className="relative z-10 flex items-center justify-center"
        style={{ minHeight: "600px" }}
      >
        <div className="relative" style={{ width: "340px", height: "550px" }}>
          {cardStack.map((cardIndex, stackPosition) => {
            const card = cards[cardIndex];
            const zIndex = stackPosition * 10;
            const isTopCard = stackPosition === cardStack.length - 1;

            return (
              <motion.div
                key={`${card.id}-${stackPosition}`}
                className={`absolute bottom-0 left-0 right-0 top-0 m-auto ${
                  isTopCard ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{
                  width: "300px",
                  height: "500px",
                  zIndex: zIndex,
                }}
                initial={false}
                animate={{
                  rotate: card.rotation,
                  scale: isTopCard ? 1 : 0.98 - stackPosition * 0.02,
                  opacity: 1 - stackPosition * 0.15,
                }}
                whileHover={
                  isTopCard
                    ? {
                        scale: 1.05,
                        boxShadow: "0px 10px 60px rgba(212, 175, 55, 0.45)",
                      }
                    : {}
                }
                onClick={() => handleCardClick(cardIndex)}
              >
                {/* Card shuffle animation */}
                <motion.div
                  className="relative h-full w-full overflow-hidden rounded-2xl border border-gold-400/30 bg-night-900 shadow-2xl"
                  style={{
                    boxShadow: isTopCard
                      ? "0px 5px 40px rgba(212, 175, 55, 0.35)"
                      : "0px 2px 30px #000",
                  }}
                  animate={
                    stackPosition === 3 && shuffleCount > 0
                      ? {
                          x: [0, 410, 0],
                          y: [0, -15, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.6,
                    ease: [0.6, 0.05, 0.01, 0.9],
                  }}
                >
                  {/* Card Image */}
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover"
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Overlay for reveal button */}
                  {isTopCard && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-night-950/70 opacity-0 transition-opacity hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardReveal(card);
                      }}
                    >
                      <button className="btn-gold flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold">
                        <Sparkles className="h-5 w-5" />
                        Reveal Meaning
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 mt-12 text-center text-ink-400"
      >
        <p className="text-sm md:text-base">
          Click the top card to shuffle &bull; Hover and click Reveal to see its
          meaning
        </p>
      </motion.div>

      {/* Modal with card meaning */}
      <AnimatePresence>
        {selectedCard && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-night-950/80 backdrop-blur-sm"
              onClick={() => setSelectedCard(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              className="glass glass-gold fixed left-0 right-0 top-1/2 z-50 mx-auto max-h-[90vh] max-w-2xl -translate-y-1/2 overflow-y-auto rounded-3xl shadow-glass"
              style={{ width: "calc(100% - 2rem)" }}
            >
              <div className="relative p-8 md:p-12">
                {/* Close button */}
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute right-4 top-4 rounded-full p-2 text-ink-200 transition-colors hover:bg-white/10 hover:text-gold-300"
                >
                  <X className="h-6 w-6" />
                </button>

                {/* Card icon */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10">
                    <Sparkles className="h-8 w-8 text-gold-300" />
                  </div>
                  <h3 className="mb-2 font-display text-3xl font-semibold text-gold md:text-4xl">
                    {selectedCard.name}
                  </h3>
                  <p className="mb-6 text-xl text-gold-300">
                    {selectedCard.meaning}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-ink-200">
                    {selectedCard.description}
                  </p>

                  {/* Keywords */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-300">
                      Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.keywords.map((keyword, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-2 text-sm text-gold-300"
                        >
                          {keyword}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setSelectedCard(null)}
                  className="btn-gold mt-8 w-full rounded-full py-3 font-semibold"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="relative z-10 mt-16 text-center text-sm text-ink-600"
      >
        <p>
          Crafted with care by{" "}
          <span className="font-semibold text-gold-300">AstroTarot Hub</span>
        </p>
      </motion.div>
    </div>
  );
}
