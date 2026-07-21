"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import { trackPageView } from "@/lib/analytics";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthLocation: "",
  });

  useEffect(() => {
    trackPageView("/profile", "Profile");

    async function loadUserData() {
      try {
        const authUser = await getCurrentUser();
        if (!authUser) {
          router.push("/auth/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", authUser.id)
          .single();

        if (error) throw error;

        if (profile) {
          setFormData({
            name: profile.name || "",
            birthDate: profile.birth_date || "",
            birthTime: profile.birth_time || "",
            birthLocation: profile.birth_location || "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setMessage({ type: "error", text: "Failed to load your data." });
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const authUser = await getCurrentUser();
      if (!authUser) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          birth_date: formData.birthDate,
          birth_time: formData.birthTime,
          birth_location: formData.birthLocation,
        })
        .eq("auth_id", authUser.id);

      if (error) throw error;

      // Clear any old cached birth chart so a new one is generated with the updated data.
      // First we get the user's internal ID
      const { data: userProfile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

      if (userProfile) {
        await supabase
          .from("birth_charts")
          .delete()
          .eq("user_id", userProfile.id);
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });

      // Redirect back to the dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-ink-200 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,92,255,0.1),transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-ink-400 hover:text-ink-50 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-gold rounded-3xl p-8 shadow-glass"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full border border-gold-400/25 bg-gold-400/10 flex items-center justify-center">
              <User className="w-6 h-6 text-gold-300" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-50">
                Your Astral Profile
              </h1>
              <p className="text-ink-400 text-sm">
                Keep your details up to date for accurate forecasts
              </p>
            </div>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`mb-6 p-4 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-600" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all outline-none text-ink-100 placeholder-ink-600"
                  placeholder="Your mystical name"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-600" />
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all outline-none text-ink-100 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Time of Birth */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-2">
                Time of Birth
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-600" />
                <input
                  type="time"
                  required
                  value={formData.birthTime}
                  onChange={(e) =>
                    setFormData({ ...formData, birthTime: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all outline-none text-ink-100 [color-scheme:dark]"
                />
              </div>
              <p className="text-xs text-ink-600 mt-1 ml-1">
                Essential to calculate your Ascendant and Houses
              </p>
            </div>

            {/* City of Birth */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-2">
                City of Birth
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-600" />
                <input
                  type="text"
                  required
                  value={formData.birthLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, birthLocation: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-night-900/60 border border-white/10 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all outline-none text-ink-100 placeholder-ink-600"
                  placeholder="e.g. São Paulo, Brazil"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-gold w-full py-4 rounded-full font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
