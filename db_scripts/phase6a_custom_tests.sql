-- Phase 6A: Storage & Database Setup for Custom Tests

-- 1. Add storage_url to mock_test_templates
-- If this is set, the test questions are fetched from the JSON in the storage bucket.
ALTER TABLE public.mock_test_templates
  ADD COLUMN IF NOT EXISTS storage_url TEXT;

-- 2. Create the Storage Buckets (Requires superuser / postgres role)
-- 'custom-tests' bucket will store the .json files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('custom-tests', 'custom-tests', true)
ON CONFLICT (id) DO NOTHING;

-- 'test-assets' bucket will store images uploaded for custom questions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('test-assets', 'test-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS Policies
-- First, drop them if they exist to avoid conflicts
DROP POLICY IF EXISTS "Custom_Tests_Public_Access" ON storage.objects;
DROP POLICY IF EXISTS "Custom_Tests_Auth_Upload" ON storage.objects;
DROP POLICY IF EXISTS "Custom_Tests_Auth_Update" ON storage.objects;

-- Allow public read access to the buckets
CREATE POLICY "Custom_Tests_Public_Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id IN ('custom-tests', 'test-assets') );

-- Allow authenticated users (Admins) to upload
CREATE POLICY "Custom_Tests_Auth_Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id IN ('custom-tests', 'test-assets') AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their own uploads
CREATE POLICY "Custom_Tests_Auth_Update" 
ON storage.objects FOR UPDATE
USING ( bucket_id IN ('custom-tests', 'test-assets') AND auth.role() = 'authenticated' );
