-- SQL Schema for Phase 1: Demo Requests
-- Run this in the Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    institute_name TEXT NOT NULL,
    student_strength INTEGER NOT NULL,
    message TEXT,
    product_source TEXT NOT NULL DEFAULT 'StudentIQ Exam Engine',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for better query performance later in CRM
CREATE INDEX IF NOT EXISTS demo_requests_email_idx ON public.demo_requests (email);
CREATE INDEX IF NOT EXISTS demo_requests_created_at_idx ON public.demo_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS demo_requests_source_idx ON public.demo_requests (product_source);

-- Set up Row Level Security (RLS)
-- We want anyone (public) to be able to insert a demo request
-- but nobody (except authenticated admins/service role) to read them.
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public inserts on demo_requests" 
ON public.demo_requests 
FOR INSERT 
TO public 
WITH CHECK (true);

-- No public read access policy is created.
-- Service role key automatically bypasses RLS to read all data in the backend/CRM.
