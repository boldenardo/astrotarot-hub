-- =============================================================
-- LEADS DO FUNIL DE QUIZ
-- Antes desta migration, o email capturado no quiz vivia SÓ no
-- localStorage do browser — quem não comprava na hora era perdido
-- para sempre. Esta tabela persiste o lead no servidor (via
-- POST /api/quiz/lead, service role) e o webhook do Stripe marca
-- converted_at na compra, dando a taxa lead → venda direto no banco.
--
-- COMO APLICAR: cole este arquivo inteiro no SQL Editor do Supabase
-- (Dashboard → SQL Editor → New query) e clique RUN.
-- =============================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  birth_date DATE,
  sign TEXT,
  score TEXT,
  answers JSONB,
  visitor_id TEXT,
  affiliate_code TEXT,
  source TEXT DEFAULT 'quiz',
  source_platform TEXT,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS ligado SEM policies: só o service role (APIs do Next) lê/escreve.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON leads FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_leads_visitor ON leads (visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
