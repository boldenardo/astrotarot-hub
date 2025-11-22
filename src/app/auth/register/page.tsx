"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  User,
  Calendar,
  MapPin,
  Clock,
  Gift,
  Crown,
  Zap,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { trackSignUp, trackPageView } from "@/lib/analytics";

interface WelcomeOffer {
  message: string;
  welcomeOffer: {
    freeTrial: {
      title: string;
      description: string;
      ctaText: string;
      ctaLink: string;
    };
    premiumPlan: {
      title: string;
      description: string;
      benefits: string[];
      price: string;
      ctaText: string;
      ctaLink: string;
    };
    singleReading: {
      title: string;
      description: string;
      ctaText: string;
      ctaLink: string;
    };
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeData, setWelcomeData] = useState<WelcomeOffer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    birthTime: "",
    birthLocation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Usar Supabase Auth
      const { user, session, requiresConfirmation } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        birthLocation: formData.birthLocation,
      });

      if (requiresConfirmation) {
        // Limpar formulário
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          birthDate: "",
          birthTime: "",
          birthLocation: "",
        });

        // Mostrar mensagem na tela em vez de alert
        setError(""); // Limpar erros anteriores

        // Redirecionar para login com mensagem de sucesso
        const params = new URLSearchParams();
        params.set(
          "message",
          "Conta criada! Verifique seu email para confirmar."
        );
        params.set("email", formData.email);
        router.push(`/auth/login?${params.toString()}`);
        return;
      }

      if (!session) {
        throw new Error("Erro ao criar sessão");
      }

      // Mostrar modal de boas-vindas
      setWelcomeData({
        message:
          "🎉 Bem-vindo(a) ao seu portal místico! Sua jornada de transformação começa AGORA.",
        welcomeOffer: {
          freeTrial: {
            title: "🎁 JOGUE GRÁTIS AGORA",
            description: "Tarot das 4 Cartas - Sem custo, sem compromisso",
            ctaText: "Começar Agora",
            ctaLink: "/challenge",
          },
          premiumPlan: {
            title: "⭐ OFERTA ESPECIAL DE BOAS-VINDAS",
            description: "Acesso TOTAL por apenas R$ 29,90/mês",
            benefits: [
              "✨ Tarot Egípcio Ilimitado",
              "🌙 Mapa Astral Personalizado",
              "💖 Compatibilidade Amorosa",
              "🔮 Previsões Diárias",
              "💰 Ritual de Abundância",
              "🤖 Guia Espiritual com IA",
            ],
            price: "R$ 29,90/mês",
            ctaText: "Ativar Plano Premium",
            ctaLink: "/cart",
          },
          singleReading: {
            title: "🌟 EXPERIMENTE UMA LEITURA COMPLETA",
            description: "Tiragem do Tarot Egípcio por apenas R$ 9,90",
            ctaText: "Fazer 1 Leitura",
            ctaLink: "/tarot",
          },
        },
      });
      setShowWelcomeModal(true);

      // Track successful signup
      trackSignUp("email");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.message?.includes("Invalid API key")) {
        setError(
          "Erro de configuração do sistema (API Key inválida). Contate o suporte."
        );
      } else {
        setError(err.message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackPageView("/auth/register", "Register");

    // Check for pending birth chart data
    const pendingData = localStorage.getItem("pendingBirthChart");
    if (pendingData) {
      try {
        const parsed = JSON.parse(pendingData);
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          birthDate: parsed.date || prev.birthDate,
          birthTime: parsed.time || prev.birthTime,
          birthLocation: parsed.city || prev.birthLocation,
        }));
      } catch (e) {
        console.error("Error parsing pending birth chart data", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden py-12">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-black to-black" />
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl px-6"
      >
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-purple-500/30 shadow-2xl shadow-purple-500/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-12 h-12 text-purple-400" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
              Criar Conta Grátis
            </h1>
            <p className="text-gray-400 text-sm">
              Comece sua jornada espiritual hoje mesmo
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-purple-400" : "text-gray-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= 1
                    ? "bg-gradient-to-r from-purple-600 to-pink-600"
                    : "bg-gray-800"
                }`}
              >
                1
              </div>
              <span className="text-sm hidden md:inline">Conta</span>
            </div>
            <div
              className={`w-16 h-1 ${
                step >= 2
                  ? "bg-gradient-to-r from-purple-600 to-pink-600"
                  : "bg-gray-800"
              }`}
            />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-purple-400" : "text-gray-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= 2
                    ? "bg-gradient-to-r from-purple-600 to-pink-600"
                    : "bg-gray-800"
                }`}
              >
                2
              </div>
              <span className="text-sm hidden md:inline">Dados Astrais</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-12 pr-12 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                      placeholder="Repita a senha"
                    />
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (
                      formData.name &&
                      formData.email &&
                      formData.password &&
                      formData.confirmPassword
                    ) {
                      if (formData.password === formData.confirmPassword) {
                        setStep(2);
                        setError("");
                      } else {
                        setError("As senhas não conferem");
                      }
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-500/50"
                >
                  Continuar
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <p className="text-sm text-purple-300">
                    💫 <strong>Opcional:</strong> Forneça seus dados de
                    nascimento para análises astrológicas personalizadas mais
                    precisas. Você pode pular esta etapa.
                  </p>
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data de Nascimento (Opcional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Birth Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hora de Nascimento (Opcional)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={formData.birthTime}
                      onChange={(e) =>
                        setFormData({ ...formData, birthTime: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Birth Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Local de Nascimento (Opcional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.birthLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          birthLocation: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                      placeholder="São Paulo, Brasil"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-purple-500/50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Criando conta...
                      </span>
                    ) : (
                      "Criar Conta"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Já tem uma conta?{" "}
              <Link
                href="/auth/login"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar para home
          </Link>
        </div>
      </motion.div>

      {/* Modal de Boas-Vindas com Ofertas */}
      <AnimatePresence>
        {showWelcomeModal && welcomeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowWelcomeModal(false);
              router.push("/challenge");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-purple-900/90 to-black/90 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-500/50 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  router.push("/challenge");
                }}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center p-8 pb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="inline-block mb-4"
                >
                  <Sparkles className="w-16 h-16 text-yellow-400" />
                </motion.div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  🎉 Conta Criada com Sucesso!
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
                  {welcomeData.message}
                </p>
              </div>

              {/* Offers Grid */}
              <div className="grid md:grid-cols-3 gap-6 p-8 pt-0">
                {/* Free Trial */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-2xl p-6 text-center"
                >
                  <Gift className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-green-300">
                    {welcomeData.welcomeOffer.freeTrial.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    {welcomeData.welcomeOffer.freeTrial.description}
                  </p>
                  <Link
                    href={welcomeData.welcomeOffer.freeTrial.ctaLink}
                    className="block w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold transition-all shadow-lg"
                  >
                    {welcomeData.welcomeOffer.freeTrial.ctaText}
                  </Link>
                </motion.div>

                {/* Premium Plan - DESTAQUE */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20 border-4 border-yellow-500/70 rounded-2xl p-6 text-center relative overflow-hidden"
                >
                  {/* Badge "RECOMENDADO" */}
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-4 py-1 rounded-bl-xl">
                    ⭐ RECOMENDADO
                  </div>

                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4 mt-4" />
                  <h3 className="text-2xl font-bold mb-2 text-yellow-300">
                    {welcomeData.welcomeOffer.premiumPlan.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    {welcomeData.welcomeOffer.premiumPlan.description}
                  </p>

                  {/* Benefits */}
                  <ul className="text-left text-sm space-y-2 mb-4">
                    {welcomeData.welcomeOffer.premiumPlan.benefits.map(
                      (benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-200">{benefit}</span>
                        </li>
                      )
                    )}
                  </ul>

                  <div className="text-3xl font-bold text-yellow-300 mb-4">
                    {welcomeData.welcomeOffer.premiumPlan.price}
                  </div>

                  <Link
                    href={welcomeData.welcomeOffer.premiumPlan.ctaLink}
                    className="block w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-yellow-500/50 animate-pulse"
                  >
                    {welcomeData.welcomeOffer.premiumPlan.ctaText}
                  </Link>
                </motion.div>

                {/* Single Reading */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl p-6 text-center"
                >
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-purple-300">
                    {welcomeData.welcomeOffer.singleReading.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    {welcomeData.welcomeOffer.singleReading.description}
                  </p>
                  <Link
                    href={welcomeData.welcomeOffer.singleReading.ctaLink}
                    className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition-all shadow-lg"
                  >
                    {welcomeData.welcomeOffer.singleReading.ctaText}
                  </Link>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="text-center p-8 pt-0">
                <p className="text-sm text-gray-400 mb-4">
                  💫 Suas escolhas definem seu destino. Comece agora sua jornada
                  de transformação!
                </p>
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    router.push("/challenge");
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
                >
                  Ir para o Jogo Gratuito →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
