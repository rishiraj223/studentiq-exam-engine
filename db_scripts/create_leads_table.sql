-- Run this script in your Supabase SQL Editor to create the demo_requests table

CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('institute', 'student')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  students_count TEXT, -- For institutes
  standard TEXT,       -- For students
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Allow anonymous inserts if submitting from public website
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- If a policy with this name already exists, it will throw an error, but that's okay (or you can DROP it first)
CREATE POLICY "Allow public inserts" ON demo_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow superadmin read" ON demo_requests FOR SELECT USING (true);
