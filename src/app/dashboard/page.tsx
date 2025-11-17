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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  birthDate?: string | null;
  birthTime?: string | null;
  birthLocation?: string | null;
  subscription: {
    plan: string;
    status: string;
  };
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

interface PlanetPosition {
  planet: string;
  sign: string;
  symbol: string;
  meaning: string;
  emoji: string;
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

function generatePlanetPositions(birthDate: string): PlanetPosition[] {
  const signKey = calculateZodiacSign(birthDate);
  const sign = zodiacSigns[signKey];

  // Posições simplificadas dos planetas (em produção, usar API real de efemérides)
  const planets: PlanetPosition[] = [
    {
      planet: "Sol",
      sign: sign.name,
      symbol: "☉",
      meaning:
        "Sua essência, ego e vitalidade. Representa quem você é no núcleo do seu ser.",
      emoji: "☀️",
    },
    {
      planet: "Lua",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 2) % 12
        ]
      ].name,
      symbol: "☽",
      meaning:
        "Suas emoções, instintos e necessidades emocionais. Como você se sente.",
      emoji: "🌙",
    },
    {
      planet: "Mercúrio",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 1) % 12
        ]
      ].name,
      symbol: "☿",
      meaning: "Sua comunicação, pensamento e processamento de informações.",
      emoji: "💬",
    },
    {
      planet: "Vênus",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 3) % 12
        ]
      ].name,
      symbol: "♀",
      meaning: "Amor, beleza, valores e como você se relaciona romanticamente.",
      emoji: "💖",
    },
    {
      planet: "Marte",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 4) % 12
        ]
      ].name,
      symbol: "♂",
      meaning: "Sua energia, desejo, ação e como você busca seus objetivos.",
      emoji: "⚡",
    },
    {
      planet: "Júpiter",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 5) % 12
        ]
      ].name,
      symbol: "♃",
      meaning: "Expansão, sorte, abundância e sabedoria. Onde você cresce.",
      emoji: "🍀",
    },
    {
      planet: "Saturno",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 6) % 12
        ]
      ].name,
      symbol: "♄",
      meaning: "Disciplina, responsabilidade, limites e lições de vida.",
      emoji: "⏳",
    },
    {
      planet: "Urano",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 7) % 12
        ]
      ].name,
      symbol: "♅",
      meaning: "Inovação, mudança súbita, liberdade e individualidade.",
      emoji: "⚡",
    },
    {
      planet: "Netuno",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 8) % 12
        ]
      ].name,
      symbol: "♆",
      meaning: "Espiritualidade, intuição, sonhos e imaginação.",
      emoji: "🔮",
    },
    {
      planet: "Plutão",
      sign: zodiacSigns[
        Object.keys(zodiacSigns)[
          (Object.keys(zodiacSigns).indexOf(signKey) + 9) % 12
        ]
      ].name,
      symbol: "♇",
      meaning: "Transformação profunda, poder pessoal e regeneração.",
      emoji: "🦅",
    },
  ];

  return planets;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Simular carregamento de dados do usuário
    // TODO: Implementar chamada real à API
    setTimeout(() => {
      setUser({
        id: "1",
        name: "Usuário Místico",
        email: "usuario@example.com",
        birthDate: "1990-05-15", // Data de exemplo
        birthTime: "14:30",
        birthLocation: "São Paulo, Brasil",
        subscription: {
          plan: "FREE",
          status: "active",
        },
      });
      setLoading(false);
    }, 500);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando seu portal místico...</p>
        </div>
      </div>
    );
  }

  const isPremium = user?.subscription.plan === "PREMIUM_MONTHLY";
  const isFree = user?.subscription.plan === "FREE";

  // Calcular mapa astral se tiver data de nascimento
  const birthChart = user?.birthDate
    ? {
        signKey: calculateZodiacSign(user.birthDate),
        sign: zodiacSigns[calculateZodiacSign(user.birthDate)],
        planets: generatePlanetPositions(user.birthDate),
      }
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Bem-vindo(a) de volta, {user?.name || "Místico(a)"}! 🌟
              </h1>
              <p className="text-gray-400">
                Seu destino está escrito nas estrelas
              </p>
            </div>

            {isFree && (
              <Link
                href="/cart"
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-yellow-500/50 flex items-center gap-2"
              >
                <Crown className="w-5 h-5" />
                Seja Premium
              </Link>
            )}
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-2xl border-2 ${
              isPremium
                ? "bg-gradient-to-r from-yellow-600/10 to-amber-600/10 border-yellow-500/50"
                : "bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/50"
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
                    {isPremium ? "Plano Premium" : "Plano Gratuito"}
                  </h3>
                  <p className="text-gray-400">
                    {isPremium
                      ? "Acesso ilimitado a todas as funcionalidades"
                      : "Acesso ao Jogo de 4 Cartas"}
                  </p>
                </div>
              </div>

              {isFree && (
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-400">R$ 29,90</p>
                  <p className="text-sm text-gray-400">por mês</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Mapa Astral - MVP */}
        {birthChart && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400" />
              Seu Mapa Astral Personalizado
            </h2>

            {/* Signo Principal */}
            <div
              className={`p-8 rounded-3xl bg-gradient-to-br ${birthChart.sign.color} mb-6 relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 text-[200px] opacity-10 leading-none">
                {birthChart.sign.symbol}
              </div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm font-semibold mb-2">
                      SEU SIGNO SOLAR
                    </p>
                    <h3 className="text-5xl font-bold text-white mb-2 flex items-center gap-3">
                      {birthChart.sign.symbol} {birthChart.sign.name}
                    </h3>
                    <p className="text-white/90 text-lg">
                      {birthChart.sign.dates}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl mb-2">
                      <p className="text-xs text-white/80">Elemento</p>
                      <p className="text-lg font-bold text-white">
                        {birthChart.sign.element}
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <p className="text-xs text-white/80">Regente</p>
                      <p className="text-lg font-bold text-white">
                        {birthChart.sign.ruler}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6">
                  {birthChart.sign.traits.map((trait, idx) => (
                    <div
                      key={idx}
                      className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-center"
                    >
                      <p className="text-white font-semibold text-sm">
                        {trait}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Planetas em Signos */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🪐 Seus Planetas nos Signos
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {birthChart.planets.map((planet, idx) => (
                  <motion.div
                    key={planet.planet}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{planet.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-bold text-purple-300">
                            {planet.planet}
                          </h4>
                          <span className="text-2xl">{planet.symbol}</span>
                          <span className="text-gray-400">em</span>
                          <span className="text-lg font-bold text-yellow-400">
                            {planet.sign}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {planet.meaning}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA para atualizar dados */}
              <div className="mt-6 p-4 bg-purple-600/10 border border-purple-500/30 rounded-xl text-center">
                <p className="text-gray-300 mb-3">
                  💫 Quer um mapa astral ainda mais preciso? Adicione seu
                  horário e local de nascimento!
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-all"
                >
                  Completar Perfil
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">⚡ Ações Rápidas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Jogo Grátis */}
            <Link
              href="/challenge"
              className="group p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-2xl hover:border-green-400 transition-all hover:scale-105"
            >
              <Gift className="w-10 h-10 text-green-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">🎁 Jogo Gratuito</h3>
              <p className="text-gray-400 text-sm mb-3">
                Tire suas 4 cartas místicas agora
              </p>
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                Jogar Agora <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Tarot Completo */}
            <Link
              href={isPremium ? "/tarot" : "/cart"}
              className={`group p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                isPremium
                  ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50 hover:border-purple-400"
                  : "bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-gray-600/50 hover:border-gray-500"
              }`}
            >
              <Sparkles className="w-10 h-10 text-purple-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">
                🔮 Tarot Egípcio Completo
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                {isPremium
                  ? "Acesso ilimitado às leituras"
                  : "R$ 9,90 por leitura ou Premium"}
              </p>
              <div
                className={`flex items-center gap-2 font-semibold ${
                  isPremium ? "text-purple-400" : "text-gray-400"
                }`}
              >
                {isPremium ? "Começar Leitura" : "Desbloquear"}{" "}
                <ArrowRight className="w-4 h-4" />
              </div>
              {!isPremium && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                  🔒 BLOQUEADO
                </div>
              )}
            </Link>

            {/* Mapa Astral */}
            <Link
              href={isPremium ? "/personality" : "/cart"}
              className={`group p-6 rounded-2xl border-2 transition-all hover:scale-105 relative ${
                isPremium
                  ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/50 hover:border-blue-400"
                  : "bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-gray-600/50 hover:border-gray-500"
              }`}
            >
              <Star className="w-10 h-10 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold mb-2">✨ Mapa Astral</h3>
              <p className="text-gray-400 text-sm mb-3">
                {isPremium
                  ? "Descubra seu propósito de vida"
                  : "Apenas para assinantes Premium"}
              </p>
              <div
                className={`flex items-center gap-2 font-semibold ${
                  isPremium ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {isPremium ? "Ver Mapa" : "Assinar Premium"}{" "}
                <ArrowRight className="w-4 h-4" />
              </div>
              {!isPremium && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                  🔒 PREMIUM
                </div>
              )}
            </Link>
          </div>
        </motion.div>

        {/* Upgrade Banner para Usuários Free */}
        {isFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border-2 border-yellow-500/50 rounded-2xl mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-3 text-yellow-300">
                  🌟 Desbloqueie Todo o Poder Místico!
                </h3>
                <p className="text-gray-300 mb-4 text-lg">
                  Por apenas{" "}
                  <span className="text-yellow-400 font-bold text-2xl">
                    R$ 29,90/mês
                  </span>
                  , você terá acesso ILIMITADO a:
                </p>
                <ul className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    "✨ Tarot Egípcio Ilimitado",
                    "🌙 Mapa Astral Completo",
                    "💖 Compatibilidade Amorosa",
                    "🔮 Previsões Diárias",
                    "💰 Rituais de Abundância",
                    "🤖 Guia Espiritual IA",
                  ].map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-200">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-4">
                  <Link
                    href="/cart"
                    className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-2xl shadow-yellow-500/50 flex items-center gap-2"
                  >
                    <Crown className="w-6 h-6" />
                    Assinar Agora e Transformar Minha Vida
                  </Link>
                  <Link
                    href="/tarot"
                    className="px-8 py-4 bg-purple-600/20 border-2 border-purple-500 hover:bg-purple-600/30 rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center gap-2"
                  >
                    Comprar 1 Leitura - R$ 9,90
                  </Link>
                </div>
              </div>
              <Crown className="w-40 h-40 text-yellow-400/20 ml-8 hidden lg:block" />
            </div>
          </motion.div>
        )}

        {/* Histórico de Leituras */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-4">📜 Minhas Leituras</h2>
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
        </motion.div>
      </div>
    </div>
  );
}
