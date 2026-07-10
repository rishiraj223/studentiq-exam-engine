-- Phase 2: Coaching Management & Isolation Schema

-- 1. Create the coachings table
CREATE TABLE IF NOT EXISTS public.coachings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the profiles table (extends auth.users)
-- This links an authenticated user to a specific role and coaching
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coaching_id UUID REFERENCES public.coachings(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('coaching_admin', 'student')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coaching_id UUID NOT NULL REFERENCES public.coachings(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Target JEE 2025'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create the students table (extended profile for students)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  coaching_id UUID NOT NULL REFERENCES public.coachings(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  standard TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) - DATA ISOLATION
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.coachings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's coaching_id
CREATE OR REPLACE FUNCTION get_auth_coaching_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT coaching_id FROM public.profiles WHERE id = auth.uid();
$$;

-- PROFILES: Users can read their own profile, or admins can read profiles in their coaching
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can read coaching profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    get_auth_coaching_id() = coaching_id 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'coaching_admin'
  );

-- BATCHES: Isolated by coaching_id
CREATE POLICY "Coachings can manage their own batches" ON public.batches
  FOR ALL TO authenticated USING (coaching_id = get_auth_coaching_id());

-- STUDENTS: Isolated by coaching_id
CREATE POLICY "Coachings can manage their own students" ON public.students
  FOR ALL TO authenticated USING (coaching_id = get_auth_coaching_id());

-- QUESTIONS UPDATE (Phase 3 integration)
-- Ensure questions belong to a specific coaching center
ALTER TABLE public.questions ADD COLUMN coaching_id UUID REFERENCES public.coachings(id) ON DELETE CASCADE;

CREATE POLICY "Coachings can manage their own questions" ON public.questions
  FOR ALL TO authenticated USING (coaching_id = get_auth_coaching_id());
