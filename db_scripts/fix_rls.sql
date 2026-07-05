-- ==========================================
-- FIX: ROW LEVEL SECURITY FOR QUESTIONS TABLE
-- Run this in the Supabase SQL Editor
-- ==========================================

-- Enable RLS on the questions table (if not already enabled)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 1. Allow ANYONE to read questions (needed for students taking the test)
CREATE POLICY "Anyone can read questions" 
ON public.questions FOR SELECT USING (true);

-- 2. Allow ANYONE to insert/update questions (for the MVP Admin Portal)
-- NOTE: In a real production app, we would restrict this to authenticated admins only.
-- But for our MVP and feeding data easily, this is perfect.
CREATE POLICY "Anyone can insert questions" 
ON public.questions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update questions" 
ON public.questions FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete questions" 
ON public.questions FOR DELETE USING (true);
