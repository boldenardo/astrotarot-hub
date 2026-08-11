-- Programa de afiliados — tracking próprio (sem SaaS externo).
-- Cole no Supabase > SQL Editor e RUN.
--
-- Modelo:
--   affiliates        — cadastro do parceiro (código = o que vai na URL ?ref=)
--   affiliate_clicks  — 1 linha por clique único (dedup por visitor_id)
--   affiliate_sales   — 1 linha por venda atribuída (inicial ou renovação)
--   users.affiliate_code — atribuição permanente do cliente (first-touch),
--                          usada para creditar renovações de assinatura.
--
-- Todas as tabelas ficam FORA do alcance de anon/authenticated: só o
-- service role (webhook/APIs do servidor) lê e escreve.

CREATE TABLE IF NOT EXISTS affiliates (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  -- Percentual de comissão (ex.: 30.00 = 30%). Informativo: o cálculo do
  -- valor devido acontece na leitura do painel, não aqui.
  commission_pct DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  -- ID anônimo do visitante (gerado no browser). Serve só para não contar
  -- o mesmo visitante várias vezes — não identifica pessoa.
  visitor_id TEXT NOT NULL,
  landing_path TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Um clique por visitante/código: recarregar a página não infla o número.
CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_clicks_visitor
  ON affiliate_clicks(code, visitor_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON affiliate_clicks(code);

CREATE TABLE IF NOT EXISTS affiliate_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  plan TEXT,
  -- 'initial' = primeira compra | 'renewal' = renovação de assinatura
  kind TEXT NOT NULL DEFAULT 'initial' CHECK (kind IN ('initial', 'renewal')),
  commission_pct DECIMAL(5, 2),
  stripe_checkout_session_id TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotência: o webhook do Stripe pode reentregar o mesmo evento.
CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_sales_session
  ON affiliate_sales(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_sales_invoice
  ON affiliate_sales(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_code ON affiliate_sales(code);

-- Atribuição permanente no cliente (first-touch): quem trouxe este usuário.
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code
  ON users(affiliate_code) WHERE affiliate_code IS NOT NULL;

-- Segurança: nada de acesso público a dados de afiliados.
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_sales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON affiliates FROM anon, authenticated;
REVOKE ALL ON affiliate_clicks FROM anon, authenticated;
REVOKE ALL ON affiliate_sales FROM anon, authenticated;

-- Painel: resumo por afiliado (lido pelo /admin/affiliates via service role).
CREATE OR REPLACE VIEW affiliate_stats AS
SELECT
  a.code,
  a.name,
  a.email,
  a.commission_pct,
  a.active,
  COALESCE(c.clicks, 0)              AS clicks,
  COALESCE(s.sales, 0)               AS sales,
  COALESCE(s.revenue, 0)             AS revenue,
  ROUND(COALESCE(s.revenue, 0) * a.commission_pct / 100, 2) AS commission_due,
  s.last_sale_at
FROM affiliates a
LEFT JOIN (
  SELECT code, COUNT(*) AS clicks FROM affiliate_clicks GROUP BY code
) c ON c.code = a.code
LEFT JOIN (
  SELECT code,
         COUNT(*)      AS sales,
         SUM(amount)   AS revenue,
         MAX(created_at) AS last_sale_at
  FROM affiliate_sales GROUP BY code
) s ON s.code = a.code;

REVOKE ALL ON affiliate_stats FROM anon, authenticated;

-- Exemplo de cadastro de afiliado (edite e rode quando for criar um):
-- INSERT INTO affiliates (code, name, email, commission_pct)
-- VALUES ('maria30', 'Maria Silva', 'maria@exemplo.com', 30.00);
