// /quiz/offer-19 — oferta de abandono de checkout.
//
// É a cancel_url do front: quem toca na seta de voltar dentro do Stripe
// chega aqui em vez de sumir. O preço é decidido NO SERVIDOR (ver
// src/lib/server/downsell.ts) — a página não recebe nem "eligible" do
// cliente, ela é renderizada no servidor já sabendo.
//
// Quem não é elegível (e-mail que já viu a oferta, token inválido, banco
// indisponível) vai para a VSL, onde o preço cheio já está com a copy
// aprovada. Assim ninguém precisa inventar uma segunda versão do texto.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveDownsell } from "@/lib/server/downsell";
import Offer19 from "./Offer19";

export const metadata: Metadata = {
  title: "Your reading is still here",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Offer19Page({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const decision = await resolveDownsell(t ?? "");
  if (!decision.eligible) redirect("/quiz/vsl-v2");
  return <Offer19 token={t ?? ""} />;
}
