"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Users,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PersonData {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  city: string;
  nation: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface CompatibilityResult {
  overall: number;
  love: number;
  communication: number;
  values: number;
  longTerm: number;
  synastry_analysis: {
    strengths: string[];
    challenges: string[];
    emotional_connection: string;
    sexual_chemistry: string;
    communication_style: string;
  };
  final_verdict: string;
}

const zodiacSigns = [
  {
    name: "Áries",
    emoji: "♈",
    element: "Fogo",
    dates: "21/03 - 19/04",
    perfectMatches: ["Leão", "Sagitário", "Gêmeos"],
    traits: ["Corajoso", "Energético", "Líder"],
    color: "from-red-500 to-orange-500",
  },
  {
    name: "Touro",
    emoji: "♉",
    element: "Terra",
    dates: "20/04 - 20/05",
    perfectMatches: ["Virgem", "Capricórnio", "Câncer"],
    traits: ["Leal", "Sensual", "Estável"],
    color: "from-green-600 to-emerald-500",
  },
  {
    name: "Gêmeos",
    emoji: "♊",
    element: "Ar",
    dates: "21/05 - 20/06",
    perfectMatches: ["Libra", "Aquário", "Áries"],
    traits: ["Comunicativo", "Versátil", "Inteligente"],
    color: "from-yellow-500 to-amber-500",
  },
  {
    name: "Câncer",
    emoji: "♋",
    element: "Água",
    dates: "21/06 - 22/07",
    perfectMatches: ["Escorpião", "Peixes", "Touro"],
    traits: ["Emotivo", "Protetor", "Intuitivo"],
    color: "from-blue-400 to-cyan-400",
  },
  {
    name: "Leão",
    emoji: "♌",
    element: "Fogo",
    dates: "23/07 - 22/08",
    perfectMatches: ["Áries", "Sagitário", "Libra"],
    traits: ["Generoso", "Criativo", "Confiante"],
    color: "from-orange-500 to-yellow-500",
  },
  {
    name: "Virgem",
    emoji: "♍",
    element: "Terra",
    dates: "23/08 - 22/09",
    perfectMatches: ["Touro", "Capricórnio", "Escorpião"],
    traits: ["Analítico", "Dedicado", "Perfeccionista"],
    color: "from-green-500 to-teal-500",
  },
  {
    name: "Libra",
    emoji: "♎",
    element: "Ar",
    dates: "23/09 - 22/10",
    perfectMatches: ["Gêmeos", "Aquário", "Leão"],
    traits: ["Diplomático", "Harmonioso", "Charmoso"],
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "Escorpião",
    emoji: "♏",
    element: "Água",
    dates: "23/10 - 21/11",
    perfectMatches: ["Câncer", "Peixes", "Virgem"],
    traits: ["Intenso", "Apaixonado", "Magnético"],
    color: "from-red-700 to-rose-700",
  },
  {
    name: "Sagitário",
    emoji: "♐",
    element: "Fogo",
    dates: "22/11 - 21/12",
    perfectMatches: ["Áries", "Leão", "Aquário"],
    traits: ["Aventureiro", "Otimista", "Filosófico"],
    color: "from-purple-500 to-indigo-500",
  },
  {
    name: "Capricórnio",
    emoji: "♑",
    element: "Terra",
    dates: "22/12 - 19/01",
    perfectMatches: ["Touro", "Virgem", "Peixes"],
    traits: ["Ambicioso", "Responsável", "Disciplinado"],
    color: "from-gray-600 to-slate-600",
  },
  {
    name: "Aquário",
    emoji: "♒",
    element: "Ar",
    dates: "20/01 - 18/02",
    perfectMatches: ["Gêmeos", "Libra", "Sagitário"],
    traits: ["Inovador", "Independente", "Humanitário"],
    color: "from-cyan-500 to-blue-500",
  },
  {
    name: "Peixes",
    emoji: "♓",
    element: "Água",
    dates: "19/02 - 20/03",
    perfectMatches: ["Câncer", "Escorpião", "Capricórnio"],
    traits: ["Empático", "Artístico", "Sonhador"],
    color: "from-indigo-500 to-purple-500",
  },
];

