-- ==========================================
-- PHASE 8: LIVE TEST SESSIONS & PROCTORING
-- ==========================================

-- 1. Create live_test_sessions table for real-time monitoring
CREATE TABLE IF NOT EXISTS public.live_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_template_id UUID NOT NULL REFERENCES public.mock_test_templates(id) ON DELETE CASCADE,
  coaching_id UUID NOT NULL REFERENCES public.coachings(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  
  -- Session State
  current_question INT DEFAULT 0,
  time_left INT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'force_submit')),
  
  -- Proctoring State
  tab_switches INT DEFAULT 0,
  fullscreen_exits INT DEFAULT 0,
  
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- A student can only have one live session per test template
  UNIQUE(student_id, test_template_id)
);

-- Enable RLS
ALTER TABLE public.live_test_sessions ENABLE ROW LEVEL SECURITY;

-- Students can insert/update their own live sessions
CREATE POLICY "Students can manage their own live sessions"
ON public.live_test_sessions
FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Admins can view and update live sessions for their coaching
-- (Note: we use a simpler policy or assume the backend service role handles admin force submits)

-- 2. Add scheduled_start_time to mock_test_templates if it doesn't exist
ALTER TABLE public.mock_test_templates 
ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMPTZ NULL;
