"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Star,
  MessageCircle,
  Gem,
  Infinity as InfinityIcon,
  Check,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PremiumGate from "@/components/PremiumGate";

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
    name: "Aries",
    emoji: "♈",
    element: "Fire",
    dates: "Mar 21 – Apr 19",
    perfectMatches: ["Leo", "Sagittarius", "Gemini"],
    traits: ["Bold", "Energetic", "Leader"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Taurus",
    emoji: "♉",
    element: "Earth",
    dates: "Apr 20 – May 20",
    perfectMatches: ["Virgo", "Capricorn", "Cancer"],
    traits: ["Loyal", "Sensual", "Grounded"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Gemini",
    emoji: "♊",
    element: "Air",
    dates: "May 21 – Jun 20",
    perfectMatches: ["Libra", "Aquarius", "Aries"],
    traits: ["Expressive", "Versatile", "Clever"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Cancer",
    emoji: "♋",
    element: "Water",
    dates: "Jun 21 – Jul 22",
    perfectMatches: ["Scorpio", "Pisces", "Taurus"],
    traits: ["Nurturing", "Protective", "Intuitive"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Leo",
    emoji: "♌",
    element: "Fire",
    dates: "Jul 23 – Aug 22",
    perfectMatches: ["Aries", "Sagittarius", "Libra"],
    traits: ["Generous", "Creative", "Confident"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Virgo",
    emoji: "♍",
    element: "Earth",
    dates: "Aug 23 – Sep 22",
    perfectMatches: ["Taurus", "Capricorn", "Scorpio"],
    traits: ["Analytical", "Devoted", "Meticulous"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Libra",
    emoji: "♎",
    element: "Air",
    dates: "Sep 23 – Oct 22",
    perfectMatches: ["Gemini", "Aquarius", "Leo"],
    traits: ["Diplomatic", "Harmonious", "Charming"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Scorpio",
    emoji: "♏",
    element: "Water",
    dates: "Oct 23 – Nov 21",
    perfectMatches: ["Cancer", "Pisces", "Virgo"],
    traits: ["Intense", "Passionate", "Magnetic"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Sagittarius",
    emoji: "♐",
    element: "Fire",
    dates: "Nov 22 – Dec 21",
    perfectMatches: ["Aries", "Leo", "Aquarius"],
    traits: ["Adventurous", "Optimistic", "Philosophical"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Capricorn",
    emoji: "♑",
    element: "Earth",
    dates: "Dec 22 – Jan 19",
    perfectMatches: ["Taurus", "Virgo", "Pisces"],
    traits: ["Ambitious", "Responsible", "Disciplined"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Aquarius",
    emoji: "♒",
    element: "Air",
    dates: "Jan 20 – Feb 18",
    perfectMatches: ["Gemini", "Libra", "Sagittarius"],
    traits: ["Innovative", "Independent", "Humanitarian"],
    color: "from-gold-300 to-gold-500",
  },
  {
    name: "Pisces",
    emoji: "♓",
    element: "Water",
    dates: "Feb 19 – Mar 20",
    perfectMatches: ["Cancer", "Scorpio", "Capricorn"],
    traits: ["Empathetic", "Artistic", "Dreamy"],
    color: "from-gold-300 to-gold-500",
  },
];

export default function CompatibilityPage() {
  const router = useRouter();
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
  const [error, setError] = useState<string>("");
  const [premiumRequired, setPremiumRequired] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    setError("");
    setPremiumRequired(false);
    try {
      // Enviamos apenas a cidade; o servidor geocodifica as coordenadas
      const response = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personA: person1, personB: person2 }),
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
        throw new Error(data?.error || "Falha ao calcular a compatibilidade");
      }

      if (data?.error) throw new Error(data.error);

      setResult(data.analysis);
      setStep(3);
    } catch (err) {
      console.error("Failed to calculate:", err);
      setError(
        "Não foi possível calcular a compatibilidade agora. Verifique os dados informados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumGate feature="compatibility">
    <div className="min-h-screen text-ink-200 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,92,255,0.08),transparent_60%)]" />
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gold-300/40 rounded-full"
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
          className="glass flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-ink-200 transition-colors hover:border-gold-400/50 hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
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
              className="w-20 h-20 text-gold-400 mx-auto"
              fill="currentColor"
            />
          </motion.div>

          <h1 className="font-display text-5xl md:text-7xl font-semibold mb-4 text-ink-50">
            Love <span className="text-gold">Compatibility</span>
          </h1>
          <p className="text-xl text-ink-400 max-w-2xl mx-auto">
            Discover the depth of your connection through the ancient wisdom of
            the stars.
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
                      ? "bg-gradient-to-r from-gold-300 to-gold-500 text-night-900"
                      : "bg-white/5 text-ink-600 border border-white/10"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s
                        ? "bg-gradient-to-r from-gold-300 to-gold-500"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-ink-600">
            <span>Person 1</span>
            <span>Person 2</span>
            <span>Result</span>
          </div>
        </div>

        {/* Zodiac Signs Section */}
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
                className="w-[600px] h-[600px] opacity-[0.08]"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    fill="none"
                    className="text-gold-400"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    fill="none"
                    className="text-gold-400"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    fill="none"
                    className="text-gold-400"
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
                        className="text-gold-400"
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
                  className="w-16 h-16 text-gold-400 mx-auto"
                  fill="currentColor"
                />
              </motion.div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4 text-ink-50">
                The 12 Zodiac <span className="text-gold">Signs</span>
              </h2>
              <p className="text-lg text-ink-400 max-w-2xl mx-auto">
                Explore the unique traits of each sign and their most harmonious
                matches for lasting love.
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

                  <div className="relative glass rounded-2xl p-6 border border-white/5 hover:border-gold-400/40 transition-all duration-300 hover:scale-105 hover:shadow-gold cursor-pointer h-full flex flex-col">
                    {/* Sign glyph */}
                    <div className="text-center mb-4">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="text-6xl mb-2 inline-block text-gold"
                      >
                        {sign.emoji}
                      </motion.div>
                      <h3 className="text-2xl font-semibold text-ink-50">
                        {sign.name}
                      </h3>
                      <p className="text-sm text-ink-600 mt-1">{sign.dates}</p>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 border border-gold-400/30 bg-gold-400/10 text-gold-300">
                        {sign.element}
                      </div>
                    </div>

                    {/* Traits */}
                    <div className="mb-4 flex-grow">
                      <p className="text-xs text-ink-600 mb-2 font-semibold uppercase tracking-wide">
                        Traits
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sign.traits.map((trait, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-white/5 text-ink-200 rounded-lg border border-white/10"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Perfect Matches */}
                    <div className="mt-auto">
                      <div className="border-t border-white/5 pt-3">
                        <p className="text-xs text-ink-600 mb-2 font-semibold uppercase tracking-wide">
                          Perfect Matches
                        </p>
                        <div className="space-y-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {sign.perfectMatches.map((match, i) => (
                            <div
                              key={i}
                              className="text-sm text-gold-300 flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
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

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-8 max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center text-red-200"
          >
            <p>{error}</p>
            {premiumRequired && (
              <Link
                href="/cart?plan=premium"
                className="btn-gold mt-3 inline-block rounded-full px-6 py-2 text-sm font-semibold"
              >
                Assinar Premium Ilimitado — US$ 29,90/mês
              </Link>
            )}
          </motion.div>
        )}

        {/* Forms */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <PersonForm
              key="person1"
              person={person1}
              setPerson={setPerson1}
              title="First Person"
              subtitle="Your birth details"
              onNext={() => setStep(2)}
              icon={Heart}
            />
          )}

          {step === 2 && (
            <PersonForm
              key="person2"
              person={person2}
              setPerson={setPerson2}
              title="Second Person"
              subtitle="Your partner's birth details"
              onNext={handleCalculate}
              onBack={() => setStep(1)}
              loading={loading}
              icon={Users}
            />
          )}

          {step === 3 && result && (
            <ResultScreen
              key="result"
              result={result}
              person1Name={person1.name || "Person 1"}
              person2Name={person2.name || "Person 2"}
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
    </PremiumGate>
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
  icon: Icon,
}: {
  person: Partial<PersonData>;
  setPerson: (p: Partial<PersonData>) => void;
  title: string;
  subtitle: string;
  onNext: () => void;
  onBack?: () => void;
  loading?: boolean;
  icon: LucideIcon;
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
      <div className="glass glass-gold rounded-3xl p-8 md:p-12">
        <div className="text-center mb-8">
          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10">
            <Icon className="h-8 w-8 text-gold-300" />
          </span>
          <h2 className="font-display text-3xl font-semibold mb-2 text-ink-50">
            {title}
          </h2>
          <p className="text-ink-400">{subtitle}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-ink-200">
              Full Name
            </label>
            <input
              type="text"
              value={person.name}
              onChange={(e) => setPerson({ ...person, name: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
              placeholder="Enter name"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-ink-200">
                Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={person.day || ""}
                onChange={(e) =>
                  setPerson({ ...person, day: parseInt(e.target.value) })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-ink-200">
                Month
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={person.month || ""}
                onChange={(e) =>
                  setPerson({ ...person, month: parseInt(e.target.value) })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                placeholder="05"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-ink-200">
                Year
              </label>
              <input
                type="number"
                min="1900"
                max="2025"
                value={person.year || ""}
                onChange={(e) =>
                  setPerson({ ...person, year: parseInt(e.target.value) })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                placeholder="1990"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-ink-200">
                Hour
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={person.hour !== undefined ? person.hour : ""}
                onChange={(e) =>
                  setPerson({ ...person, hour: parseInt(e.target.value) })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                placeholder="14"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-ink-200">
                Minute
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={person.minute !== undefined ? person.minute : ""}
                onChange={(e) =>
                  setPerson({ ...person, minute: parseInt(e.target.value) })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-ink-200">
              City of Birth
            </label>
            <input
              type="text"
              value={person.city}
              onChange={(e) => setPerson({ ...person, city: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
              placeholder="São Paulo"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-ghost flex-1 rounded-full py-4 font-semibold"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!isValid || loading}
            className="btn-gold flex-1 rounded-full py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                {onBack ? "Calculate Compatibility" : "Continue"}
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
  const scoreBreakdown: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: "Love", value: result.love, Icon: Heart },
    { label: "Communication", value: result.communication, Icon: MessageCircle },
    { label: "Values", value: result.values, Icon: Gem },
    { label: "Long-Term", value: result.longTerm, Icon: InfinityIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Score Card */}
      <div className="glass glass-gold rounded-3xl p-8 md:p-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-8"
        >
          <div className="text-8xl font-display font-semibold text-gold mb-4">
            {result.overall}%
          </div>
          <div className="flex items-center justify-center gap-3 text-2xl text-ink-200">
            <span>{person1Name}</span>
            <Heart className="w-8 h-8 text-gold-400" fill="currentColor" />
            <span>{person2Name}</span>
          </div>
        </motion.div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {scoreBreakdown.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass rounded-2xl p-5 border border-white/5"
            >
              <item.Icon className="mx-auto mb-2 h-6 w-6 text-gold-300" />
              <div className="text-2xl font-bold text-gold">{item.value}%</div>
              <div className="text-sm text-ink-400">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-3xl p-8 md:p-12 border-white/5 space-y-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-gold-300" />
          <h2 className="font-display text-2xl font-semibold text-ink-50">
            Full Analysis
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-gold-300 mb-3">
              Strengths
            </h3>
            <ul className="space-y-2">
              {result.synastry_analysis.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-ink-200">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-amethyst-300 mb-3">
              Challenges
            </h3>
            <ul className="space-y-2">
              {result.synastry_analysis.challenges.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-ink-200">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amethyst-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-ink-50 mb-2">
              Emotional Connection
            </h3>
            <p className="text-ink-400">
              {result.synastry_analysis.emotional_connection}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-50 mb-2">Chemistry</h3>
            <p className="text-ink-400">
              {result.synastry_analysis.sexual_chemistry}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-50 mb-2">
              Communication
            </h3>
            <p className="text-ink-400">
              {result.synastry_analysis.communication_style}
            </p>
          </div>
        </div>

        <div className="glass glass-gold rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-ink-50 mb-3">
            Final Verdict
          </h3>
          <p className="text-ink-200 italic">{result.final_verdict}</p>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onReset}
          className="btn-ghost flex-1 rounded-full py-4 font-semibold"
        >
          New Analysis
        </button>
        <Link
          href="/auth/register"
          className="btn-gold flex-1 rounded-full py-4 font-semibold text-center"
        >
          Save Result (Create Account)
        </Link>
      </div>
    </motion.div>
  );
}
