"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, TrendingUp, Sparkles, Shield, Star, Zap } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Atraia o Amor Verdadeiro",
    description:
      "Descubra quando e como o amor vai entrar na sua vida. Entenda sua compatibilidade astrológica e desbloqueie relações profundas e duradouras.",
    link: "/compatibility",
  },
  {
    icon: TrendingUp,
    title: "Prosperidade Financeira",
    description:
      "Identifique os ciclos de abundância no seu mapa astral. Saiba os melhores momentos para investir, lançar projetos e crescer materialmente.",
    link: "/abundance",
  },
  {
    icon: Sparkles,
    title: "Limpeza Energética",
    description:
      "Liberte-se dos bloqueios espirituais que travam seu crescimento. Técnicas personalizadas com base no seu mapa para limpar o caminho e atrair positividade.",
  },
  {
    icon: Shield,
    title: "Proteção Espiritual",
    description:
      "Fortaleça sua aura e proteja-se de energias negativas. Rituais alinhados às fases da lua e ao seu mapa natal.",
  },
  {
    icon: Star,
    title: "Propósito de Vida",
    description:
      "Compreenda sua missão nesta vida através do Nodo Norte. Descubra seus dons únicos e como usá-los para impactar o mundo.",
    link: "/personality",
  },
  {
    icon: Zap,
    title: "A Hora Certa de Agir",
    description:
      "Nunca mais perca uma oportunidade. Conheça os dias e horários mais favoráveis para decisões importantes, viagens e novos projetos.",
    link: "/predictions",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-night-900/40 to-transparent" />
      <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-amethyst-500/10 blur-3xl" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-gold-500/[0.07] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold">
            <Sparkles className="h-7 w-7 text-night-900" />
          </span>
          <h2 className="font-display text-4xl font-semibold text-ink-50 md:text-6xl">
            Transforme sua vida com
            <br />
            <span className="text-gold">sabedoria ancestral</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            Milhares de pessoas já descobriram seu poder interior. Agora é a
            sua vez de brilhar.
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
          className="mt-20 text-center"
        >
          <Link
            href="/auth/register"
            className="btn-gold inline-flex items-center gap-2 rounded-full px-10 py-5 text-lg"
          >
            <Sparkles className="h-5 w-5" />
            Comece sua transformação
          </Link>
          <p className="mt-4 text-sm text-ink-600">
            Comece grátis &bull; Cancele quando quiser
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  const Icon = feature.icon;

  const CardContent = (
    <div className="glass relative h-full rounded-3xl border-white/5 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/30">
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/10">
        <Icon className="h-7 w-7 text-gold-300" />
      </div>
      <h3 className="mb-3 font-display text-2xl font-semibold text-ink-50">
        {feature.title}
      </h3>
      <p className="leading-relaxed text-ink-400">{feature.description}</p>
      {feature.link && (
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">
          Explorar &rarr;
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
