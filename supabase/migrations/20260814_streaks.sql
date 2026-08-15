-- =============================================================
-- STREAK DE LOGIN (retenção)
--
-- Uma linha por usuário por dia em daily_checkins (o UNIQUE é o que
-- torna o check-in idempotente: abrir o app dez vezes no mesmo dia
-- conta uma). user_streaks guarda o estado agregado para leitura
-- barata no dashboard.
--
-- Datas em UTC de propósito: é previsível, não depende do fuso do
-- dispositivo e não pode ser burlado mudando o relógio do celular.
--
-- COMO APLICAR: cole no SQL Editor do Supabase e clique RUN.
-- =============================================================

CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, checkin_date)
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON daily_checkins FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_checkins_user_date
  ON daily_checkins (user_id, checkin_date DESC);

CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  points_total INTEGER NOT NULL DEFAULT 0,
  /** Marcos já entregues, para não repetir a mesma recompensa. */
  claimed_milestones INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON user_streaks FROM anon, authenticated;

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- Check-in atômico.
-- Faz tudo numa transação do banco: registra o dia, recalcula a
-- sequência (ontem = continua, mais velho = recomeça) e credita os
-- pontos. Retorna o estado novo mais se ESTE check-in foi o do dia.
-- =============================================================
CREATE OR REPLACE FUNCTION public.record_checkin(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  points_total INTEGER,
  claimed_milestones INTEGER[],
  is_new_checkin BOOLEAN
) AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_inserted BOOLEAN := FALSE;
  v_last DATE;
  v_current INTEGER;
  v_longest INTEGER;
  v_points INTEGER;
  v_claimed INTEGER[];
BEGIN
  INSERT INTO daily_checkins (user_id, checkin_date)
  VALUES (p_user_id, v_today)
  ON CONFLICT (user_id, checkin_date) DO NOTHING;
  v_inserted := FOUND;

  INSERT INTO user_streaks (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT s.last_checkin_date, s.current_streak, s.longest_streak,
         s.points_total, s.claimed_milestones
    INTO v_last, v_current, v_longest, v_points, v_claimed
    FROM user_streaks s WHERE s.user_id = p_user_id
    FOR UPDATE;

  IF v_inserted THEN
    IF v_last = v_today - 1 THEN
      v_current := v_current + 1;      -- veio ontem: a sequência segue
    ELSE
      v_current := 1;                  -- faltou: recomeça hoje
    END IF;

    v_longest := GREATEST(v_longest, v_current);
    v_points  := v_points + 10 + (CASE WHEN v_current % 7 = 0 THEN 50 ELSE 0 END);

    UPDATE user_streaks s
       SET current_streak = v_current,
           longest_streak = v_longest,
           last_checkin_date = v_today,
           points_total = v_points
     WHERE s.user_id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_current, v_longest, v_points, v_claimed, v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_checkin(UUID) FROM PUBLIC, anon, authenticated;

-- Marca um marco como entregue (evita repetir a mesma recompensa).
CREATE OR REPLACE FUNCTION public.claim_milestone(p_user_id UUID, p_milestone INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_ok BOOLEAN := FALSE;
BEGIN
  UPDATE user_streaks
     SET claimed_milestones = array_append(claimed_milestones, p_milestone)
   WHERE user_id = p_user_id
     AND NOT (p_milestone = ANY(claimed_milestones));
  v_ok := FOUND;
  RETURN v_ok;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.claim_milestone(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