export default function CompatibilityPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [person1, setPerson1] = useState<Partial<PersonData>>({
    name: "",
    nation: "BR",
    timezone: "America/Sao_Paulo",
  });
  const [person2, setPerson2] = useState<Partial<PersonData>>({
    name: "",
    nation: "BR",
    timezone: "America/Sao_Paulo",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Adiciona coordenadas padrão de São Paulo se não fornecidas
      const data1 = {
        ...person1,
        latitude: person1.latitude || -23.5505,
        longitude: person1.longitude || -46.6333,
      };
      const data2 = {
        ...person2,
        latitude: person2.latitude || -23.5505,
        longitude: person2.longitude || -46.6333,
      };

      const { data, error } = await supabase.functions.invoke(
        "generate-compatibility",
        {
          body: { personA: data1, personB: data2 },
        }
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data.analysis);
      setStep(3);
    } catch (error: any) {
      console.error("Erro ao calcular:", error);
      alert(
        error.message || "Erro ao calcular compatibilidade. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-900/20 via-black to-purple-900/20" />
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-pink-400/30 rounded-full"
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
          ← Voltar
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Heart
              className="w-20 h-20 text-pink-400 mx-auto"
              fill="currentColor"
            />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Compatibilidade Amorosa
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Descubra o nível de conexão entre vocês através da astrologia
            ancestral
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? "bg-gradient-to-r from-pink-600 to-purple-600"
                      : "bg-gray-800 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s
                        ? "bg-gradient-to-r from-pink-600 to-purple-600"
                        : "bg-gray-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Pessoa 1</span>
            <span>Pessoa 2</span>
            <span>Resultado</span>
          </div>
        </div>

        {/* Zodiac Signs Section - IMPROVED */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto mb-20"
        >
          {/* Decorative Zodiac Wheel Background */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                className="w-[600px] h-[600px] opacity-5"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    fill="none"
                    className="text-purple-400"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    fill="none"
                    className="text-pink-400"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    fill="none"
                    className="text-purple-400"
                  />
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180;
                    const x1 = 100 + 50 * Math.cos(angle);
                    const y1 = 100 + 50 * Math.sin(angle);
                    const x2 = 100 + 90 * Math.cos(angle);
                    const y2 = 100 + 90 * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-purple-400"
                      />
                    );
                  })}
                </svg>
              </motion.div>
            </div>

            <div className="text-center mb-12 relative z-10">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <Star
                  className="w-16 h-16 text-pink-400 mx-auto"
                  fill="currentColor"
                />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
                Os 12 Signos do Zodíaco
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Descubra as características únicas de cada signo e seus pares
                perfeitos para relacionamentos harmoniosos
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
              {zodiacSigns.map((sign, index) => (
                <motion.div
                  key={sign.name}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                  className="group relative"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${sign.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl`}
                  />

                  <div className="relative bg-gradient-to-br from-gray-900/80 via-purple-950/50 to-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:border-pink-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 cursor-pointer h-full flex flex-col">
                    {/* Sign Emoji */}
                    <div className="text-center mb-4">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`text-6xl mb-2 inline-block bg-gradient-to-br ${sign.color} bg-clip-text`}
                      >
                        {sign.emoji}
                      </motion.div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {sign.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{sign.dates}</p>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 bg-gradient-to-r ${sign.color} text-white`}
                      >
                        {sign.element}
                      </div>
                    </div>

                    {/* Traits */}
                    <div className="mb-4 flex-grow">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                        Características
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sign.traits.map((trait, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Perfect Matches - Revealed on Hover */}
                    <div className="mt-auto">
                      <div className="border-t border-purple-500/20 pt-3">
                        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                          💕 Pares Perfeitos
                        </p>
                        <div className="space-y-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {sign.perfectMatches.map((match, i) => (
                            <div
                              key={i}
                              className="text-sm text-pink-300 flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                              {match}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <PersonForm
              key="person1"
              person={person1}
              setPerson={setPerson1}
              title="Primeira Pessoa"
              subtitle="Seus dados de nascimento"
              onNext={() => setStep(2)}
              icon="💕"
            />
          )}

          {step === 2 && (
            <PersonForm
              key="person2"
              person={person2}
              setPerson={setPerson2}
              title="Segunda Pessoa"
              subtitle="Dados de nascimento do seu amor"
              onNext={handleCalculate}
              onBack={() => setStep(1)}
              loading={loading}
              icon="💖"
            />
          )}

          {step === 3 && result && (
            <ResultScreen
              key="result"
              result={result}
              person1Name={person1.name || "Pessoa 1"}
              person2Name={person2.name || "Pessoa 2"}
              onReset={() => {
                setStep(1);
                setPerson1({
                  name: "",
                  nation: "BR",
                  timezone: "America/Sao_Paulo",
                });
                setPerson2({
                  name: "",
                  nation: "BR",
                  timezone: "America/Sao_Paulo",
                });
                setResult(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PersonForm({
  person,
  setPerson,
  title,
  subtitle,
  onNext,
  onBack,
  loading,
  icon,
}: {
  person: Partial<PersonData>;
  setPerson: (p: Partial<PersonData>) => void;
  title: string;
  subtitle: string;
  onNext: () => void;
  onBack?: () => void;
  loading?: boolean;
  icon: string;
}) {
  const isValid =
    person.name &&
    person.year &&
    person.month &&
    person.day &&
    person.hour !== undefined &&
    person.minute !== undefined &&
    person.city;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-purple-950/50 via-purple-900/30 to-pink-950/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{icon}</div>
          <h2 className="text-3xl font-bold mb-2">{title}</h2>
          <p className="text-gray-400">{subtitle}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Nome
            </label>
            <input
              type="text"
              value={person.name}
              onChange={(e) => setPerson({ ...person, name: e.target.value })}
              className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              placeholder="Digite o nome"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Dia
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={person.day || ""}
                onChange={(e) =>
                  setPerson({ ...person, day: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Mês
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={person.month || ""}
                onChange={(e) =>
                  setPerson({ ...person, month: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="05"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Ano
              </label>
              <input
                type="number"
                min="1900"
                max="2025"
                value={person.year || ""}
                onChange={(e) =>
                  setPerson({ ...person, year: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="1990"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Hora
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={person.hour !== undefined ? person.hour : ""}
                onChange={(e) =>
                  setPerson({ ...person, hour: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="14"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Minuto
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={person.minute !== undefined ? person.minute : ""}
                onChange={(e) =>
                  setPerson({ ...person, minute: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Cidade de Nascimento
            </label>
            <input
              type="text"
              value={person.city}
              onChange={(e) => setPerson({ ...person, city: e.target.value })}
              className="w-full px-4 py-3 bg-black/50 border border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="São Paulo"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-full font-semibold transition-all"
            >
              Voltar
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!isValid || loading}
            className="flex-1 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                {onBack ? "Calcular Compatibilidade" : "Próximo"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ResultScreen({
  result,
  person1Name,
  person2Name,
  onReset,
}: {
  result: CompatibilityResult;
  person1Name: string;
  person2Name: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Score Card */}
      <div className="bg-gradient-to-br from-pink-950/50 via-purple-900/40 to-pink-950/50 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-8 md:p-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-8"
        >
          <div className="text-8xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-pink-400 bg-clip-text text-transparent mb-4">
            {result.overall}%
          </div>
          <div className="flex items-center justify-center gap-3 text-2xl">
            <span>{person1Name}</span>
            <Heart className="w-8 h-8 text-pink-400" fill="currentColor" />
            <span>{person2Name}</span>
          </div>
        </motion.div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Amor", value: result.love, icon: "💕" },
            {
              label: "Comunicação",
              value: result.communication,
              icon: "💬",
            },
            { label: "Valores", value: result.values, icon: "💎" },
            { label: "Longo Prazo", value: result.longTerm, icon: "♾️" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-black/30 rounded-2xl p-4"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-2xl font-bold text-pink-300">
                {item.value}%
              </div>
              <div className="text-sm text-gray-400">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-purple-950/50 via-purple-900/30 to-pink-950/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-12 space-y-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold">Análise Completa</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-pink-300 mb-3">
              Pontos Fortes
            </h3>
            <ul className="space-y-2">
              {result.synastry_analysis.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-3">
              Desafios
            </h3>
            <ul className="space-y-2">
              {result.synastry_analysis.challenges.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300">
                  <span className="text-red-400">!</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Conexão Emocional
            </h3>
            <p className="text-gray-300">
              {result.synastry_analysis.emotional_connection}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Química</h3>
            <p className="text-gray-300">
              {result.synastry_analysis.sexual_chemistry}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Comunicação
            </h3>
            <p className="text-gray-300">
              {result.synastry_analysis.communication_style}
            </p>
          </div>
        </div>

        <div className="bg-black/30 p-6 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-bold text-white mb-3">Veredito Final</h3>
          <p className="text-gray-300 italic">{result.final_verdict}</p>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onReset}
          className="flex-1 py-4 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-600/50 rounded-full font-semibold transition-all hover:scale-105"
        >
          Nova Análise
        </button>
        <Link
          href="/auth/register"
          className="flex-1 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-full font-semibold text-center transition-all hover:scale-105 shadow-xl"
        >
          Salvar Resultado (Criar Conta)
        </Link>
      </div>
    </motion.div>
  );
}
