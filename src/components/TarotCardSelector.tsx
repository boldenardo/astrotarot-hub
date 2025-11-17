"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    name: "Os Amantes",
    meaning: "Love ✷ Connection ✷ Choice",
    keywords: ["amor", "conexão", "escolha"],
    description:
      "O Sol e a Lua se perseguem pelo céu em devoção e adoração infinitas. Esses Amantes finalmente encontraram um abraço cósmico, incorporando o amor disponível para todos que vivem sob sua luz. Apaixonar-se pode parecer destino—como se você tivesse encontrado sua outra metade. Esta carta fala mais sobre o ato de amar: de cuidar e escolher continuamente o compromisso com o outro.",
    frontImage: "/cards/lovers.jpg",
  },
  {
    id: 2,
    name: "Oito de Espadas",
    meaning: "Paralyzed ✷ Fixation ✷ Liberation",
    keywords: ["paralisado", "fixação", "libertação"],
    description:
      "Solte as amarras da sua mente: há mais espaço para se mover do que você pensava. Vendada e aprisionada por espadas perigosas, uma mulher está presa em um loop de pensamentos que parece sufocante e confinador. Mas suas mãos estão realmente amarradas, ou ela apenas perdeu a crença em suas habilidades? Esta carta convida você a olhar além de uma fixação mental.",
    frontImage: "/cards/swords.jpg",
  },
  {
    id: 3,
    name: "A Morte",
    meaning: "Release ✷ Endings ✷ Rebirth",
    keywords: ["liberação", "finais", "renascimento"],
    description:
      "Todas as coisas devem morrer para renascer. Adornada com flores e foices, a Morte nos lembra da decadência inerente à vida. Embora a Morte seja um fim, também é um começo: uma transformação de algo que estava pronto para evoluir. Se você receber esta carta, é hora de deixar ir aquilo que você não está mais destinado a carregar.",
    frontImage: "/cards/death.jpg",
  },
  {
    id: 4,
    name: "O Louco",
    meaning: "Potential ✷ Innocence ✷ A New Journey",
    keywords: ["potencial", "inocência", "nova jornada"],
    description:
      "O Louco se equilibra na borda das nuvens, preparando-se para saltar no desconhecido. Ele carrega seu potencial em sua mochila e sua inocência na rosa que segura. Ele não sabe o que vem a seguir, mas está pronto para começar uma nova jornada. Esta carta é um convite para caminhar com ousadia e entusiasmo em direção a algo novo.",
    frontImage: "/cards/fool.jpg",
  },
];

export default function TarotCardSelector() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  const handleCardClick = (cardId: number) => {
    if (flippedCard === cardId) {
      // Se clicar na mesma carta, desvira
      setFlippedCard(null);
      setSelectedCard(null);
    } else {
      // Vira a nova carta
      setFlippedCard(cardId);
      setSelectedCard(cardId);
    }
  };

  const selectedCardData = cards.find((c) => c.id === selectedCard);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-[#f6eab0]">
      {/* Background Stars */}
      <div className="stars-container fixed inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="star absolute text-2xl"
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
          >
            ✷
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-16 pb-8"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 font-['Prompt']">
          AstroTarot Místico
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-3xl md:text-4xl text-center mb-12 font-light font-['Prompt']"
        >
          - Selecione sua carta -
        </motion.p>
      </motion.div>

      {/* Cards Container */}
      <div className="flex items-center justify-center gap-4 md:gap-8 px-4 mb-8">
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
            className="relative cursor-pointer group"
            onClick={() => handleCardClick(card.id)}
            style={{
              perspective: "1000px",
            }}
          >
            {/* Glow Effect on Hover */}
            <motion.div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 -z-10"
              style={{
                background: `linear-gradient(to bottom right, hsl(${
                  index * 100
                }, 100%, 50%), hsl(${index * 100 - 55}, 100%, 50%))`,
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
              className="relative w-32 h-52 md:w-64 md:h-[420px]"
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
                  boxShadow: "0px 5px 25px 0px #f6eab0",
                }}
              />

              {/* Card Front */}
              <div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center p-4"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  boxShadow: "0px 5px 25px 0px #f6eab0",
                }}
              >
                <div className="text-center">
                  <div className="text-6xl md:text-8xl mb-4">🔮</div>
                  <h3 className="text-lg md:text-2xl font-bold mb-2">
                    {card.name}
                  </h3>
                  <p className="text-xs md:text-sm opacity-80">
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
            className="max-w-4xl mx-auto px-8 pb-16 text-center"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              {selectedCardData.meaning}
            </h3>
            <p className="text-base md:text-lg leading-relaxed opacity-90">
              {selectedCardData.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {selectedCardData.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full bg-purple-900/50 border border-[#f6eab0]/30 text-sm"
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
            className="text-center text-lg md:text-xl opacity-70 pb-16"
          >
            ( Que a sorte esteja a seu favor! )
          </motion.p>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Prompt:wght@100;300;400;600;700&display=swap");

        .star {
          color: #f6eab0;
          text-shadow: 0 0 10px #f6eab0, 0 0 20px #f6eab0;
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
