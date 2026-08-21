// Funil de dor D — o ex ("why can't I let him go").
// Rota fina: todo o funil vive no engine <PainFunnel> + EX_CONFIG.

import type { Metadata } from "next";
import PainFunnel from "@/components/pain/PainFunnel";
import { EX_CONFIG } from "@/lib/pain-funnels/ex";

export const metadata: Metadata = {
  title: EX_CONFIG.pageTitle,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PainFunnel config={EX_CONFIG} />;
}
