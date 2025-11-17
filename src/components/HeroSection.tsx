"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Moon,
  Crown,
} from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Galaxy Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-black to-black" />

        {/* Static pattern (removed animation for performance) */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Reduced stars from 15 to 8 for performance */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* Zodiac Wheel Background */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="url(#gradient)"
              strokeWidth="0.5"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="0.5"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="50"
              stroke="url(#gradient)"
              strokeWidth="0.5"
              fill="none"
            />
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={100 + 90 * Math.cos(angle)}
                  y2={100 + 90 * Math.sin(angle)}
                  stroke="url(#gradient)"
                  strokeWidth="0.3"
                />
              );
            })}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/80 to-orange-600/80 backdrop-blur-sm border-2 border-yellow-400/50 rounded-full mb-8 shadow-lg shadow-red-500/50"
        >
          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          <span className="text-sm font-bold text-white">
            🔥 ATENÇÃO: Apenas 23 vagas restantes hoje!
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
        >
          <span className="block bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
            Pare de Sofrer!
          </span>
          <span className="block bg-gradient-to-r from-pink-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Seu Destino Muda HOJE
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed"
        >
          <span className="text-pink-400 font-bold text-2xl">
            Atraia o Amor Verdadeiro em 48 horas
          </span>
          ,{" "}
          <span className="text-yellow-400 font-bold text-2xl">
            Multiplique sua Renda em 30 dias
          </span>{" "}
          e{" "}
          <span className="text-purple-400 font-bold text-2xl">
            Liberte-se das Energias Bloqueadoras AGORA
          </span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg text-gray-300 max-w-2xl mx-auto mb-8 font-semibold"
        >
          🔥 Mais de 50.000 mulheres JÁ transformaram suas vidas!
          <span className="text-yellow-400"> Você será a próxima?</span>
        </motion.p>

        {/* Freemium Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-lg shadow-red-500/50 animate-pulse"
        >
          <Sparkles className="w-4 h-4" />
          🎁 EXPERIMENTE GRÁTIS AGORA - Apenas hoje sem cadastro!
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/challenge"
            className="group relative px-8 py-5 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 text-white rounded-full font-bold text-lg shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 transition-all hover:scale-105 animate-pulse"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              🎁 EXPERIMENTE GRÁTIS - Seu Destino Aguarda!
            </span>
          </Link>
          <Link
            href="/auth/register"
            className="group relative px-8 py-5 bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 hover:from-yellow-700 hover:via-amber-700 hover:to-yellow-700 text-black rounded-full font-bold text-lg shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/70 transition-all hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              💰 Acesso VIP - R$ 29,90/mês
            </span>
          </Link>

          <Link
            href="#features"
            className="px-8 py-5 bg-black/50 backdrop-blur-sm border-2 border-purple-500/50 hover:border-purple-400 rounded-full font-bold text-lg transition-all hover:scale-105 hover:bg-purple-900/30"
          >
            Como Funciona a Magia ✨
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span>100% Seguro e Confidencial</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Resultados Instantâneos</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" fill="currentColor" />
            <span>4.9/5 de Satisfação</span>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-purple-400"
        >
          <Moon className="w-6 h-6" />
          <span className="text-xs uppercase tracking-wider">
            Descubra mais
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
