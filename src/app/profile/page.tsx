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
  Sparkles,
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
    loadUserData();
  }, []);

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
      console.error("Erro ao carregar perfil:", error);
      setMessage({ type: "error", text: "Erro ao carregar seus dados." });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const authUser = await getCurrentUser();
      if (!authUser) throw new Error("Usuário não autenticado");

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

      // Limpar cache do mapa astral antigo se houver, para gerar um novo com os novos dados
      // Primeiro pegamos o ID interno do usuário
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

      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });

      // Redirecionar de volta para o dashboard após um breve delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      setMessage({
        type: "error",
        text: error.message || "Erro ao atualizar perfil.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Seu Perfil Astral</h1>
              <p className="text-gray-400 text-sm">
                Mantenha seus dados atualizados para previsões precisas
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
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                  placeholder="Seu nome místico"
                />
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Nascimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Hora de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hora de Nascimento
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="time"
                  required
                  value={formData.birthTime}
                  onChange={(e) =>
                    setFormData({ ...formData, birthTime: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white [color-scheme:dark]"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Essencial para calcular seu Ascendente e Casas
              </p>
            </div>

            {/* Local de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cidade de Nascimento
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={formData.birthLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, birthLocation: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                  placeholder="Ex: São Paulo, SP"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
