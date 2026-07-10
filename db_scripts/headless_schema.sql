-- ==========================================
-- STEP 1: CLEAN UP OLD ARCHITECTURE
-- ==========================================
-- We are dropping the old multi-tenant SaaS tables to move to the Headless MVP.
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.coachings CASCADE;
DROP TABLE IF EXISTS public.demo_requests CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;

-- ==========================================
-- STEP 2: HEADLESS EXAM ENGINE SCHEMA (PHASE 1)
-- ==========================================

-- 1. The Centralized Question Bank
-- This is owned completely by the platform (no coaching_id needed).
-- It natively supports LaTeX text and JSON options.
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type TEXT NOT NULL, -- e.g., 'JEE Main', 'NEET'
  subject TEXT NOT NULL,   -- e.g., 'Physics', 'Chemistry'
  chapter TEXT,
  topic TEXT,
  difficulty TEXT,         -- 'easy', 'medium', 'hard'
  year INT,
  marks INT DEFAULT 4,
  negative_marks INT DEFAULT 1,
  question_text TEXT NOT NULL, 
  options JSONB NOT NULL,  -- Stored as a JSON array of strings
  correct_answer_index INT NOT NULL, -- 0, 1, 2, or 3
  explanation TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mock Test Templates
-- These are pre-defined tests (e.g., "JEE 2023 Paper 1") that your main CRM will assign to students.
CREATE TABLE public.mock_test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 180,
  total_marks INT NOT NULL DEFAULT 300,
  question_ids UUID[] NOT NULL, -- An array of UUIDs linking to the questions table
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SECURITY (RLS)
-- ==========================================
-- Since this is a headless engine accessed via secure tokens later, 
-- these tables can be read-only for authenticated anon requests if needed,
-- but for the MVP, we will rely on the server-side API (service_role) to fetch questions securely.
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_templates ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally DO NOT create public select policies yet, 
-- because in Phase 2, the Next.js server will fetch the questions securely 
-- using the service_role key after decoding the JWT token. This prevents students from scraping the DB.
