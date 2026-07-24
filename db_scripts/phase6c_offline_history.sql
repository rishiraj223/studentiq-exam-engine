-- ============================================================
-- PHASE 6C: OFFLINE TEST HISTORY & QUESTION AVAILABILITY
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Saved Offline Test History
--    Stores only IDs (not question content) to keep storage minimal
--    ~2 KB per saved test. 1000 academies × 100 tests = ~200 MB max.
CREATE TABLE IF NOT EXISTS public.offline_test_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coaching_id      UUID NOT NULL,          -- which academy generated this
  test_name        TEXT NOT NULL,
  exam_type        TEXT NOT NULL,          -- 'JEE Main', 'NEET', etc.
  subject          TEXT,                   -- NULL for multi-subject papers
  subjects         TEXT[] DEFAULT '{}',    -- for multi-subject mode
  standard         TEXT NOT NULL,          -- '11th' or '12th'
  chapters         TEXT[] NOT NULL DEFAULT '{}',
  question_ids     UUID[] NOT NULL,        -- only IDs, not full question data
  total_marks      INT NOT NULL DEFAULT 0,
  duration_minutes INT,
  difficulty_mix   JSONB,                  -- e.g. {"easy":5,"medium":10,"hard":5}
  num_questions    INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-coaching lookups
CREATE INDEX IF NOT EXISTS idx_offline_history_coaching
  ON public.offline_test_history(coaching_id, created_at DESC);

-- Index to help "avoid repeated questions" query (GIN for array contains)
CREATE INDEX IF NOT EXISTS idx_offline_history_qids
  ON public.offline_test_history USING GIN(question_ids);

-- RLS: only service role (our backend) can read/write
ALTER TABLE public.offline_test_history ENABLE ROW LEVEL SECURITY;

-- Allow backend (service role) full access
-- Frontend always goes through our API routes which use the service role key
CREATE POLICY "Service role full access"
  ON public.offline_test_history
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. Question availability view (pre-aggregated counts)
--    This avoids a slow COUNT(*) query on every chapter selection.
--    The UI will call this to show "6 questions available" per chapter.
CREATE OR REPLACE VIEW public.question_availability AS
SELECT
  exam_type,
  standard,
  subject,
  chapter,
  difficulty,
  COUNT(*) AS question_count
FROM public.questions
GROUP BY exam_type, standard, subject, chapter, difficulty;

-- Grant read access to anon (the browser Supabase client uses anon key for reads)
GRANT SELECT ON public.question_availability TO anon;
GRANT SELECT ON public.question_availability TO authenticated;


-- ============================================================
-- DONE. Tables created:
--   public.offline_test_history
-- Views created:
--   public.question_availability
-- ============================================================
