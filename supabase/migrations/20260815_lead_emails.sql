-- =============================================================
-- CONTROLE DE ENVIO DE E-MAIL PARA LEADS
--
-- Duas colunas de carimbo para nunca reenviar a mesma coisa:
--   reading_email_sent_at   — a leitura prometida no quiz (envio único)
--   recovery_email_sent_at  — carrinho abandonado (envio único)
--
-- Sem isso, cada re-submit do formulário dispararia outro e-mail: spam
-- para a pessoa e reputação de domínio queimada (o que derruba a entrega
-- de TODOS os e-mails, inclusive os de quem comprou).
--
-- COMO APLICAR: cole no SQL Editor do Supabase e RUN.
-- =============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS reading_email_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMPTZ;

-- Fila do carrinho abandonado: leads sem compra que ainda não receberam
-- o e-mail de recuperação. O índice parcial mantém a busca barata mesmo
-- com a tabela crescendo.
CREATE INDEX IF NOT EXISTS idx_leads_recovery_pending
  ON leads (created_at)
  WHERE converted_at IS NULL AND recovery_email_sent_at IS NULL;
