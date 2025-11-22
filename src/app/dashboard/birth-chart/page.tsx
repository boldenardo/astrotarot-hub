"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Moon,
  Sun,
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Info,
  User,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import { trackPageView } from "@/lib/analytics";

interface PlanetData {
  sign: string;
  degree: number;
  house: number;
  retrograde?: boolean;
}

interface HouseData {
  sign: string;
  degree: number;
}

interface FullChartData {
  sun: { sign: string; house: number; interpretation: string };
  moon: { sign: string; house: number; interpretation: string };
  ascendant: { sign: string; interpretation: string };
  interpretation: string;
  raw_data?: {
    planets: Record<string, PlanetData>;
    houses: Record<string, HouseData>;
  };
}

const planetSymbols: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  Chiron: "⚷",
  Lilith: "⚸",
  Node: "☊",
};

const planetNamesPT: Record<string, string> = {
  Sun: "Sol",
  Moon: "Lua",
  Mercury: "Mercúrio",
  Venus: "Vênus",
  Mars: "Marte",
  Jupiter: "Júpiter",
  Saturn: "Saturno",
  Uranus: "Urano",
  Neptune: "Netuno",
  Pluto: "Plutão",
  Chiron: "Quíron",
  Lilith: "Lilith",
  Node: "Nodo Norte",
};

export default function BirthChartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<FullChartData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"planets" | "houses">("planets");

  useEffect(() => {
    trackPageView("/dashboard/birth-chart", "Full Birth Chart");

    async function loadChartData() {
      try {
        const authUser = await getCurrentUser();
        if (!authUser) {
          router.push("/auth/login");
          return;
        }

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", authUser.id)
          .single();

        if (profileError) throw profileError;
        setUserData(profile);

        // Buscar mapa astral salvo
        const { data: chart, error: chartError } = await supabase
          .from("birth_charts")
          .select("chart_data, transits")
          .eq("user_id", profile.id)
          .single();

        if (chart) {
          setChartData({
            ...chart.chart_data,
            raw_data: chart.transits,
          });
        } else {
          // Se não tiver mapa, redirecionar para dashboard para gerar
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Erro ao carregar mapa:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChartData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando seu mapa completo...</p>
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-4"
          >
            <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-400 bg-clip-text text-transparent mb-4">
              Seu Mapa Astral Completo
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" /> {userData?.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />{" "}
                {new Date(userData?.birth_date).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {userData?.birth_time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {userData?.birth_location}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Main Interpretation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-3xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Essência Cósmica
          </h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            {chartData.interpretation}
          </p>
        </motion.div>

        {/* Big Three */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 border border-yellow-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-yellow-400">
              <Sun className="w-8 h-8" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Sol
                </p>
                <p className="text-xl font-bold">{chartData.sun.sign}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {chartData.sun.interpretation}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 border border-blue-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-blue-300">
              <Moon className="w-8 h-8" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Lua
                </p>
                <p className="text-xl font-bold">{chartData.moon.sign}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {chartData.moon.interpretation}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/50 border border-purple-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-purple-400">
              <span className="text-3xl font-serif">↑</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Ascendente
                </p>
                <p className="text-xl font-bold">{chartData.ascendant.sign}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {chartData.ascendant.interpretation}
            </p>
          </motion.div>
        </div>

        {/* Detailed Data Tabs */}
        {chartData.raw_data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
              <button
                onClick={() => setActiveTab("planets")}
                className={`pb-2 px-4 font-semibold transition-colors ${
                  activeTab === "planets"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Planetas
              </button>
              <button
                onClick={() => setActiveTab("houses")}
                className={`pb-2 px-4 font-semibold transition-colors ${
                  activeTab === "houses"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Casas
              </button>
            </div>

            <div className="bg-gray-900/30 rounded-3xl overflow-hidden border border-gray-800">
              {activeTab === "planets" && (
                <div className="divide-y divide-gray-800">
                  {Object.entries(chartData.raw_data.planets).map(
                    ([key, planet]) => (
                      <div
                        key={key}
                        className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl text-yellow-400">
                            {planetSymbols[key] || "•"}
                          </div>
                          <div>
                            <p className="font-bold text-white">
                              {planetNamesPT[key] || key}
                            </p>
                            <p className="text-xs text-gray-500">
                              Casa {planet.house}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-300">
                            {planet.sign}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.floor(planet.degree)}°{" "}
                            {Math.round((planet.degree % 1) * 60)}{"'"}{planet.retrograde && " (R)"}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {activeTab === "houses" && (
                <div className="divide-y divide-gray-800">
                  {Object.entries(chartData.raw_data.houses).map(
                    ([key, house]) => (
                      <div
                        key={key}
                        className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                            {key}
                          </div>
                          <div>
                            <p className="font-bold text-white">Casa {key}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-300">
                            {house.sign}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.floor(house.degree)}°{" "}
                            {Math.round((house.degree % 1) * 60)}{"'"}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
