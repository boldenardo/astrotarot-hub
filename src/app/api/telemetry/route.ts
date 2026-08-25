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

const ALLOWED = new Set([
  "pain_offer_viewed",
  "pain_checkout_clicked",
  "offer_viewed",
  "checkout_cta_clicked",
  "checkout_session_created",
  "checkout_error",
  "checkout_form_opened",
  "checkout_form_loaded",
  "checkout_form_slow",
  "checkout_form_timeout",
  "checkout_form_error",
  "checkout_form_closed",
  "checkout_fallback_hosted",
  "checkout_redirect_started",
  "checkout_escape_attempted",
  "checkout_escape_failed",
  "purchase_completed",
]);

const MAX_PARAMS_BYTES = 1500;
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
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : "";
  if (!ALLOWED.has(event)) return NextResponse.json({ ok: false }, { status: 400 });

  const ua = (req.headers.get("user-agent") || "").slice(0, 400);
  const row = {
    event,
    funnel_session_id:
      typeof body.funnelSessionId === "string" ? body.funnelSessionId.slice(0, 64) : null,
    variant: typeof body.variant === "string" ? body.variant.slice(0, 64) : null,
    path: typeof body.path === "string" ? body.path.slice(0, 120) : null,
    params: cleanParams(body.params),
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
