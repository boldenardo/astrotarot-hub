-- =============================================================
-- PRÉVIA GRÁTIS DA LEITURA DE ALMA GÊMEA
--
-- A landing promete "free soulmate reading", o quiz diz que o retrato está
-- pronto, e a página seguinte cobra. Nada grátis era entregue em lugar
-- nenhum — e 27% de quem começa o quiz o REFAZ (alguns 5 e 7 vezes),
-- procurando o caminho grátis que a nossa copy prometeu.
--
-- Esta coluna guarda a leitura de verdade (5 cartas sorteadas + dossiê),
-- gerada de graça no fim do quiz, chaveada pelo mesmo e-mail que já
-- identifica o lead.
--
-- É ela que torna a prévia IDEMPOTENTE: refazer o quiz com o mesmo e-mail
-- devolve AS MESMAS cartas em vez de sortear de novo. E é ela que garante
-- que a leitura paga é literalmente a mesma que a pessoa viu de graça,
-- sem uma segunda chamada de LLM.
--
-- ENQUANTO NÃO FOR APLICADA: nada quebra. A prévia é gerada e mostrada
-- normalmente (o navegador guarda a cópia), só não sobrevive à troca de
-- aparelho, e a leitura paga volta a gerar o dossiê do zero, como hoje.
--
-- COMO APLICAR: cole no SQL Editor do Supabase e clique RUN.
-- (Rode DEPOIS de 20260814_leads.sql.)
-- =============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS soulmate_reading JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS soulmate_reading_at TIMESTAMPTZ;

-- Só as linhas que já têm leitura entram no índice: serve para medir
-- volume/custo por hora e para achar leads com prévia e sem compra.
CREATE INDEX IF NOT EXISTS idx_leads_soulmate_reading_at
  ON leads (soulmate_reading_at DESC)
  WHERE soulmate_reading_at IS NOT NULL;
