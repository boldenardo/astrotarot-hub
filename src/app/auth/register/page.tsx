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
  ArrowLeft,
  ArrowRight,
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Use Supabase Auth
      const { user, session, requiresConfirmation } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        birthLocation: formData.birthLocation,
      });

      if (requiresConfirmation) {
        // Clear the form
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          birthDate: "",
          birthTime: "",
          birthLocation: "",
        });

        // Show an on-screen message instead of an alert
        setError(""); // Clear previous errors

        // Redirect to login with a success message
        const params = new URLSearchParams();
        params.set(
          "message",
          "Account created. Please check your email to confirm."
        );
        params.set("email", formData.email);
        router.push(`/auth/login?${params.toString()}`);
        return;
      }

      if (!session) {
        throw new Error("Failed to create session");
      }

      // Show the welcome modal
      setWelcomeData({
        message:
          "Welcome to your mystical portal. Your journey of transformation begins now.",
        welcomeOffer: {
          freeTrial: {
            title: "Play for free now",
            description: "The 4-Card Tarot reading, at no cost and no commitment",
            ctaText: "Start now",
            ctaLink: "/challenge",
          },
          premiumPlan: {
            title: "Special welcome offer",
            description: "Full access for only $9.99/mo",
            benefits: [
              "Unlimited Egyptian Tarot",
              "Personalized birth chart",
              "Love compatibility",
              "Daily forecasts",
              "Abundance ritual",
              "AI Spiritual Guide",
            ],
            price: "$9.99/mo",
            ctaText: "Activate Premium Plan",
            ctaLink: "/cart",
          },
          singleReading: {
            title: "Try a complete reading",
            description: "An Egyptian Tarot spread for only $2.99",
            ctaText: "Get one reading",
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
          "System configuration error (invalid API key). Please contact support."
        );
      } else {
        setError(err.message || "Unable to create account");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden py-12 text-ink-100">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,92,255,0.12),transparent_60%)]" />
        <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.06),transparent_45%)]" />
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/40"
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
        <div className="glass glass-gold rounded-3xl p-8 shadow-glass md:p-10">
          {/* Logo */}
          <div className="mb-8 text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="mb-4 inline-block"
            >
              <Sparkles className="h-12 w-12 text-gold-400" />
            </motion.div>
            <h1 className="mb-2 font-display text-3xl font-semibold text-ink-50">
              Create a <span className="text-gold">free</span> account
            </h1>
            <p className="text-sm text-ink-400">
              Begin your spiritual journey today
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-gold-300" : "text-ink-600"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                  step >= 1
                    ? "bg-gradient-to-br from-gold-200 to-gold-600 text-night-900"
                    : "bg-white/5 text-ink-600"
                }`}
              >
                1
              </div>
              <span className="hidden text-sm md:inline">Account</span>
            </div>
            <div
              className={`h-1 w-16 ${
                step >= 2
                  ? "bg-gradient-to-r from-gold-200 to-gold-600"
                  : "bg-white/10"
              }`}
            />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-gold-300" : "text-ink-600"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                  step >= 2
                    ? "bg-gradient-to-br from-gold-200 to-gold-600 text-night-900"
                    : "bg-white/5 text-ink-600"
                }`}
              >
                2
              </div>
              <span className="hidden text-sm md:inline">Birth Details</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
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
                  <label className="mb-2 block text-sm font-medium text-ink-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-ink-100 outline-none transition-all placeholder:text-ink-600 focus:border-gold-400/50"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-ink-100 outline-none transition-all placeholder:text-ink-600 focus:border-gold-400/50"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-12 text-ink-100 outline-none transition-all placeholder:text-ink-600 focus:border-gold-400/50"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-gold-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
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
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-ink-100 outline-none transition-all placeholder:text-ink-600 focus:border-gold-400/50"
                      placeholder="Repeat your password"
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
                        setError("Passwords do not match");
                      }
                    }
                  }}
                  className="btn-gold w-full rounded-full py-4 font-semibold"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6 rounded-2xl border border-gold-400/25 bg-gold-400/10 p-4">
                  <p className="text-sm text-ink-300">
                    <strong className="text-gold-300">Optional:</strong> Provide
                    your birth details for more accurate, personalized
                    astrological insights. You can skip this step.
                  </p>
                </div>

                {/* Birth Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-300">
                    Date of Birth (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-ink-100 outline-none transition-all placeholder:text-ink-600 focus:border-gold-400/50"
                    />
                  </div>
                </div>

                {/* Birth Time */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-300">
                    Time of Birth (Optional)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                    <input
                      type="time"
                      value={formData.birthTime}
                      onChange={(e) =>
                        setFormData({ ...formData, birthTime: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-ink-100 outline-none transition-all placeholder:text-ink-600 focus:border-gold-400/50"
                    />
                  </div>
                </div>

                {/* Birth Location */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-300">
                    Place of Birth (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      value={formData.birthLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          birthLocation: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-ink-100 outline-none transition-all placeholder:text-ink-600 focus:border-gold-400/50"
                      placeholder="New York, USA"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-ghost w-1/3 rounded-full py-3 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold flex-1 rounded-full py-3 font-semibold disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-ink-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-gold-300 transition-colors hover:text-gold-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </motion.div>

      {/* Welcome modal with offers */}
      <AnimatePresence>
        {showWelcomeModal && welcomeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 p-4 backdrop-blur-sm"
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
              className="glass glass-gold relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl shadow-glass"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  router.push("/challenge");
                }}
                className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 p-2 text-ink-200 transition-all hover:border-gold-400/50 hover:text-gold-300"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="p-8 pb-6 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="mb-4 inline-block"
                >
                  <Sparkles className="h-16 w-16 text-gold-400" />
                </motion.div>
                <h2 className="mb-4 font-display text-4xl font-semibold text-ink-50">
                  Account created{" "}
                  <span className="text-gold">successfully</span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-ink-400">
                  {welcomeData.message}
                </p>
              </div>

              {/* Offers Grid */}
              <div className="grid gap-6 p-8 pt-0 md:grid-cols-3">
                {/* Free Trial */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="glass rounded-3xl border-white/5 p-6 text-center"
                >
                  <Gift className="mx-auto mb-4 h-12 w-12 text-gold-300" />
                  <h3 className="mb-2 font-display text-xl font-semibold text-ink-50">
                    {welcomeData.welcomeOffer.freeTrial.title}
                  </h3>
                  <p className="mb-4 text-sm text-ink-400">
                    {welcomeData.welcomeOffer.freeTrial.description}
                  </p>
                  <Link
                    href={welcomeData.welcomeOffer.freeTrial.ctaLink}
                    className="btn-ghost block w-full rounded-full py-3 font-semibold"
                  >
                    {welcomeData.welcomeOffer.freeTrial.ctaText}
                  </Link>
                </motion.div>

                {/* Premium Plan - Highlighted */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="glass glass-gold relative overflow-hidden rounded-3xl p-6 text-center"
                >
                  {/* Recommended badge */}
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-gold-200 to-gold-600 px-4 py-1 text-xs font-bold text-night-900">
                    Recommended
                  </div>

                  <Crown className="mx-auto mb-4 mt-4 h-12 w-12 text-gold-400" />
                  <h3 className="mb-2 font-display text-2xl font-semibold text-gold-300">
                    {welcomeData.welcomeOffer.premiumPlan.title}
                  </h3>
                  <p className="mb-3 text-sm text-ink-400">
                    {welcomeData.welcomeOffer.premiumPlan.description}
                  </p>

                  {/* Benefits */}
                  <ul className="mb-4 space-y-2 text-left text-sm">
                    {welcomeData.welcomeOffer.premiumPlan.benefits.map(
                      (benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-400" />
                          <span className="text-ink-200">{benefit}</span>
                        </li>
                      )
                    )}
                  </ul>

                  <div className="mb-4 text-3xl font-bold text-gold">
                    {welcomeData.welcomeOffer.premiumPlan.price}
                  </div>

                  <Link
                    href={welcomeData.welcomeOffer.premiumPlan.ctaLink}
                    className="btn-gold block w-full rounded-full py-4 text-lg"
                  >
                    {welcomeData.welcomeOffer.premiumPlan.ctaText}
                  </Link>
                </motion.div>

                {/* Single Reading */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="glass rounded-3xl border-white/5 p-6 text-center"
                >
                  <Sparkles className="mx-auto mb-4 h-12 w-12 text-gold-300" />
                  <h3 className="mb-2 font-display text-xl font-semibold text-ink-50">
                    {welcomeData.welcomeOffer.singleReading.title}
                  </h3>
                  <p className="mb-4 text-sm text-ink-400">
                    {welcomeData.welcomeOffer.singleReading.description}
                  </p>
                  <Link
                    href={welcomeData.welcomeOffer.singleReading.ctaLink}
                    className="btn-ghost block w-full rounded-full py-3 font-semibold"
                  >
                    {welcomeData.welcomeOffer.singleReading.ctaText}
                  </Link>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="p-8 pt-0 text-center">
                <p className="mb-4 text-sm text-ink-600">
                  Your choices shape your destiny. Begin your journey of
                  transformation now.
                </p>
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    router.push("/challenge");
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-300 transition-colors hover:text-gold-200"
                >
                  Go to the free game
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
