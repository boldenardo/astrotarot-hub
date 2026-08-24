-- Downsell de abandono de checkout ($19.99) — controle NO SERVIDOR.
--
-- A página promete "não é um preço que dá para voltar e pegar". Isso só
-- pode ser dito porque a permissão vive AQUI, amarrada ao e-mail: limpar
-- localStorage, abrir aba anônima ou reabrir o link não devolve o desconto.
-- Sem esta tabela a frase seria mentira e todo mundo aprenderia a abandonar
-- o checkout para comprar $29 por $19.99 para sempre.
--
-- Cole no Supabase > SQL Editor e RUN. Aditiva.

CREATE TABLE IF NOT EXISTS downsell_grants (
  -- Token opaco que viaja na cancel_url. Nunca o e-mail: PII não vai
  -- para query string.
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  quiz_session_id TEXT,
  -- Sessão de checkout que a pessoa abandonou (origem desta permissão).
  stripe_checkout_session_id TEXT,
  -- Primeira vez que a oferta foi EXIBIDA para este token.
  seen_at TIMESTAMP WITH TIME ZONE,
  -- Quando virou compra. A partir daqui o e-mail nunca mais vê $19.99.
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A consulta quente é "este e-mail já viu/usou alguma vez?".
CREATE INDEX IF NOT EXISTS idx_downsell_grants_email
  ON downsell_grants(email, seen_at, used_at);

ALTER TABLE downsell_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON downsell_grants FROM anon, authenticated;
