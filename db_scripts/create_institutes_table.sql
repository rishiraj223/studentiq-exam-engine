-- =====================================================
-- INSTITUTES TABLE
-- Run this in your Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS institutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  contact_number TEXT,
  email TEXT NOT NULL,
  address TEXT,
  student_strength INTEGER DEFAULT 0,
  recovery_phone TEXT,                       -- optional
  plan TEXT NOT NULL CHECK (plan IN ('trial', 'standard')),
  plan_start_date TIMESTAMP WITH TIME ZONE,  -- when plan started
  plan_days INTEGER NOT NULL DEFAULT 5,      -- 5 for trial, 365 for standard; editable
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_code TEXT UNIQUE NOT NULL,          -- 6-char alphanumeric code for signup
  converted_from_lead UUID REFERENCES demo_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow superadmin all" ON institutes USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_institutes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER institutes_updated_at
  BEFORE UPDATE ON institutes
  FOR EACH ROW EXECUTE FUNCTION update_institutes_updated_at();

-- Also add a column to demo_requests to track if it was converted
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS converted_to_institute BOOLEAN DEFAULT false;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL;
