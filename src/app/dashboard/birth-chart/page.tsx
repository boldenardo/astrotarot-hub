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
  User,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
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

// Normaliza nomes (remove acentos, minúsculas) para casar chaves pt/en
function stripAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const planetSymbols: Record<string, string> = {
  sun: "☉",
  sol: "☉",
  moon: "☽",
  lua: "☽",
  mercury: "☿",
  mercurio: "☿",
  venus: "♀",
  mars: "♂",
  marte: "♂",
  jupiter: "♃",
  saturn: "♄",
  saturno: "♄",
  uranus: "♅",
  urano: "♅",
  neptune: "♆",
  netuno: "♆",
  pluto: "♇",
  plutao: "♇",
  node: "☊",
  nodo: "☊",
  chiron: "⚷",
  quiron: "⚷",
  fortuna: "⊗",
  lilith: "⚸",
};

const planetNames: Record<string, string> = {
  sun: "Sol",
  sol: "Sol",
  moon: "Lua",
  lua: "Lua",
  mercury: "Mercúrio",
  mercurio: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  marte: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  saturno: "Saturno",
  uranus: "Urano",
  urano: "Urano",
  neptune: "Netuno",
  netuno: "Netuno",
  pluto: "Plutão",
  plutao: "Plutão",
  node: "Nodo Norte",
  nodo: "Nodo Norte",
  chiron: "Quíron",
  quiron: "Quíron",
  fortuna: "Fortuna",
  lilith: "Lilith",
};

export default function BirthChartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<FullChartData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"planets" | "houses">("planets");

  useEffect(() => {
    trackPageView("/dashboard/birth-chart", "Mapa Astral Completo");

    async function loadChartData() {
      try {
        const authUser = await getCurrentUser();
        if (!authUser) {
          router.push("/auth/login");
          return;
        }

        // Busca o perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", authUser.id)
          .single();

        if (profileError) throw profileError;
        setUserData(profile);

        // Busca o mapa astral salvo
        const { data: chart } = await supabase
          .from("birth_charts")
          .select("chart_data, transits")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (chart) {
          setChartData({
            ...chart.chart_data,
            raw_data: chart.transits,
          });
        } else {
          // Sem mapa salvo: volta ao dashboard para gerar um
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Falha ao carregar o mapa:", error);
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
          <p className="text-ink-400">Carregando seu mapa completo...</p>
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
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </Link>

          {/* Cabeçalho */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block mb-4"
            >
              <Star className="w-12 h-12 text-gold-300 mx-auto mb-4" />
              <h1 className="font-display text-3xl md:text-5xl font-semibold text-ink-50 mb-4">
                Seu <span className="text-gold">Mapa Astral</span> Completo
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ink-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-gold-300" /> {userData?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gold-300" />{" "}
                  {new Date(userData?.birth_date).toLocaleDateString("pt-BR")}
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

          {/* Interpretação principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass glass-gold rounded-3xl p-8 mb-12"
          >
            <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-gold-300" />
              Essência Cósmica
            </h2>
            <p className="text-ink-300 leading-relaxed text-lg">
              {chartData.interpretation}
            </p>
          </motion.div>

          {/* Os Três Grandes */}
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
                    Sol
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
                    Lua
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
                <span className="text-3xl font-serif">↑</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                    Ascendente
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

          {/* Abas com dados detalhados */}
          {chartData.raw_data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab("planets")}
                  className={`pb-2 px-4 font-semibold transition-colors ${
                    activeTab === "planets"
                      ? "text-gold-300 border-b-2 border-gold-400"
                      : "text-ink-600 hover:text-ink-300"
                  }`}
                >
                  Planetas
                </button>
                <button
                  onClick={() => setActiveTab("houses")}
                  className={`pb-2 px-4 font-semibold transition-colors ${
                    activeTab === "houses"
                      ? "text-gold-300 border-b-2 border-gold-400"
                      : "text-ink-600 hover:text-ink-300"
                  }`}
                >
                  Casas
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
                          className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-night-800 flex items-center justify-center text-xl text-gold-300">
                              {planetSymbols[k] || "•"}
                            </div>
                            <div>
                              <p className="font-semibold text-ink-50">
                                {planetNames[k] || planet.name || "—"}
                              </p>
                              <p className="text-xs text-ink-600">
                                Casa {planet.house}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gold-300">
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
                          className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-night-800 flex items-center justify-center font-bold text-ink-400">
                              {num}
                            </div>
                            <div>
                              <p className="font-semibold text-ink-50">
                                Casa {num}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gold-300">
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
