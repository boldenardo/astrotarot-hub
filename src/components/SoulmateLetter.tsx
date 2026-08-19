"use client";

// A carta sendo preenchida com os dados DELA.
//
// Substitui o vídeo do casal no parque, que dizia uma coisa ("estou
// preparando o retrato") e mostrava outra — a incoerência aparecia no
// momento mais caro do funil.
//
// Nada aqui é imagem gerada: são duas folhas de papel em CSS e o nome, a
// data e o signo que a própria pessoa acabou de digitar. Personalizado de
// verdade, zero bytes de download, e impossível de ficar desatualizado.
//
// Os campos do lado direito preenchem um a um, com pausa. A espera vira o
// espetáculo em vez de uma barra de progresso.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  name?: string;
  birthDate?: string;
  sign?: string;
  /** Rótulos no idioma do funil. */
  labels: {
    name: string;
    birthDate: string;
    zodiac: string;
    title: string;
    fields: string[];
  };
}

/** "1990-10-05" → "10/05" (dia e mês bastam; o ano não decora a carta). */
function shortDate(iso?: string): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return m ? `${m[3]}/${m[2]}` : iso;
}

export default function SoulmateLetter({
  name,
  birthDate,
  sign,
  labels,
}: Props) {
  // Quantos campos do lado direito já foram "escritos".
  const [written, setWritten] = useState(0);

  useEffect(() => {
    if (written >= labels.fields.length) return;
    const id = window.setTimeout(() => setWritten((n) => n + 1), 900);
    return () => window.clearTimeout(id);
  }, [written, labels.fields.length]);

  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6b4a2f] via-[#5a3d26] to-[#3f2a1a] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      {/* veios da madeira */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(96deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 14px)",
        }}
      />

      <div className="relative flex gap-3">
        {/* Folha da esquerda: os dados que ela deu. */}
        <motion.div
          initial={{ opacity: 0, y: 12, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-[46%] shrink-0 rounded-sm bg-[linear-gradient(160deg,#fdfaf1,#efe7d4)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        >
          <ul className="space-y-2.5 font-[family-name:var(--font-hand)] text-[13px] leading-tight text-[#2f3350]">
            <li>
              {labels.name}:{" "}
              <span className="font-semibold">{firstName ?? "—"}</span>
            </li>
            <li>
              {labels.birthDate}:{" "}
              <span className="font-semibold">{shortDate(birthDate)}</span>
            </li>
            <li>
              {labels.zodiac}:{" "}
              <span className="font-semibold">{sign ?? "—"}</span>
            </li>
          </ul>
        </motion.div>

        {/* Folha da direita: o que Master Aura está escrevendo agora. */}
        <motion.div
          initial={{ opacity: 0, y: 16, rotate: 5 }}
          animate={{ opacity: 1, y: 0, rotate: 3 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="relative flex-1 rounded-sm bg-[linear-gradient(200deg,#fdfaf1,#ece3cd)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        >
          <p className="font-[family-name:var(--font-hand)] text-[17px] text-[#2f3350]">
            {labels.title}
          </p>
          <ul className="mt-3 space-y-2 font-[family-name:var(--font-hand)] text-[12px] leading-tight text-[#4a4f6b]">
            {labels.fields.map((f, i) => (
              <li
                key={f}
                className={`transition-opacity duration-500 ${
                  i < written ? "opacity-100" : "opacity-30"
                }`}
              >
                {f}:{" "}
                {i < written && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="tracking-[0.3em] text-[#2f3350]"
                  >
                    ···
                  </motion.span>
                )}
              </li>
            ))}
          </ul>

          {/* lápis: só enquanto ainda há campo por escrever */}
          {written < labels.fields.length && (
            <motion.div
              aria-hidden
              className="absolute -bottom-1 right-2 h-16 w-2 origin-top rounded-full bg-gradient-to-b from-[#2b2b2b] via-[#1a1a1a] to-[#d9a441]"
              animate={{ rotate: [10, 16, 10], y: [0, 3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
