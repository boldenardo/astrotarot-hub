"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, TrendingUp, Sparkles, Shield, Star, Zap } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Attract True Love",
    description:
      "Discover when and how love will enter your life. Understand your astrological compatibility and unlock deep, lasting relationships.",
    link: "/compatibility",
  },
  {
    icon: TrendingUp,
    title: "Financial Prosperity",
    description:
      "Identify the cycles of abundance in your birth chart. Know the best moments to invest, launch projects, and grow your wealth.",
    link: "/abundance",
  },
  {
    icon: Sparkles,
    title: "Energy Cleansing",
    description:
      "Free yourself from the spiritual blocks holding back your growth. Personalized techniques based on your chart to clear the path and draw in positivity.",
  },
  {
    icon: Shield,
    title: "Spiritual Protection",
    description:
      "Strengthen your aura and shield yourself from negative energy. Rituals aligned with the moon phases and your natal chart.",
  },
  {
    icon: Star,
    title: "Life Purpose",
    description:
      "Understand your mission in this life through the North Node. Discover your unique gifts and how to use them to impact the world.",
    link: "/personality",
  },
  {
    icon: Zap,
    title: "The Right Time to Act",
    description:
      "Never miss an opportunity again. Learn the most favorable days and hours for important decisions, travel, and new projects.",
    link: "/predictions",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-night-900/40 to-transparent" />
      <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-amethyst-500/10 blur-3xl" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-gold-500/[0.07] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-3xl text-center sm:mb-20"
        >
          <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold">
            <Sparkles className="h-7 w-7 text-night-900" />
          </span>
          <h2 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl md:text-6xl">
            Transform your life with
            <br />
            <span className="text-gold">ancient wisdom</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-ink-400 sm:text-lg">
            Thousands of people have already discovered their inner power. Now
            it&apos;s your turn to shine.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center sm:mt-20"
        >
          <Link
            href="/auth/register"
            className="btn-gold flex w-full items-center justify-center gap-2 rounded-full px-10 py-4 text-base sm:inline-flex sm:w-auto sm:py-5 sm:text-lg"
          >
            <Sparkles className="h-5 w-5" />
            Begin your transformation
          </Link>
          <p className="mt-4 text-sm text-ink-600">
            Start free &bull; Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  const Icon = feature.icon;

  const CardContent = (
    <div className="glass relative h-full rounded-3xl border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/30 sm:p-8">
      <div className="mb-6 inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/10">
        <Icon className="h-7 w-7 text-gold-300" />
      </div>
      <h3 className="mb-3 break-words font-display text-xl font-semibold text-ink-50 sm:text-2xl">
        {feature.title}
      </h3>
      <p className="break-words leading-relaxed text-ink-400">
        {feature.description}
      </p>
      {feature.link && (
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">
          Explore &rarr;
        </span>
      )}
    </div>
  );

  return (
    <div className="group h-full">
      {feature.link ? (
        <Link href={feature.link} className="block h-full">
          {CardContent}
        </Link>
      ) : (
        CardContent
      )}
    </div>
  );
}
