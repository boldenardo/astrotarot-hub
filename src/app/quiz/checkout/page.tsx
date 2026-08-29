// /quiz/checkout — o checkout próprio (ver CustomCheckout.tsx).
//
// Server component de propósito: é aqui que se lê o provider REAL do
// runtime. Com a Hotmart ativa o formulário da Stripe nem é montado — quem
// chegar aqui por um link antigo, um "voltar" do navegador ou uma env
// pública desatualizada é reencaminhado para a oferta certa (HotmartBounce).
import type { Metadata } from "next";
import CustomCheckout from "./CustomCheckout";
import HotmartBounce from "./HotmartBounce";
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
      {hotmart ? <HotmartBounce /> : <CustomCheckout />}
    </main>
  );
}
