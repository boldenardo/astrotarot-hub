"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function MiniBirthChart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    city: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate a short delay for the "calculation"
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Save the data to localStorage to use after sign-up
    localStorage.setItem("pendingBirthChart", JSON.stringify(formData));

    // Redirect to sign-up
    router.push("/auth/register?ref=birth_chart");
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,92,255,0.08),transparent_60%)]" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <Star
              className="w-12 h-12 text-gold-300 mx-auto mb-4"
              fill="currentColor"
            />
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-ink-50 mb-4">
              Discover Your <span className="text-gold">Birth Chart</span>
            </h2>
            <p className="text-xl text-ink-400">
              Reveal the secrets the stars held at the moment of your birth
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass glass-gold rounded-3xl p-8 md:p-12 shadow-glass"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold-300" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 text-ink-100 placeholder-ink-600"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold-300" /> City of Birth
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 text-ink-100 placeholder-ink-600"
                  placeholder="e.g. São Paulo, Brazil"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold-300" /> Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 text-ink-100 placeholder-ink-600 [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-300" /> Time (Optional)
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 text-ink-100 placeholder-ink-600 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-4 rounded-full font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Calculating Chart...
                  </>
                ) : (
                  <>
                    Generate Free Birth Chart
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
              <p className="text-center text-ink-600 text-sm mt-4">
                *By clicking, you&apos;ll be redirected to create your free
                account and view your results.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
