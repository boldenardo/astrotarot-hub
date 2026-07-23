"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Moon,
  Sun,
  ArrowLeft,
  ArrowUp,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  User,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyProfile, type MeProfile } from "@/lib/client/me";
import { trackPageView } from "@/lib/analytics";
import PremiumGate from "@/components/PremiumGate";

interface PlanetData {
  name?: string;
  sign: string;
  house: number;
  full_degree?: number;
  norm_degree?: number;
  is_retro?: boolean | string;
}

interface HouseData {
  house?: number;
  sign: string;
  degree: number;
}

interface FullChartData {
  sun: { sign: string; house: number; interpretation: string };
  moon: { sign: string; house: number; interpretation: string };
  ascendant: { sign: string; interpretation: string };
  interpretation: string;
  raw_data?: {
    planets: PlanetData[];
    houses: HouseData[];
  };
}

// Normalizes names (strip accents, lowercase) to match pt/en keys
function stripAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Two-letter typographic abbreviations (no unicode glyphs — they render
// inconsistently across devices). Keys stay pt+en normalized.
const planetAbbreviations: Record<string, string> = {
  sun: "Su",
  sol: "Su",
  moon: "Mo",
  lua: "Mo",
  mercury: "Me",
  mercurio: "Me",
  venus: "Ve",
  mars: "Ma",
  marte: "Ma",
  jupiter: "Ju",
  saturn: "Sa",
  saturno: "Sa",
  uranus: "Ur",
  urano: "Ur",
  neptune: "Ne",
  netuno: "Ne",
  pluto: "Pl",
  plutao: "Pl",
  node: "No",
  nodo: "No",
  chiron: "Ch",
  quiron: "Ch",
  fortuna: "Fo",
  lilith: "Li",
};

const planetNames: Record<string, string> = {
  sun: "Sun",
  sol: "Sun",
  moon: "Moon",
  lua: "Moon",
  mercury: "Mercury",
  mercurio: "Mercury",
  venus: "Venus",
  mars: "Mars",
  marte: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  saturno: "Saturn",
  uranus: "Uranus",
  urano: "Uranus",
  neptune: "Neptune",
  netuno: "Neptune",
  pluto: "Pluto",
  plutao: "Pluto",
  node: "North Node",
  nodo: "North Node",
  chiron: "Chiron",
  quiron: "Chiron",
  fortuna: "Fortune",
  lilith: "Lilith",
};

export default function BirthChartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<FullChartData | null>(null);
  const [userData, setUserData] = useState<MeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"planets" | "houses">("planets");

  useEffect(() => {
    trackPageView("/dashboard/birth-chart", "Full Birth Chart");

    async function loadChartData() {
      try {
        const profile = await getMyProfile();
        if (!profile) {
          router.push("/auth/login");
          return;
        }

        // Missing complete birth data: go back to the dashboard to fill it in
        if (
          !profile.birth_date ||
          !profile.birth_time ||
          !profile.birth_location
        ) {
          router.push("/dashboard");
          return;
        }

        setUserData(profile);

        // The client doesn't read birth_charts directly (RLS). We generate the
        // chart via the authenticated route, which returns interpreted data.
        const chartResponse = await fetch("/api/birth-chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthDate: profile.birth_date,
            birthTime: profile.birth_time,
            birthLocation: profile.birth_location,
            name: profile.name,
          }),
        });

        if (chartResponse.status === 401) {
          router.push("/auth/login");
          return;
        }

        if (chartResponse.ok) {
          const chart = (await chartResponse.json()) as FullChartData;
          setChartData(chart);
        } else {
          // No access or failure: go back to the dashboard
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to load the chart:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChartData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-400 animate-spin mx-auto mb-4" />
          <p className="text-ink-400">Loading your full chart...</p>
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  return (
    <PremiumGate feature="birth_chart">
      <div className="min-h-screen text-ink-200 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,92,255,0.1),transparent_60%)]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-ink-400 hover:text-ink-50 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block mb-4"
            >
              <Star className="w-12 h-12 text-gold-300 mx-auto mb-4" />
              <h1 className="font-display text-3xl md:text-5xl font-semibold text-ink-50 mb-4">
                Your Full <span className="text-gold">Birth Chart</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ink-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-gold-300" /> {userData?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gold-300" />{" "}
                  {userData?.birth_date
                    ? new Date(userData.birth_date).toLocaleDateString("en-US")
                    : "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gold-300" />{" "}
                  {userData?.birth_time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gold-300" />{" "}
                  {userData?.birth_location}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Main interpretation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass glass-gold rounded-3xl p-6 sm:p-8 mb-12"
          >
            <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 shrink-0 text-gold-300" />
              Cosmic Essence
            </h2>
            <p className="text-ink-300 leading-relaxed text-base sm:text-lg break-words">
              {chartData.interpretation}
            </p>
          </motion.div>

          {/* The Big Three */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-6 border-white/5"
            >
              <div className="flex items-center gap-3 mb-4 text-gold-300">
                <Sun className="w-8 h-8" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                    Sun
                  </p>
                  <p className="text-xl font-semibold text-ink-50">
                    {chartData.sun.sign}
                  </p>
                </div>
              </div>
              <p className="text-sm text-ink-400">
                {chartData.sun.interpretation}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-6 border-white/5"
            >
              <div className="flex items-center gap-3 mb-4 text-amethyst-300">
                <Moon className="w-8 h-8" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                    Moon
                  </p>
                  <p className="text-xl font-semibold text-ink-50">
                    {chartData.moon.sign}
                  </p>
                </div>
              </div>
              <p className="text-sm text-ink-400">
                {chartData.moon.interpretation}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-3xl p-6 border-white/5"
            >
              <div className="flex items-center gap-3 mb-4 text-ink-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-gold-300">
                  <ArrowUp className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                    Ascendant
                  </p>
                  <p className="text-xl font-semibold text-ink-50">
                    {chartData.ascendant.sign}
                  </p>
                </div>
              </div>
              <p className="text-sm text-ink-400">
                {chartData.ascendant.interpretation}
              </p>
            </motion.div>
          </div>

          {/* Tabs with detailed data */}
          {chartData.raw_data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab("planets")}
                  className={`pb-2 px-4 font-semibold transition-colors ${
                    activeTab === "planets"
                      ? "text-gold-300 border-b-2 border-gold-400"
                      : "text-ink-600 hover:text-ink-300"
                  }`}
                >
                  Planets
                </button>
                <button
                  onClick={() => setActiveTab("houses")}
                  className={`pb-2 px-4 font-semibold transition-colors ${
                    activeTab === "houses"
                      ? "text-gold-300 border-b-2 border-gold-400"
                      : "text-ink-600 hover:text-ink-300"
                  }`}
                >
                  Houses
                </button>
              </div>

              <div className="glass rounded-3xl overflow-hidden border-white/5">
                {activeTab === "planets" && (
                  <div className="divide-y divide-white/5">
                    {chartData.raw_data.planets.map((planet, i) => {
                      const k = stripAccents(planet.name ?? "");
                      const deg =
                        typeof planet.norm_degree === "number"
                          ? planet.norm_degree
                          : 0;
                      const retro =
                        planet.is_retro === true ||
                        planet.is_retro === "true";
                      return (
                        <div
                          key={i}
                          className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-night-800 border border-gold-400/30 flex items-center justify-center font-display font-semibold text-sm text-gold-300">
                              {planetAbbreviations[k] ||
                                (planet.name || "?").slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-50 text-sm sm:text-base break-words">
                                {planetNames[k] || planet.name || "—"}
                              </p>
                              <p className="text-xs text-ink-600">
                                House {planet.house}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-gold-300 text-sm sm:text-base">
                              {planet.sign}
                            </p>
                            <p className="text-xs text-ink-600">
                              {Math.floor(deg)}°{" "}
                              {Math.round((deg % 1) * 60)}
                              {"'"}
                              {retro && " (R)"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "houses" && (
                  <div className="divide-y divide-white/5">
                    {chartData.raw_data.houses.map((house, i) => {
                      const num = house.house ?? i + 1;
                      const deg =
                        typeof house.degree === "number" ? house.degree : 0;
                      return (
                        <div
                          key={i}
                          className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-night-800 flex items-center justify-center font-bold leading-none text-ink-400">
                              {num}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-50 text-sm sm:text-base">
                                House {num}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-gold-300 text-sm sm:text-base">
                              {house.sign}
                            </p>
                            <p className="text-xs text-ink-600">
                              {Math.floor(deg)}°{" "}
                              {Math.round((deg % 1) * 60)}
                              {"'"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PremiumGate>
  );
}
