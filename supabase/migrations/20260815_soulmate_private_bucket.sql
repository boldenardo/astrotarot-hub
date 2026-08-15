-- =============================================================
-- CORREÇÃO: o bucket do retrato precisa ser PRIVADO
--
-- A migration 20260814_entitlements.sql criou o bucket `soulmate` com
-- public = true e o código gravava a MESMA URL em image_url e
-- preview_url. Resultado: quem assinava por US$ 14,99 já recebia a
-- imagem completa, e o add-on "Draw Your Soulmate" (US$ 24,99) não
-- protegia nada — bastava abrir a URL da prévia.
--
-- Agora: bucket privado, a tabela guarda CAMINHOS e o servidor emite
-- URLs assinadas conforme o direito de cada usuário (GET /api/soulmate).
--
-- COMO APLICAR: cole no SQL Editor do Supabase e RUN.
-- Rodar depois de 20260814_entitlements.sql.
-- =============================================================

UPDATE storage.buckets SET public = false WHERE id = 'soulmate';

-- Nenhuma policy de leitura para anon/authenticated: todo acesso passa
-- pelo service role, que assina URLs de curta duração na API.
DROP POLICY IF EXISTS "soulmate portraits are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public read soulmate" ON storage.objects;

-- Linhas antigas guardam URL pública completa; zerar força a próxima
-- leitura a tratá-las como legado (o código já lida com os dois formatos)
-- e a próxima geração regrava no formato novo (caminho).
-- Não apagamos os arquivos: quem já pagou continua com o dossiê.
COMMENT ON COLUMN soulmate_portraits.image_url IS
  'Caminho no bucket privado (ex.: {user_id}/portrait.png). URL é assinada na leitura.';
COMMENT ON COLUMN soulmate_portraits.preview_url IS
  'Caminho da prévia borrada (ex.: {user_id}/preview.jpg). URL é assinada na leitura.';
