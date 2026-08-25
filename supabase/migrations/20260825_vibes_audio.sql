-- =============================================================
-- VIBES & MEDITATIONS — entrega de áudio (bump de $19 / add-on $9.99)
--
-- 1) Bucket PRIVADO `vibes` para os MP3s do catálogo. Nenhuma policy
--    de leitura: todo acesso sai pelo service role emitindo signed
--    URLs em /api/vibes/stream, depois de conferir o entitlement.
--    Upload: scripts/upload-vibes-audio.mjs (não é feito por SQL).
--
-- 2) Alinhamento do CHECK de user_entitlements.feature: o webhook já
--    concede 'past_life' e 'cord_reading' (OTO e bump do Cord), mas a
--    constraint original só aceitava 'soulmate_portrait' e 'vibes' —
--    os inserts dessas duas features falhavam silenciosamente.
--
-- COMO APLICAR: cole no SQL Editor do Supabase e clique RUN.
-- =============================================================

-- (1) Bucket privado de áudio
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'vibes',
  'vibes',
  false,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Sem CREATE POLICY para anon/authenticated: o default do Storage é
-- negar, e é exatamente isso que queremos. Service role ignora RLS.

-- (2) CHECK com todas as features que o webhook já concede
ALTER TABLE user_entitlements
  DROP CONSTRAINT IF EXISTS user_entitlements_feature_check;

ALTER TABLE user_entitlements
  ADD CONSTRAINT user_entitlements_feature_check
  CHECK (feature IN ('soulmate_portrait', 'vibes', 'past_life', 'cord_reading'));
