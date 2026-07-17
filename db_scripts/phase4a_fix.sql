-- ============================================================
-- PHASE 4A FIX: Add created_by to mock_test_templates
-- Run this in your EXAM ENGINE Supabase SQL editor
-- ============================================================

-- 1. Add created_by column to track which student created each test
ALTER TABLE public.mock_test_templates
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Add index for fast per-student queries
CREATE INDEX IF NOT EXISTS idx_mock_test_templates_created_by
  ON public.mock_test_templates(created_by);
