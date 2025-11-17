"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, TrendingUp, Sparkles, Shield, Star, Zap } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Atração do Amor Verdadeiro",
    description:
      "Descubra quando e como o amor da sua vida vai aparecer. Entenda sua compatibilidade astrológica e desbloqueie relacionamentos profundos e duradouros.",
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "bg-pink-500/20",
    link: "/compatibility",
  },
  {
    icon: TrendingUp,
    title: "Prosperidade Financeira",
    description:
      "Identifique os ciclos de abundância no seu mapa astral. Saiba os melhores momentos para investir, empreender e multiplicar sua riqueza material.",
    gradient: "from-yellow-500 to-amber-500",
    bgGlow: "bg-yellow-500/20",
    link: "/abundance",
  },
  {
    icon: Sparkles,
    title: "Limpeza Energética",
    description:
      "Remova bloqueios espirituais que impedem seu crescimento. Técnicas personalizadas baseadas no seu mapa para limpar caminhos e atrair positividade.",
    gradient: "from-purple-500 to-violet-500",
    bgGlow: "bg-purple-500/20",
  },
  {
    icon: Shield,
    title: "Proteção Espiritual",
    description:
      "Fortaleça sua aura e proteja-se de energias negativas. Rituais personalizados conforme as fases lunares e sua carta natal.",
    gradient: "from-indigo-500 to-blue-500",
    bgGlow: "bg-indigo-500/20",
  },
  {
    icon: Star,
    title: "Propósito de Vida",
    description:
      "Entenda sua missão nesta encarnação através do Nodo Norte. Descubra seus dons únicos e como usá-los para impactar o mundo.",
    gradient: "from-cyan-500 to-teal-500",
    bgGlow: "bg-cyan-500/20",
    link: "/personality",
  },
  {
    icon: Zap,
    title: "Momento Certo para Agir",
    description:
      "Nunca mais perca oportunidades! Saiba os dias e horários mais favoráveis para tomar decisões importantes, viajar e iniciar projetos.",
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/20",
    link: "/predictions",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto" />
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
            Transforme Sua Vida Com
            <br />
            Sabedoria Ancestral
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Milhares de mulheres já descobriram seu poder interior. Chegou a sua
            vez de brilhar! ✨
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <FeatureCard feature={feature} index={index} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-20"
        >
          <a
            href="/auth/register"
            className="inline-block px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full font-bold text-xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all hover:scale-105"
          >
            🌟 Começar Minha Transformação Agora
          </a>
          <p className="mt-4 text-sm text-gray-500">
            Primeiros 7 dias grátis • Cancele quando quiser
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const Icon = feature.icon;

  const CardContent = (
    <>
      {/* Glow Effect */}
      <div
        className={`absolute -inset-0.5 ${feature.bgGlow} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Card */}
      <div className="relative h-full bg-gradient-to-br from-purple-950/50 via-black to-purple-950/30 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 transition-all duration-300 group-hover:border-purple-400/50">
        {/* Icon */}
        <div className="mb-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 group-hover:bg-clip-text transition-all">
          {feature.title}
        </h3>
        <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
          {feature.description}
        </p>

        {/* Decorative corner */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>

        {/* Link indicator */}
        {feature.link && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-purple-400 text-sm font-semibold">
              Explorar →
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative h-full"
    >
      {feature.link ? (
        <Link href={feature.link} className="block h-full">
          {CardContent}
        </Link>
      ) : (
        CardContent
      )}
    </motion.div>
  );
}
