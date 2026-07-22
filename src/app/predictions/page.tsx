"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Sunrise,
  Moon,
  TrendingUp,
  AlertCircle,
  Star,
} from "lucide-react";

import PremiumGate from "@/components/PremiumGate";

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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ENERGY_ICONS = {
  love: Heart,
  career: Briefcase,
  health: Activity,
  finances: DollarSign,
  spirituality: Sparkles,
};

const ENERGY_LABELS = {
  love: "Love",
  career: "Career",
  health: "Health",
  finances: "Finances",
  spirituality: "Spirituality",
};

const ENERGY_COLORS = {
  love: "from-gold-500 to-gold-300",
  career: "from-gold-500 to-gold-300",
  health: "from-gold-500 to-gold-300",
  finances: "from-gold-500 to-gold-300",
  spirituality: "from-gold-500 to-gold-300",
};

export default function PredictionsPage() {
  const router = useRouter();
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
  const [premiumRequired, setPremiumRequired] = useState(false);
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
      console.error("Failed to fetch coordinates:", error);
    }
    return { latitude: -23.5505, longitude: -46.6333 };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setPremiumRequired(false);
    setStep("loading");

    try {
      const coords = await getCoordinates(birthData.city, birthData.nation);

      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.code === "PREMIUM_REQUIRED") {
          setPremiumRequired(true);
          setError(
            "This feature is exclusive to the Premium Unlimited plan."
          );
          setStep("form");
          return;
        }
        throw new Error(data?.error || "Failed to generate the forecast");
      }

      setPrediction(data);
      setStep("results");
    } catch (err) {
      console.error(err);
      setError(
        "We couldn't generate your forecast right now. Please try again in a moment."
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
            <Icon className="w-5 h-5 text-gold-300" />
            <span className="text-ink-200 font-medium">{label}</span>
          </div>
          <span className="text-2xl font-bold text-ink-50">{value}%</span>
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
    <PremiumGate feature="horoscope">
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated stars */}
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
              <Sun className="w-16 h-16 text-gold-400" />
            </motion.div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-ink-50 mb-4 break-words">
              Your Daily <span className="text-gold">Forecast</span>
            </h1>
            <p className="text-lg sm:text-xl text-ink-400 capitalize">
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Form */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-3xl p-6 sm:p-8 border-white/5 max-w-2xl mx-auto"
              >
                <div className="text-center mb-6">
                  <h2 className="font-display text-2xl font-semibold text-ink-50 mb-2">
                    Enter your birth details
                  </h2>
                  <p className="text-ink-400">
                    To generate personalized forecasts based on your natal
                    chart
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <User className="w-5 h-5 text-gold-300" />
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={birthData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <Calendar className="w-5 h-5 text-gold-300" />
                      Date of birth
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="number"
                        name="day"
                        value={birthData.day}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="31"
                        placeholder="Day"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      />
                      <select
                        name="month"
                        value={birthData.month}
                        onChange={handleInputChange}
                        required
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 focus:border-gold-400/50 focus:outline-none"
                      >
                        <option value="">Month</option>
                        {MONTHS.map((month, index) => (
                          <option
                            key={month}
                            value={index + 1}
                            className="bg-night-800"
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
                        max="2026"
                        placeholder="Year"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <Clock className="w-5 h-5 text-gold-300" />
                      Time of birth
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
                        placeholder="Hour"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      />
                      <input
                        type="number"
                        name="minute"
                        value={birthData.minute}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max="59"
                        placeholder="Minute"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <MapPin className="w-5 h-5 text-gold-300" />
                      City of birth
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={birthData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      placeholder="e.g. New York"
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                      <p>{error}</p>
                      {premiumRequired && (
                        <Link
                          href="/cart?plan=premium"
                          className="btn-gold mt-3 inline-block rounded-full px-6 py-2 text-sm font-semibold"
                        >
                          Subscribe to Premium Unlimited — $29.90/mo
                        </Link>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-gold w-full rounded-full py-4 font-semibold text-lg"
                  >
                    Reveal today&apos;s forecast
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
                  <Sun className="w-20 h-20 text-gold-400" />
                </motion.div>
                <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4">
                  Reading the planetary transits...
                </h2>
                <p className="text-ink-400">
                  Calculating the astrological energies of your day
                </p>
              </motion.div>
            )}

            {/* Results */}
            {step === "results" && prediction && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Moon phase */}
                <div className="glass glass-gold rounded-3xl p-6 sm:p-8 text-center">
                  <span className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10">
                    <Moon className="h-8 w-8 text-gold-300" />
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-2 break-words">
                    {prediction.moonPhase.name}
                  </h2>
                  <p className="text-lg sm:text-xl text-ink-400 break-words">
                    {prediction.moonPhase.meaning}
                  </p>
                </div>

                {/* Recommendation and caution */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass rounded-3xl p-6 border-white/5">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-6 h-6 text-gold-300 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
                          Today&apos;s recommendation
                        </h3>
                        <p className="text-ink-400 leading-relaxed">
                          {prediction.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-3xl p-6 border-white/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-gold-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
                          Today&apos;s caution
                        </h3>
                        <p className="text-ink-400 leading-relaxed">
                          {prediction.warning}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's energies */}
                <div className="glass rounded-3xl p-6 sm:p-8 border-white/5">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6 text-center">
                    Today&apos;s energies
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

                {/* Best times */}
                <div className="glass rounded-3xl p-6 sm:p-8 border-white/5">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6 text-center">
                    Best times of day
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Sunrise className="w-10 h-10 text-gold-300 mx-auto mb-3" />
                      <h3 className="font-display text-xl font-semibold text-gold-300 mb-2">
                        Morning
                      </h3>
                      <p className="text-ink-400">
                        {prediction.bestTimeOfDay.morning}
                      </p>
                    </div>
                    <div className="text-center">
                      <Sun className="w-10 h-10 text-gold-300 mx-auto mb-3" />
                      <h3 className="font-display text-xl font-semibold text-gold-300 mb-2">
                        Afternoon
                      </h3>
                      <p className="text-ink-400">
                        {prediction.bestTimeOfDay.afternoon}
                      </p>
                    </div>
                    <div className="text-center">
                      <Moon className="w-10 h-10 text-gold-300 mx-auto mb-3" />
                      <h3 className="font-display text-xl font-semibold text-gold-300 mb-2">
                        Evening
                      </h3>
                      <p className="text-ink-400">
                        {prediction.bestTimeOfDay.evening}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lucky elements */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass rounded-3xl p-6 border-white/5 text-center">
                    <Star className="w-12 h-12 text-gold-400 mx-auto mb-3" />
                    <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
                      Lucky color
                    </h3>
                    <p className="text-2xl sm:text-3xl font-bold text-gold-300 capitalize break-words">
                      {prediction.luckyColor}
                    </p>
                  </div>

                  <div className="glass rounded-3xl p-6 border-white/5 text-center">
                    <Sparkles className="w-12 h-12 text-gold-400 mx-auto mb-3" />
                    <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
                      Lucky number
                    </h3>
                    <p className="text-4xl sm:text-5xl font-bold text-gold-300">
                      {prediction.luckyNumber}
                    </p>
                  </div>
                </div>

                {/* Key transits */}
                {prediction.majorTransits.length > 0 && (
                  <div className="glass rounded-3xl p-6 sm:p-8 border-white/5">
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6 text-center">
                      Key astrological transits
                    </h2>
                    <div className="space-y-4">
                      {prediction.majorTransits.map((transit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/5"
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="bg-gold-400/10 rounded-full p-3 shrink-0">
                              <Moon className="w-6 h-6 text-gold-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-lg sm:text-xl font-semibold text-ink-50 mb-2 break-words">
                                {transit.transit} in {transit.aspect} with{" "}
                                {transit.natal}
                              </h3>
                              <p className="text-gold-300 font-semibold mb-2">
                                {transit.energy}
                              </p>
                              <p className="text-ink-400 mb-3">
                                {transit.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {transit.areas.map((area, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1 bg-gold-400/10 border border-gold-400/20 rounded-full text-sm text-gold-300"
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

                {/* New reading button */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setStep("form");
                      setPrediction(null);
                    }}
                    className="btn-gold rounded-full px-8 py-4 font-semibold text-lg"
                  >
                    View another day&apos;s forecast
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    </PremiumGate>
  );
}
