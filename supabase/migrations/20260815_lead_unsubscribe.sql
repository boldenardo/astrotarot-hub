-- =============================================================
-- DESCADASTRO DA LISTA PROMOCIONAL
--
-- O e-mail de carrinho abandonado é marketing: quem não comprou não
-- pediu para ser perseguido. Gmail e Yahoo exigem descadastro de um
-- clique de quem manda em volume, e a CAN-SPAM (público americano) é
-- explícita sobre isso.
--
-- Marcar como spam não tem volta: derruba a entrega de TODOS os e-mails
-- do domínio, inclusive os de quem pagou.
--
-- COMO APLICAR: cole no SQL Editor do Supabase e clique RUN.
-- =============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- A fila do carrinho abandonado passa a excluir quem saiu da lista.
-- Substitui o índice criado em 20260815_lead_emails.
DROP INDEX IF EXISTS idx_leads_recovery_pending;
CREATE INDEX IF NOT EXISTS idx_leads_recovery_pending
  ON leads (created_at)
  WHERE converted_at IS NULL
    AND recovery_email_sent_at IS NULL
    AND unsubscribed_at IS NULL;
