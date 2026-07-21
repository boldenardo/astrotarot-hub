"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Heart, Sparkles, Moon } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function GuiaEspiritualPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá, querida alma. Eu sou a Luna, sua guia espiritual. Este é um espaço seguro para compartilhar seus sentimentos, desafios e sonhos. Como posso te acolher hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    // Últimas 10 mensagens como contexto para a Luna
    const history = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/spiritual-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history }),
      });

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.message) {
        throw new Error(data?.error || "Falha ao enviar a mensagem");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Desculpe, não consegui processar sua mensagem agora. Tente novamente em instantes.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-ink-200">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,92,255,0.10),transparent_60%)]" />

      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
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

      <Navbar />

      <div className="relative z-10 pt-32 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-gold-300" fill="currentColor" />
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-50">
                Guia <span className="text-gold">Espiritual</span>
              </h1>
              <Moon className="w-8 h-8 text-gold-400" />
            </div>
            <p className="text-ink-400 text-sm">
              Um espaço seguro de acolhimento e orientação emocional
            </p>
          </motion.div>

          {/* Chat Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass glass-gold relative rounded-3xl overflow-hidden shadow-glass"
          >
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-gold-400/10 border border-gold-400/20 text-ink-100"
                        : "glass text-ink-200"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-gold-300" />
                        <span className="text-xs text-gold-300 font-semibold">
                          Luna
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <span className="text-xs text-ink-600 mt-2 block">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gold-300 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-xs text-ink-400">
                        Refletindo...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-white/5 p-4">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Compartilhe seus pensamentos..."
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="btn-gold flex items-center justify-center rounded-2xl px-6 py-3 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-ink-600 mt-2 text-center">
                Pressione Enter para enviar &bull; Shift + Enter para nova
                linha
              </p>
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              {
                icon: <Heart className="w-5 h-5" />,
                title: "Acolhimento",
                text: "Um espaço seguro e sem julgamentos",
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                title: "Orientação",
                text: "Insights para o seu crescimento",
              },
              {
                icon: <Moon className="w-5 h-5" />,
                title: "Confidencial",
                text: "Suas conversas permanecem privadas",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass rounded-2xl border-white/5 p-4 text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gold-400/25 bg-gold-400/10 text-gold-300 mb-2">
                  {card.icon}
                </div>
                <h3 className="font-semibold text-ink-50 mb-1">{card.title}</h3>
                <p className="text-xs text-ink-400">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
