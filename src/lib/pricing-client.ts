"use client";

// Moeda do visitante no CLIENT — para exibição apenas.
//
// Busca o país no /api/geo (mesmos headers de IP que o servidor usa para
// COBRAR) e devolve o grid. Antes da resposta, USD: o primeiro paint é
// idêntico ao SSR (sem erro de hidratação) e o mundo inteiro fora dos
// países ligados nunca vê flicker. O valor final cobrado continua sendo o
// do PaymentIntent — o servidor decide; isto aqui só mostra.

import { useEffect, useState } from "react";
import { USD_GRID, gridForCountry, type CurrencyGrid } from "@/lib/pricing";

export function useLocalPricing(): CurrencyGrid {
  const [grid, setGrid] = useState<CurrencyGrid>(USD_GRID);
  useEffect(() => {
    let alive = true;
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { country?: string | null } | null) => {
        if (alive && d?.country) setGrid(gridForCountry(d.country));
      })
      .catch(() => {
        // sem geo: fica em USD
      });
    return () => {
      alive = false;
    };
  }, []);
  return grid;
}
