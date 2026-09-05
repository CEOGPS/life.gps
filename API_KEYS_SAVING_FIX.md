# API Keys Not Saving - Fix Guide

## Step 1: Create the `integrations_credentials` table in Supabase

1. Go to: https://supabase.com/dashboard/project/mhvcdstgkyplhzjptgfr
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL and run it:

```sql
-- Create integrations_credentials table for API key and OAuth token storage
CREATE TABLE IF NOT EXISTS integrations_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  email TEXT,
  api_key TEXT,
  status TEXT DEFAULT 'on',
  label TEXT,
  oauth_provider TEXT,
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration_name, email)
);

CREATE INDEX IF NOT EXISTS idx_integrations_credentials_user_id 
  ON integrations_credentials(user_id);
```

## Step 2: Update RLS (Row Level Security)

Go to **Authentication > Policies** → find the `integrations_credentials` table → make sure it allows your user to SELECT/INSERT/UPDATE/DELETE.

Or run this in SQL Editor:

```sql
ALTER TABLE integrations_credentials ENABLE ROW LEVEL SECURITY;

-- Allow unauthenticated access for now (test mode)
CREATE POLICY "Allow all access" 
  ON integrations_credentials FOR ALL 
  USING (true) 
  WITH CHECK (true);
```

## Step 3: Test

1. Refresh browser: `http://localhost:3000`
2. Go to **Integrations** panel
3. Click an integration (e.g., OpenAI)
4. Click **API KEY**
5. Enter email: `test@example.com`
6. Enter key: `sk-test123`
7. Click **SAVE KEY**

## Step 4: Verify in Supabase

Go to https://supabase.com/dashboard/project/mhvcdstgkyplhzjptgfr → **Table Editor** → `integrations_credentials` → you should see a new row with:
- `user_id`: your email
- `integration_name`: "OpenAI"
- `api_key`: "sk-test123"
- `status`: "on"

## If Still Not Working

1. Open DevTools (F12) → **Console** tab
2. Try adding an API key again
3. Look for errors like:
   - `"relation integrations_credentials does not exist"` → table not created
   - `"new row violates row-level security policy"` → RLS policy issue
   - `"permission denied"` → need to adjust RLS

Report the exact error and we'll fix it.
