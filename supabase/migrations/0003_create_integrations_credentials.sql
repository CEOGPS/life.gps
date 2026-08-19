-- ============================================================================
-- INTEGRATIONS CREDENTIALS TABLE
-- Persistent storage for API keys, OAuth tokens, account configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS integrations_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integration_name TEXT NOT NULL,
  email TEXT,
  username TEXT,
  password TEXT,
  api_key TEXT,
  status TEXT DEFAULT 'off',
  label TEXT,
  color TEXT,
  icon TEXT,
  oauth_provider TEXT,
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMPTZ,
  oauth_scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration_name, email)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_integrations_credentials_user
  ON integrations_credentials (user_id, integration_name);

CREATE INDEX IF NOT EXISTS idx_integrations_credentials_email
  ON integrations_credentials (user_id, email);

-- Enable Row Level Security
ALTER TABLE integrations_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only manage their own credentials
-- Using auth.jwt() ->> 'sub' for Supabase Auth, but we use Firebase
-- So we'll use a custom claim or service role for writes
-- For now, allow all authenticated users to read/write their own data
-- The frontend will filter by user_id

CREATE POLICY "Users can read own credentials" ON integrations_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" ON integrations_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" ON integrations_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials" ON integrations_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Since we use Firebase Auth (not Supabase Auth), we need a service role policy
-- for server-side operations. The worker will use service role key.

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_integrations_credentials_updated_at ON integrations_credentials;
CREATE TRIGGER update_integrations_credentials_updated_at
  BEFORE UPDATE ON integrations_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();