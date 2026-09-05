-- ============================================================================
-- LIFEOS1: MISSING TABLES SCHEMA
-- Add these to your Supabase project in the SQL editor
-- ============================================================================

-- 1. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  phone2 TEXT,
  email TEXT NOT NULL,
  email2 TEXT,
  address TEXT,
  birthday TEXT,
  anniversary TEXT,
  relationship TEXT,
  notes TEXT,
  enriched BOOLEAN DEFAULT false,
  linkedin TEXT,
  twitter TEXT,
  instagram TEXT,
  facebook TEXT,
  company TEXT,
  title TEXT,
  industry TEXT,
  revenue_range TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_user_email ON contacts(user_email);
CREATE INDEX idx_contacts_created_at ON contacts(user_email, created_at DESC);

-- 2. LEADS TABLE (CRM)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Lead' CHECK (status IN ('Lead', 'Prospect', 'Client', 'Inactive')),
  last_contacted TEXT,
  next_follow_up TEXT,
  enriched BOOLEAN DEFAULT false,
  linkedin TEXT,
  twitter TEXT,
  website TEXT,
  industry TEXT,
  revenue_range TEXT,
  employee_count TEXT,
  location TEXT,
  owner TEXT,
  source TEXT,
  deal_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_user_email ON leads(user_email);
CREATE INDEX idx_leads_status ON leads(user_email, status);
CREATE INDEX idx_leads_created_at ON leads(user_email, created_at DESC);

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'mid' CHECK (priority IN ('low', 'mid', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_email ON tasks(user_email);
CREATE INDEX idx_tasks_done ON tasks(user_email, done);
CREATE INDEX idx_tasks_created_at ON tasks(user_email, created_at DESC);

-- 4. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_user_email ON notes(user_email);
CREATE INDEX idx_notes_created_at ON notes(user_email, created_at DESC);

-- 5. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user_email ON calendar_events(user_email);
CREATE INDEX idx_calendar_events_date ON calendar_events(user_email, date);
CREATE INDEX idx_calendar_events_created_at ON calendar_events(user_email, created_at DESC);

-- 6. BUDGET BILLS TABLE
CREATE TABLE IF NOT EXISTS budget_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TEXT NOT NULL,
  paid BOOLEAN DEFAULT false,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_bills_user_email ON budget_bills(user_email);
CREATE INDEX idx_budget_bills_due_date ON budget_bills(user_email, due_date);
CREATE INDEX idx_budget_bills_created_at ON budget_bills(user_email, created_at DESC);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_email ON notifications(user_email);
CREATE INDEX idx_notifications_read ON notifications(user_email, read);
CREATE INDEX idx_notifications_created_at ON notifications(user_email, created_at DESC);

-- 8. ACTIVITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  source TEXT NOT NULL,
  type TEXT,
  title TEXT NOT NULL,
  body TEXT,
  time TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_events_user_email ON activity_events(user_email);
CREATE INDEX idx_activity_events_read ON activity_events(user_email, read);
CREATE INDEX idx_activity_events_created_at ON activity_events(user_email, created_at DESC);

-- 9. AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  desc TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user_email ON agents(user_email);
CREATE INDEX idx_agents_enabled ON agents(user_email, enabled);

-- 10. BUSINESS WEBSITES TABLE
CREATE TABLE IF NOT EXISTS business_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  platform TEXT,
  status TEXT,
  api_key TEXT,
  api_secret TEXT,
  last_sync TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_websites_user_email ON business_websites(user_email);

-- 11. BUSINESS REVIEWS TABLE
CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  author_name TEXT,
  rating NUMERIC,
  content TEXT,
  response_text TEXT,
  responded_at TEXT,
  review_date TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_reviews_user_email ON business_reviews(user_email);
CREATE INDEX idx_business_reviews_platform ON business_reviews(user_email, platform);

-- 12. BUSINESS LISTINGS TABLE
CREATE TABLE IF NOT EXISTS business_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  platform TEXT NOT NULL,
  listing_url TEXT,
  status TEXT,
  external_id TEXT,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  hours JSONB,
  last_verified TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_listings_user_email ON business_listings(user_email);
CREATE INDEX idx_business_listings_platform ON business_listings(user_email, platform);

-- 13. BUSINESS ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS business_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  website_id TEXT,
  date TEXT NOT NULL,
  visitors NUMERIC DEFAULT 0,
  pageviews NUMERIC DEFAULT 0,
  leads NUMERIC DEFAULT 0,
  conversions NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  avg_session_duration NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_analytics_user_email ON business_analytics(user_email);
CREATE INDEX idx_business_analytics_date ON business_analytics(user_email, date DESC);

-- 14. BUSINESS LEADS TABLE
CREATE TABLE IF NOT EXISTS business_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT,
  value NUMERIC DEFAULT 0,
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_leads_user_email ON business_leads(user_email);
CREATE INDEX idx_business_leads_status ON business_leads(user_email, status);

-- 15. ACTIVITY DISMISSED TABLE (for dismissing activity events)
CREATE TABLE IF NOT EXISTS activity_dismissed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  event_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_dismissed_user_email ON activity_dismissed(user_email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Users only see their own data
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own contacts"
  ON contacts FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own leads"
  ON leads FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own tasks"
  ON tasks FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own notes"
  ON notes FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own calendar events"
  ON calendar_events FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE budget_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own budget bills"
  ON budget_bills FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own notifications"
  ON notifications FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own activity events"
  ON activity_events FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own agents"
  ON agents FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE business_websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own business websites"
  ON business_websites FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own business reviews"
  ON business_reviews FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own business listings"
  ON business_listings FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE business_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own business analytics"
  ON business_analytics FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE business_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own business leads"
  ON business_leads FOR ALL
  USING (user_email = current_user_email());

ALTER TABLE activity_dismissed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own dismissed activities"
  ON activity_dismissed FOR ALL
  USING (user_email = current_user_email());

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to get current user email from JWT token
CREATE OR REPLACE FUNCTION current_user_email() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims')::jsonb->>'email',
    current_setting('app.current_user_email', true)
  );
$$ LANGUAGE sql STABLE;
