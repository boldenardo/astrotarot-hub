"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Heart, Sparkles, Moon } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function GuiaEspiritualPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá, querida! 💜 Sou seu Guia Espiritual. Este é um espaço seguro para você compartilhar seus sentimentos, desafios e sonhos. Como posso te acolher hoje?",
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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/guia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.reply) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Desculpe, tive dificuldades para responder. Por favor, tente novamente.",
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
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-950 via-black to-black" />

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
              <Heart className="w-8 h-8 text-pink-400" fill="currentColor" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Guia Espiritual
              </h1>
              <Moon className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm">
              Um espaço seguro para acolhimento e orientação emocional
            </p>
          </motion.div>

          {/* Chat Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-purple-950/30 backdrop-blur-xl border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
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
                        ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                        : "bg-purple-900/50 border border-purple-500/30 text-gray-200"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <span className="text-xs text-pink-400 font-semibold">
                          Guia Espiritual
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <span className="text-xs opacity-50 mt-2 block">
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
                  <div className="bg-purple-900/50 border border-purple-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        Refletindo...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-purple-500/30 p-4 bg-purple-950/50">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Compartilhe seus pensamentos..."
                  className="flex-1 bg-purple-900/30 border border-purple-500/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400/50 resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all hover:scale-105 shadow-lg shadow-pink-500/30"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Pressione Enter para enviar • Shift + Enter para nova linha
              </p>
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              {
                icon: <Heart className="w-5 h-5" />,
                title: "Acolhimento",
                text: "Espaço seguro e sem julgamentos",
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                title: "Orientação",
                text: "Insights para seu crescimento",
              },
              {
                icon: <Moon className="w-5 h-5" />,
                title: "Confidencial",
                text: "Suas conversas são privadas",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-purple-950/30 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white mb-2">
                  {card.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{card.title}</h3>
                <p className="text-xs text-gray-400">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
