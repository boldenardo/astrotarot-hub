// /quiz/reveal — a revelação das duas cartas grátis, entre a VSL e o
// pagamento. noindex: é um passo interno do funil, e indexá-lo colocaria
// tráfego frio no meio de uma cerimônia que só faz sentido com as respostas
// do quiz na mão.
import type { Metadata } from "next";
import { Suspense } from "react";
import RevealClient from "./RevealClient";
import { activeProvider } from "@/lib/payments/provider";

export const metadata: Metadata = {
  title: "Your spread",
  robots: { index: false, follow: false },
};

// O gateway vem do SERVIDOR, não de NEXT_PUBLIC_PAYMENT_PROVIDER.
//
// A env pública é inlinada no build e pode discordar da env do servidor —
// basta o dono setar uma e esquecer a outra na Vercel. Aqui a discordância
// custaria caro: acreditando em Hotmart quando o servidor está em Stripe,
// a página pediria uma sessão hospedada da Stripe e mandaria a pessoa para
// lá — o checkout hospedado que saiu do funil em 25/08 depois de 13
// sessões e zero vendas. Uma fonte de verdade só.
export const dynamic = "force-dynamic";

export default function RevealPage() {
  return (
    <main className="min-h-screen bg-[#0e0a1a]">
      <Suspense fallback={null}>
        <RevealClient hotmart={activeProvider() === "hotmart"} />
      </Suspense>
    </main>
  );
}
