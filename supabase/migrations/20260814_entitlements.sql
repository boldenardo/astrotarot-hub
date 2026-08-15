-- =============================================================
-- ENTITLEMENTS (add-ons fora do plano base)
--
-- users.subscription_plan é UM campo de texto: não comporta um
-- catálogo de add-ons comprados por fora do plano. Esta tabela
-- passa a responder "esta pessoa tem direito a X?" para:
--   soulmate_portrait  → compra única de $24.99 (retrato completo
--                        em alta + dossiê; a prévia vem no plano)
--   vibes              → +$9.99/mês, aba de meditações
--
-- Quem escreve aqui é sempre o servidor (webhook do Stripe ou
-- rota com service role). O cliente nunca fala com esta tabela.
--
-- COMO APLICAR: cole no SQL Editor do Supabase e clique RUN.
-- =============================================================

CREATE TABLE IF NOT EXISTS user_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('soulmate_portrait', 'vibes')),
  -- 'stripe_one_time' | 'stripe_subscription_item' | 'manual'
  source TEXT NOT NULL DEFAULT 'stripe_one_time',
  -- session id, subscription item id ou nota do suporte
  stripe_reference TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL = vitalício (compra única). Preenchido para add-on recorrente.
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, feature)
);

ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON user_entitlements FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_entitlements_user
  ON user_entitlements (user_id) WHERE active;

CREATE TRIGGER update_user_entitlements_updated_at
  BEFORE UPDATE ON user_entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- RETRATOS GERADOS
-- Uma linha por pessoa. Gerar custa dinheiro, então a geração é
-- idempotente: a rota só cria se ainda não existir linha aqui.
-- =============================================================
CREATE TABLE IF NOT EXISTS soulmate_portraits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- URL pública no Supabase Storage
  image_url TEXT,
  -- versão reduzida/marcada mostrada a quem só tem o plano base
  preview_url TEXT,
  -- dossiê estruturado gerado pelo Groq (traços, janela, como reconhecer)
  dossier JSONB,
  -- prompt efetivamente usado, para auditoria e regeneração manual
  prompt TEXT,
  sign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE soulmate_portraits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON soulmate_portraits FROM anon, authenticated;

CREATE TRIGGER update_soulmate_portraits_updated_at
  BEFORE UPDATE ON soulmate_portraits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- STORAGE: bucket dos retratos
-- Público na leitura (a URL vai no <img> e no compartilhamento),
-- escrita só pelo service role. O caminho é {user_id}/portrait.png,
-- que não é adivinhável sem o id.
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('soulmate', 'soulmate', true)
ON CONFLICT (id) DO NOTHING;
