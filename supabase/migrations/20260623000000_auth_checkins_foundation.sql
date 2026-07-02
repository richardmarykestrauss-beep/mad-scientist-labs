-- Migration: Auth and Check-ins Foundation
-- Created at: 2026-06-23

BEGIN;

-- Create private schema for security helpers (not exposed in Supabase Data API / schema list)
CREATE SCHEMA IF NOT EXISTS private;

-- Restrict schema access
REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Define the updated_at trigger helper function (kept in private schema to avoid exposing trigger mechanics)
CREATE OR REPLACE FUNCTION private.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 1. Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  role text NOT NULL DEFAULT 'client',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_profiles_auth_users FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT check_valid_role CHECK (role IN ('client', 'coach', 'admin')),
  CONSTRAINT check_valid_status CHECK (status IN ('active', 'inactive'))
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.handle_updated_at();

-- 2. Create coach_client_assignments table
CREATE TABLE IF NOT EXISTS public.coach_client_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_coach_client_assignment UNIQUE (coach_id, client_id),
  CONSTRAINT check_not_self_assigned CHECK (coach_id <> client_id),
  CONSTRAINT check_valid_assignment_status CHECK (status IN ('active', 'inactive'))
);

-- 3. Create check_ins table
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_key text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  weight numeric NOT NULL CHECK (weight > 0),
  energy integer NOT NULL CHECK (energy BETWEEN 1 AND 10),
  sleep integer NOT NULL CHECK (sleep BETWEEN 1 AND 10),
  mood integer NOT NULL CHECK (mood BETWEEN 1 AND 10),
  stress integer NOT NULL CHECK (stress BETWEEN 1 AND 10),
  training integer NOT NULL CHECK (training BETWEEN 0 AND 100),
  nutrition integer NOT NULL CHECK (nutrition BETWEEN 0 AND 100),
  digestion text NOT NULL CHECK (length(trim(digestion)) > 0),
  wins text NOT NULL CHECK (length(trim(wins)) > 0),
  struggles text NOT NULL CHECK (length(trim(struggles)) > 0),
  questions text NOT NULL CHECK (length(trim(questions)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_client_week UNIQUE (client_id, week_key),
  CONSTRAINT check_week_key_format CHECK (week_key ~ '^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$')
);

DROP TRIGGER IF EXISTS tr_check_ins_updated_at ON public.check_ins;
CREATE TRIGGER tr_check_ins_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION private.handle_updated_at();

-- 4. Create check_in_reviews table
CREATE TABLE IF NOT EXISTS public.check_in_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid NOT NULL UNIQUE REFERENCES public.check_ins(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  feedback text NOT NULL CHECK (length(trim(feedback)) > 0),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_check_in_reviews_updated_at ON public.check_in_reviews;
CREATE TRIGGER tr_check_in_reviews_updated_at
  BEFORE UPDATE ON public.check_in_reviews
  FOR EACH ROW EXECUTE FUNCTION private.handle_updated_at();

-- Indexes for performance and RLS lookup speed
CREATE INDEX IF NOT EXISTS idx_assignments_coach_client ON public.coach_client_assignments(coach_id, client_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_client_submitted ON public.check_ins(client_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_coach ON public.check_in_reviews(coach_id);
CREATE INDEX IF NOT EXISTS idx_reviews_check_in ON public.check_in_reviews(check_in_id);

-- Profile provisioning trigger from auth.users (Defined in private schema)
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'client', -- Hardcoded to client
    'active'  -- Default status
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger assignment
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- Security Helper Functions in private schema to prevent policy recursion
CREATE OR REPLACE FUNCTION private.is_active_client()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'client'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION private.is_coach()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('coach', 'admin') AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION private.coach_is_assigned_to(client_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.coach_client_assignments
    WHERE coach_id = auth.uid() AND client_id = client_uuid AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger function for coach/client assignment role-integrity validation
CREATE OR REPLACE FUNCTION private.validate_coach_client_assignment()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = new.coach_id
      AND role IN ('coach', 'admin')
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid active coach assignment';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = new.client_id
      AND role = 'client'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid active client assignment';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger for assignments validation
DROP TRIGGER IF EXISTS tr_coach_client_assignments_validation ON public.coach_client_assignments;
CREATE TRIGGER tr_coach_client_assignments_validation
  BEFORE INSERT OR UPDATE ON public.coach_client_assignments
  FOR EACH ROW EXECUTE FUNCTION private.validate_coach_client_assignment();

-- Revoke default function privileges
REVOKE ALL ON FUNCTION private.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_active_client() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_coach() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION private.coach_is_assigned_to(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION private.handle_updated_at() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION private.validate_coach_client_assignment() FROM public, anon, authenticated;

-- Explicitly grant execute rights on the RLS helpers only to authenticated
GRANT EXECUTE ON FUNCTION private.is_active_client() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION private.coach_is_assigned_to(uuid) TO authenticated;

-- Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_reviews ENABLE ROW LEVEL SECURITY;

-- Explicit table grants (Restrict public, allow authenticated)
REVOKE ALL ON public.profiles FROM public, anon, authenticated;
REVOKE ALL ON public.coach_client_assignments FROM public, anon, authenticated;
REVOKE ALL ON public.check_ins FROM public, anon, authenticated;
REVOKE ALL ON public.check_in_reviews FROM public, anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.coach_client_assignments TO authenticated;
GRANT SELECT, INSERT ON public.check_ins TO authenticated;
GRANT SELECT, INSERT ON public.check_in_reviews TO authenticated;

-- RLS Policies
-- Profiles Policies
DROP POLICY IF EXISTS profiles_read_self ON public.profiles;
CREATE POLICY profiles_read_self ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id AND status = 'active');

DROP POLICY IF EXISTS profiles_read_coach_assigned ON public.profiles;
CREATE POLICY profiles_read_coach_assigned ON public.profiles
  FOR SELECT TO authenticated
  USING (private.is_coach() AND private.coach_is_assigned_to(id));

-- Coach-Client Assignments Policies
DROP POLICY IF EXISTS assignments_read ON public.coach_client_assignments;
CREATE POLICY assignments_read ON public.coach_client_assignments
  FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND (
      (
        client_id = auth.uid()
        AND private.is_active_client()
      )
      OR
      (
        coach_id = auth.uid()
        AND private.is_coach()
      )
    )
  );

-- Check-ins Policies
DROP POLICY IF EXISTS check_ins_client_read ON public.check_ins;
CREATE POLICY check_ins_client_read ON public.check_ins
  FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    AND private.is_active_client()
  );

DROP POLICY IF EXISTS check_ins_client_insert ON public.check_ins;
CREATE POLICY check_ins_client_insert ON public.check_ins
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND private.is_active_client()
  );

DROP POLICY IF EXISTS check_ins_coach_read ON public.check_ins;
CREATE POLICY check_ins_coach_read ON public.check_ins
  FOR SELECT TO authenticated
  USING (private.is_coach() AND private.coach_is_assigned_to(client_id));

-- Check-in Reviews Policies
DROP POLICY IF EXISTS reviews_client_read ON public.check_in_reviews;
CREATE POLICY reviews_client_read ON public.check_in_reviews
  FOR SELECT TO authenticated
  USING (
    private.is_active_client()
    AND EXISTS (
      SELECT 1 FROM public.check_ins
      WHERE public.check_ins.id = check_in_id AND public.check_ins.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS reviews_coach_read ON public.check_in_reviews;
CREATE POLICY reviews_coach_read ON public.check_in_reviews
  FOR SELECT TO authenticated
  USING (
    private.is_coach() AND
    EXISTS (
      SELECT 1 FROM public.check_ins
      WHERE public.check_ins.id = check_in_id AND private.coach_is_assigned_to(public.check_ins.client_id)
    )
  );

DROP POLICY IF EXISTS reviews_coach_insert ON public.check_in_reviews;
CREATE POLICY reviews_coach_insert ON public.check_in_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_coach() AND
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.check_ins
      WHERE public.check_ins.id = check_in_id AND private.coach_is_assigned_to(public.check_ins.client_id)
    )
  );

COMMIT;
