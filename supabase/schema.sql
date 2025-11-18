-- AstroTarot Hub - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  subscription_plan TEXT DEFAULT 'FREE' CHECK (subscription_plan IN ('FREE', 'SINGLE_READING', 'PREMIUM_MONTHLY')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended')),
  readings_left INTEGER DEFAULT 4,
  pixup_customer_id TEXT,
  pixup_subscription_id TEXT,
  auto_renew BOOLEAN DEFAULT false,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
  payment_type TEXT CHECK (payment_type IN ('single', 'subscription')),
  pixup_payment_id TEXT,
  pixup_qr_code TEXT,
  pixup_qr_string TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tarot Readings table
CREATE TABLE tarot_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cards JSONB NOT NULL,
  interpretation TEXT,
  question TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Birth Charts table
CREATE TABLE birth_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  chart_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_tarot_readings_user_id ON tarot_readings(user_id);
CREATE INDEX idx_birth_charts_user_id ON birth_charts(user_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_charts ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Policies for payments table
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Policies for tarot_readings table
CREATE POLICY "Users can view own readings"
  ON tarot_readings FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own readings"
  ON tarot_readings FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Policies for birth_charts table
CREATE POLICY "Users can view own charts"
  ON birth_charts FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own charts"
  ON birth_charts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (optional)
-- Password should be hashed with bcrypt before inserting
-- INSERT INTO users (email, password, name, subscription_plan)
-- VALUES ('admin@astrotarot.com', 'hashed_password_here', 'Admin', 'PREMIUM_MONTHLY');
