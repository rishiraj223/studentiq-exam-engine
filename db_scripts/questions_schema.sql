-- Phase 3: Question Bank Database Schema

-- 1. Create the questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  exam_type TEXT NOT NULL, -- e.g., 'JEE Main', 'NEET', 'MHT CET'
  year INTEGER,
  text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings
  correct_answer INTEGER NOT NULL, -- 0-indexed index of the correct option
  explanation TEXT,
  image_url TEXT,
  marks INTEGER NOT NULL DEFAULT 4,
  negative_marks INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add an index for faster querying by exam type and subject
CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON public.questions (exam_type, subject);

-- 3. Set up Row Level Security (RLS) - For MVP, we will allow read/write, but you can restrict this later
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON public.questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert access" ON public.questions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON public.questions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete access" ON public.questions
  FOR DELETE TO authenticated USING (true);

-- 4. Storage for Question Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('question_images', 'question_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'question_images');

CREATE POLICY "Authenticated Insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'question_images');
