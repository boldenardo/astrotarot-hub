-- =====================================================================
-- Migração: idempotência do webhook Stripe (evita crédito/cobrança dupla)
-- Rode DEPOIS de 20260721_stripe_new_plans.sql, no Supabase > SQL Editor.
-- =====================================================================

-- 1) Dedup por event.id do Stripe (cobre TODOS os tipos de evento).
CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id TEXT PRIMARY KEY,
  type TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_events FROM anon, authenticated;

-- 2) Uma sessão de checkout só pode gerar UMA linha de pagamento.
--    (permite a virada atômica PENDING -> COMPLETED sem duplicar)
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_session
  ON public.payments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- 3) Idempotência das renovações (invoice.paid): 1 fatura = 1 pagamento.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_invoice
  ON public.payments(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- Remove o índice antigo NÃO-único de sessão, se existir (substituído pelo UNIQUE acima).
DROP INDEX IF EXISTS idx_payments_stripe_session;
