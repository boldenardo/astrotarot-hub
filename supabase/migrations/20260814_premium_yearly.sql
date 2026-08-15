-- =============================================================
-- PLANO ANUAL (PREMIUM_YEARLY)
-- Amplia o CHECK de users.subscription_plan para aceitar o plano
-- anual ($79/ano), usado pelo upsell pós-compra da thank-you e
-- pela opção anual do /cart. Sem esta migration, o webhook falha
-- ao gravar PREMIUM_YEARLY.
--
-- COMO APLICAR: cole no SQL Editor do Supabase e clique RUN.
-- =============================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_plan_check;
ALTER TABLE public.users ADD CONSTRAINT users_subscription_plan_check
  CHECK (subscription_plan IN ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY'));
