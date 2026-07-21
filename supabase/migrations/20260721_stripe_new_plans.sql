-- =====================================================================
-- Migração: PixUp -> Stripe + novos planos
--   • Pacote 5 Leituras  (US$ 9,99, pagamento único, +5 readings_left)
--   • Premium Ilimitado  (US$ 29,90/mês, ilimitado + features premium)
-- Rode este arquivo INTEIRO no Supabase > SQL Editor (banco já existente).
-- Para bancos novos, use supabase/schema-stripe.sql.
-- =====================================================================

-- 1) users: colunas Stripe no lugar das PixUp
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.users DROP COLUMN IF EXISTS pixup_customer_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS pixup_subscription_id;

-- 2) Planos: só FREE e PREMIUM_MONTHLY (pacote de leituras não muda o plano,
--    apenas credita readings_left)
UPDATE public.users SET subscription_plan = 'FREE'
  WHERE subscription_plan NOT IN ('FREE', 'PREMIUM_MONTHLY');
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_plan_check;
ALTER TABLE public.users ADD CONSTRAINT users_subscription_plan_check
  CHECK (subscription_plan IN ('FREE', 'PREMIUM_MONTHLY'));

-- 3) payments: colunas Stripe, moeda usd, novos tipos
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE public.payments DROP COLUMN IF EXISTS pixup_payment_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS pixup_qr_code;
ALTER TABLE public.payments DROP COLUMN IF EXISTS pixup_qr_string;
ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'usd';

UPDATE public.payments SET payment_type = 'READINGS_PACK'
  WHERE payment_type = 'SINGLE_READING';
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('READINGS_PACK', 'SUBSCRIPTION'));

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_checkout_session_id);

-- 4) Segurança: usuário NÃO pode editar o próprio plano/saldo pela API pública.
--    Só nome e dados de nascimento são editáveis pelo cliente; plano e saldo
--    mudam apenas via service role (webhook Stripe / rotas de API).
REVOKE UPDATE ON public.users FROM anon, authenticated;
GRANT UPDATE (name, birth_date, birth_time, birth_location)
  ON public.users TO authenticated;

-- 5) Funções atômicas de saldo de leituras (evitam corrida de condição).
--    Chamadas apenas pelo service role.
CREATE OR REPLACE FUNCTION public.consume_reading(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_left INTEGER;
BEGIN
  UPDATE public.users
     SET readings_left = readings_left - 1
   WHERE id = p_user_id
     AND readings_left > 0
  RETURNING readings_left INTO new_left;
  RETURN new_left; -- NULL = sem saldo
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.grant_readings(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_left INTEGER;
BEGIN
  UPDATE public.users
     SET readings_left = readings_left + p_amount
   WHERE id = p_user_id
  RETURNING readings_left INTO new_left;
  RETURN new_left;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.consume_reading(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_readings(UUID, INTEGER) FROM PUBLIC, anon, authenticated;

-- 6) Permitir regenerar o mapa astral quando o perfil muda
--    (a página de perfil deleta o cache em birth_charts)
DROP POLICY IF EXISTS "Users can delete own charts" ON public.birth_charts;
CREATE POLICY "Users can delete own charts" ON public.birth_charts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = birth_charts.user_id AND users.auth_id = auth.uid()));
