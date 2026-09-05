-- Create integrations_credentials table for API key and OAuth token storage
CREATE TABLE IF NOT EXISTS integrations_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  email TEXT,
  username TEXT,
  password TEXT,
  api_key TEXT,
  status TEXT DEFAULT 'on' CHECK (status IN ('on', 'off')),
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integrations_credentials_user_id 
  ON integrations_credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_integrations_credentials_integration 
  ON integrations_credentials(user_id, integration_name);

-- Enable RLS
ALTER TABLE integrations_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only see their own credentials
CREATE POLICY "Users can read own integration credentials"
  ON integrations_credentials FOR SELECT
  USING (user_id = current_user_email());

CREATE POLICY "Users can insert own integration credentials"
  ON integrations_credentials FOR INSERT
  WITH CHECK (user_id = current_user_email());

CREATE POLICY "Users can update own integration credentials"
  ON integrations_credentials FOR UPDATE
  USING (user_id = current_user_email());

CREATE POLICY "Users can delete own integration credentials"
  ON integrations_credentials FOR DELETE
  USING (user_id = current_user_email());

-- Function to get current user email from JWT
CREATE OR REPLACE FUNCTION current_user_email() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims')::jsonb->>'email',
    current_setting('app.current_user_email', true)
  );
$$ LANGUAGE sql STABLE;
