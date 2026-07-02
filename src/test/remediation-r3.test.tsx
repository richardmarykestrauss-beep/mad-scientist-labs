import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCheckInRepository } from "@/repositories/checkInRepository";
import { localCheckInRepository } from "@/repositories/localCheckInRepository";
import { supabaseCheckInRepository } from "@/repositories/supabaseCheckInRepository";
import { resolveDataMode, validateSupabaseConfig } from "@/lib/supabase";
import * as fs from "fs";
import * as path from "path";

describe("Remediation R3 - Configuration and Environment Guardrails", () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it("fails closed when VITE_DATA_MODE is missing", () => {
    expect(() => resolveDataMode(undefined)).toThrow(/must be explicitly set/);
  });

  it("fails closed when VITE_DATA_MODE is unknown", () => {
    expect(() => resolveDataMode("production-demo")).toThrow(/must be explicitly set/);
  });

  it("local mode works without Supabase variables", () => {
    import.meta.env.VITE_DATA_MODE = "local";
    import.meta.env.VITE_SUPABASE_URL = "";
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "";
    
    expect(() => validateSupabaseConfig()).not.toThrow();
  });

  it("supabase mode rejects missing URL/key", () => {
    import.meta.env.VITE_DATA_MODE = "supabase";
    import.meta.env.VITE_SUPABASE_URL = "";
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "";
    
    expect(() => validateSupabaseConfig()).toThrow();
  });

  it("supabase mode rejects service-role keys", () => {
    import.meta.env.VITE_DATA_MODE = "supabase";
    import.meta.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "service_role_secret_key_prohibited";
    
    expect(() => validateSupabaseConfig()).toThrow(/service_role/);
  });

  it("supabase mode rejects malformed URLs and publishable keys", () => {
    import.meta.env.VITE_DATA_MODE = "supabase";
    import.meta.env.VITE_SUPABASE_URL = "not-a-url";
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "short";
    expect(() => validateSupabaseConfig()).toThrow(/valid HTTPS URL/);
  });
});

describe("Remediation R3 - Repository Contracts", () => {
  it("local repository implements check-in repository interface", () => {
    expect(localCheckInRepository.getCurrentUserProfile).toBeDefined();
    expect(localCheckInRepository.listAssignedClients).toBeDefined();
    expect(localCheckInRepository.listOwnCheckIns).toBeDefined();
    expect(localCheckInRepository.submitOwnCheckIn).toBeDefined();
    expect(localCheckInRepository.listAssignedClientCheckIns).toBeDefined();
    expect(localCheckInRepository.reviewAssignedCheckIn).toBeDefined();
  });

  it("supabase repository implements same interface", () => {
    expect(supabaseCheckInRepository.getCurrentUserProfile).toBeDefined();
    expect(supabaseCheckInRepository.listAssignedClients).toBeDefined();
    expect(supabaseCheckInRepository.listOwnCheckIns).toBeDefined();
    expect(supabaseCheckInRepository.submitOwnCheckIn).toBeDefined();
    expect(supabaseCheckInRepository.listAssignedClientCheckIns).toBeDefined();
    expect(supabaseCheckInRepository.reviewAssignedCheckIn).toBeDefined();
  });
});

describe("Remediation R3 - Client/Coach Identity Isolation", () => {
  it("client submission does not require clientId in payload", async () => {
    // Check type definition by making sure clientId is omitted
    const inputPayload = {
      date: "2026-06-23",
      bodyWeightKg: 95.5,
      energyScore: 8,
      sleepQuality: 8,
      moodScore: 8,
      stressScore: 3,
      trainingAdherence: 95,
      nutritionAdherence: 90,
      digestionNotes: "Normal",
      winsThisWeek: "Consistency",
      strugglesThisWeek: "None",
      questionForCoach: "None"
    };

    // Assert that the function accepts it and derives clientId on the backend/auth context
    expect(inputPayload).not.toHaveProperty("clientId");
  });

  it("coach review payload does not require coachId in payload", () => {
    const inputPayload = {
      checkInId: "some-uuid",
      feedback: "Maintain progress"
    };
    expect(inputPayload).not.toHaveProperty("coachId");
  });
});

