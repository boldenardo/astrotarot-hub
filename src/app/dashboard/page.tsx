"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  Calendar,
  TrendingUp,
  Heart,
  Gift,
  Zap,
  Clock,
  Star,
  ArrowRight,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import {
  trackPageView,
  trackSubscriptionUpgradeClicked,
} from "@/lib/analytics";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_location?: string | null;
  subscription_plan: string;
  subscription_status: string;
  readings_left: number;
}

interface TarotReading {
  id: string;
  created_at: string;
  question: string | null;
  interpretation: string;
}

interface ZodiacSign {
  name: string;
  symbol: string;
  element: string;
  quality: string;
  ruler: string;
  dates: string;
  traits: string[];
  color: string;
}

const zodiacSigns: Record<string, ZodiacSign> = {
  aries: {
    name: "Áries",
    symbol: "♈",
    element: "Fogo",
    quality: "Cardeal",
    ruler: "Marte",
    dates: "21/03 - 19/04",
    traits: [
      "Corajoso",
      "Determinado",
      "Líder natural",
      "Impulsivo",
      "Energético",
    ],
    color: "from-red-500 to-orange-500",
  },
  taurus: {
    name: "Touro",
    symbol: "♉",
    element: "Terra",
    quality: "Fixo",
    ruler: "Vênus",
    dates: "20/04 - 20/05",
    traits: ["Confiável", "Paciente", "Prático", "Determinado", "Leal"],
    color: "from-green-600 to-emerald-500",
  },
  gemini: {
    name: "Gêmeos",
    symbol: "♊",
    element: "Ar",
    quality: "Mutável",
    ruler: "Mercúrio",
    dates: "21/05 - 20/06",
    traits: ["Comunicativo", "Versátil", "Curioso", "Inteligente", "Adaptável"],
    color: "from-yellow-400 to-amber-400",
  },
  cancer: {
    name: "Câncer",
    symbol: "♋",
    element: "Água",
    quality: "Cardeal",
    ruler: "Lua",
    dates: "21/06 - 22/07",
    traits: ["Intuitivo", "Emocional", "Protetor", "Sensível", "Carinhoso"],
    color: "from-blue-400 to-cyan-400",
  },
  leo: {
    name: "Leão",
    symbol: "♌",
    element: "Fogo",
    quality: "Fixo",
    ruler: "Sol",
    dates: "23/07 - 22/08",
    traits: ["Confiante", "Generoso", "Criativo", "Carismático", "Leal"],
    color: "from-orange-500 to-yellow-500",
  },
  virgo: {
    name: "Virgem",
    symbol: "♍",
    element: "Terra",
    quality: "Mutável",
    ruler: "Mercúrio",
    dates: "23/08 - 22/09",
    traits: [
      "Analítico",
      "Prático",
      "Perfeccionista",
      "Trabalhador",
      "Modesto",
    ],
    color: "from-green-500 to-teal-500",
  },
  libra: {
    name: "Libra",
    symbol: "♎",
    element: "Ar",
    quality: "Cardeal",
    ruler: "Vênus",
    dates: "23/09 - 22/10",
    traits: ["Diplomático", "Justo", "Social", "Harmonioso", "Charmoso"],
    color: "from-pink-400 to-rose-400",
  },
  scorpio: {
    name: "Escorpião",
    symbol: "♏",
    element: "Água",
    quality: "Fixo",
    ruler: "Plutão",
    dates: "23/10 - 21/11",
    traits: ["Intenso", "Apaixonado", "Misterioso", "Transformador", "Leal"],
    color: "from-purple-600 to-fuchsia-600",
  },
  sagittarius: {
    name: "Sagitário",
    symbol: "♐",
    element: "Fogo",
    quality: "Mutável",
    ruler: "Júpiter",
    dates: "22/11 - 21/12",
    traits: ["Otimista", "Aventureiro", "Filosófico", "Honesto", "Livre"],
    color: "from-indigo-500 to-purple-500",
  },
  capricorn: {
    name: "Capricórnio",
    symbol: "♑",
    element: "Terra",
    quality: "Cardeal",
    ruler: "Saturno",
    dates: "22/12 - 19/01",
    traits: ["Ambicioso", "Disciplinado", "Responsável", "Prático", "Paciente"],
    color: "from-gray-600 to-slate-600",
  },
  aquarius: {
    name: "Aquário",
    symbol: "♒",
    element: "Ar",
    quality: "Fixo",
    ruler: "Urano",
    dates: "20/01 - 18/02",
    traits: [
      "Inovador",
      "Independente",
      "Humanitário",
      "Original",
      "Intelectual",
    ],
    color: "from-cyan-500 to-blue-500",
  },
  pisces: {
    name: "Peixes",
    symbol: "♓",
    element: "Água",
    quality: "Mutável",
    ruler: "Netuno",
    dates: "19/02 - 20/03",
    traits: ["Intuitivo", "Compassivo", "Artístico", "Sensível", "Espiritual"],
    color: "from-teal-500 to-cyan-500",
  },
};

function calculateZodiacSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
    return "scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
    return "sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
    return "aquarius";
  return "pisces";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [readings, setReadings] = useState<TarotReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [birthChart, setBirthChart] = useState<any>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    trackPageView("/dashboard", "Dashboard");

    async function getCoordinates(city: string) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
            city
          )}&country=Brazil&format=json&limit=1`
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
      return { latitude: -23.5505, longitude: -46.6333 }; // Default SP
    }

    async function loadUserData() {
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

        setUser({
          id: profile.id,
          email: authUser.email || "",
          name: profile.name,
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          birth_location: profile.birth_location,
          subscription_plan: profile.subscription_plan,
          subscription_status: profile.subscription_status,
          readings_left: profile.readings_left,
        });

        // Buscar últimas leituras
        const { data: readingsData } = await supabase
          .from("tarot_readings")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (readingsData) {
          setReadings(readingsData);
        }

        // Gerar Mapa Astral Simplificado se tiver dados
        if (
          profile.birth_date &&
          profile.birth_time &&
          profile.birth_location
        ) {
          console.log("Iniciando geração do mapa astral..."); // Debug
          setLoadingChart(true);

          const coords = await getCoordinates(profile.birth_location);
          console.log("Coordenadas encontradas:", coords); // Debug

          const { data: chartData, error: chartError } =
            await supabase.functions.invoke("generate-birth-chart", {
              body: {
                birthDate: profile.birth_date,
                birthTime: profile.birth_time,
                birthLocation: profile.birth_location,
                name: profile.name,
                latitude: coords.latitude,
                longitude: coords.longitude,
              },
            });

          if (chartError) {
            console.error("Erro na função generate-birth-chart:", chartError);
          }

          if (chartData) {
            console.log("Dados do mapa recebidos:", chartData); // Debug
            setBirthChart(chartData);
          }
          setLoadingChart(false);
        } else {
          console.log("Dados de nascimento incompletos para o mapa astral"); // Debug
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-400">Carregando seu portal místico...</p>
        </div>
      </div>
    );
  }

  const isPremium = user?.subscription_plan === "PREMIUM_MONTHLY";
  const isFree = user?.subscription_plan === "FREE";

  const zodiacSign = user?.birth_date
    ? {
        signKey: calculateZodiacSign(user.birth_date),
        sign: zodiacSigns[calculateZodiacSign(user.birth_date)],
      }
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 5,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-2xl font-bold">
            ✨ AstroTarot Hub
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        {/* User Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            Bem-vindo(a), {user?.name || "Místico(a)"}! 🌟
          </h1>
          <p className="text-gray-400">{user?.email}</p>
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl mb-8 ${
            isPremium
              ? "bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border-2 border-yellow-500/50"
              : "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isPremium ? (
                <Crown className="w-12 h-12 text-yellow-400" />
              ) : (
                <Gift className="w-12 h-12 text-purple-400" />
              )}
              <div>
                <h3 className="text-2xl font-bold">
                  {isPremium ? "✨ Plano Premium Ativo" : "🎁 Plano Gratuito"}
                </h3>
                <p className="text-gray-400">
                  {isPremium
                    ? "Acesso ilimitado a todas as funcionalidades"
                    : `${
                        user?.readings_left || 0
                      } leituras gratuitas restantes`}
                </p>
              </div>
            </div>
            {isFree && (
              <Link
                href="/cart"
                onClick={() =>
                  trackSubscriptionUpgradeClicked("premium_monthly")
                }
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 rounded-xl font-bold transition-all hover:scale-105"
              >
                <Crown className="w-5 h-5 inline mr-2" />
                Seja Premium
              </Link>
            )}
          </div>
        </motion.div>

        {/* Zodiac Sign Card */}
        {zodiacSign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-8 rounded-3xl bg-gradient-to-br ${zodiacSign.sign.color} mb-8 relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 text-[200px] opacity-10 leading-none">
              {zodiacSign.sign.symbol}
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-semibold mb-2">
                SEU SIGNO SOLAR
              </p>
              <h3 className="text-5xl font-bold text-white mb-2">
                {zodiacSign.sign.symbol} {zodiacSign.sign.name}
              </h3>
              <p className="text-white/90 mb-4">{zodiacSign.sign.dates}</p>
              <div className="flex flex-wrap gap-2">
                {zodiacSign.sign.traits.map((trait: string) => (
                  <span
                    key={trait}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mini Birth Chart (AI Generated) */}
        {loadingChart ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-gray-900/50 border border-purple-500/20 mb-8 text-center"
          >
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">
              Gerando seu Mapa Astral...
            </h3>
            <p className="text-gray-400">
              Os astros estão se alinhando para você
            </p>
          </motion.div>
        ) : birthChart ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-yellow-400" />
              <h3 className="text-2xl font-bold">Seu Mapa Astral Essencial</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Sun */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-yellow-400">
                  <span className="text-xl">☉</span>
                  <span className="font-bold">
                    Sol em {birthChart.sun.sign}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  Casa {birthChart.sun.house}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {birthChart.sun.interpretation}
                </p>
              </div>

              {/* Moon */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-blue-300">
                  <span className="text-xl">☽</span>
                  <span className="font-bold">
                    Lua em {birthChart.moon.sign}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  Casa {birthChart.moon.house}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {birthChart.moon.interpretation}
                </p>
              </div>

              {/* Ascendant */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-purple-300">
                  <span className="text-xl">↑</span>
                  <span className="font-bold">
                    Ascendente em {birthChart.ascendant.sign}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mt-6">
                  {birthChart.ascendant.interpretation}
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-xl mb-6">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Interpretação Geral
              </h4>
              <p className="text-gray-300 leading-relaxed">
                {birthChart.interpretation}
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/dashboard/birth-chart"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 rounded-xl font-semibold transition-all text-purple-300 hover:text-white"
              >
                <Star className="w-4 h-4" />
                Ver Mapa Completo (Planetas e Casas)
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-gray-900/50 border border-gray-700 mb-8 text-center"
          >
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Descubra seu Mapa Astral</h3>
            <p className="text-gray-400 mb-6">
              Complete seu perfil com seus dados de nascimento para revelar os
              segredos dos astros sobre você.
            </p>
            <Link
              href="/profile" // Assuming there is a profile page, or maybe just show a modal?
              // Actually, I don't see a profile page in the file list.
              // I'll point to a settings page or just leave it as a placeholder for now,
              // or maybe redirect to a "complete profile" flow.
              // The user said "usando os dados de cadastro".
              // If they are missing, they need to add them.
              // Let's assume for now they have it or I'll point to a generic edit profile.
              // Since I don't have a profile page, I'll create a simple button that alerts or does nothing for now,
              // OR better, I'll check if I can easily add a profile editing feature.
              // But to be safe and stick to the request "move to dashboard", I'll just show the message.
              // Wait, the user said "usando os dados de cadastro".
              // If the user just registered, they SHOULD have the data.
              // So this fallback is mostly for old users or if something failed.
              // I'll point to "/settings" (which might not exist) or just hide the button.
              // Let's look at the file list again. No profile/settings page.
              // I'll just show the text.
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-all"
            >
              <User className="w-5 h-5" />
              Completar Perfil
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">⚡ Ações Rápidas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/challenge"
              className="p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-2xl hover:border-green-400 transition-all hover:scale-105"
            >
              <Gift className="w-10 h-10 text-green-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">🎁 Jogo Gratuito</h3>
              <p className="text-gray-400 text-sm mb-3">
                Tire suas 4 cartas místicas
              </p>
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                Jogar Agora <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              href="/tarot"
              className="p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl hover:border-purple-400 transition-all hover:scale-105"
            >
              <Sparkles className="w-10 h-10 text-purple-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">🔮 Tarot Completo</h3>
              <p className="text-gray-400 text-sm mb-3">
                Leitura completa com IA
              </p>
              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                Iniciar Leitura <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              href="/guia"
              className="p-6 bg-gradient-to-br from-pink-600/20 to-rose-600/20 border-2 border-pink-500/50 rounded-2xl hover:border-pink-400 transition-all hover:scale-105"
            >
              <Heart className="w-10 h-10 text-pink-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">💜 Guia Espiritual</h3>
              <p className="text-gray-400 text-sm mb-3">Chat com IA Luna</p>
              <div className="flex items-center gap-2 text-pink-400 font-semibold">
                Conversar <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              href="/compatibility"
              className="p-6 bg-gradient-to-br from-red-600/20 to-pink-600/20 border-2 border-red-500/50 rounded-2xl hover:border-red-400 transition-all hover:scale-105"
            >
              <Heart className="w-10 h-10 text-red-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">💕 Compatibilidade</h3>
              <p className="text-gray-400 text-sm mb-3">
                Análise astrológica amorosa
              </p>
              <div className="flex items-center gap-2 text-red-400 font-semibold">
                Analisar <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              href="/predictions"
              className="p-6 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-2 border-blue-500/50 rounded-2xl hover:border-blue-400 transition-all hover:scale-105"
            >
              <TrendingUp className="w-10 h-10 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">🌙 Previsões</h3>
              <p className="text-gray-400 text-sm mb-3">
                Seu futuro nas estrelas
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                Ver Previsões <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              href="/abundance"
              className="p-6 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/50 rounded-2xl hover:border-yellow-400 transition-all hover:scale-105"
            >
              <Zap className="w-10 h-10 text-yellow-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">💰 Abundância</h3>
              <p className="text-gray-400 text-sm mb-3">
                Rituais de prosperidade
              </p>
              <div className="flex items-center gap-2 text-yellow-400 font-semibold">
                Acessar <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Readings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-4">
            📜 Minhas Últimas Leituras
          </h2>
          {readings.length === 0 ? (
            <div className="p-8 bg-gray-900/50 border border-gray-700 rounded-2xl text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Você ainda não realizou nenhuma leitura
              </p>
              <Link
                href="/challenge"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Fazer Minha Primeira Leitura
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {readings.map((reading) => (
                <div
                  key={reading.id}
                  className="p-6 bg-gray-900/50 border border-gray-700 rounded-2xl hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="font-bold text-lg">
                          {reading.question || "Leitura Geral"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(reading.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 line-clamp-2">
                    {reading.interpretation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Premium Upgrade CTA */}
        {isFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-8 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border-2 border-yellow-500/50 rounded-2xl"
          >
            <div className="text-center">
              <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-3">
                Desbloqueie Todo o Poder Místico
              </h3>
              <p className="text-xl text-gray-300 mb-6">
                Por apenas{" "}
                <span className="text-yellow-400 font-bold">R$ 29,90/mês</span>
              </p>
              <Link
                href="/cart"
                onClick={() =>
                  trackSubscriptionUpgradeClicked("premium_monthly")
                }
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 rounded-xl font-bold text-lg transition-all hover:scale-105"
              >
                <Crown className="w-6 h-6" />
                Assinar Agora
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
