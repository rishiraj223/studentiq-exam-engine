-- ============================================================
-- PHASE 6B: Analytics, Leaderboard & Attempt Fixes
-- Run this in your EXAM ENGINE Supabase SQL editor
-- ============================================================

-- 1. Fix the Foreign Key Issue for test_attempts
-- The student_id comes from the separate Coaching CRM database, so it won't exist in local auth.users.
ALTER TABLE public.test_attempts
  DROP CONSTRAINT IF EXISTS test_attempts_student_id_fkey;

-- 2. Add coaching_id and student_name to make Leaderboards and Analytics incredibly fast
ALTER TABLE public.test_attempts
  ADD COLUMN IF NOT EXISTS coaching_id UUID,
  ADD COLUMN IF NOT EXISTS student_name TEXT;

-- 3. Create Indexes for extremely fast Leaderboard / Analytics queries
CREATE INDEX IF NOT EXISTS idx_test_attempts_template_coaching 
  ON public.test_attempts(test_template_id, coaching_id);

CREATE INDEX IF NOT EXISTS idx_test_attempts_score 
  ON public.test_attempts(total_score DESC, time_taken_seconds ASC);
