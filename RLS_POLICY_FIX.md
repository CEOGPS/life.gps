# LifeOS1 Data Not Persisting - RLS Policy Fix

## Problem
Dashboard data (CRM, contacts, etc.) disappears on refresh/re-login because Supabase Row-Level Security (RLS) policies are rejecting reads/writes.

## Solution: Fix RLS Policies

### Step 1: Disable RLS (Development Quick Fix)
1. Go to https://supabase.com/dashboard/project/mhvcdstgkyplhzjptgfr
2. Click **Authentication > Policies**
3. For each table (crm_contacts, contacts, leads, tasks, etc.):
   - Click the table name
   - Click **Delete** on any existing policies
   - Click **New Policy** → **Create a policy**
   - Name: `Allow all access (dev)`
   - Template: **For full customization**
   - Paste this:
     ```sql
     CREATE POLICY "Allow all access" ON <table_name>
     FOR ALL
     USING (true)
     WITH CHECK (true);
     ```
   - Click **Review**
   - Click **Save policy**

### Step 2: User-Scoped RLS (Production Safe)
Once development works, switch to this for security:

For each table:
```sql
-- SELECT policy
CREATE POLICY "Users can read own data" ON <table_name>
FOR SELECT
USING (user_email = auth.jwt() ->> 'email');

-- INSERT policy
CREATE POLICY "Users can insert own data" ON <table_name>
FOR INSERT
WITH CHECK (user_email = auth.jwt() ->> 'email');

-- UPDATE policy
CREATE POLICY "Users can update own data" ON <table_name>
FOR UPDATE
USING (user_email = auth.jwt() ->> 'email');

-- DELETE policy
CREATE POLICY "Users can delete own data" ON <table_name>
FOR DELETE
USING (user_email = auth.jwt() ->> 'email');
```

### Step 3: Test
1. Refresh: http://localhost:3000
2. Login again
3. Data should now persist on refresh

## Tables to Fix
- crm_contacts
- contacts
- leads
- tasks
- notes
- calendar_events
- budget_bills
- notifications
- activity_events
- agents
- business_websites
- business_reviews
- business_listings
- business_analytics
- business_leads
- api_keys

## Verify It Works
1. Open DevTools (F12) → **Console**
2. Add a contact/lead
3. Refresh the page
4. Data should still be there (not empty)
5. If error shows: `"new row violates row-level security policy"` → RLS policy still needs fixing

---

**Note**: The code is already fixed to filter by `user_email` on all queries. Just need the RLS policies enabled.
