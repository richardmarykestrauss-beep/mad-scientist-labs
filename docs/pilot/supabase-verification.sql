-- Read-only post-migration verification for the Supabase SQL Editor.
-- Supplying these result sets is required before migration success is claimed.

SELECT table_schema, table_name, c.relrowsecurity AS row_security
FROM information_schema.tables t
JOIN pg_catalog.pg_class c ON c.relname = t.table_name
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'coach_client_assignments', 'check_ins', 'check_in_reviews')
ORDER BY table_name;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'coach_client_assignments', 'check_ins', 'check_in_reviews')
ORDER BY tablename, policyname;

SELECT grantee, table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'coach_client_assignments', 'check_ins', 'check_in_reviews')
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

SELECT routine_schema, routine_name, grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema = 'private'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY routine_name, grantee;

SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_catalog.pg_constraint
WHERE conrelid IN (
  'public.profiles'::regclass,
  'public.coach_client_assignments'::regclass,
  'public.check_ins'::regclass,
  'public.check_in_reviews'::regclass
)
ORDER BY table_name::text, conname;

SELECT event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema IN ('auth', 'public')
  AND trigger_name IN (
    'on_auth_user_created',
    'tr_profiles_updated_at',
    'tr_check_ins_updated_at',
    'tr_check_in_reviews_updated_at',
    'tr_coach_client_assignments_validation'
  )
ORDER BY trigger_name, event_manipulation;
