-- ============================================================
-- PHASE 5A: Assigned Tests & Global Ranking
-- Run this in your EXAM ENGINE Supabase SQL editor
-- ============================================================

-- 1. Add fields to distinguish self-practice vs admin-assigned tests
ALTER TABLE public.mock_test_templates
  ADD COLUMN IF NOT EXISTS test_mode TEXT DEFAULT 'self_practice' CHECK (test_mode IN ('self_practice', 'assigned')),
  ADD COLUMN IF NOT EXISTS coaching_id UUID,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_from TIMESTAMPTZ;

-- 2. Add indexes for fast fetching by coaching academy
CREATE INDEX IF NOT EXISTS idx_mock_test_templates_coaching_id 
  ON public.mock_test_templates(coaching_id);

CREATE INDEX IF NOT EXISTS idx_mock_test_templates_test_mode 
  ON public.mock_test_templates(test_mode);

-- 3. (Optional but recommended) Set all existing tests explicitly to self_practice
UPDATE public.mock_test_templates 
SET test_mode = 'self_practice' 
WHERE test_mode IS NULL;
