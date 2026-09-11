-- LifeOS1 Complete Migration Script
-- Run ALL of this in Supabase SQL Editor (https://supabase.com/dashboard/project/mhvcdstgkyplhzjptgfr/sql)

-- ============================================================
-- 1. CONTACTS TABLE - Add all new columns
-- ============================================================
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email2 TEXT,
ADD COLUMN IF NOT EXISTS phone2 TEXT,
ADD COLUMN IF NOT EXISTS extra_phones TEXT[],
ADD COLUMN IF NOT EXISTS extra_emails TEXT[],
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS birthday TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS extra_websites TEXT[],
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_contact TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(user_email);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- RLS: Permissive for anon key
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON contacts;
CREATE POLICY "Allow all operations for anon" ON contacts
FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON contacts TO anon;
GRANT ALL ON contacts TO authenticated;

-- ============================================================
-- 2. CRM_CONTACTS TABLE - Add new columns
-- ============================================================
ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS extra_phones TEXT[],
ADD COLUMN IF NOT EXISTS extra_emails TEXT[],
ADD COLUMN IF NOT EXISTS birthday TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_contact TEXT,
ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_user_email ON crm_contacts(user_email);
CREATE INDEX IF NOT EXISTS idx_crm_name ON crm_contacts(name);
CREATE INDEX IF NOT EXISTS idx_crm_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_company ON crm_contacts(company);
CREATE INDEX IF NOT EXISTS idx_crm_stage ON crm_contacts(stage);
CREATE INDEX IF NOT EXISTS idx_crm_tag ON crm_contacts(tag);
CREATE INDEX IF NOT EXISTS idx_crm_created_at ON crm_contacts(created_at DESC);

-- RLS: Permissive for anon key
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON crm_contacts;
CREATE POLICY "Allow all operations for anon" ON crm_contacts
FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON crm_contacts TO anon;
GRANT ALL ON crm_contacts TO authenticated;

-- ============================================================
-- 3. USER_SETTINGS TABLE - For persistent memory
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, key)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON user_settings;
CREATE POLICY "Allow all operations for anon" ON user_settings
FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_user_settings_email ON user_settings(user_email);
GRANT ALL ON user_settings TO anon;
GRANT ALL ON user_settings TO authenticated;

-- ============================================================
-- 4. USER_DATA TABLE - Existing table fix (if needed)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, data_key)
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON user_data;
CREATE POLICY "Allow all operations for anon" ON user_data
FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_user_data_email ON user_data(user_email);
GRANT ALL ON user_data TO anon;
GRANT ALL ON user_data TO authenticated;

-- ============================================================
-- 5. NOTIFICATIONS TABLE - For dashboard notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON notifications;
CREATE POLICY "Allow all operations for anon" ON notifications
FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(user_email);
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;

-- ============================================================
-- 6. TASKS TABLE - For dashboard tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON tasks;
CREATE POLICY "Allow all operations for anon" ON tasks
FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_tasks_email ON tasks(user_email);
GRANT ALL ON tasks TO anon;
GRANT ALL ON tasks TO authenticated;

-- ============================================================
-- 7. EVENTS TABLE - For calendar
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON events;
CREATE POLICY "Allow all operations for anon" ON events
FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_events_email ON events(user_email);
GRANT ALL ON events TO anon;
GRANT ALL ON events TO authenticated;

-- ============================================================
-- 8. NOTES TABLE - For dashboard notes
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON notes;
CREATE POLICY "Allow all operations for anon" ON notes
FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_notes_email ON notes(user_email);
GRANT ALL ON notes TO anon;
GRANT ALL ON notes TO authenticated;

-- ============================================================
-- 9. LEADS TABLE - For dashboard leads
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon" ON leads;
CREATE POLICY "Allow all operations for anon" ON leads
FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(user_email);
GRANT ALL ON leads TO anon;
GRANT ALL ON leads TO authenticated;

-- ============================================================
-- DONE - Verify tables exist
-- ============================================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contacts', 'crm_contacts', 'user_settings', 'user_data', 'notifications', 'tasks', 'events', 'notes', 'leads')
ORDER BY table_name;