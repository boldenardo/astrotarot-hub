import type { Metadata } from "next";

// Variante da VSL — mesma política da V1: etapa de funil, sem valor de
// busca. noindex/nofollow, e fora do sitemap. Duas páginas comerciais com
// o mesmo conteúdo indexadas seriam canibalização pura.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function QuizVslV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