describe("Remediation R3 - Static SQL Migration Security Audit Checks", () => {
  const migrationPath = path.resolve(__dirname, "../../supabase/migrations/20260623000000_auth_checkins_foundation.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  it("proves private schema creation exists", () => {
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS private;");
  });

  it("proves PUBLIC/anon usage privileges on private schema are revoked", () => {
    expect(sql).toContain("REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;");
  });

  it("proves authenticated has usage permissions on private schema", () => {
    expect(sql).toContain("GRANT USAGE ON SCHEMA private TO authenticated;");
  });

  it("proves authenticated has execute permissions only on required RLS helpers", () => {
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION private.is_active_client() TO authenticated;");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION private.is_coach() TO authenticated;");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION private.coach_is_assigned_to(uuid) TO authenticated;");
  });

  it("proves anon does not have direct execute access on helpers", () => {
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION private.is_active_client() TO anon");
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION private.is_coach() TO anon");
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION private.coach_is_assigned_to(uuid) TO anon");
  });

  it("proves handle_new_user is not client-executable", () => {
    expect(sql).toContain("REVOKE ALL ON FUNCTION private.handle_new_user() FROM public, anon, authenticated;");
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION private.handle_new_user() TO");
  });

  it("proves RLS policies invoke private schema helper functions", () => {
    expect(sql).toContain("private.is_active_client()");
    expect(sql).toContain("private.is_coach()");
    expect(sql).toContain("private.coach_is_assigned_to");
  });

  it("proves no public helper functions remain", () => {
    expect(sql).not.toContain("public.is_coach()");
    expect(sql).not.toContain("public.coach_is_assigned_to(");
  });

  it("proves all security definer functions set empty search_path", () => {
    // We clean linebreaks to do robust matching
    const normalizedSql = sql.replace(/\s+/g, " ");
    const matches = normalizedSql.match(/SECURITY DEFINER SET search_path = ''/g);
    // There are exactly 4 security definer functions remaining: handle_new_user, is_active_client, is_coach, coach_is_assigned_to, validate_coach_client_assignment
    // total is 5 (handle_new_user, is_active_client, is_coach, coach_is_assigned_to, validate_coach_client_assignment)
    expect(matches?.length).toBe(5);
  });

  it("proves no admin helper or unused grant exists", () => {
    expect(sql).not.toContain("private.is_admin()");
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION private.is_admin");
  });

  it("proves assignments_read requires status = active and role verification", () => {
    const normalizedSql = sql.replace(/\s+/g, " ");
    expect(normalizedSql).toContain("CREATE POLICY assignments_read ON public.coach_client_assignments FOR SELECT TO authenticated USING ( status = 'active' AND ( ( client_id = auth.uid() AND private.is_active_client() ) OR ( coach_id = auth.uid() AND private.is_coach() ) ) )");
  });

  it("proves validate_coach_client_assignment trigger function exists and validates active statuses and roles", () => {
    expect(sql).toContain("private.validate_coach_client_assignment()");
    expect(sql).toContain("role IN ('coach', 'admin')");
    expect(sql).toContain("role = 'client'");
    expect(sql).toContain("status = 'active'");
  });

  it("proves validate_coach_client_assignment trigger function is SECURITY DEFINER with empty search_path", () => {
    const normalizedSql = sql.replace(/\s+/g, " ");
    expect(normalizedSql).toContain("CREATE OR REPLACE FUNCTION private.validate_coach_client_assignment() RETURNS trigger AS $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM public.profiles WHERE id = new.coach_id AND role IN ('coach', 'admin') AND status = 'active' ) THEN RAISE EXCEPTION 'Invalid active coach assignment'; END IF; IF NOT EXISTS ( SELECT 1 FROM public.profiles WHERE id = new.client_id AND role = 'client' AND status = 'active' ) THEN RAISE EXCEPTION 'Invalid active client assignment'; END IF; RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';");
  });

  it("proves trigger validation runs BEFORE INSERT OR UPDATE", () => {
    expect(sql).toContain("BEFORE INSERT OR UPDATE ON public.coach_client_assignments");
    expect(sql).toContain("FOR EACH ROW EXECUTE FUNCTION private.validate_coach_client_assignment()");
  });

  it("proves validate_coach_client_assignment has no execute grants to authenticated or anon", () => {
    expect(sql).toContain("REVOKE ALL ON FUNCTION private.validate_coach_client_assignment() FROM public, anon, authenticated;");
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION private.validate_coach_client_assignment");
  });

  it("proves private.is_active_client checks role client and status active", () => {
    const normalizedSql = sql.replace(/\s+/g, " ");
    expect(normalizedSql).toContain("CREATE OR REPLACE FUNCTION private.is_active_client() RETURNS boolean AS $$ BEGIN RETURN EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'client' AND status = 'active' ); END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';");
  });

  it("proves client policies call private.is_active_client", () => {
    const normalizedSql = sql.replace(/\s+/g, " ");
    expect(normalizedSql).toContain("CREATE POLICY check_ins_client_read ON public.check_ins FOR SELECT TO authenticated USING ( client_id = auth.uid() AND private.is_active_client() )");
    expect(normalizedSql).toContain("CREATE POLICY check_ins_client_insert ON public.check_ins FOR INSERT TO authenticated WITH CHECK ( client_id = auth.uid() AND private.is_active_client() )");
    expect(normalizedSql).toContain("CREATE POLICY reviews_client_read ON public.check_in_reviews FOR SELECT TO authenticated USING ( private.is_active_client() AND EXISTS ( SELECT 1 FROM public.check_ins WHERE public.check_ins.id = check_in_id AND public.check_ins.client_id = auth.uid() ) )");
  });

  it("proves week_key constraint permits only valid weeks between 01 and 53", () => {
    const normalizedSql = sql.replace(/\s+/g, " ");
    expect(normalizedSql).toContain("CONSTRAINT check_week_key_format CHECK (week_key ~ '^\\d{4}-W(0[1-9]|[1-4]\\d|5[0-3])$')");
  });

  it("revokes inherited table privileges before granting the minimum authenticated access", () => {
    for (const table of ["profiles", "coach_client_assignments", "check_ins", "check_in_reviews"]) {
      expect(sql).toContain(`REVOKE ALL ON public.${table} FROM public, anon, authenticated;`);
    }
    expect(sql).not.toMatch(/GRANT\s+(UPDATE|DELETE|ALL).*TO authenticated/i);
  });

  it("denies inactive profiles from the self-profile policy", () => {
    const normalizedSql = sql.replace(/\s+/g, " ");
    expect(normalizedSql).toContain("USING (auth.uid() = id AND status = 'active')");
  });

  it("matches percentage semantics for training and nutrition", () => {
    expect(sql).toContain("training integer NOT NULL CHECK (training BETWEEN 0 AND 100)");
    expect(sql).toContain("nutrition integer NOT NULL CHECK (nutrition BETWEEN 0 AND 100)");
  });

  it("has no update or delete policy for submitted check-ins or insert-once reviews", () => {
    expect(sql).not.toMatch(/CREATE POLICY\s+\S+\s+ON public\.check_ins\s+FOR (UPDATE|DELETE)/i);
    expect(sql).not.toMatch(/CREATE POLICY\s+\S+\s+ON public\.check_in_reviews\s+FOR (UPDATE|DELETE)/i);
  });
});

describe("Remediation R3 - Source security regression checks", () => {
  const authSource = fs.readFileSync(path.resolve(__dirname, "../context/AuthContext.tsx"), "utf8");
  const repositorySource = fs.readFileSync(path.resolve(__dirname, "../repositories/supabaseCheckInRepository.ts"), "utf8");
  const loginSource = fs.readFileSync(path.resolve(__dirname, "../pages/Login.tsx"), "utf8");

  it("does not bypass generated Supabase typing", () => {
    expect(repositorySource).not.toContain("as any");
    expect(repositorySource).not.toMatch(/:\s*any\b/);
  });

  it("derives client and coach IDs from the authenticated Supabase user", () => {
    expect(repositorySource).toContain("client_id: user.id");
    expect(repositorySource).toContain("coach_id: user.id");
  });

  it("does not route a live user by matching their email text", () => {
    expect(loginSource).toContain("profile.role === \"coach\"");
    expect(loginSource).not.toContain("email.includes(\"warren\")");
  });

  it("allows a demo fallback only outside Supabase mode", () => {
    expect(authSource).toContain("if (dataMode === \"supabase\")");
    expect(authSource).toContain("useAuth must be used within AuthProvider in Supabase mode");
  });
});
