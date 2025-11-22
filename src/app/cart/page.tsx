"use client";

import { motion } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPayment } from "@/lib/payment-client";
import {
  trackPageView,
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackPaymentFailed,
} from "@/lib/analytics";
import Image from "next/image";

interface CartItem {
  id: string;
  type: "SINGLE_READING" | "SUBSCRIPTION";
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      type: "SINGLE_READING",
      name: "Tiragem do Tarot Egípcio",
      description: "Uma tiragem completa com interpretação personalizada",
      price: 9.9,
      quantity: 1,
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    trackPageView("/cart", "Carrinho de Compras");
  }, []);

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsProcessing(true);
    const firstItem = cartItems[0];

    // Track payment initiation
    trackPaymentInitiated(firstItem.type, firstItem.price);

    try {
      const result = await createPayment({
        type: firstItem.type,
        customerName: "Cliente",
      });

      if (result.success) {
        setPaymentData(result.payment);
        // Track payment creation success
        trackPaymentCompleted(firstItem.type, firstItem.price);
      } else {
        trackPaymentFailed(firstItem.type, "payment_creation_failed");
      }
    } catch (error: any) {
      console.error("Erro ao criar pagamento:", error);
      trackPaymentFailed(firstItem.type, error.message || "unknown_error");
      alert("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
              Seu Carrinho
            </h1>
          </div>
          <p className="text-gray-400">
            Revise seus itens antes de finalizar a compra
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-12 border border-gray-800 text-center"
              >
                <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Carrinho Vazio</h2>
                <p className="text-gray-400 mb-6">
                  Adicione itens para começar sua jornada espiritual
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all"
                >
                  Explorar Serviços
                </Link>
              </motion.div>
            ) : (
              cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>

                    {/* Details */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        {item.type === "SINGLE_READING" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                              disabled={item.quantity === 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {item.type === "SUBSCRIPTION" && (
                          <div className="text-sm text-purple-400">
                            Cobrança mensal
                          </div>
                        )}

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-300">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              R$ {item.price.toFixed(2)} cada
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex-shrink-0"
                      title="Remover"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 sticky top-24"
            >
              <h2 className="text-2xl font-bold mb-6">Resumo do Pedido</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Desconto</span>
                  <span className="text-green-400">R$ 0,00</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-purple-300">
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {cartItems.length > 0 && !paymentData && (
                <>
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Finalizar Compra
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Pagamento seguro via PIX • Confirmação instantânea
                  </p>
                </>
              )}

              {/* QR Code Payment */}
              {paymentData && (
                <div className="mt-6 p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/30">
                  <h3 className="text-xl font-bold mb-4 text-center">
                    🎉 Pagamento Criado!
                  </h3>
                  <p className="text-gray-300 text-center mb-4">
                    Escaneie o QR Code abaixo para pagar via PIX
                  </p>
                  {paymentData.qrCode && (
                    <div className="bg-white p-4 rounded-xl mb-4 flex justify-center">
                      <Image
                        src={paymentData.qrCode}
                        alt="QR Code PIX"
                        width={256}
                        height={256}
                        className="w-64 h-64"
                        unoptimized // Since it might be a data URL or external without config
                      />
                    </div>
                  )}
                  {paymentData.qrString && (
                    <div className="bg-black/50 p-4 rounded-lg mb-4">
                      <p className="text-xs text-gray-400 mb-2 text-center">
                        Ou copie o código PIX:
                      </p>
                      <p className="text-xs text-purple-300 break-all text-center">
                        {paymentData.qrString}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-400 text-center">
                    ⏰ Expira em:{" "}
                    {new Date(paymentData.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
              )}

              {/* Add More Items */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-semibold mb-3 text-sm text-gray-400">
                  Adicionar mais:
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/tarot"
                    className="block p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 transition-all text-sm"
                  >
                    <div className="font-semibold">+ Tiragem Tarot</div>
                    <div className="text-xs text-gray-400">R$ 9,90</div>
                  </Link>
                  <Link
                    href="/#premium"
                    className="block p-3 bg-pink-500/10 hover:bg-pink-500/20 rounded-lg border border-pink-500/30 transition-all text-sm"
                  >
                    <div className="font-semibold">🌟 Plano Premium</div>
                    <div className="text-xs text-gray-400">R$ 29,90/mês</div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Continue Shopping */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
          >
            ← Continuar Explorando
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
