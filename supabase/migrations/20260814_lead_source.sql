-- =============================================================
-- ORIGEM DO TRÁFEGO ORGÂNICO NO LEAD
-- O link da bio carrega ?src=ig|fb|tt|yt. Guardar a plataforma no
-- lead é o que permite responder "qual conta traz gente que compra?"
-- sem depender de pixel de mídia paga.
--
-- COMO APLICAR: cole no SQL Editor do Supabase e clique RUN.
-- (Rode DEPOIS de 20260814_leads.sql.)
-- =============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_platform TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads (source_platform);
