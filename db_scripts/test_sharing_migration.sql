-- ==========================================
-- TEST SHARING SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add access_code to mock_test_templates
ALTER TABLE public.mock_test_templates 
ADD COLUMN IF NOT EXISTS access_code CHAR(4) UNIQUE;

-- 2. Create test_sessions table for anonymous public test takers
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_template_id UUID NOT NULL REFERENCES public.mock_test_templates(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '[]',
  total_score NUMERIC DEFAULT 0,
  subject_scores JSONB DEFAULT '{}',
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  unanswered_count INT DEFAULT 0,
  time_taken_seconds INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS for test_sessions — public insert and read (no login needed)
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert a session" ON public.test_sessions;
CREATE POLICY "Anyone can insert a session"
ON public.test_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read sessions" ON public.test_sessions;
CREATE POLICY "Anyone can read sessions"
ON public.test_sessions FOR SELECT USING (true);

-- 4. Allow anon/public to read mock_test_templates (needed for the /t/[code] page)
DROP POLICY IF EXISTS "Public can read test templates" ON public.mock_test_templates;
CREATE POLICY "Public can read test templates"
ON public.mock_test_templates FOR SELECT USING (true);

-- 5. Allow anon/public to read questions (needed for exam simulator)
DROP POLICY IF EXISTS "Public can read questions" ON public.questions;
CREATE POLICY "Public can read questions"
ON public.questions FOR SELECT USING (true);
