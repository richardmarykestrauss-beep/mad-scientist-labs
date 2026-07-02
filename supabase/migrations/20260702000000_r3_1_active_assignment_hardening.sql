-- R3.1 follow-up for projects where the R3 foundation migration was applied.
BEGIN;

CREATE OR REPLACE FUNCTION private.coach_is_assigned_to(client_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.coach_client_assignments AS assignment
    JOIN public.profiles AS coach_profile ON coach_profile.id = assignment.coach_id
    JOIN public.profiles AS client_profile ON client_profile.id = assignment.client_id
    WHERE assignment.coach_id = auth.uid()
      AND assignment.client_id = client_uuid
      AND assignment.status = 'active'
      AND coach_profile.role IN ('coach', 'admin')
      AND coach_profile.status = 'active'
      AND client_profile.role = 'client'
      AND client_profile.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION private.coach_is_assigned_to(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.coach_is_assigned_to(uuid) TO authenticated;

COMMIT;
