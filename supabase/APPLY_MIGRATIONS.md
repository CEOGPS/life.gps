# Apply Supabase Migrations for Persistent Memory

## Instructions

Run these SQL scripts in the **Supabase SQL Editor** for project: **mhvcdstgkyplhzjptgfr.supabase.co**

Go to: https://supabase.com/dashboard/project/mhvcdstgkyplhzjptgfr/sql/new

### Step 1: Apply user_settings migration (for storage.ts)

Copy and run: `supabase/migrations/0001_create_user_settings.sql`

```sql
-- ============================================================================
-- LifeOS1 — user_settings persistence table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings (key);

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
```

### Step 2: Apply user_data migration (for usePersistentState)

Copy and run: `supabase/migrations/0004_create_user_data.sql`

```sql
-- ============================================================================
-- LifeOS1 — user_data persistence table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_data (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT NOT NULL,
  data_key     TEXT NOT NULL,
  data_value   JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, data_key)
);

CREATE INDEX IF NOT EXISTS idx_user_data_lookup ON user_data (user_email, data_key);

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
```

### Step 3: Verify tables exist

Run this verification query:

```sql
-- Verify user_settings table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('user_settings', 'user_data')
ORDER BY table_name, ordinal_position;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('user_settings', 'user_data');

-- Verify grants
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('user_settings', 'user_data')
ORDER BY table_name, grantee;
```

## Expected Results

After running both migrations:
- ✅ `user_settings` table exists with columns: `key` (text, PK), `value` (jsonb), `updated_at` (timestamptz)
- ✅ `user_data` table exists with columns: `id` (uuid, PK), `user_email` (text), `data_key` (text), `data_value` (jsonb), `created_at`, `updated_at`
- ✅ Both tables have permissive RLS policies (`USING (true) WITH CHECK (true)`)
- ✅ Both tables grant SELECT, INSERT, UPDATE, DELETE to anon, authenticated, service_role
- ✅ Unique constraint on `user_data(user_email, data_key)`

## After Applying

1. **Deploy frontend** (if not already):
   ```bash
   pnpm run build && npx wrangler pages deploy dist --project-name=lifeos1
   ```

2. **Verify in browser console** at https://lifeos1.pages.dev:
   - No more warnings like: `[usePersistentState] Supabase table "user_data" not found`
   - No more warnings like: `[storage] getItem(...) remote failed: relation 'user_settings'`
   - Data entered in one browser appears in another (incognito/different device)

3. **Test persistence**:
   - Add a Quick Link, Financial Account, Calendar Event, Family Member
   - Clear localStorage (Application tab → Clear storage)
   - Reload page → data should reappear from Supabase