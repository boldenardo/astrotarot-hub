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
import { useClerk } from "@clerk/nextjs";
import {
  getMyProfile,
  getMyReadings,
  type MeProfile,
  type MeReading,
} from "@/lib/client/me";
import { isPremium as isPremiumPlan } from "@/lib/plans";
import {
  trackPageView,
  trackSubscriptionUpgradeClicked,
} from "@/lib/analytics";

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
    name: "Aries",
    symbol: "♈︎",
    element: "Fire",
    quality: "Cardinal",
    ruler: "Mars",
    dates: "Mar 21 - Apr 19",
    traits: ["Courageous", "Determined", "Natural leader", "Impulsive", "Energetic"],
  },
  taurus: {
    name: "Taurus",
    symbol: "♉︎",
    element: "Earth",
    quality: "Fixed",
    ruler: "Venus",
    dates: "Apr 20 - May 20",
    traits: ["Reliable", "Patient", "Practical", "Determined", "Loyal"],
  },
  gemini: {
    name: "Gemini",
    symbol: "♊︎",
    element: "Air",
    quality: "Mutable",
    ruler: "Mercury",
    dates: "May 21 - Jun 20",
    traits: ["Communicative", "Versatile", "Curious", "Intelligent", "Adaptable"],
  },
  cancer: {
    name: "Cancer",
    symbol: "♋︎",
    element: "Water",
    quality: "Cardinal",
    ruler: "Moon",
    dates: "Jun 21 - Jul 22",
    traits: ["Intuitive", "Emotional", "Protective", "Sensitive", "Nurturing"],
  },
  leo: {
    name: "Leo",
    symbol: "♌︎",
    element: "Fire",
    quality: "Fixed",
    ruler: "Sun",
    dates: "Jul 23 - Aug 22",
    traits: ["Confident", "Generous", "Creative", "Charismatic", "Loyal"],
  },
  virgo: {
    name: "Virgo",
    symbol: "♍︎",
    element: "Earth",
    quality: "Mutable",
    ruler: "Mercury",
    dates: "Aug 23 - Sep 22",
    traits: ["Analytical", "Practical", "Perfectionist", "Hardworking", "Modest"],
  },
  libra: {
    name: "Libra",
    symbol: "♎︎",
    element: "Air",
    quality: "Cardinal",
    ruler: "Venus",
    dates: "Sep 23 - Oct 22",
    traits: ["Diplomatic", "Fair", "Sociable", "Harmonious", "Charming"],
  },
  scorpio: {
    name: "Scorpio",
    symbol: "♏︎",
    element: "Water",
    quality: "Fixed",
    ruler: "Pluto",
    dates: "Oct 23 - Nov 21",
    traits: ["Intense", "Passionate", "Mysterious", "Transformative", "Loyal"],
  },
  sagittarius: {
    name: "Sagittarius",
    symbol: "♐︎",
    element: "Fire",
    quality: "Mutable",
    ruler: "Jupiter",
    dates: "Nov 22 - Dec 21",
    traits: ["Optimistic", "Adventurous", "Philosophical", "Honest", "Free-spirited"],
  },
  capricorn: {
    name: "Capricorn",
    symbol: "♑︎",
    element: "Earth",
    quality: "Cardinal",
    ruler: "Saturn",
    dates: "Dec 22 - Jan 19",
    traits: ["Ambitious", "Disciplined", "Responsible", "Practical", "Patient"],
  },
  aquarius: {
    name: "Aquarius",
    symbol: "♒︎",
    element: "Air",
    quality: "Fixed",
    ruler: "Uranus",
    dates: "Jan 20 - Feb 18",
    traits: ["Innovative", "Independent", "Humanitarian", "Original", "Intellectual"],
  },
  pisces: {
    name: "Pisces",
    symbol: "♓︎",
    element: "Water",
    quality: "Mutable",
    ruler: "Neptune",
    dates: "Feb 19 - Mar 20",
    traits: ["Intuitive", "Compassionate", "Artistic", "Sensitive", "Spiritual"],
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

function spreadLabel(spread: string | null): string {
  if (!spread) return "Tarot Reading";
  const map: Record<string, string> = {
    "1": "1-Card Spread",
    "3": "3-Card Spread",
    "5": "5-Card Spread",
    "7": "7-Card Spread",
    FOUR_CARDS: "4-Card Spread",
    FULL_SPREAD: "Full Spread",
  };
  return map[spread] ?? "Tarot Spread";
}

export default function DashboardPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [user, setUser] = useState<MeProfile | null>(null);
  const [readings, setReadings] = useState<MeReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [birthChart, setBirthChart] = useState<any>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [showChartTeaser, setShowChartTeaser] = useState(false);

  useEffect(() => {
    trackPageView("/dashboard", "Dashboard");

    async function loadUserData() {
      try {
        const profile = await getMyProfile();
        if (!profile) {
          router.push("/auth/login");
          return;
        }

        setUser(profile);

        // Fetch the most recent readings
        const readingsData = await getMyReadings(5);
        setReadings(readingsData);

        // Generate the mini birth chart when the birth data is complete.
        // The /api/birth-chart route now requires Premium, so we only fetch
        // for subscribers; FREE users see an upgrade teaser instead.
        if (
          profile.birth_date &&
          profile.birth_time &&
          profile.birth_location
        ) {
          if (isPremiumPlan(profile)) {
            setLoadingChart(true);

            try {
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

              if (chartResponse.ok) {
                const chartData = await chartResponse.json();
                setBirthChart(chartData);
              } else if (chartResponse.status === 401) {
                router.push("/auth/login");
                return;
              } else if (chartResponse.status === 403) {
                // Expired subscription / no access: show teaser without error
                setShowChartTeaser(true);
              } else {
                console.error(
                  "Failed to generate the birth chart:",
                  chartResponse.status
                );
              }
            } catch (chartError) {
              console.error("Failed to generate the birth chart:", chartError);
            }
            setLoadingChart(false);
          } else {
            // FREE user: don't call the premium route, show teaser
            setShowChartTeaser(true);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  async function handleLogout() {
    await signOut({ redirectUrl: "/" });
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
          <p className="text-ink-400">Loading your mystic portal...</p>
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
      title: "Free Game",
      description: "Draw your 4 mystic cards",
      cta: "Play Now",
      premiumOnly: false,
    },
    {
      href: "/tarot",
      icon: Sparkles,
      title: "Full Tarot",
      description: "Complete AI-powered reading",
      cta: "Start Reading",
      premiumOnly: false,
    },
    {
      href: "/guia",
      icon: Heart,
      title: "Spiritual Guide",
      description: "Chat with Luna AI",
      cta: "Chat Now",
      premiumOnly: false,
    },
    {
      href: "/compatibility",
      icon: Heart,
      title: "Compatibility",
      description: "Astrological love analysis",
      cta: "Analyze",
      premiumOnly: true,
    },
    {
      href: "/predictions",
      icon: TrendingUp,
      title: "Forecasts",
      description: "Your future in the stars",
      cta: "View Forecasts",
      premiumOnly: true,
    },
    {
      href: "/abundance",
      icon: Zap,
      title: "Prosperity",
      description: "Prosperity rituals",
      cta: "Open",
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

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
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
            Sign out
          </button>
        </div>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink-50 mb-2 break-words">
            Welcome back,{" "}
            <span className="text-gold">{user?.name || "Seeker"}</span>
          </h1>
          <p className="text-ink-600">{user?.email}</p>
        </motion.div>

        {/* Subscription status */}
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
                  {premium ? "Unlimited Premium Active" : "Free Plan"}
                </h3>
                <p className="text-ink-400">
                  {premium
                    ? "Unlimited readings + all features"
                    : `${user?.readings_left || 0} readings left`}
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
                  5-Reading Pack — $9.99
                </Link>
                <Link
                  href="/cart?plan=premium"
                  onClick={() =>
                    trackSubscriptionUpgradeClicked("premium_monthly")
                  }
                  className="btn-gold flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm"
                >
                  <Crown className="w-5 h-5" />
                  Unlimited Premium — $29.90/month
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Zodiac sign card */}
        {zodiacSign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass glass-gold rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 hidden sm:block text-[200px] leading-none text-gold-400/10 pointer-events-none select-none">
              {zodiacSign.sign.symbol}
            </div>
            <div className="relative z-10">
              <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-2">
                Your Sun Sign
              </p>
              <div className="flex items-center gap-4 mb-2">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/20 to-purple-500/20 border border-gold-400/30 text-3xl leading-none text-gold-300">
                  {zodiacSign.sign.symbol}
                </span>
                <h3 className="font-display text-3xl sm:text-5xl font-semibold text-ink-50 break-words">
                  {zodiacSign.sign.name}
                </h3>
              </div>
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

        {/* Mini birth chart (AI generated) */}
        {loadingChart ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 border-white/5 mb-8 text-center"
          >
            <Sparkles className="w-8 h-8 text-gold-300 mx-auto mb-4 animate-pulse" />
            <h3 className="font-display text-xl font-semibold text-ink-50 mb-2">
              Generating your birth chart...
            </h3>
            <p className="text-ink-400">The stars are aligning for you</p>
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
                Your Essential Birth Chart
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Sun */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-gold-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-lg leading-none text-gold-300">
                    {"☉︎"}
                  </span>
                  <span className="font-semibold">
                    Sun in {birthChart.sun.sign}
                  </span>
                </div>
                <p className="text-sm text-ink-300 mb-2">
                  House {birthChart.sun.house}
                </p>
                <p className="text-sm text-ink-400 leading-relaxed">
                  {birthChart.sun.interpretation}
                </p>
              </div>

              {/* Moon */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-amethyst-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-lg leading-none text-gold-300">
                    {"☽︎"}
                  </span>
                  <span className="font-semibold">
                    Moon in {birthChart.moon.sign}
                  </span>
                </div>
                <p className="text-sm text-ink-300 mb-2">
                  House {birthChart.moon.house}
                </p>
                <p className="text-sm text-ink-400 leading-relaxed">
                  {birthChart.moon.interpretation}
                </p>
              </div>

              {/* Ascendant */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-ink-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-lg leading-none text-gold-300">
                    {"↑︎"}
                  </span>
                  <span className="font-semibold">
                    Ascendant in {birthChart.ascendant.sign}
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
                Overall Interpretation
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
                View Full Chart (Planets & Houses)
              </Link>
            </div>
          </motion.div>
        ) : showChartTeaser ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass glass-gold rounded-3xl p-8 mb-8 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 hidden sm:block text-[160px] leading-none text-gold-400/10 pointer-events-none select-none">
              {"★︎"}
            </div>
            <div className="relative z-10">
              <Lock className="w-12 h-12 text-gold-300 mx-auto mb-4" />
              <h3 className="font-display text-2xl font-semibold text-ink-50 mb-2">
                Your birth chart is Premium
              </h3>
              <p className="text-ink-300 mb-6 max-w-xl mx-auto">
                Your complete birth chart — Sun, Moon, Ascendant, planets and
                houses — is one step away. Unlock it with the Unlimited Premium
                plan.
              </p>
              <Link
                href="/cart?plan=premium"
                onClick={() =>
                  trackSubscriptionUpgradeClicked("premium_monthly")
                }
                className="btn-gold inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-6 sm:px-8 py-4 text-base sm:text-lg"
              >
                <Crown className="w-6 h-6 shrink-0" />
                <span className="break-words">
                  Unlock with Unlimited Premium — $29.90/month
                </span>
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
              Discover Your Birth Chart
            </h3>
            <p className="text-ink-400 mb-6">
              Complete your profile with your birth details to reveal what the
              stars say about you.
            </p>
            <Link
              href="/profile"
              className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
            >
              <User className="w-5 h-5" />
              Complete Profile
            </Link>
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Recent readings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-2xl font-semibold text-ink-50 mb-4">
            My Recent Readings
          </h2>
          {readings.length === 0 ? (
            <div className="glass rounded-3xl p-8 border-white/5 text-center">
              <Calendar className="w-16 h-16 text-ink-600 mx-auto mb-4" />
              <p className="text-ink-400 mb-4">
                You haven&apos;t done any readings yet
              </p>
              <Link
                href="/challenge"
                className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
              >
                <Sparkles className="w-5 h-5" />
                Do My First Reading
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {readings.map((reading) => (
                <div
                  key={reading.id}
                  className="glass rounded-3xl p-6 border-white/5 transition-all hover:border-gold-400/30"
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-gold-300 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-ink-50 text-lg">
                          {spreadLabel(reading.spread_type)}
                        </p>
                        <p className="text-sm text-ink-600">
                          {new Date(reading.created_at).toLocaleDateString(
                            "en-US",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    {reading.is_premium && (
                      <span className="flex items-center gap-1 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-semibold text-gold-300">
                        <Crown className="w-3 h-3" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-ink-300 line-clamp-2 break-words">
                    {reading.interpretation || "Reading saved."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Premium upgrade CTA */}
        {isFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass glass-gold rounded-3xl p-8 mt-8"
          >
            <div className="text-center">
              <Crown className="w-20 h-20 text-gold-300 mx-auto mb-4" />
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-ink-50 mb-3">
                Unlock All the Mystic Power
              </h3>
              <p className="text-xl text-ink-300 mb-6">
                For just{" "}
                <span className="text-gold font-bold">$29.90/month</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/cart?plan=premium"
                  onClick={() =>
                    trackSubscriptionUpgradeClicked("premium_monthly")
                  }
                  className="btn-gold inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-8 py-4 text-lg"
                >
                  <Crown className="w-6 h-6" />
                  Subscribe Now
                </Link>
                <Link
                  href="/cart?plan=pack5"
                  className="btn-ghost inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-8 py-4"
                >
                  <Sparkles className="w-5 h-5 text-gold-300" />
                  Or buy 5 readings for $9.99
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
