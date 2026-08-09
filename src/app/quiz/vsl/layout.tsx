import type { Metadata } from "next";

// VSL do funil — sem valor de busca; não indexar.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function QuizVslLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
