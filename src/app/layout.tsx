import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstroTarot Hub - Tarot e Astrologia",
  description:
    "Plataforma de tiragens de tarot integradas com análises astrológicas personalizadas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
