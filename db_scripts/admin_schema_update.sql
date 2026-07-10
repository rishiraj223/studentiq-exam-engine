-- ==========================================
-- UPDATE SCHEMA FOR TAXONOMY & NTA SECTIONS
-- ==========================================

-- 1. Add the 'standard' column to questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS standard TEXT; -- e.g., '11th', '12th', 'Combined'

-- 2. Modify mock_test_templates to support NTA Sections (Physics, Chemistry, Maths)
-- We change question_ids from an array to a JSONB object so we can structure it like:
-- { "Physics": ["uuid1", "uuid2"], "Chemistry": ["uuid3"] }
ALTER TABLE public.mock_test_templates
DROP COLUMN IF EXISTS question_ids;

ALTER TABLE public.mock_test_templates
ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '{}'::jsonb;
