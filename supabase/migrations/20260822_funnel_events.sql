-- Telemetria do checkout no NOSSO banco. O GA4 recebe os mesmos eventos,
-- mas ninguém da operação consegue lê-lo por API; aqui a pergunta
-- "o formulário da Stripe chegou a carregar na webview do Facebook?"
-- vira um SELECT. Só eventos de checkout/compra, nunca o conteúdo do
-- quiz. Cole no Supabase > SQL Editor e RUN. Aditiva.

CREATE TABLE IF NOT EXISTS funnel_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  funnel_session_id TEXT,
  variant TEXT,
  path TEXT,
  -- Parâmetros do evento (label, ms, loaded, reason, plan...).
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  -- "facebook" | "instagram" | "messenger" | "tiktok" | "other" | "browser"
  webview TEXT,
  viewport_w INT,
  viewport_h INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON funnel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event ON funnel_events(event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON funnel_events(funnel_session_id);

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON funnel_events FROM anon, authenticated;
