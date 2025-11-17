"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Sparkles,
  Target,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Star,
  Coins,
  Briefcase,
  PiggyBank,
} from "lucide-react";

interface BirthData {
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

const abundanceAreas = [
  {
    icon: DollarSign,
    title: "Prosperidade Financeira",
    description: "Ciclos de abundância no seu mapa astral",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: Briefcase,
    title: "Sucesso Profissional",
    description: "Melhores momentos para crescer na carreira",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: PiggyBank,
    title: "Investimentos",
    description: "Períodos favoráveis para multiplicar recursos",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Coins,
    title: "Oportunidades",
    description: "Momentos de sorte e expansão material",
    gradient: "from-purple-500 to-pink-500",
  },
];

export default function AbundancePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BirthData>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    city: "",
    nation: "BR",
    latitude: -23.5505,
    longitude: -46.6333,
    timezone: "America/Sao_Paulo",
  });
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulação de chamada API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setResult({
        currentCycle: "Júpiter em trígono com seu Sol natal",
        favorablePeriods: [
          "15-30 de Novembro: Excelente para novos investimentos",
          "10-20 de Dezembro: Período de expansão profissional",
          "5-15 de Janeiro: Oportunidades inesperadas de ganhos",
        ],
        houses: {
          second: "Vênus em Touro - Estabilidade financeira",
          eighth: "Plutão em aspecto favorável - Transformação financeira",
          tenth: "Júpiter expandindo carreira e reconhecimento",
        },
        recommendations: [
          "Invista em ativos de longo prazo durante Júpiter em sua 2ª casa",
          "Período ideal para pedir aumento ou promoção",
          "Considere empreender com parcerias estratégicas",
          "Evite grandes gastos entre 20-30 de Dezembro (Mercúrio retrógrado)",
        ],
      });
    } catch (error) {
      console.error("Erro ao buscar análise:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white pt-24">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/30 via-black to-black" />

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full border border-yellow-500/30 mb-6">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-medium">
                Astrologia da Abundância
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Desbloqueie Sua
              <br />
              Prosperidade
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Descubra os ciclos de abundância no seu mapa astral e saiba
              exatamente quando agir para multiplicar sua riqueza material
            </p>
          </motion.div>

          {/* Abundance Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {abundanceAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 backdrop-blur-xl hover:border-yellow-500/50 transition-all duration-300">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${area.gradient} flex items-center justify-center mb-4`}
                  >
                    <area.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{area.title}</h3>
                  <p className="text-sm text-gray-400">{area.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-gray-800"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                Análise de Abundância Personalizada
              </h2>
              <p className="text-gray-400">
                Preencha seus dados de nascimento para descobrir seus ciclos de
                prosperidade
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Time Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setFormData({
                        ...formData,
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        day: date.getDate(),
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Hora
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    onChange={(e) => {
                      const [hour, minute] = e.target.value.split(":");
                      setFormData({
                        ...formData,
                        hour: parseInt(hour),
                        minute: parseInt(minute),
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Cidade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="São Paulo"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-xl font-semibold text-black transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-yellow-500/50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando seu mapa...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Revelar Minha Abundância
                  </span>
                )}
              </button>
            </form>
          </motion.div>

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-12 space-y-6"
            >
              {/* Current Cycle */}
              <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-300">
                      Ciclo Atual de Prosperidade
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Fase astrológica ativa
                    </p>
                  </div>
                </div>
                <p className="text-lg text-white">{result.currentCycle}</p>
              </div>

              {/* Favorable Periods */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-yellow-400" />
                  Períodos Favoráveis
                </h3>
                <div className="space-y-4">
                  {result.favorablePeriods.map(
                    (period: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20"
                      >
                        <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                        <p className="text-gray-300">{period}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Houses Analysis */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">Casas de Abundância</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <h4 className="font-semibold text-green-400 mb-2">
                      Casa 2 - Recursos
                    </h4>
                    <p className="text-sm text-gray-300">
                      {result.houses.second}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <h4 className="font-semibold text-purple-400 mb-2">
                      Casa 8 - Transformação
                    </h4>
                    <p className="text-sm text-gray-300">
                      {result.houses.eighth}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <h4 className="font-semibold text-blue-400 mb-2">
                      Casa 10 - Carreira
                    </h4>
                    <p className="text-sm text-gray-300">
                      {result.houses.tenth}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">
                  Recomendações Estratégicas
                </h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/30 text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Desbloqueie Análise Completa
                </h3>
                <p className="text-gray-300 mb-6">
                  Acesse previsões mensais detalhadas, rituais de abundância
                  personalizados e alertas de oportunidades em tempo real
                </p>
                <button className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-xl font-semibold text-black transition-all hover:scale-105 shadow-lg shadow-yellow-500/50">
                  Assinar Premium - R$ 29,90/mês
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
