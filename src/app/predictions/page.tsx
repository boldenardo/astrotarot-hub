"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Briefcase,
  Activity,
  DollarSign,
  Sparkles,
  Sun,
  Moon,
  TrendingUp,
  AlertCircle,
  Star,
} from "lucide-react";

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

interface DailyPrediction {
  date: string;
  moonPhase: {
    name: string;
    emoji: string;
    meaning: string;
    percentage: number;
  };
  majorTransits: Array<{
    transit: string;
    natal: string;
    aspect: string;
    energy: string;
    description: string;
    areas: string[];
  }>;
  energyRatings: {
    love: number;
    career: number;
    health: number;
    finances: number;
    spirituality: number;
  };
  bestTimeOfDay: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  luckyColor: string;
  luckyNumber: number;
  recommendation: string;
  warning: string;
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

const ENERGY_ICONS = {
  love: Heart,
  career: Briefcase,
  health: Activity,
  finances: DollarSign,
  spirituality: Sparkles,
};

const ENERGY_LABELS = {
  love: "Amor",
  career: "Carreira",
  health: "Saúde",
  finances: "Finanças",
  spirituality: "Espiritualidade",
};

const ENERGY_COLORS = {
  love: "from-pink-500 to-rose-500",
  career: "from-blue-500 to-indigo-500",
  health: "from-green-500 to-emerald-500",
  finances: "from-yellow-500 to-amber-500",
  spirituality: "from-purple-500 to-violet-500",
};

export default function PredictionsPage() {
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
  const [prediction, setPrediction] = useState<DailyPrediction | null>(null);
  const [error, setError] = useState<string>("");
  const [currentDate] = useState(new Date());

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
    return { latitude: -23.5505, longitude: -46.6333 };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("loading");

    try {
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
        targetDate: currentDate.toISOString(),
      };

      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Erro ao processar dados");
      }

      const data = await response.json();
      setPrediction(data.prediction);
      setStep("results");
    } catch (err) {
      setError(
        "Funcionalidade em desenvolvimento. Em breve você poderá acessar suas previsões personalizadas."
      );
      setStep("form");
    }
  };

  const renderEnergyBar = (
    category: keyof DailyPrediction["energyRatings"],
    value: number
  ) => {
    const Icon = ENERGY_ICONS[category];
    const label = ENERGY_LABELS[category];
    const gradient = ENERGY_COLORS[category];

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">{label}</span>
          </div>
          <span className="text-2xl font-bold text-white">{value}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full bg-gradient-to-r ${gradient}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      {/* Estrelas animadas */}
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
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="inline-block mb-4"
            >
              <Sun className="w-16 h-16 text-yellow-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Suas Previsões de Hoje
            </h1>
            <p className="text-xl text-purple-200">
              {currentDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
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
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-2xl mx-auto"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Informe seus Dados de Nascimento
                  </h2>
                  <p className="text-purple-200">
                    Para gerar previsões personalizadas baseadas no seu mapa
                    natal
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                    Ver Minhas Previsões de Hoje
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
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="inline-block mb-6"
                >
                  <Sun className="w-20 h-20 text-yellow-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Analisando os Trânsitos Planetários...
                </h2>
                <p className="text-purple-200">
                  Calculando as energias astrológicas do seu dia
                </p>
              </motion.div>
            )}

            {/* Resultados */}
            {step === "results" && prediction && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Fase Lunar */}
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center">
                  <div className="text-7xl mb-4">
                    {prediction.moonPhase.emoji}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {prediction.moonPhase.name}
                  </h2>
                  <p className="text-xl text-purple-200">
                    {prediction.moonPhase.meaning}
                  </p>
                </div>

                {/* Recomendação e Alerta */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-xl rounded-3xl p-6 border border-green-500/30">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Recomendação do Dia
                        </h3>
                        <p className="text-green-100 leading-relaxed">
                          {prediction.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Alerta do Dia
                        </h3>
                        <p className="text-orange-100 leading-relaxed">
                          {prediction.warning}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Energias do Dia */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Energias do Dia
                  </h2>
                  <div className="space-y-6">
                    {Object.entries(prediction.energyRatings).map(
                      ([category, value]) =>
                        renderEnergyBar(
                          category as keyof DailyPrediction["energyRatings"],
                          value
                        )
                    )}
                  </div>
                </div>

                {/* Melhores Horários */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Melhores Horários do Dia
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🌅</div>
                      <h3 className="text-xl font-bold text-yellow-300 mb-2">
                        Manhã
                      </h3>
                      <p className="text-white/80">
                        {prediction.bestTimeOfDay.morning}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-3">☀️</div>
                      <h3 className="text-xl font-bold text-orange-300 mb-2">
                        Tarde
                      </h3>
                      <p className="text-white/80">
                        {prediction.bestTimeOfDay.afternoon}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-3">🌙</div>
                      <h3 className="text-xl font-bold text-purple-300 mb-2">
                        Noite
                      </h3>
                      <p className="text-white/80">
                        {prediction.bestTimeOfDay.evening}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Elementos de Sorte */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 text-center">
                    <Star className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      Cor da Sorte
                    </h3>
                    <p className="text-3xl font-bold text-purple-200 capitalize">
                      {prediction.luckyColor}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/30 text-center">
                    <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      Número da Sorte
                    </h3>
                    <p className="text-5xl font-bold text-cyan-200">
                      {prediction.luckyNumber}
                    </p>
                  </div>
                </div>

                {/* Trânsitos Principais */}
                {prediction.majorTransits.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                    <h2 className="text-3xl font-bold text-white mb-6 text-center">
                      Principais Trânsitos Astrológicos
                    </h2>
                    <div className="space-y-4">
                      {prediction.majorTransits.map((transit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/5 rounded-2xl p-6 border border-white/10"
                        >
                          <div className="flex items-start gap-4">
                            <div className="bg-purple-500/20 rounded-full p-3">
                              <Moon className="w-6 h-6 text-purple-300" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {transit.transit} em {transit.aspect} com{" "}
                                {transit.natal}
                              </h3>
                              <p className="text-purple-300 font-semibold mb-2">
                                {transit.energy}
                              </p>
                              <p className="text-white/80 mb-3">
                                {transit.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {transit.areas.map((area, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-200"
                                  >
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botão Nova Consulta */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setStep("form");
                      setPrediction(null);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Ver Previsões de Outro Dia
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
