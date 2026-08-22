-- AstroTarot 2.0 — histórico das experiências guiadas (rituais, sonhos,
-- vidas passadas, leitura de conexão). Uma tabela genérica: o formato de
-- cada leitura vive em `result` (jsonb) com schema fixo por `kind`.
-- Cole no Supabase > SQL Editor e RUN. Aditiva; nada é apagado.

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('ritual', 'dream', 'past-life', 'connection')),
  subtype TEXT,
  -- Entrada enumerada (ids de opção, intenção). Nunca o relato livre inteiro.
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiences_user_kind ON experiences(user_id, kind, created_at DESC);

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON experiences FROM anon, authenticated;
