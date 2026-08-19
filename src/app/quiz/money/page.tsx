// Funil de dor — variante MONEY. Rota isolada do Control (/quiz):
// recebe tráfego direcionado, nunca randomiza o funil principal.
//
// noindex: página de experimento pago. Indexada, ela competiria com o
// Control nos mesmos termos e contaminaria a leitura do teste.

import type { Metadata } from "next";
import PainFunnel from "@/components/pain/PainFunnel";
import { MONEY_CONFIG } from "@/lib/pain-funnels/money";

export const metadata: Metadata = {
  title: MONEY_CONFIG.pageTitle,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PainFunnel config={MONEY_CONFIG} />;
}
