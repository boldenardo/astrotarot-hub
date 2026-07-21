-- =====================================================================
-- Migração: autenticação via Clerk (substitui o Supabase Auth)
-- Rode no Supabase > SQL Editor DEPOIS das migrações anteriores.
-- =====================================================================

-- 1) Coluna do ID do usuário no Clerk (chave de vínculo com a tabela users).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_clerk_user_id
  ON public.users(clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

-- 2) auth_id (Supabase Auth) deixa de ser obrigatório — agora é opcional.
ALTER TABLE public.users ALTER COLUMN auth_id DROP NOT NULL;

-- 3) O provisionamento passa a ser feito pela aplicação (requireUser, via
--    service role). O trigger de criação no signup do Supabase Auth fica
--    inofensivo (não haverá mais signups por lá), mas removemos para evitar
--    confusão futura.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Observação: as políticas RLS continuam usando auth.uid(), mas o cliente não
-- acessa mais o banco diretamente — toda leitura/escrita passa pelas rotas
-- /api/* (service role). O RLS permanece como tranca contra acesso anônimo.
