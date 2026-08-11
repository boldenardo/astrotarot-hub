"use client";

// Captura ?ref=CODIGO em QUALQUER página pública e registra o clique uma
// única vez por visitante. Não renderiza nada e não bloqueia a página:
// roda depois da hidratação e falha em silêncio se o registro não passar.

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  AFFILIATE_PARAM,
  getVisitorId,
  normalizeCode,
  storeRef,
} from "@/lib/affiliate";

export default function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams.get(AFFILIATE_PARAM);
    const code = normalizeCode(raw);
    if (!code) return;

    // storeRef só retorna código quando ESTA visita criou a atribuição
    // (first-touch) — evita contar clique a cada refresh com ?ref= na URL.
    const attributed = storeRef(code);
    if (!attributed) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    void fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        code: attributed,
        visitorId,
        landingPath: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {
      // rede indisponível: a atribuição local continua valendo para a venda
    });
  }, [searchParams]);

  return null;
}
