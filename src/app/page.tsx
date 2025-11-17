"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      <Navbar />
      <HeroSection />

      {/* Rounded Divider */}
      <div className="relative h-32 bg-gradient-to-b from-black to-purple-950/30">
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,32L80,37.3C160,43,320,53,480,58.7C640,64,800,64,960,58.7C1120,53,1280,43,1360,37.3L1440,32L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"
            fill="url(#gradient1)"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#581c87" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <FeaturesSection />

      {/* Freemium vs Premium Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
              Comece Grátis, Evolua Quando Quiser
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experimente nossa magia sem compromisso
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Freemium Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gradient-to-br from-yellow-950/30 via-amber-950/20 to-yellow-950/30 backdrop-blur-xl border-2 border-yellow-500/50 rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-300">
                    Grátis Para Sempre
                  </h3>
                  <p className="text-sm text-gray-400">Sem cartão de crédito</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">
                    <strong className="text-yellow-300">
                      Jogo das 4 Cartas
                    </strong>{" "}
                    ilimitado
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">
                    Insights básicos do Tarot Egípcio
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">
                    Guia Espiritual com IA (conversas limitadas)
                  </p>
                </div>
              </div>

              <Link
                href="/challenge"
                className="block w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-black text-center rounded-full font-bold transition-all hover:scale-105 shadow-lg shadow-yellow-500/30"
              >
                Começar Grátis
              </Link>
            </motion.div>

            {/* Premium Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-gradient-to-br from-purple-950/30 via-purple-900/20 to-purple-950/30 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl p-8 relative overflow-hidden"
            >
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ Mais Popular
              </div>

              <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-pink-300">Premium</h3>
                  <p className="text-sm text-gray-400">Acesso total</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">
                    <strong className="text-pink-300">
                      Tudo do plano grátis
                    </strong>{" "}
                    +
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">
                    Tiragens completas de Tarot com IA
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">
                    Mapa Astral completo + Compatibilidade
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">
                    Previsões diárias personalizadas
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-400 text-sm">✓</span>
                  </div>
                  <p className="text-gray-300">Guia Espiritual ilimitado</p>
                </div>
              </div>

              <Link
                href="/auth/register"
                className="block w-full py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-700 hover:via-purple-700 hover:to-pink-700 text-white text-center rounded-full font-bold transition-all hover:scale-105 shadow-lg shadow-pink-500/50"
              >
                Começar Premium
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section with rounded container */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-black to-purple-950/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Histórias Reais
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Mariana S.",
                text: "Encontrei clareza sobre meu caminho amoroso. A precisão me surpreendeu! 💕",
                rating: 5,
                location: "São Paulo, BR",
              },
              {
                name: "Ana Paula R.",
                text: "Descobri meu propósito e tudo começou a fazer sentido. Ferramenta incrível! 🌟",
                rating: 5,
                location: "Rio de Janeiro, BR",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />
                <div className="relative bg-purple-950/50 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 hover:border-purple-400/50 transition-all">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 text-lg mb-6 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rounded bottom */}
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,32L80,37.3C160,43,320,53,480,58.7C640,64,800,64,960,58.7C1120,53,1280,43,1360,37.3L1440,32L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"
            fill="#000000"
          />
        </svg>
      </section>

      {/* Freemium - Jogo das 4 Cartas */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 text-black px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Sparkles className="w-4 h-4" />
              100% GRÁTIS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Jogo das 4 Cartas
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Descubra insights sobre seu momento atual com nosso jogo
              interativo gratuito
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-amber-950/30 via-yellow-950/20 to-amber-950/30 backdrop-blur-xl border border-amber-500/30 rounded-[3rem] p-8 md:p-12 overflow-hidden"
          >
            {/* Decorative stars */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left side - Info */}
              <div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-4">
                  Como Funciona?
                </h3>
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                      1
                    </div>
                    <p>Escolha 4 cartas do baralho egípcio virado</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                      2
                    </div>
                    <p>Revele os significados místicos de cada carta</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                      3
                    </div>
                    <p>Receba insights sobre amor, crescimento e decisões</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/challenge"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 hover:from-yellow-700 hover:via-amber-700 hover:to-yellow-700 text-black rounded-full font-bold text-lg shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/70 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5" />
                    Jogar Agora Grátis
                  </Link>
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  ✨ Sem cadastro • ✨ Totalmente gratuito • ✨ Ilimitado
                </p>
              </div>

              {/* Right side - Visual */}
              <div className="relative">
                <motion.div
                  initial={{ rotate: -5 }}
                  animate={{ rotate: 5 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05, rotate: 0 }}
                      className="aspect-[2/3] rounded-2xl overflow-hidden border-2 border-yellow-600/50 shadow-lg shadow-yellow-900/50"
                      style={{
                        backgroundImage:
                          'url("https://i.pinimg.com/originals/8c/de/fb/8cdefb154d4d30cf5e5ef00d1b998b6c.jpg")',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guia Espiritual Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-purple-900/60 via-pink-900/40 to-purple-900/60 border border-purple-500/30 p-12 md:p-20 text-center"
          >
            {/* Simplified background */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-block mb-6"
              >
                <Heart
                  className="w-16 h-16 text-pink-400 mx-auto"
                  fill="currentColor"
                />
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-300 bg-clip-text text-transparent leading-tight">
                Seu Guia Espiritual Pessoal
              </h2>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Converse com nossa IA especializada em bem-estar emocional e
                espiritual.
                <span className="block mt-3 text-pink-400 font-semibold">
                  Acolhimento • Orientação • Reflexão
                </span>
              </p>

              <Link
                href="/guia"
                className="inline-block px-10 py-5 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-700 hover:via-purple-700 hover:to-pink-700 rounded-full font-bold text-lg shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all hover:scale-105"
              >
                🌟 Conversar com o Guia
              </Link>

              <p className="mt-6 text-sm text-gray-400">
                Disponível 24/7 • Confidencial • Psicologia Positiva
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-purple-900/50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 AstroTarot Hub • Todos os direitos reservados</p>
          <p className="mt-2">Feito com 💜 para empoderar mulheres</p>
        </div>
      </footer>
    </main>
  );
}
