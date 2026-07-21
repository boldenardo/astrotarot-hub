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
  Star,
  ArrowRight,
  LogOut,
  User,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import { isPremium as isPremiumPlan } from "@/lib/plans";
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
}

const zodiacSigns: Record<string, ZodiacSign> = {
  aries: {
    name: "Áries",
    symbol: "♈",
    element: "Fogo",
    quality: "Cardinal",
    ruler: "Marte",
    dates: "21 Mar - 19 Abr",
    traits: ["Corajoso", "Determinado", "Líder nato", "Impulsivo", "Energético"],
  },
  taurus: {
    name: "Touro",
    symbol: "♉",
    element: "Terra",
    quality: "Fixo",
    ruler: "Vênus",
    dates: "20 Abr - 20 Mai",
    traits: ["Confiável", "Paciente", "Prático", "Determinado", "Leal"],
  },
  gemini: {
    name: "Gêmeos",
    symbol: "♊",
    element: "Ar",
    quality: "Mutável",
    ruler: "Mercúrio",
    dates: "21 Mai - 20 Jun",
    traits: ["Comunicativo", "Versátil", "Curioso", "Inteligente", "Adaptável"],
  },
  cancer: {
    name: "Câncer",
    symbol: "♋",
    element: "Água",
    quality: "Cardinal",
    ruler: "Lua",
    dates: "21 Jun - 22 Jul",
    traits: ["Intuitivo", "Emocional", "Protetor", "Sensível", "Acolhedor"],
  },
  leo: {
    name: "Leão",
    symbol: "♌",
    element: "Fogo",
    quality: "Fixo",
    ruler: "Sol",
    dates: "23 Jul - 22 Ago",
    traits: ["Confiante", "Generoso", "Criativo", "Carismático", "Leal"],
  },
  virgo: {
    name: "Virgem",
    symbol: "♍",
    element: "Terra",
    quality: "Mutável",
    ruler: "Mercúrio",
    dates: "23 Ago - 22 Set",
    traits: ["Analítico", "Prático", "Perfeccionista", "Trabalhador", "Modesto"],
  },
  libra: {
    name: "Libra",
    symbol: "♎",
    element: "Ar",
    quality: "Cardinal",
    ruler: "Vênus",
    dates: "23 Set - 22 Out",
    traits: ["Diplomático", "Justo", "Sociável", "Harmonioso", "Encantador"],
  },
  scorpio: {
    name: "Escorpião",
    symbol: "♏",
    element: "Água",
    quality: "Fixo",
    ruler: "Plutão",
    dates: "23 Out - 21 Nov",
    traits: ["Intenso", "Apaixonado", "Misterioso", "Transformador", "Leal"],
  },
  sagittarius: {
    name: "Sagitário",
    symbol: "♐",
    element: "Fogo",
    quality: "Mutável",
    ruler: "Júpiter",
    dates: "22 Nov - 21 Dez",
    traits: ["Otimista", "Aventureiro", "Filosófico", "Honesto", "Livre"],
  },
  capricorn: {
    name: "Capricórnio",
    symbol: "♑",
    element: "Terra",
    quality: "Cardinal",
    ruler: "Saturno",
    dates: "22 Dez - 19 Jan",
    traits: ["Ambicioso", "Disciplinado", "Responsável", "Prático", "Paciente"],
  },
  aquarius: {
    name: "Aquário",
    symbol: "♒",
    element: "Ar",
    quality: "Fixo",
    ruler: "Urano",
    dates: "20 Jan - 18 Fev",
    traits: ["Inovador", "Independente", "Humanitário", "Original", "Intelectual"],
  },
  pisces: {
    name: "Peixes",
    symbol: "♓",
    element: "Água",
    quality: "Mutável",
    ruler: "Netuno",
    dates: "19 Fev - 20 Mar",
    traits: ["Intuitivo", "Compassivo", "Artístico", "Sensível", "Espiritual"],
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
  const [showChartTeaser, setShowChartTeaser] = useState(false);

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
        console.error("Failed to fetch coordinates:", error);
      }
      return { latitude: -23.5505, longitude: -46.6333 }; // Padrão: São Paulo
    }

    async function loadUserData() {
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

        // Busca as leituras mais recentes
        const { data: readingsData } = await supabase
          .from("tarot_readings")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (readingsData) {
          setReadings(readingsData);
        }

        // Gera o mini mapa astral se os dados estiverem completos.
        // A rota /api/birth-chart agora exige Premium, então só buscamos
        // para assinantes; usuários FREE veem um teaser de upgrade.
        if (
          profile.birth_date &&
          profile.birth_time &&
          profile.birth_location
        ) {
          if (isPremiumPlan(profile)) {
            setLoadingChart(true);

            const coords = await getCoordinates(profile.birth_location);

            try {
              const chartResponse = await fetch("/api/birth-chart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  birthDate: profile.birth_date,
                  birthTime: profile.birth_time,
                  birthLocation: profile.birth_location,
                  name: profile.name,
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                }),
              });

              if (chartResponse.ok) {
                const chartData = await chartResponse.json();
                setBirthChart(chartData);
              } else if (chartResponse.status === 403) {
                // Assinatura expirada/sem acesso: mostra teaser sem erro
                setShowChartTeaser(true);
              } else {
                console.error(
                  "Falha ao gerar o mapa astral:",
                  chartResponse.status
                );
              }
            } catch (chartError) {
              console.error("Falha ao gerar o mapa astral:", chartError);
            }
            setLoadingChart(false);
          } else {
            // Usuário FREE: não chama a rota premium, exibe teaser
            setShowChartTeaser(true);
          }
        }
      } catch (error) {
        console.error("Falha ao carregar os dados:", error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-gold-400/40 border-t-gold-400 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-ink-400">Carregando seu portal místico...</p>
        </div>
      </div>
    );
  }

  const premium = isPremiumPlan(user);
  const isFree = !premium;

  const zodiacSign = user?.birth_date
    ? {
        signKey: calculateZodiacSign(user.birth_date),
        sign: zodiacSigns[calculateZodiacSign(user.birth_date)],
      }
    : null;

  const quickActions = [
    {
      href: "/challenge",
      icon: Gift,
      title: "Jogo Grátis",
      description: "Tire suas 4 cartas místicas",
      cta: "Jogar Agora",
      premiumOnly: false,
    },
    {
      href: "/tarot",
      icon: Sparkles,
      title: "Tarot Completo",
      description: "Leitura completa com IA",
      cta: "Iniciar Leitura",
      premiumOnly: false,
    },
    {
      href: "/guia",
      icon: Heart,
      title: "Guia Espiritual",
      description: "Converse com a Luna IA",
      cta: "Conversar",
      premiumOnly: false,
    },
    {
      href: "/compatibility",
      icon: Heart,
      title: "Compatibilidade",
      description: "Análise astrológica do amor",
      cta: "Analisar",
      premiumOnly: true,
    },
    {
      href: "/predictions",
      icon: TrendingUp,
      title: "Previsões",
      description: "Seu futuro nos astros",
      cta: "Ver Previsões",
      premiumOnly: true,
    },
    {
      href: "/abundance",
      icon: Zap,
      title: "Prosperidade",
      description: "Rituais de prosperidade",
      cta: "Abrir",
      premiumOnly: true,
    },
  ];

  return (
    <div className="min-h-screen text-ink-200">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,92,255,0.12),transparent_60%)]" />
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

      {/* Conteúdo */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-ink-50"
          >
            Astro<span className="text-gold">Tarot</span> Hub
          </Link>
          <button
            onClick={handleLogout}
            className="btn-ghost flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        {/* Boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl font-semibold text-ink-50 mb-2">
            Bem-vindo(a) de volta,{" "}
            <span className="text-gold">{user?.name || "Buscador(a)"}</span>
          </h1>
          <p className="text-ink-600">{user?.email}</p>
        </motion.div>

        {/* Status da assinatura */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass rounded-3xl p-6 mb-8 ${
            premium ? "glass-gold" : "border-white/5"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {premium ? (
                <Crown className="w-12 h-12 text-gold-300" />
              ) : (
                <Gift className="w-12 h-12 text-ink-300" />
              )}
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink-50">
                  {premium ? "Premium Ilimitado Ativo" : "Plano Gratuito"}
                </h3>
                <p className="text-ink-400">
                  {premium
                    ? "Leituras ilimitadas + todas as features"
                    : `${user?.readings_left || 0} leituras restantes`}
                </p>
              </div>
            </div>
            {isFree && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/cart?plan=pack5"
                  className="btn-ghost flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                >
                  <Sparkles className="w-4 h-4 text-gold-300" />
                  Pacote 5 Leituras — US$ 9,99
                </Link>
                <Link
                  href="/cart?plan=premium"
                  onClick={() =>
                    trackSubscriptionUpgradeClicked("premium_monthly")
                  }
                  className="btn-gold flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm"
                >
                  <Crown className="w-5 h-5" />
                  Premium Ilimitado — US$ 29,90/mês
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Card do signo */}
        {zodiacSign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass glass-gold rounded-3xl p-8 mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-[200px] leading-none text-gold-400/10">
              {zodiacSign.sign.symbol}
            </div>
            <div className="relative z-10">
              <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-2">
                Seu Signo Solar
              </p>
              <h3 className="font-display text-5xl font-semibold text-ink-50 mb-2">
                {zodiacSign.sign.symbol} {zodiacSign.sign.name}
              </h3>
              <p className="text-ink-400 mb-4">{zodiacSign.sign.dates}</p>
              <div className="flex flex-wrap gap-2">
                {zodiacSign.sign.traits.map((trait: string) => (
                  <span
                    key={trait}
                    className="px-3 py-1 rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-300 text-sm font-semibold"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mini mapa astral (gerado por IA) */}
        {loadingChart ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 border-white/5 mb-8 text-center"
          >
            <Sparkles className="w-8 h-8 text-gold-300 mx-auto mb-4 animate-pulse" />
            <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
              Gerando seu mapa astral...
            </h3>
            <p className="text-ink-400">Os astros estão se alinhando para você</p>
          </motion.div>
        ) : birthChart ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass glass-gold rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-gold-300" />
              <h3 className="font-display text-2xl font-semibold text-ink-50">
                Seu Mapa Astral Essencial
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Sol */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-gold-300">
                  <span className="text-xl">☉</span>
                  <span className="font-semibold">
                    Sol em {birthChart.sun.sign}
                  </span>
                </div>
                <p className="text-sm text-ink-300 mb-2">
                  Casa {birthChart.sun.house}
                </p>
                <p className="text-sm text-ink-400 leading-relaxed">
                  {birthChart.sun.interpretation}
                </p>
              </div>

              {/* Lua */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-amethyst-300">
                  <span className="text-xl">☽</span>
                  <span className="font-semibold">
                    Lua em {birthChart.moon.sign}
                  </span>
                </div>
                <p className="text-sm text-ink-300 mb-2">
                  Casa {birthChart.moon.house}
                </p>
                <p className="text-sm text-ink-400 leading-relaxed">
                  {birthChart.moon.interpretation}
                </p>
              </div>

              {/* Ascendente */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-ink-300">
                  <span className="text-xl">↑</span>
                  <span className="font-semibold">
                    Ascendente em {birthChart.ascendant.sign}
                  </span>
                </div>
                <p className="text-sm text-ink-400 leading-relaxed mt-6">
                  {birthChart.ascendant.interpretation}
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl mb-6">
              <h4 className="font-semibold text-ink-50 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-300" />
                Interpretação Geral
              </h4>
              <p className="text-ink-300 leading-relaxed">
                {birthChart.interpretation}
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/dashboard/birth-chart"
                className="btn-ghost inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
              >
                <Star className="w-4 h-4 text-gold-300" />
                Ver Mapa Completo (Planetas e Casas)
              </Link>
            </div>
          </motion.div>
        ) : showChartTeaser ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass glass-gold rounded-3xl p-8 mb-8 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-[160px] leading-none text-gold-400/10 pointer-events-none">
              ★
            </div>
            <div className="relative z-10">
              <Lock className="w-12 h-12 text-gold-300 mx-auto mb-4" />
              <h3 className="font-display text-2xl font-semibold text-ink-50 mb-2">
                Mapa astral é Premium
              </h3>
              <p className="text-ink-300 mb-6 max-w-xl mx-auto">
                Seu mapa astral completo — Sol, Lua, Ascendente, planetas e
                casas — está a um passo. Desbloqueie com o plano Premium
                Ilimitado.
              </p>
              <Link
                href="/cart?plan=premium"
                onClick={() =>
                  trackSubscriptionUpgradeClicked("premium_monthly")
                }
                className="btn-gold inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg"
              >
                <Crown className="w-6 h-6" />
                Desbloquear com Premium Ilimitado — US$ 29,90/mês
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 border-white/5 mb-8 text-center"
          >
            <Star className="w-12 h-12 text-ink-600 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
              Descubra Seu Mapa Astral
            </h3>
            <p className="text-ink-400 mb-6">
              Complete seu perfil com seus dados de nascimento para revelar o
              que os astros dizem sobre você.
            </p>
            <Link
              href="/profile"
              className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
            >
              <User className="w-5 h-5" />
              Completar Perfil
            </Link>
          </motion.div>
        )}

        {/* Ações rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4">
            Ações Rápidas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const showPremiumBadge = action.premiumOnly && isFree;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="glass relative rounded-3xl p-6 border-white/5 transition-all hover:border-gold-400/30"
                >
                  {showPremiumBadge && (
                    <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-300">
                      <Lock className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                  <Icon className="w-10 h-10 text-gold-300 mb-3" />
                  <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-ink-400 text-sm mb-3">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-2 text-gold-300 font-semibold">
                    {action.cta} <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Leituras recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4">
            Minhas Leituras Recentes
          </h2>
          {readings.length === 0 ? (
            <div className="glass rounded-3xl p-8 border-white/5 text-center">
              <Calendar className="w-16 h-16 text-ink-600 mx-auto mb-4" />
              <p className="text-ink-400 mb-4">
                Você ainda não fez nenhuma leitura
              </p>
              <Link
                href="/challenge"
                className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
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
                  className="glass rounded-3xl p-6 border-white/5 transition-all hover:border-gold-400/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-gold-300" />
                      <div>
                        <p className="font-semibold text-ink-50 text-lg">
                          {reading.question || "Leitura Geral"}
                        </p>
                        <p className="text-sm text-ink-600">
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
                  <p className="text-ink-300 line-clamp-2">
                    {reading.interpretation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* CTA de upgrade Premium */}
        {isFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass glass-gold rounded-3xl p-8 mt-8"
          >
            <div className="text-center">
              <Crown className="w-20 h-20 text-gold-300 mx-auto mb-4" />
              <h3 className="font-display text-3xl font-semibold text-ink-50 mb-3">
                Desbloqueie Todo o Poder Místico
              </h3>
              <p className="text-xl text-ink-300 mb-6">
                Por apenas{" "}
                <span className="text-gold font-bold">US$ 29,90/mês</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/cart?plan=premium"
                  onClick={() =>
                    trackSubscriptionUpgradeClicked("premium_monthly")
                  }
                  className="btn-gold inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg"
                >
                  <Crown className="w-6 h-6" />
                  Assinar Agora
                </Link>
                <Link
                  href="/cart?plan=pack5"
                  className="btn-ghost inline-flex items-center gap-2 rounded-full px-8 py-4"
                >
                  <Sparkles className="w-5 h-5 text-gold-300" />
                  Ou compre 5 leituras por US$ 9,99
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
