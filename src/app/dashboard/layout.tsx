import type { Metadata } from "next";

// Área privada — nunca indexar (cinto e suspensório além do robots.txt).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
