// /f/<funnel>/<variant> — rota única de todos os funis experimentais.
// O engine é o mesmo dos funis de dor; a diferença vive no registro.
// Sempre noindex (variantes não competem com as páginas públicas).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PainFunnel from "@/components/pain/PainFunnel";
import { getFunnel } from "@/lib/funnels/registry";

type Params = Promise<{ funnel: string; variant: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { funnel, variant } = await params;
  const cfg = getFunnel(funnel, variant);
  return {
    title: cfg?.pageTitle ?? "AstroTarot",
    robots: { index: false, follow: true },
  };
}

export default async function FunnelPage({ params }: { params: Params }) {
  const { funnel, variant } = await params;
  const cfg = getFunnel(funnel, variant);
  if (!cfg) notFound();
  return <PainFunnel config={cfg} />;
}
