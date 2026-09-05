-- ============================================================================
-- LifeOS1 — Comprehensive Fix for Persistent Memory Across Project
-- Run this ENTIRE script in Supabase SQL Editor
-- Project: mhvcdstgkyplhzjptgfr.supabase.co
-- ============================================================================

-- ============================================================================
-- 1. CREATE/REPAIR user_data TABLE (for usePersistentState hook)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, data_key)
);

CREATE INDEX IF NOT EXISTS idx_user_data_lookup ON user_data (user_email, data_key);

-- Auto-refresh updated_at on update
CREATE OR REPLACE FUNCTION user_data_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_data_touch_updated_at ON user_data;
CREATE TRIGGER trg_user_data_touch_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION user_data_touch_updated_at();

-- Permissive RLS for Firebase auth compatibility
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_data_anon_all" ON user_data;
CREATE POLICY "user_data_anon_all"
  ON user_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "user_data_authenticated_all" ON user_data;
CREATE POLICY "user_data_authenticated_all"
  ON user_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_data TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_data TO service_role;

-- ============================================================================
-- 2. CREATE api_keys TABLE (what integrationsSupabase.ts ACTUALLY uses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  service TEXT NOT NULL,              -- integration name (e.g., "google", "slack")
  account_email TEXT NOT NULL,        -- email/identifier for this credential
  api_key TEXT,                       -- the actual API key/token
  status TEXT DEFAULT 'on',           -- 'on' | 'off'
  label TEXT,                         -- display label
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, service, account_email)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys (user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys (service);

-- Auto-refresh updated_at
CREATE OR REPLACE FUNCTION api_keys_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_api_keys_updated_at ON api_keys;
CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION api_keys_touch_updated_at();

-- Permissive RLS for Firebase auth
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "api_keys_anon_all" ON api_keys;
CREATE POLICY "api_keys_anon_all"
  ON api_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "api_keys_authenticated_all" ON api_keys;
CREATE POLICY "api_keys_authenticated_all"
  ON api_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api_keys TO service_role;

-- ============================================================================
-- 3. FIX integrations_credentials TABLE (use user_email instead of user_id)
-- ============================================================================
-- Add user_email column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations_credentials' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE integrations_credentials ADD COLUMN user_email TEXT;
  END IF;
END $$;

-- Backfill user_email from user_id if we have a mapping (for existing data)
-- Note: This requires a join with auth.users which we can't do directly with anon key
-- For new data, code should write user_email directly

-- Update unique constraint to include user_email
ALTER TABLE integrations_credentials DROP CONSTRAINT IF EXISTS integrations_credentials_user_id_integration_name_email_key;
ALTER TABLE integrations_credentials ADD CONSTRAINT integrations_credentials_user_email_integration_email_key 
  UNIQUE (user_email, integration_name, email);

-- Update indexes
DROP INDEX IF EXISTS idx_integrations_credentials_user;
DROP INDEX IF EXISTS idx_integrations_credentials_email;
CREATE INDEX IF NOT EXISTS idx_integrations_credentials_user_email 
  ON integrations_credentials (user_email, integration_name);
CREATE INDEX IF NOT EXISTS idx_integrations_credentials_user_email_email 
  ON integrations_credentials (user_email, email);

-- Ensure permissive RLS (already in migration but verify)
ALTER TABLE integrations_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "integrations_credentials_anon_all" ON integrations_credentials;
CREATE POLICY "integrations_credentials_anon_all"
  ON integrations_credentials
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "integrations_credentials_authenticated_all" ON integrations_credentials;
CREATE POLICY "integrations_credentials_authenticated_all"
  ON integrations_credentials
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE integrations_credentials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE integrations_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE integrations_credentials TO service_role;

-- ============================================================================
-- 4. ENSURE ALL TABLES HAVE PERMISSIVE RLS (from 0005_dashboard_modules.sql & 0006)
-- ============================================================================
-- These tables already have permissive policies, but let's verify/refresh them

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_all" ON tasks;
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO anon, authenticated, service_role;

-- notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_all" ON notes;
CREATE POLICY "notes_all" ON notes FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON notes TO anon, authenticated, service_role;

-- calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendar_events_all" ON calendar_events;
CREATE POLICY "calendar_events_all" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO anon, authenticated, service_role;

-- leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_all" ON leads;
CREATE POLICY "leads_all" ON leads FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO anon, authenticated, service_role;

-- budget_bills
ALTER TABLE budget_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "budget_bills_all" ON budget_bills;
CREATE POLICY "budget_bills_all" ON budget_bills FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_bills TO anon, authenticated, service_role;

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all" ON notifications;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon, authenticated, service_role;

-- activity_events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_events_all" ON activity_events;
CREATE POLICY "activity_events_all" ON activity_events FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_events TO anon, authenticated, service_role;

-- quick_links
ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quick_links_all" ON quick_links;
CREATE POLICY "quick_links_all" ON quick_links FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON quick_links TO anon, authenticated, service_role;

-- contacts (from 0005 - user_email version)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_all" ON contacts;
CREATE POLICY "contacts_all" ON contacts FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO anon, authenticated, service_role;

-- business_websites
ALTER TABLE business_websites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_websites_all" ON business_websites;
CREATE POLICY "business_websites_all" ON business_websites FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON business_websites TO anon, authenticated, service_role;

-- business_reviews
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_reviews_all" ON business_reviews;
CREATE POLICY "business_reviews_all" ON business_reviews FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON business_reviews TO anon, authenticated, service_role;

-- business_listings
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_listings_all" ON business_listings;
CREATE POLICY "business_listings_all" ON business_listings FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON business_listings TO anon, authenticated, service_role;

-- business_analytics
ALTER TABLE business_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_analytics_all" ON business_analytics;
CREATE POLICY "business_analytics_all" ON business_analytics FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON business_analytics TO anon, authenticated, service_role;

-- business_leads
ALTER TABLE business_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_leads_all" ON business_leads;
CREATE POLICY "business_leads_all" ON business_leads FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON business_leads TO anon, authenticated, service_role;

-- user_settings (from 0001)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_anon_all" ON user_settings;
CREATE POLICY "app_settings_anon_all"
  ON user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "app_settings_authenticated_all" ON user_settings;
CREATE POLICY "app_settings_authenticated_all"
  ON user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_settings TO service_role;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify tables exist and RLS is permissive

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_data', 'api_keys', 'integrations_credentials', 
    'user_settings', 'tasks', 'notes', 'calendar_events', 
    'leads', 'budget_bills', 'notifications', 'activity_events',
    'quick_links', 'contacts', 'business_websites', 'business_reviews',
    'business_listings', 'business_analytics', 'business_leads'
  )
ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_data', 'api_keys', 'integrations_credentials', 
    'user_settings', 'tasks', 'notes', 'calendar_events', 
    'leads', 'budget_bills', 'notifications', 'activity_events',
    'quick_links', 'contacts', 'business_websites', 'business_reviews',
    'business_listings', 'business_analytics', 'business_leads'
  )
ORDER BY tablename, policyname;

-- Check grants
SELECT table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'user_data', 'api_keys', 'integrations_credentials', 
    'user_settings', 'tasks', 'notes', 'calendar_events', 
    'leads', 'budget_bills', 'notifications', 'activity_events',
    'quick_links', 'contacts', 'business_websites', 'business_reviews',
    'business_listings', 'business_analytics', 'business_leads'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee;