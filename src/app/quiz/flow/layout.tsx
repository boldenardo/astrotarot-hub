import type { Metadata } from "next";

// Etapa intermediária do funil — sem valor de busca; não indexar.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function QuizFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
