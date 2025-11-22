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

    // Simula um pequeno delay para "cálculo"
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Salva os dados no localStorage para usar após o cadastro
    localStorage.setItem("pendingBirthChart", JSON.stringify(formData));

    // Redireciona para o cadastro
    router.push("/auth/register?ref=birth_chart");
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <Star
              className="w-12 h-12 text-yellow-400 mx-auto mb-4"
              fill="currentColor"
            />
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-400 bg-clip-text text-transparent mb-4">
              Descubra seu Mapa Astral
            </h2>
            <p className="text-xl text-gray-400">
              Revele os segredos dos astros no momento do seu nascimento
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-900/80 via-purple-950/30 to-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-12 shadow-2xl shadow-purple-500/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" /> Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" /> Cidade de
                  Nascimento
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
                  placeholder="Ex: São Paulo, SP"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> Data de
                  Nascimento
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600 [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" /> Horário
                  (Opcional)
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Calculando Mapa...
                  </>
                ) : (
                  <>
                    Gerar Mapa Astral Grátis
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
              <p className="text-center text-gray-500 text-sm mt-4">
                *Ao clicar, você será redirecionado para criar sua conta
                gratuita e visualizar o resultado.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
