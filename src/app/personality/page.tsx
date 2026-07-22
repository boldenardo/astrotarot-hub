"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Star,
  Sun,
  Moon,
  Sunrise,
  Check,
  Target,
  Sprout,
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

const ELEMENT_COLORS: { [key: string]: string } = {
  Fire: "#D4AF37",
  Earth: "#A9822F",
  Air: "#B7A6F0",
  Water: "#7C5CFF",
};

const ELEMENT_NAMES: { [key: string]: string } = {
  Fire: "Fire",
  Earth: "Earth",
  Air: "Air",
  Water: "Water",
};

export default function PersonalityReportPage() {
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
  const [result, setResult] = useState<PersonalityResult | null>(null);
  const [interpretation, setInterpretation] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [premiumRequired, setPremiumRequired] = useState(false);

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
    return { latitude: -23.5505, longitude: -46.6333 }; // São Paulo default
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setPremiumRequired(false);
    setStep("loading");

    try {
      // Fetch coordinates
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

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.code === "PREMIUM_REQUIRED") {
          setPremiumRequired(true);
          setError("This feature is exclusive to the Premium Unlimited plan.");
          setStep("form");
          return;
        }
        throw new Error(data?.error || "Failed to generate the report");
      }

      setResult(data.profile);
      setInterpretation(data.interpretation);
      setStep("results");
    } catch (err) {
      console.error(err);
      setError(
        "We couldn't generate your report right now. Please try again in a moment."
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
          {/* Center circle */}
          <circle cx="100" cy="100" r="40" fill="#0B0713" />
        </svg>

        {/* Legend */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-8 h-8 mx-auto text-gold-300 mb-1" />
            <p className="text-sm font-medium text-ink-200">Elements</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PremiumGate feature="birth_chart">
    <div className="min-h-screen relative overflow-hidden text-ink-200">
      {/* Background stars */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gold-300/50 rounded-full"
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
              <Star className="w-16 h-16 text-gold-400" fill="currentColor" />
            </motion.div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-ink-50 mb-4">
              Personality <span className="text-gold">Report</span>
            </h1>
            <p className="text-base sm:text-xl text-ink-400">
              Discover your essence through your birth chart.
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
                className="glass glass-gold rounded-3xl p-5 sm:p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <User className="w-5 h-5 text-gold-300" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={birthData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <Calendar className="w-5 h-5 text-gold-300" />
                      Date of Birth
                    </label>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <input
                        type="number"
                        name="day"
                        value={birthData.day}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="31"
                        placeholder="Day"
                        className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-3 text-base text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      />
                      <select
                        name="month"
                        value={birthData.month}
                        onChange={handleInputChange}
                        required
                        className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-3 text-base text-ink-100 focus:border-gold-400/50 focus:outline-none"
                      >
                        <option value="" className="bg-night-800">
                          Month
                        </option>
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
                        className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-3 text-base text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Time of Birth */}
                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <Clock className="w-5 h-5 text-gold-300" />
                      Time of Birth
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
                        className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-3 text-base text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
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
                        className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-3 text-base text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="flex items-center gap-2 text-ink-200 mb-2">
                      <MapPin className="w-5 h-5 text-gold-300" />
                      City of Birth
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={birthData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                      placeholder="e.g. New York"
                    />
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl border border-red-400/30 bg-red-400/10 text-red-200">
                      <p>{error}</p>
                      {premiumRequired && (
                        <Link
                          href="/cart?plan=premium"
                          className="btn-gold mt-3 block w-full rounded-full px-6 py-2.5 text-center text-sm font-semibold sm:inline-block sm:w-auto"
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
                    Generate Personality Report
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
                  <Sparkles className="w-20 h-20 text-gold-400" />
                </motion.div>
                <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4">
                  Reading your birth chart...
                </h2>
                <p className="text-ink-400">
                  Aligning the stars to reveal your essence.
                </p>
              </motion.div>
            )}

            {/* Results */}
            {step === "results" && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Big Three */}
                <div className="glass rounded-3xl p-5 sm:p-8 border-white/5">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6 text-center">
                    Your Big Three
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Sun */}
                    <div className="glass rounded-2xl p-6 border border-gold-400/20">
                      <div className="text-center">
                        <Sun className="w-9 h-9 mx-auto mb-2 text-gold-300" />
                        <h3 className="text-xl font-semibold text-ink-50 mb-2">
                          Sun
                        </h3>
                        <p className="text-2xl font-bold text-gold-300 mb-1">
                          {result.bigThree.sun.sign}
                        </p>
                        <p className="text-sm text-ink-400">
                          Your core identity
                        </p>
                      </div>
                    </div>

                    {/* Moon */}
                    <div className="glass rounded-2xl p-6 border border-white/5">
                      <div className="text-center">
                        <Moon className="w-9 h-9 mx-auto mb-2 text-amethyst-300" />
                        <h3 className="text-xl font-semibold text-ink-50 mb-2">
                          Moon
                        </h3>
                        <p className="text-2xl font-bold text-amethyst-300 mb-1">
                          {result.bigThree.moon.sign}
                        </p>
                        <p className="text-sm text-ink-400">
                          Your emotional world
                        </p>
                      </div>
                    </div>

                    {/* Ascendant */}
                    <div className="glass rounded-2xl p-6 border border-gold-400/20">
                      <div className="text-center">
                        <Sunrise className="w-9 h-9 mx-auto mb-2 text-gold-300" />
                        <h3 className="text-xl font-semibold text-ink-50 mb-2">
                          Ascendant
                        </h3>
                        <p className="text-2xl font-bold text-gold-300 mb-1">
                          {result.bigThree.ascendant.sign}
                        </p>
                        <p className="text-sm text-ink-400">
                          Your outward self
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Element Distribution */}
                <div className="glass rounded-3xl p-5 sm:p-8 border-white/5">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6 text-center">
                    Elemental Balance
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
                                <span className="text-ink-200 font-medium">
                                  {ELEMENT_NAMES[element]}
                                </span>
                                <span className="text-ink-400">{count}</span>
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
                      <div className="mt-6 p-4 glass rounded-2xl border border-white/5">
                        <p className="text-ink-200 font-semibold text-center">
                          Dominant Element:{" "}
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

                {/* Strengths */}
                <div className="glass rounded-3xl p-5 sm:p-8 border-white/5">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6 flex items-center gap-2">
                    <Sparkles className="w-7 h-7 text-gold-300" /> Your Natural
                    Gifts
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
                        <Check className="w-6 h-6 flex-shrink-0 text-gold-400" />
                        <span className="text-ink-200 text-lg">{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Challenges */}
                <div className="glass rounded-3xl p-5 sm:p-8 border-white/5">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6 flex items-center gap-2">
                    <Sprout className="w-7 h-7 text-amethyst-300" /> Areas for
                    Growth
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
                        <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amethyst-400" />
                        <span className="text-ink-200 text-lg">{challenge}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Life Purpose */}
                <div className="glass glass-gold rounded-3xl p-5 sm:p-8">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-4 flex items-center gap-2">
                    <Target className="w-7 h-7 text-gold-300" /> Your Life
                    Purpose
                  </h2>
                  <p className="text-base sm:text-xl text-ink-200 leading-relaxed break-words">
                    {result.lifePurpose}
                  </p>
                </div>

                {/* AI Interpretation */}
                {interpretation && (
                  <div className="glass rounded-3xl p-5 sm:p-8 border-white/5">
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-6">
                      Complete Astrological Reading
                    </h2>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <div className="text-ink-200 leading-relaxed whitespace-pre-wrap">
                        {interpretation}
                      </div>
                    </div>
                  </div>
                )}

                {/* New Analysis Button */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setStep("form");
                      setResult(null);
                      setInterpretation("");
                    }}
                    className="btn-gold rounded-full px-8 py-4 font-semibold text-lg"
                  >
                    Start a New Reading
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
