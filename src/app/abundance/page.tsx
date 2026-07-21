"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

import PremiumGate from "@/components/PremiumGate";

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
    title: "Financial Prosperity",
    description: "Abundance cycles within your natal chart",
    gradient: "from-gold-200 to-gold-600",
  },
  {
    icon: Briefcase,
    title: "Professional Success",
    description: "The best moments to grow your career",
    gradient: "from-gold-200 to-gold-600",
  },
  {
    icon: PiggyBank,
    title: "Investments",
    description: "Favorable periods to multiply your resources",
    gradient: "from-gold-200 to-gold-600",
  },
  {
    icon: Coins,
    title: "Opportunities",
    description: "Moments of fortune and material expansion",
    gradient: "from-gold-200 to-gold-600",
  },
];

export default function AbundancePage() {
  const router = useRouter();
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
  const [error, setError] = useState<string>("");
  const [premiumRequired, setPremiumRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    setPremiumRequired(false);

    try {
      const response = await fetch("/api/abundance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthData: formData }),
      });

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.code === "PREMIUM_REQUIRED") {
          setPremiumRequired(true);
          setError("Este recurso é exclusivo do plano Premium Ilimitado.");
          return;
        }
        throw new Error(data?.error || "Falha ao gerar a análise");
      }

      if (data?.success && data.analysis) {
        setResult(data.analysis);
      } else {
        throw new Error(data?.error || "Falha ao gerar a análise");
      }
    } catch (err) {
      console.error("Failed to fetch analysis:", err);
      setError(
        "Não foi possível gerar sua análise de abundância agora. Tente novamente em instantes."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumGate feature="prosperity">
    <main className="min-h-screen text-ink-200 pt-24">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),transparent_60%)]" />

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amethyst-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-gold-400/30 bg-gold-400/10 rounded-full mb-6">
              <TrendingUp className="w-4 h-4 text-gold-300" />
              <span className="text-gold-300 text-sm font-medium">
                Abundance Astrology
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-semibold text-ink-50 mb-6">
              Unlock Your
              <br />
              <span className="text-gold">Prosperity</span>
            </h1>

            <p className="text-xl text-ink-400 max-w-3xl mx-auto leading-relaxed">
              Discover the abundance cycles within your natal chart and learn
              exactly when to act to multiply your material wealth
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
                <div className="glass relative p-6 rounded-3xl border-white/5 hover:border-gold-400/40 transition-all duration-300">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${area.gradient} shadow-gold flex items-center justify-center mb-4`}
                  >
                    <area.icon className="w-6 h-6 text-night-900" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink-50 mb-2">
                    {area.title}
                  </h3>
                  <p className="text-sm text-ink-400">{area.description}</p>
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
            className="glass glass-gold rounded-3xl p-8 md:p-12"
          >
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl font-semibold text-ink-50 mb-4">
                Personalized <span className="text-gold">Abundance</span> Analysis
              </h2>
              <p className="text-ink-400">
                Enter your birth details to uncover your cycles of prosperity
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Time Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-200 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2 text-gold-300" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
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
                  <label className="block text-sm font-medium text-ink-200 mb-2">
                    <Clock className="w-4 h-4 inline mr-2 text-gold-300" />
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
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
                  <label className="block text-sm font-medium text-ink-200 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2 text-gold-300" />
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
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
                className="btn-gold w-full rounded-full py-4 font-semibold text-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing your chart...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Reveal My Abundance
                  </span>
                )}
              </button>

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center text-red-200">
                  <p>{error}</p>
                  {premiumRequired && (
                    <Link
                      href="/cart?plan=premium"
                      className="btn-gold mt-3 inline-block rounded-full px-6 py-2 text-sm font-semibold"
                    >
                      Assinar Premium Ilimitado — US$ 29,90/mês
                    </Link>
                  )}
                </div>
              )}
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
              <div className="glass glass-gold rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold flex items-center justify-center">
                    <Star className="w-6 h-6 text-night-900" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-gold-300">
                      Current Prosperity Cycle
                    </h3>
                    <p className="text-ink-400 text-sm">
                      Active astrological phase
                    </p>
                  </div>
                </div>
                <p className="text-lg text-ink-200">{result.currentCycle}</p>
              </div>

              {/* Abundance Scores */}
              {result.scores && (
                <div className="glass rounded-3xl p-8 border-white/5">
                  <h3 className="font-display text-2xl font-semibold text-ink-50 mb-6">
                    Abundance Potential
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gold-400/10 rounded-xl border border-gold-400/20">
                      <DollarSign className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-gold-300">
                        {result.scores.financial}
                      </div>
                      <div className="text-sm text-ink-400">Finances</div>
                    </div>
                    <div className="text-center p-4 bg-gold-400/10 rounded-xl border border-gold-400/20">
                      <Briefcase className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-gold-300">
                        {result.scores.career}
                      </div>
                      <div className="text-sm text-ink-400">Career</div>
                    </div>
                    <div className="text-center p-4 bg-gold-400/10 rounded-xl border border-gold-400/20">
                      <PiggyBank className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-gold-300">
                        {result.scores.investments}
                      </div>
                      <div className="text-sm text-ink-400">Investments</div>
                    </div>
                    <div className="text-center p-4 bg-gold-400/10 rounded-xl border border-gold-400/20">
                      <Sparkles className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-gold-300">
                        {result.scores.opportunities}
                      </div>
                      <div className="text-sm text-ink-400">Opportunities</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Favorable Periods */}
              <div className="glass rounded-3xl p-8 border-white/5">
                <h3 className="font-display text-2xl font-semibold text-ink-50 mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-gold-400" />
                  Favorable Periods
                </h3>
                <div className="space-y-4">
                  {result.favorablePeriods.map(
                    (period: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-gold-400/5 rounded-xl border border-gold-400/15"
                      >
                        <div className="w-2 h-2 rounded-full bg-gold-400 mt-2" />
                        <p className="text-ink-400">{period}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Houses Analysis */}
              <div className="glass rounded-3xl p-8 border-white/5">
                <h3 className="font-display text-2xl font-semibold text-ink-50 mb-6">
                  Houses of Abundance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.houses?.house2 && (
                    <div className="p-4 bg-gold-400/5 rounded-xl border border-gold-400/15">
                      <h4 className="font-semibold text-gold-300 mb-2">
                        House 2 - Resources
                      </h4>
                      <p className="text-sm text-ink-400">
                        {result.houses.house2}
                      </p>
                    </div>
                  )}
                  {result.houses?.house8 && (
                    <div className="p-4 bg-gold-400/5 rounded-xl border border-gold-400/15">
                      <h4 className="font-semibold text-gold-300 mb-2">
                        House 8 - Transformation
                      </h4>
                      <p className="text-sm text-ink-400">
                        {result.houses.house8}
                      </p>
                    </div>
                  )}
                  {result.houses?.house10 && (
                    <div className="p-4 bg-gold-400/5 rounded-xl border border-gold-400/15">
                      <h4 className="font-semibold text-gold-300 mb-2">
                        House 10 - Career
                      </h4>
                      <p className="text-sm text-ink-400">
                        {result.houses.house10}
                      </p>
                    </div>
                  )}
                  {result.houses?.house11 && (
                    <div className="p-4 bg-gold-400/5 rounded-xl border border-gold-400/15">
                      <h4 className="font-semibold text-gold-300 mb-2">
                        House 11 - Gains
                      </h4>
                      <p className="text-sm text-ink-400">
                        {result.houses.house11}
                      </p>
                    </div>
                  )}
                  {result.jupiterPosition && (
                    <div className="p-4 bg-gold-400/5 rounded-xl border border-gold-400/15">
                      <h4 className="font-semibold text-gold-300 mb-2">
                        Jupiter - Expansion
                      </h4>
                      <p className="text-sm text-ink-400">
                        {result.jupiterPosition}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="glass rounded-3xl p-8 border-white/5">
                <h3 className="font-display text-2xl font-semibold text-ink-50 mb-6">
                  Strategic Recommendations
                </h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-white/5 rounded-xl"
                    >
                      <Sparkles className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                      <p className="text-ink-400">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="glass glass-gold rounded-3xl p-8 text-center">
                <h3 className="font-display text-2xl font-semibold text-ink-50 mb-4">
                  Unlock the Full Analysis
                </h3>
                <p className="text-ink-400 mb-6">
                  Access detailed monthly forecasts, personalized abundance
                  rituals, and real-time opportunity alerts
                </p>
                <Link
                  href="/cart?plan=premium"
                  className="btn-gold inline-block rounded-full px-8 py-3 font-semibold"
                >
                  Assinar Premium Ilimitado — US$ 29,90/mês
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
    </PremiumGate>
  );
}
