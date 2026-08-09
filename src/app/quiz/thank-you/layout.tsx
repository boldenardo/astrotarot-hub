import type { Metadata } from "next";

// Página pós-conversão — nunca indexar (também bloqueada no robots.txt).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function QuizThankYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
