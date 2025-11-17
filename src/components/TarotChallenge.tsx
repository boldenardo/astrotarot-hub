"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shuffle, Sparkles } from "lucide-react";

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
    name: "O Eremita",
    meaning: "Introspecção ✷ Sabedoria ✷ Solidão",
    description:
      "O Eremita representa a busca interior, o período de reflexão profunda e isolamento necessário para encontrar respostas. Carregando sua lanterna de sabedoria, ele nos lembra que às vezes precisamos nos afastar do mundo exterior para iluminar nosso mundo interior. Esta carta convida você a um momento de pausa, meditação e autoconhecimento.",
    keywords: [
      "introspecção",
      "sabedoria",
      "solidão",
      "reflexão",
      "guia interior",
    ],
    image:
      "https://cdn.pixabay.com/photo/2021/02/15/07/52/hermit-6016941_960_720.jpg",
    rotation: -3,
  },
  {
    id: 2,
    name: "A Temperança",
    meaning: "Equilíbrio ✷ Moderação ✷ Harmonia",
    description:
      "A Temperança simboliza o equilíbrio perfeito entre opostos. O anjo derrama água entre duas taças, misturando elementos com graça e paciência. Esta carta nos ensina sobre moderação, paciência e a arte de encontrar o meio-termo. Ela aparece quando você precisa integrar aspectos diferentes da sua vida ou encontrar harmonia em situações conflitantes.",
    keywords: [
      "equilíbrio",
      "moderação",
      "harmonia",
      "paciência",
      "integração",
    ],
    image:
      "https://cdn.pixabay.com/photo/2021/02/15/07/42/temperance-6016917_960_720.jpg",
    rotation: 4,
  },
  {
    id: 3,
    name: "O Enforcado",
    meaning: "Suspensão ✷ Perspectiva ✷ Sacrifício",
    description:
      "O Enforcado nos mostra que às vezes precisamos mudar completamente nossa perspectiva. Suspenso de cabeça para baixo, ele vê o mundo de forma diferente. Esta carta sugere um período de espera proposital, onde você libera o controle e permite que as coisas se desenrolem. É sobre sacrifício voluntário que leva a insights profundos e transformação espiritual.",
    keywords: ["perspectiva", "suspensão", "sacrifício", "rendição", "visão"],
    image:
      "https://cdn.pixabay.com/photo/2021/02/15/07/52/hanged-man-6016939_960_720.jpg",
    rotation: 10,
  },
  {
    id: 4,
    name: "O Hierofante",
    meaning: "Tradição ✷ Conhecimento ✷ Orientação",
    description:
      "O Hierofante representa a sabedoria das tradições, o conhecimento transmitido através de gerações e a orientação espiritual. Como guardião dos mistérios sagrados, ele nos conecta com estruturas maiores de significado. Esta carta aparece quando você busca educação formal, conselhos de mentores ou quando precisa seguir o caminho estabelecido antes de criar o seu próprio.",
    keywords: [
      "tradição",
      "conhecimento",
      "orientação",
      "espiritualidade",
      "mentor",
    ],
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

  // Randomiza a ordem das cartas quando o componente é montado
  useEffect(() => {
    const shuffled = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    setCardStack(shuffled);
  }, []);

  const handleCardClick = (index: number) => {
    // Pega a carta do topo
    const topCardIndex = cardStack[cardStack.length - 1];
    const clickedCardIndex = cardStack.indexOf(index);

    // Se não é a carta do topo, não faz nada
    if (clickedCardIndex !== cardStack.length - 1) return;

    // Embaralha a pilha: move a carta do topo para o fundo
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
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden py-16 px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-400/50 rounded-full"
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
        className="relative z-10 text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
          Desafio das Quatro Cartas
        </h2>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
          Clique nas cartas para embaralhar e depois revele seus significados
          profundos
        </p>
        {shuffleCount > 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-purple-400 mt-4 text-sm"
          >
            ✨ Embaralhadas: {shuffleCount} vezes
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
                className={`absolute left-0 right-0 top-0 bottom-0 m-auto ${
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
                        boxShadow: "0px 10px 60px rgba(168, 85, 247, 0.6)",
                      }
                    : {}
                }
                onClick={() => handleCardClick(cardIndex)}
              >
                {/* Card shuffle animation */}
                <motion.div
                  className="relative w-full h-full rounded-xl border-4 border-white shadow-2xl overflow-hidden bg-white"
                  style={{
                    boxShadow: isTopCard
                      ? "0px 5px 40px rgba(168, 85, 247, 0.5)"
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
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Overlay for reveal button */}
                  {isTopCard && (
                    <motion.div
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardReveal(card);
                      }}
                    >
                      <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg hover:scale-110 transition-transform">
                        🔮 Revelar Significado
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
        className="relative z-10 text-center mt-12 text-gray-400"
      >
        <p className="text-sm md:text-base">
          💡 Clique na carta do topo para embaralhar • Passe o mouse e clique em
          "Revelar" para ver o significado
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setSelectedCard(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 right-0 top-1/2 -translate-y-1/2 mx-auto max-w-2xl bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-xl rounded-3xl border border-purple-500/50 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
              style={{ width: "calc(100% - 2rem)" }}
            >
              <div className="relative p-8 md:p-12">
                {/* Close button */}
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Card icon */}
                <div className="text-center mb-6">
                  <div className="text-7xl mb-4">🎴</div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                    {selectedCard.name}
                  </h3>
                  <p className="text-xl text-purple-300 mb-6">
                    {selectedCard.meaning}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-6">
                  <p className="text-lg text-gray-200 leading-relaxed">
                    {selectedCard.description}
                  </p>

                  {/* Keywords */}
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-purple-400 mb-3 font-semibold">
                      Palavras-chave
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.keywords.map((keyword, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="px-4 py-2 bg-purple-800/50 border border-purple-600/50 rounded-full text-sm"
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
                  className="mt-8 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:scale-105 transition-transform"
                >
                  Entendido ✨
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Made with love footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="relative z-10 text-center mt-16 text-gray-500 text-sm"
      >
        <p>
          Feito com <span className="text-pink-500">💖</span> e{" "}
          <span className="text-yellow-600">☕</span> por{" "}
          <span className="text-purple-400 font-semibold">AstroTarot Hub</span>
        </p>
      </motion.div>
    </div>
  );
}
