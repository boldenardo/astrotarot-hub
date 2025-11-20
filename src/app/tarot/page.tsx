"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shuffle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EGYPTIAN_DECK } from "@/lib/tarot-data";

interface DrawnCard {
  id: number;
  name: string;
  image: string;
  position: string;
  interpretation?: string;
}

export default function EgyptianTarotPage() {
  const [numCards, setNumCards] = useState<number>(3);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showCards, setShowCards] = useState(false);

  const spreadTypes: { [key: number]: string[] } = {
    1: ["Presente"],
    3: ["Passado", "Presente", "Futuro"],
    5: [
      "Situação",
      "Obstáculo",
      "Conselho",
      "Resultado Próximo",
      "Resultado Final",
    ],
    7: [
      "Passado",
      "Presente",
      "Futuro",
      "Você",
      "Ambiente",
      "Esperanças",
      "Resultado",
    ],
  };

  const drawCards = async () => {
    if (numCards > 22 || numCards < 1) {
      alert("Escolha entre 1 e 22 cartas!");
      return;
    }

    setIsDrawing(true);
    setShowCards(false);
    setAiInterpretation("");

    // Simula embaralhamento
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Sorteia cartas únicas
    const shuffled = [...EGYPTIAN_DECK].sort(() => Math.random() - 0.5);
    const positions =
      spreadTypes[numCards] ||
      Array.from({ length: numCards }, (_, i) => `Posição ${i + 1}`);

    const selected: DrawnCard[] = shuffled
      .slice(0, numCards)
      .map((card, index) => ({
        id: card.id,
        name: card.name,
        image: card.imageUrl,
        position: positions[index] || `Posição ${index + 1}`,
      }));

    setDrawnCards(selected);
    setIsDrawing(false);
    setShowCards(true);

    // Gera interpretação com IA
    await generateAIInterpretation(selected);
  };

  const generateAIInterpretation = async (cards: DrawnCard[]) => {
    setIsLoadingAI(true);

    try {
      // Usar Edge Function do Supabase
      const { createTarotReading } = await import("@/lib/tarot-client");

      const result = await createTarotReading(
        cards.map((c) => c.name),
        "Interpretação geral da tiragem"
      );

      setAiInterpretation(
        result.interpretation || "Interpretação indisponível no momento."
      );
    } catch (error) {
      console.error("Erro ao gerar interpretação:", error);
      setAiInterpretation(
        "✨ Suas cartas revelam uma jornada de transformação. Cada carta carrega uma mensagem profunda do Tarot Egípcio, guiando você através dos mistérios ancestrais."
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background mystical effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
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
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-600/50 rounded-full transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
              Tarot Egípcio
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-xl text-gray-300 mb-2">Arcanos Maiores</p>
          <p className="text-sm text-gray-500 max-w-3xl mx-auto italic">
            &ldquo;A Kábala se perde na noite dos séculos, onde o Universo se
            gestou no ventre de Maha Kundalini, a Grande Mãe. O Anjo METATRON
            nos deixou o Tarot, no qual se encerra toda a Sabedoria
            Divina.&rdquo;
          </p>
        </motion.div>

        {/* Card selection */}
        {!showCards && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-center mb-6">
              Quantas cartas deseja tirar?
            </h2>

            <div className="space-y-4 mb-6">
              {[1, 3, 5, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumCards(num)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    numCards === num
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-lg scale-105"
                      : "bg-purple-800/50 hover:bg-purple-700/50 border border-purple-600/50"
                  }`}
                >
                  {num} {num === 1 ? "Carta" : "Cartas"} -{" "}
                  {spreadTypes[num]?.[0] || "Tiragem Personalizada"}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-2 text-gray-400">
                Ou escolha um número (1-22):
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
                className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={drawCards}
              disabled={isDrawing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
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
                    <Shuffle className="w-5 h-5" />
                  </motion.div>
                  Embaralhando...
                </>
              ) : (
                <>
                  <Shuffle className="w-5 h-5" />
                  Tirar Cartas
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                {drawnCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 50, rotateY: 180 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                    className="group relative"
                  >
                    <div className="relative rounded-2xl overflow-hidden border-4 border-yellow-600/50 shadow-2xl hover:shadow-yellow-500/50 transition-all hover:scale-105">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-auto object-cover filter grayscale-0 group-hover:brightness-110 transition-all"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-xs text-yellow-400 font-semibold mb-1">
                          {card.position}
                        </p>
                        <h3 className="text-lg font-bold">{card.name}</h3>
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
                className="max-w-4xl mx-auto bg-gradient-to-br from-purple-900/60 via-indigo-900/60 to-purple-900/60 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-purple-500/30 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    Interpretação Mística
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
                      className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
                    />
                    <p className="text-gray-400">
                      Consultando as energias cósmicas...
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-line">
                      {aiInterpretation}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* New reading button */}
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setShowCards(false);
                    setDrawnCards([]);
                    setAiInterpretation("");
                  }}
                  className="px-8 py-3 bg-purple-800/50 hover:bg-purple-700/50 border border-purple-600/50 rounded-full font-semibold transition-all hover:scale-105"
                >
                  Nova Tiragem
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
