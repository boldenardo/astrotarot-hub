// GET /api/geo — cidade/região aproximada do visitante, lida dos headers
// que a Vercel injeta na borda. Usada só para personalizar a tela de
// "onde você vai encontrar sua alma gêmea" no funil.
//
// Privacidade: não guardamos nada e não expomos o IP — apenas devolvemos
// o nome da cidade/região que a própria rede já informa. Em dev (sem os
// headers) retorna vazio e o funil usa um texto genérico.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

function clean(value: string | null): string | null {
  if (!value) return null;
  // Vercel envia city URL-encoded (ex.: "S%C3%A3o%20Paulo").
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded.length > 0 && decoded.length <= 80 ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const city = clean(req.headers.get("x-vercel-ip-city"));
  const region = clean(req.headers.get("x-vercel-ip-country-region"));
  const country = clean(req.headers.get("x-vercel-ip-country"));

  return NextResponse.json(
    { city, region, country },
    // Sem cache: a resposta varia por visitante.
    { headers: { "Cache-Control": "no-store" } }
  );
}
