-- AstroTarot Hub - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extensão do auth.users do Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  birth_date TEXT,
  birth_time TEXT,
  birth_location TEXT,
  subscription_plan TEXT DEFAULT 'FREE' CHECK (subscription_plan IN ('FREE', 'SINGLE_READING', 'PREMIUM_MONTHLY')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending', 'cancelled', 'suspended')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  readings_left INTEGER DEFAULT 4,
  pixup_customer_id TEXT,
  pixup_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  payment_type TEXT CHECK (payment_type IN ('SINGLE_READING', 'SUBSCRIPTION')),
  pixup_payment_id TEXT,
  pixup_qr_code TEXT,
  pixup_qr_string TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_user_id ON tarot_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_charts_user_id ON birth_charts(user_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_charts ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "System can create user profiles"
  ON users FOR INSERT
  WITH CHECK (true);

-- Policies for payments table
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = payments.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = NEW.user_id AND users.auth_id = auth.uid()
  ));

-- Policies for tarot_readings table
CREATE POLICY "Users can view own readings"
  ON tarot_readings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = tarot_readings.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own readings"
  ON tarot_readings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = NEW.user_id AND users.auth_id = auth.uid()
  ));

-- Policies for birth_charts table
CREATE POLICY "Users can view own charts"
  ON birth_charts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = birth_charts.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own charts"
  ON birth_charts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = NEW.user_id AND users.auth_id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, subscription_plan, subscription_status, readings_left)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'FREE', 
    'active', 
    4
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auth.users to create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default admin user (optional)
-- Password should be hashed with bcrypt before inserting
-- INSERT INTO users (email, password, name, subscription_plan)
-- VALUES ('admin@astrotarot.com', 'hashed_password_here', 'Admin', 'PREMIUM_MONTHLY');
