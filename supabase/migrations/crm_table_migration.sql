-- LifeOS1 CRM Table Migration
-- Run this in Supabase SQL Editor to add new columns

-- Add new columns to crm_contacts table
ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS extra_phones TEXT[],
ADD COLUMN IF NOT EXISTS extra_emails TEXT[],
ADD COLUMN IF NOT EXISTS birthday TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_contact TEXT,
ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_user_email ON crm_contacts(user_email);
CREATE INDEX IF NOT EXISTS idx_crm_name ON crm_contacts(name);
CREATE INDEX IF NOT EXISTS idx_crm_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_company ON crm_contacts(company);
CREATE INDEX IF NOT EXISTS idx_crm_stage ON crm_contacts(stage);
CREATE INDEX IF NOT EXISTS idx_crm_tag ON crm_contacts(tag);
CREATE INDEX IF NOT EXISTS idx_crm_created_at ON crm_contacts(created_at DESC);

-- Enable RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON crm_contacts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON crm_contacts;
DROP POLICY IF EXISTS "Enable update for users based on email" ON crm_contacts;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON crm_contacts;

-- Create permissive policies for anon key access
CREATE POLICY "Allow all operations for anon" ON crm_contacts
FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON crm_contacts TO anon;
GRANT ALL ON crm_contacts TO authenticated;