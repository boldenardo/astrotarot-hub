// /quiz/checkout — o checkout próprio (ver CustomCheckout.tsx).
//
// Server component de propósito: é aqui que se lê o provider REAL do
// runtime. Com a Hotmart ativa monta-se o HotmartCheckout — a MESMA moldura
// de confiança do checkout próprio (garantia, resumo, selo, prova), com o
// formulário de pagamento deles abrindo em overlay por cima.
import type { Metadata } from "next";
import CustomCheckout from "./CustomCheckout";
import HotmartCheckout from "./HotmartCheckout";
import { activeProvider } from "@/lib/payments/provider";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false, follow: false },
};

// O provider vem de env do servidor: a página não pode ser pré-renderizada
// no build, senão congela o gateway do momento em que o build rodou.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const hotmart = activeProvider() === "hotmart";
  return (
    <main className="min-h-screen bg-[#0e0a1a]">
      {hotmart ? <HotmartCheckout /> : <CustomCheckout />}
    </main>
  );
}
