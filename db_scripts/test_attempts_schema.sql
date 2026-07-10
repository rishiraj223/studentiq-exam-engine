-- ==========================================
-- STEP 3: STUDENT TEST ATTEMPTS TABLE
-- ==========================================

CREATE TABLE public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_template_id UUID NOT NULL REFERENCES public.mock_test_templates(id) ON DELETE CASCADE,
  
  -- Overall Score
  total_score INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unanswered_count INT NOT NULL DEFAULT 0,
  
  -- Detailed Responses (Stored as JSON array for easy frontend parsing)
  -- Format: [{ question_id: 'uuid', selected_option: 2, is_correct: true, status: 'answered' }]
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Time tracking
  time_taken_seconds INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a student can only take a specific test once (if desired for MVP, remove if they can retake)
  UNIQUE(student_id, test_template_id)
);

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Students can insert their own attempts
CREATE POLICY "Students can insert their own test attempts"
ON public.test_attempts
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can read their own attempts
CREATE POLICY "Students can view their own test attempts"
ON public.test_attempts
FOR SELECT
USING (auth.uid() = student_id);
