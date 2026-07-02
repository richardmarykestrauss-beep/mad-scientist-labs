import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resolveDataMode } from "@/lib/supabase";
import {
  canUseLocalPrototype,
  featureStatus,
  localPrototypeClientId,
  PILOT_STATUS_COPY,
} from "@/lib/pilotFeatures";
import { clearPilotSessionCaches, PILOT_SESSION_CACHE_KEYS } from "@/lib/pilotSession";
import { PrototypeFeatureNotice } from "@/components/pilot/PrototypeFeatureNotice";
import { getCheckInRepository } from "@/repositories/checkInRepository";
import { localCheckInRepository } from "@/repositories/localCheckInRepository";
import { supabaseCheckInRepository } from "@/repositories/supabaseCheckInRepository";
import * as fs from "fs";
import * as path from "path";

const source = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, `../${relativePath}`), "utf8");

describe("Remediation R3.1 - fail-closed mode selection", () => {
  it("accepts only explicit local and supabase modes", () => {
    expect(resolveDataMode("local")).toBe("local");
    expect(resolveDataMode("supabase")).toBe("supabase");
    expect(() => resolveDataMode(undefined)).toThrow();
    expect(() => resolveDataMode("demo")).toThrow();
  });

  it("selects exactly one repository without a Supabase-to-local fallback", () => {
    expect(getCheckInRepository("local")).toBe(localCheckInRepository);
    expect(getCheckInRepository("supabase")).toBe(supabaseCheckInRepository);
    expect(source("repositories/supabaseCheckInRepository.ts")).not.toContain("localCheckInRepository");
  });

  it("keeps production builds fail-closed instead of inferring demo mode", () => {
    const configSource = source("lib/supabase.ts");
    expect(configSource).not.toContain('VITE_DATA_MODE || "local"');
    expect(configSource).toContain("resolveDataMode(import.meta.env.VITE_DATA_MODE)");
  });
});

describe("Remediation R3.1 - live/demo identity isolation", () => {
  it("never maps a live UUID into a local prototype identity", () => {
    const realUuid = "7f4b1b0e-6e6c-4f70-8ef7-7a22e922d51b";
    expect(localPrototypeClientId("supabase", realUuid)).toBeNull();
    expect(canUseLocalPrototype("supabase")).toBe(false);
  });

  it("preserves explicit local demo identities separately", () => {
    expect(localPrototypeClientId("local")).toBe("c-001");
    expect(localPrototypeClientId("local", "c-002")).toBe("c-002");
    expect(canUseLocalPrototype("local")).toBe(true);
  });

  it("marks live check-ins live and unmigrated modules disabled", () => {
    expect(featureStatus("supabase", "weeklyCheckIns")).toBe("live");
    expect(featureStatus("supabase", "coachReviews")).toBe("live");
    expect(featureStatus("supabase", "labs")).toBe("disabled");
    expect(featureStatus("supabase", "recommendations")).toBe("disabled");
    expect(featureStatus("local", "labs")).toBe("demo");
  });

  it("renders an explicit blocked notice without personalized medical output", () => {
    render(<PrototypeFeatureNotice feature="Labs and recommendations" />);
    expect(screen.getByText(/Prototype feature/)).toBeInTheDocument();
    expect(screen.getByText(/No live identity or client data/)).toBeInTheDocument();
    expect(screen.getByText(/Not medical diagnosis or treatment/)).toBeInTheDocument();
    expect(screen.queryByText(/thyroid complex/i)).not.toBeInTheDocument();
  });

  it("does not pass a Supabase identity into local client-store lookups", () => {
    const clientSource = source("pages/client/ClientHome.tsx");
    const coachSource = source("pages/coach/ClientProfile.tsx");
    expect(clientSource).toContain("prototypeClientId ? getClientPanels(prototypeClientId) : []");
    expect(coachSource).toContain('dataMode === "local" ? getClientPanels(id) : []');
  });

  it("neither loads nor persists prototype records in Supabase mode", () => {
    const storeSource = source("data/store.ts");
    expect(storeSource).toContain('if (getActiveDataMode() === "supabase")');
    expect(storeSource).toContain('if (getActiveDataMode() === "supabase") return;');
  });
});

describe("Remediation R3.1 - sign-out cleanup", () => {
  it("clears all pilot session caches", () => {
    for (const key of PILOT_SESSION_CACHE_KEYS) sessionStorage.setItem(key, "prior-user-data");
    clearPilotSessionCaches();
    for (const key of PILOT_SESSION_CACHE_KEYS) expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("clears caches both when loading a user and signing out", () => {
    const authSource = source("context/AuthContext.tsx");
    expect(authSource.match(/clearPilotSessionCaches\(\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(authSource).toContain("setUser(null)");
    expect(authSource).toContain("setProfile(null)");
  });

  it("clears prior-user check-in and roster state before refetching", () => {
    expect(source("pages/client/ClientHome.tsx")).toContain("setCheckInHistory([])");
    expect(source("components/client/CheckInSubmissionForm.tsx")).toContain("setCurrentWeekCheckIn(null)");
    expect(source("pages/coach/ClientProfile.tsx")).toContain("setRawCheckIns([])");
    expect(source("pages/coach/ClientList.tsx")).toContain("setLiveClients([])");
  });
});

describe("Remediation R3.1 - active assignment and pilot UX", () => {
  const migration = fs.readFileSync(
    path.resolve(__dirname, "../../supabase/migrations/20260623000000_auth_checkins_foundation.sql"),
    "utf8",
  );

  it("requires active assignment, active coach, and active client", () => {
    expect(migration).toContain("assignment.status = 'active'");
    expect(migration).toContain("coach_profile.status = 'active'");
    expect(migration).toContain("client_profile.role = 'client'");
    expect(migration).toContain("client_profile.status = 'active'");
  });

  it("provides a deployable follow-up hardening migration", () => {
    const patchMigration = fs.readFileSync(
      path.resolve(__dirname, "../../supabase/migrations/20260702000000_r3_1_active_assignment_hardening.sql"),
      "utf8",
    );
    expect(patchMigration).toContain("SECURITY DEFINER SET search_path = ''");
    expect(patchMigration).toContain("GRANT EXECUTE ON FUNCTION private.coach_is_assigned_to(uuid) TO authenticated");
  });

  it("uses mode-aware Settings and the live pilot status copy", () => {
    const settingsSource = source("pages/coach/Settings.tsx");
    expect(settingsSource).toContain('if (dataMode === "supabase")');
    expect(settingsSource).toContain("Authentication, client identity, weekly check-ins, and coach reviews sync through Supabase.");
    expect(PILOT_STATUS_COPY).toMatch(/Live check-ins and coach feedback/);
  });

  it("keeps pilot login sign-in-only with no role or signup control", () => {
    const loginSource = source("pages/Login.tsx");
    expect(loginSource).not.toMatch(/sign\s*up/i);
    expect(loginSource).not.toMatch(/select.*role|role.*select/i);
    expect(loginSource).toContain('dataMode !== "supabase"');
  });
});
