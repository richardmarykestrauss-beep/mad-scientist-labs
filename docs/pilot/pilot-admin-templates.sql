-- Mad Scientist Coaching Lab pilot administration templates
-- Run only in the Supabase SQL Editor as a privileged project administrator.
-- Replace every <...> placeholder before running a selected block.
-- Never place credentials, JWTs, or service-role keys in this file.

-- 1. Promote Warren after his Auth account has been created.
UPDATE public.profiles
SET role = 'coach', status = 'active', updated_at = now()
WHERE id = '<WARREN_USER_UUID>'::uuid
  AND role = 'client';

-- Verify exactly one row was promoted before continuing.
SELECT id, full_name, role, status
FROM public.profiles
WHERE id = '<WARREN_USER_UUID>'::uuid;

-- 2. Assign the ten active pilot clients to Warren.
-- The validation trigger rejects non-client, inactive, or invalid accounts.
INSERT INTO public.coach_client_assignments (coach_id, client_id, status)
SELECT '<WARREN_USER_UUID>'::uuid, client_id, 'active'
FROM (
  VALUES
    ('<PILOT_CLIENT_01_UUID>'::uuid),
    ('<PILOT_CLIENT_02_UUID>'::uuid),
    ('<PILOT_CLIENT_03_UUID>'::uuid),
    ('<PILOT_CLIENT_04_UUID>'::uuid),
    ('<PILOT_CLIENT_05_UUID>'::uuid),
    ('<PILOT_CLIENT_06_UUID>'::uuid),
    ('<PILOT_CLIENT_07_UUID>'::uuid),
    ('<PILOT_CLIENT_08_UUID>'::uuid),
    ('<PILOT_CLIENT_09_UUID>'::uuid),
    ('<PILOT_CLIENT_10_UUID>'::uuid)
) AS pilot(client_id)
ON CONFLICT (coach_id, client_id)
DO UPDATE SET status = 'active';

-- 3. Verify Warren's active pilot assignments and detect duplicates.
SELECT count(*) AS active_assignment_count,
       count(DISTINCT client_id) AS distinct_client_count
FROM public.coach_client_assignments
WHERE coach_id = '<WARREN_USER_UUID>'::uuid
  AND status = 'active';

SELECT client_id, count(*) AS duplicate_count
FROM public.coach_client_assignments
WHERE coach_id = '<WARREN_USER_UUID>'::uuid
GROUP BY client_id
HAVING count(*) > 1;

SELECT role, status, count(*) AS profile_count
FROM public.profiles
WHERE id IN (
  '<PILOT_CLIENT_01_UUID>'::uuid, '<PILOT_CLIENT_02_UUID>'::uuid,
  '<PILOT_CLIENT_03_UUID>'::uuid, '<PILOT_CLIENT_04_UUID>'::uuid,
  '<PILOT_CLIENT_05_UUID>'::uuid, '<PILOT_CLIENT_06_UUID>'::uuid,
  '<PILOT_CLIENT_07_UUID>'::uuid, '<PILOT_CLIENT_08_UUID>'::uuid,
  '<PILOT_CLIENT_09_UUID>'::uuid, '<PILOT_CLIENT_10_UUID>'::uuid
)
GROUP BY role, status;

-- 4. Deactivate a pilot client. Inactivate assignments first so the
-- assignment-integrity trigger still sees an active client during the update.
BEGIN;
UPDATE public.coach_client_assignments
SET status = 'inactive'
WHERE client_id = '<PILOT_CLIENT_UUID>'::uuid
  AND status = 'active';
UPDATE public.profiles
SET status = 'inactive', updated_at = now()
WHERE id = '<PILOT_CLIENT_UUID>'::uuid
  AND role = 'client';
COMMIT;

-- 5. Remove access without deactivating the client account.
UPDATE public.coach_client_assignments
SET status = 'inactive'
WHERE coach_id = '<WARREN_USER_UUID>'::uuid
  AND client_id = '<PILOT_CLIENT_UUID>'::uuid
  AND status = 'active';
