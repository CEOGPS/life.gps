-- ============================================================================
-- LifeOS1 — user_settings persistence table
--
-- Backing table for src/lib/storage.ts (getItem/setItem/removeItem/listKeys).
-- The app is LOCAL-FIRST: every value is written to localStorage immediately
-- and synced to this table in the background. This table is what makes data
-- survive across browsers/origins. Without it, remote sync fails with
-- "[storage] setItem(...) remote sync failed: relation 'user_settings' ..." or
-- "column user_settings.value does not exist" and data never leaves the machine.
--
-- Run in the Supabase SQL editor for the PRODUCTION project:
--   mhvcdstgkyplhzjptgfr.supabase.co   (the project hardcoded as the client
--   fallback, so the deployed lifeos1.pages.dev build already points here)
-- ============================================================================

-- The exact shape storage.ts expects:
--   key        text  primary key
--   value      jsonb (stores ANY app state: profile, banner, tasks, ...)
--   updated_at timestamptz (set by storage.ts and refreshed on upsert)
CREATE TABLE IF NOT EXISTS user_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup when listing keys.
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings (key);

-- Auto-refresh updated_at on update so listKeys/ordering stay meaningful.
CREATE OR REPLACE FUNCTION user_settings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_settings_touch_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_touch_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION user_settings_touch_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- LifeOS1 authenticates with FIREBASE, not Supabase. The browser talks to this
-- table with the Supabase "publishable/anon" key, and that client has NO
-- Supabase JWT user, so RLS keyed to auth.uid()/auth.jwt() would BLOCK every
-- read/write (which is the current silent failure). It is a single-user
-- personal instance, so we enable RLS but grant the app's two roles full
-- access. If you later add multiple tenants, replace this with a per-user
-- policy keyed to a real Supabase auth user.
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

-- Grant table privileges to the roles used by the publishable/anon and secret
-- keys so PostgREST can actually perform DML.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_settings TO service_role;
