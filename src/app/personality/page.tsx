"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Calendar, Clock, Sparkles, Star } from "lucide-react";

interface BirthData {
  name: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  city: string;
  nation: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface ElementDistribution {
  Fire: number;
  Earth: number;
  Air: number;
  Water: number;
}

interface PersonalityResult {
  bigThree: {
    sun: { sign: string; element: string; modality: string };
    moon: { sign: string; element: string; modality: string };
    ascendant: { sign: string; element: string; modality: string };
  };
  elements: ElementDistribution;
  modalities: {
    Cardinal: number;
    Fixed: number;
    Mutable: number;
  };
  dominantElement: string;
  dominantModality: string;
  strengths: string[];
  challenges: string[];
  lifePurpose: string;
}

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const ELEMENT_COLORS: { [key: string]: string } = {
  Fire: "#FF4500",
  Earth: "#8B4513",
  Air: "#87CEEB",
  Water: "#4682B4",
};

const ELEMENT_NAMES: { [key: string]: string } = {
  Fire: "Fogo",
  Earth: "Terra",
  Air: "Ar",
  Water: "Água",
};

export default function PersonalityReportPage() {
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [birthData, setBirthData] = useState<BirthData>({
    name: "",
    day: "",
    month: "",
    year: "",
    hour: "",
    minute: "",
    city: "",
    nation: "Brazil",
    latitude: 0,
    longitude: 0,
    timezone: "America/Sao_Paulo",
  });
  const [result, setResult] = useState<PersonalityResult | null>(null);
  const [interpretation, setInterpretation] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBirthData({ ...birthData, [e.target.name]: e.target.value });
  };

  const getCoordinates = async (city: string, nation: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
          city
        )}&country=${encodeURIComponent(nation)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
    }
    return { latitude: -23.5505, longitude: -46.6333 }; // São Paulo default
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("loading");

    try {
      // Busca coordenadas
      const coords = await getCoordinates(birthData.city, birthData.nation);

      const requestData = {
        birthData: {
          name: birthData.name,
          year: parseInt(birthData.year),
          month: parseInt(birthData.month),
          day: parseInt(birthData.day),
          hour: parseInt(birthData.hour),
          minute: parseInt(birthData.minute),
          city: birthData.city,
          nation: birthData.nation,
          latitude: coords.latitude,
          longitude: coords.longitude,
          timezone: birthData.timezone,
        },
      };

      const response = await fetch("/api/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Erro ao processar dados");
      }

      const data = await response.json();
      setResult(data.profile);
      setInterpretation(data.interpretation);
      setStep("results");
    } catch (err) {
      setError(
        "Funcionalidade em desenvolvimento. Use o dashboard para ver seu signo solar."
      );
      setStep("form");
    }
  };

  const renderPieChart = (elements: ElementDistribution) => {
    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    let currentAngle = 0;
    const slices = Object.entries(elements).map(([element, count]) => {
      const percentage = (count / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      return { element, count, percentage, startAngle, angle };
    });

    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg viewBox="0 0 200 200" className="transform -rotate-90">
          {slices.map(({ element, startAngle, angle }) => {
            const radius = 80;
            const centerX = 100;
            const centerY = 100;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = ((startAngle + angle) * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              "Z",
            ].join(" ");

            return (
              <path
                key={element}
                d={pathData}
                fill={ELEMENT_COLORS[element]}
                opacity="0.9"
              />
            );
          })}
          {/* Centro branco */}
          <circle cx="100" cy="100" r="40" fill="white" />
        </svg>

        {/* Legenda */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-8 h-8 mx-auto text-purple-600 mb-1" />
            <p className="text-sm font-medium text-gray-700">Elementos</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 relative overflow-hidden">
      {/* Estrelas de fundo */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Star className="w-16 h-16 text-yellow-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Relatório de Personalidade
            </h1>
            <p className="text-xl text-purple-200">
              Descubra sua essência através do seu Mapa Astral
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Formulário */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nome */}
                  <div>
                    <label className="flex items-center gap-2 text-white mb-2">
                      <User className="w-5 h-5" />
                      Nome
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={birthData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Seu nome"
                    />
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="flex items-center gap-2 text-white mb-2">
                      <Calendar className="w-5 h-5" />
                      Data de Nascimento
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="number"
                        name="day"
                        value={birthData.day}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="31"
                        placeholder="Dia"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        name="month"
                        value={birthData.month}
                        onChange={handleInputChange}
                        required
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Mês</option>
                        {MONTHS.map((month, index) => (
                          <option
                            key={month}
                            value={index + 1}
                            className="bg-purple-900"
                          >
                            {month}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        name="year"
                        value={birthData.year}
                        onChange={handleInputChange}
                        required
                        min="1900"
                        max="2024"
                        placeholder="Ano"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Hora de Nascimento */}
                  <div>
                    <label className="flex items-center gap-2 text-white mb-2">
                      <Clock className="w-5 h-5" />
                      Hora de Nascimento
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        name="hour"
                        value={birthData.hour}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max="23"
                        placeholder="Hora"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="number"
                        name="minute"
                        value={birthData.minute}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max="59"
                        placeholder="Minuto"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="flex items-center gap-2 text-white mb-2">
                      <MapPin className="w-5 h-5" />
                      Cidade de Nascimento
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={birthData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: São Paulo"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-full font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Gerar Relatório de Personalidade
                  </button>
                </form>
              </motion.div>
            )}

            {/* Loading */}
            {step === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-20 h-20 text-yellow-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Analisando seu Mapa Astral...
                </h2>
                <p className="text-purple-200">
                  Conectando com as estrelas e revelando sua essência
                </p>
              </motion.div>
            )}

            {/* Resultados */}
            {step === "results" && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Big Three */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Seu Grande Trio
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Sol */}
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
                      <div className="text-center">
                        <div className="text-4xl mb-2">☀️</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Sol
                        </h3>
                        <p className="text-2xl font-bold text-yellow-300 mb-1">
                          {result.bigThree.sun.sign}
                        </p>
                        <p className="text-sm text-white/70">
                          Sua identidade essencial
                        </p>
                      </div>
                    </div>

                    {/* Lua */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🌙</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Lua
                        </h3>
                        <p className="text-2xl font-bold text-blue-300 mb-1">
                          {result.bigThree.moon.sign}
                        </p>
                        <p className="text-sm text-white/70">
                          Seu mundo emocional
                        </p>
                      </div>
                    </div>

                    {/* Ascendente */}
                    <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl p-6 border border-pink-500/30">
                      <div className="text-center">
                        <div className="text-4xl mb-2">⬆️</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Ascendente
                        </h3>
                        <p className="text-2xl font-bold text-pink-300 mb-1">
                          {result.bigThree.ascendant.sign}
                        </p>
                        <p className="text-sm text-white/70">
                          Sua máscara social
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Elementos */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Distribuição dos Elementos
                  </h2>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                      {renderPieChart(result.elements)}
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      {Object.entries(result.elements).map(
                        ([element, count]) => (
                          <div
                            key={element}
                            className="flex items-center gap-4"
                          >
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{
                                backgroundColor: ELEMENT_COLORS[element],
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-white font-medium">
                                  {ELEMENT_NAMES[element]}
                                </span>
                                <span className="text-white/70">{count}</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${(count / 9) * 100}%`,
                                  }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                  className="h-full"
                                  style={{
                                    backgroundColor: ELEMENT_COLORS[element],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      <div className="mt-6 p-4 bg-white/10 rounded-2xl">
                        <p className="text-white font-semibold text-center">
                          Elemento Dominante:{" "}
                          <span
                            className="text-xl"
                            style={{
                              color: ELEMENT_COLORS[result.dominantElement],
                            }}
                          >
                            {ELEMENT_NAMES[result.dominantElement]}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pontos Fortes */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>✨</span> Seus Dons Naturais
                  </h2>
                  <ul className="space-y-3">
                    {result.strengths.map((strength, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="text-green-400 text-xl flex-shrink-0">
                          ✓
                        </span>
                        <span className="text-white text-lg">{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Desafios */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>🌱</span> Áreas de Crescimento
                  </h2>
                  <ul className="space-y-3">
                    {result.challenges.map((challenge, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="text-yellow-400 text-xl flex-shrink-0">
                          →
                        </span>
                        <span className="text-white text-lg">{challenge}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Propósito de Vida */}
                <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/50">
                  <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
                    <span>🎯</span> Seu Propósito de Vida
                  </h2>
                  <p className="text-xl text-white leading-relaxed">
                    {result.lifePurpose}
                  </p>
                </div>

                {/* Interpretação da IA */}
                {interpretation && (
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                    <h2 className="text-3xl font-bold text-white mb-6">
                      Análise Astrológica Completa
                    </h2>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <div className="text-white/90 leading-relaxed whitespace-pre-wrap">
                        {interpretation}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão Nova Análise */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setStep("form");
                      setResult(null);
                      setInterpretation("");
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Fazer Nova Análise
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
