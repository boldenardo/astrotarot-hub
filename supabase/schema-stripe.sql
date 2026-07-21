-- AstroTarot Hub - Supabase Database Schema (Stripe edition)
-- Cole TUDO isto no Supabase > SQL Editor e clique em RUN.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  birth_date TEXT,
  birth_time TEXT,
  birth_location TEXT,
  subscription_plan TEXT DEFAULT 'FREE' CHECK (subscription_plan IN ('FREE', 'PREMIUM_MONTHLY')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending', 'cancelled', 'suspended')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  readings_left INTEGER DEFAULT 4,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (Stripe)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  payment_type TEXT CHECK (payment_type IN ('READINGS_PACK', 'SUBSCRIPTION')),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_invoice_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dedup de eventos do Stripe (idempotência do webhook)
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  type TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON stripe_events FROM anon, authenticated;

-- Tarot Readings table
CREATE TABLE IF NOT EXISTS tarot_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deck_type TEXT,
  spread_type TEXT,
  cards JSONB NOT NULL,
  interpretation TEXT,
  is_premium BOOLEAN DEFAULT false,
  astrological_integration JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Birth Charts table
CREATE TABLE IF NOT EXISTS birth_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  birth_location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  chart_data JSONB NOT NULL,
  transits JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_session ON payments(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_invoice ON payments(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tarot_readings_user_id ON tarot_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_charts_user_id ON birth_charts(user_id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_charts ENABLE ROW LEVEL SECURITY;

-- Policies: users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "System can create user profiles" ON users FOR INSERT WITH CHECK (true);

-- Policies: payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = payments.user_id AND users.auth_id = auth.uid()));
CREATE POLICY "Users can create own payments" ON payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid()));

-- Policies: tarot_readings
CREATE POLICY "Users can view own readings" ON tarot_readings FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = tarot_readings.user_id AND users.auth_id = auth.uid()));
CREATE POLICY "Users can create own readings" ON tarot_readings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid()));

-- Policies: birth_charts
CREATE POLICY "Users can view own charts" ON birth_charts FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = birth_charts.user_id AND users.auth_id = auth.uid()));
CREATE POLICY "Users can create own charts" ON birth_charts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid()));
CREATE POLICY "Users can delete own charts" ON birth_charts FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = birth_charts.user_id AND users.auth_id = auth.uid()));

-- Segurança: plano/saldo só mudam via service role (webhook Stripe / API).
REVOKE UPDATE ON users FROM anon, authenticated;
GRANT UPDATE (name, birth_date, birth_time, birth_location) ON users TO authenticated;

-- Funções atômicas de saldo de leituras (somente service role)
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

-- Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger: auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, birth_date, birth_time, birth_location, subscription_plan, subscription_status, readings_left)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'birth_date',
    NEW.raw_user_meta_data->>'birth_time',
    NEW.raw_user_meta_data->>'birth_location',
    'FREE',
    'active',
    4
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
