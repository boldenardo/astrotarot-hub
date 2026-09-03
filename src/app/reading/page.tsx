// /reading — a leitura comprada, aberta pelo link do e-mail.
//
// noindex e sem cache: é conteúdo pago, identificado por token na query.
import type { Metadata } from "next";
import { Suspense } from "react";
import ReadingClient from "./ReadingClient";

export const metadata: Metadata = {
  title: "Your reading",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ReadingPage() {
  return (
    <main className="min-h-screen bg-[#0e0a1a]">
      <Suspense fallback={null}>
        <ReadingClient />
      </Suspense>
    </main>
  );
}
