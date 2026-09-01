// POST /api/telemetry — espelho dos eventos de checkout no nosso banco.
//
// Por que existe: o GA4 recebe checkout_form_opened/loaded/timeout, mas
// ninguém da operação lê o GA4 por API — e a pergunta que decide o
// faturamento ("o formulário da Stripe carrega na webview do Facebook?")
// ficava sem resposta. Aqui vira um SELECT em funnel_events.
//
// Público (o visitante não tem conta), mas: só aceita uma lista fixa de
// eventos, corta payload, nunca grava e-mail ou respostas do quiz, e é
// best-effort — falha em silêncio, nunca atrasa a compra.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

// Mesma família do espelho do cliente (ver src/lib/analytics.ts). Prefixo
// em vez de lista: cada evento novo do funil entra sozinho, e o que não é
// de funil continua barrado.
const ALLOWED =
  /^(quiz_|vsl_|pain_|checkout_|offer_|downsell_|cta_viewed$|lead_captured$|purchase_completed$|plan_options|experience_|ritual_|dream_|soulmate_)/;

const MAX_PARAMS_BYTES = 1500;

/** As unicas chaves de origem aceitas. Espelha ENTRY_KEYS do analytics. */
const ENTRY_KEYS = new Set([
  "from", "src", "ref", "canceled",
  "utm_source", "utm_medium", "utm_campaign",
]);
const SENSITIVE = /email|name|birth|answer|phone|card/i;

function webviewOf(ua: string): string {
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "facebook";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/Messenger|FBMD/i.test(ua)) return "messenger";
  if (/TikTok|musical_ly|Bytedance/i.test(ua)) return "tiktok";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/\bwv\b|WebView/i.test(ua)) return "other";
  return "browser";
}

function cleanParams(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (SENSITIVE.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 120);
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return JSON.stringify(out).length > MAX_PARAMS_BYTES ? {} : out;
}

export async function POST(req: NextRequest) {
  let body: {
    event?: string;
    params?: unknown;
    funnelSessionId?: string;
    variant?: string;
    path?: string;
    vw?: number;
    vh?: number;
    q?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : "";
  if (!ALLOWED.test(event) || event.length > 48) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ua = (req.headers.get("user-agent") || "").slice(0, 400);

  // ── PAIS E ORIGEM ────────────────────────────────────────────────────
  //
  // O pais vem do header que a Vercel injeta na borda, LIDO AQUI: nao custa
  // round-trip nenhum e nao depende do cliente cooperar. Sem ele nao havia
  // como responder a pergunta que o funil vive fazendo — 20 pessoas abriram
  // o checkout em sete dias e nenhuma pagou, e a hipotese mais forte e QUEM
  // esta pagando (cartao bloqueado para compra internacional na Africa do
  // Sul, India, Nepal), nao o gateway.
  //
  // Vai dentro de `params` e nao numa coluna nova de proposito: coluna
  // exigiria SQL rodado a mao antes de qualquer dado aparecer, e um insert
  // com coluna inexistente derruba TODA a telemetria, nao so o campo novo.
  const country = (req.headers.get("x-vercel-ip-country") || "").slice(0, 2) || null;
  // A whitelist mora AQUI, e nao so no cliente: `q` vem do corpo do POST e
  // qualquer um pode chamar esta rota. Sem isto, um caller curioso enfia o
  // que quiser em params e a coluna vira lixeira aberta.
  const entry =
    body.q && typeof body.q === "object"
      ? Object.fromEntries(
          Object.entries(body.q as Record<string, unknown>)
            .filter(
              ([k, v]) => ENTRY_KEYS.has(k) && typeof v === "string" && v
            )
            .map(([k, v]) => [`q_${k}`, String(v).slice(0, 60)])
        )
      : {};
  const row = {
    event,
    funnel_session_id:
      typeof body.funnelSessionId === "string" ? body.funnelSessionId.slice(0, 64) : null,
    variant: typeof body.variant === "string" ? body.variant.slice(0, 64) : null,
    path: typeof body.path === "string" ? body.path.slice(0, 120) : null,
    // O pais entra DEPOIS do cleanParams: ele e derivado do request, nao
    // enviado pelo cliente, entao nao passa pelo filtro de conteudo — e nao
    // pode ser forjado por quem chama a rota.
    params: { ...cleanParams(body.params), ...entry, ...(country ? { country } : {}) },
    user_agent: ua,
    webview: webviewOf(ua),
    viewport_w: Number.isFinite(body.vw) ? Math.round(body.vw as number) : null,
    viewport_h: Number.isFinite(body.vh) ? Math.round(body.vh as number) : null,
  };

  try {
    const { error } = await getSupabaseAdmin().from("funnel_events").insert(row);
    if (error) console.warn("[telemetry] insert skipped:", error.message, JSON.stringify(row));
  } catch (e) {
    console.warn("[telemetry] failed:", e);
  }
  return NextResponse.json({ ok: true });
}
