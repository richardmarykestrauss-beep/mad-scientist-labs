import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckInSubmissionForm } from "@/components/client/CheckInSubmissionForm";
import { SupplementChecklist } from "@/components/client/SupplementChecklist";
import { TrainingPlanCards } from "@/components/client/TrainingPlanCards";
import {
  actions,
  getCheckInsForClient,
  getClient,
  getClientCoachNotes,
  getClientExerciseLogs,
  getClientSupplementLogs,
  getClientSupplementProtocol,
  getClientTrainingPlan,
} from "@/data/store";
import ClientHome from "@/pages/client/ClientHome";
import ClientProfile from "@/pages/coach/ClientProfile";
import NotFound from "@/pages/NotFound";

const today = () => new Date().toISOString().slice(0, 10);

const addFreshClient = (name = "R2 Athlete") =>
  actions.addClient(name, `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`, "R2 test goal");

const submitValidCheckIn = (clientId: string) =>
  actions.submitCheckIn(
    clientId,
    82.4,
    7,
    8,
    7,
    4,
    91,
    88,
    "Digestion steady.",
    "Hit all training sessions.",
    "Sleep timing drifted.",
    "Should I move rest day?"
  );

const addClientSafeNote = (clientId: string) =>
  actions.addCoachNote({
    clientId,
    title: "R2 Client Safe Note",
    body: "Keep sleep timing consistent this week.",
    category: "Check-In",
    visibility: "client_safe",
    pinned: false,
    messages: [],
  });

describe("Remediation R2 launch-critical baseline", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    actions.resetStore();
    localStorage.clear();
  });

  it("blocks duplicate current-week check-ins while preserving valid submissions", () => {
    const clientId = addFreshClient("Duplicate Guard");
    const first = submitValidCheckIn(clientId);

    expect(first.winsThisWeek).toBe("Hit all training sessions.");
    expect(() => submitValidCheckIn(clientId)).toThrow("Weekly check-in already submitted for this week");
    expect(getCheckInsForClient(clientId)).toHaveLength(1);
  });

  it("persists coach review feedback and does not render client editing controls for it", () => {
    const clientId = addFreshClient("Feedback Guard");
    const checkIn = submitValidCheckIn(clientId);
    actions.reviewCheckIn(checkIn.id, "Hold calories steady and improve bedtime consistency.", "Coach Warren");

    render(<CheckInSubmissionForm clientId={clientId} />);

    expect(screen.getByText(/Hold calories steady/)).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit weekly check-in/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Question for Coach")).not.toBeInTheDocument();
  });

  it("persists coach-note acknowledgement and keeps client and coach messages isolated by client", () => {
    const c001Note = addClientSafeNote("c-001");
    const c002Note = addClientSafeNote("c-002");

    actions.acknowledgeCoachNote(c001Note.id);
    actions.replyToCoachNote(c001Note.id, "Client reply from c-001");
    actions.coachReplyToNote(c001Note.id, "Coach response to c-001");

    const c001Notes = getClientCoachNotes("c-001");
    const updated = c001Notes.find((n) => n.id === c001Note.id);
    expect(updated?.acknowledgedByClient).toBe(true);
    expect(updated?.acknowledgedAt).toBeTruthy();
    expect(updated?.messages?.map((m) => `${m.senderRole}:${m.text}`)).toEqual([
      "client:Client reply from c-001",
      "coach:Coach response to c-001",
    ]);

    const c002Messages = getClientCoachNotes("c-002").find((n) => n.id === c002Note.id)?.messages || [];
    expect(c002Messages).toHaveLength(0);
  });

  it("blocks empty coach-note messages and suppresses rapid duplicate submissions", () => {
    const note = addClientSafeNote("c-001");

    expect(() => actions.replyToCoachNote(note.id, "   ")).toThrow("Message cannot be empty");
    actions.replyToCoachNote(note.id, "Same message");
    actions.replyToCoachNote(note.id, "Same message");

    const messages = getClientCoachNotes("c-001").find((n) => n.id === note.id)?.messages || [];
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("Same message");
  });

  it("keeps protocol data isolated across unsupported, c-001, and c-002 client views", () => {
    const { unmount } = render(<TrainingPlanCards clientId="c-no-program" />);
    expect(screen.getByText("No training programme assigned yet.")).toBeInTheDocument();
    expect(screen.queryByText("Incline Dumbbell Press")).not.toBeInTheDocument();
    unmount();

    render(<TrainingPlanCards clientId="c-001" />);
    expect(screen.getByText("Incline Dumbbell Press")).toBeInTheDocument();
    expect(screen.queryByText("Barbell Squats")).not.toBeInTheDocument();
    cleanup();

    render(<TrainingPlanCards clientId="c-002" />);
    expect(screen.getByText("Barbell Squats")).toBeInTheDocument();
    expect(screen.queryByText("Incline Dumbbell Press")).not.toBeInTheDocument();
    cleanup();

    render(<SupplementChecklist clientId="c-no-supplements" />);
    expect(screen.getByText("No supplement protocol assigned yet.")).toBeInTheDocument();
    expect(screen.queryByText("Omega-3 Fish Oil")).not.toBeInTheDocument();
    cleanup();

    render(<SupplementChecklist clientId="c-001" />);
    expect(screen.getByText("Omega-3 Fish Oil")).toBeInTheDocument();
    cleanup();

    render(<SupplementChecklist clientId="c-002" />);
    expect(screen.getByText("Optimize Free T3/T4 conversion")).toBeInTheDocument();
    expect(screen.queryByText("Omega-3 Fish Oil")).not.toBeInTheDocument();

    expect(getClientTrainingPlan("c-001")?.programName).toBe("Bio-Performance Hypertrophy");
    expect(getClientTrainingPlan("c-002")?.programName).toBe("Metabolic Conditioning & Strength");
    expect(getClientSupplementProtocol("c-001")?.items.map((i) => i.name)).toContain("Thyroid Complex (Iodine/Selenium)");
    expect(getClientSupplementProtocol("c-002")?.items.map((i) => i.name)).toEqual(["Vitamin D3 + K2", "Magnesium Glycinate"]);
  });

  it("persists training and supplement toggles while keeping compliance bounded", () => {
    const date = today();
    const beforeExercise = getClientExerciseLogs("c-001", date).find((l) => l.exerciseName === "Incline Dumbbell Press");

    actions.toggleExerciseSet("c-001", "Incline Dumbbell Press", 2);
    const afterExercise = getClientExerciseLogs("c-001", date).find((l) => l.exerciseName === "Incline Dumbbell Press");
    expect(afterExercise?.completedSets[2]).toBe(!beforeExercise?.completedSets[2]);

    actions.toggleExerciseSet("c-001", "Incline Dumbbell Press", 2);
    actions.toggleExerciseSet("c-001", "Incline Dumbbell Press", 2);
    const exerciseLogs = getClientExerciseLogs("c-001", date).filter((l) => l.exerciseName === "Incline Dumbbell Press");
    expect(exerciseLogs).toHaveLength(1);

    const beforeSupplement = getClientSupplementLogs("c-001", date).find((l) => l.supplementName === "Magnesium Glycinate");
    actions.toggleSupplement("c-001", "Magnesium Glycinate");
    const afterSupplement = getClientSupplementLogs("c-001", date).find((l) => l.supplementName === "Magnesium Glycinate");
    expect(afterSupplement?.completed).toBe(!beforeSupplement?.completed);

    actions.toggleSupplement("c-001", "Magnesium Glycinate");
    actions.toggleSupplement("c-001", "Magnesium Glycinate");
    const supplementLogs = getClientSupplementLogs("c-001", date).filter((l) => l.supplementName === "Magnesium Glycinate");
    expect(supplementLogs).toHaveLength(1);

    const client = getClient("c-001");
    expect(client?.trainingCompliance).toBeGreaterThanOrEqual(0);
    expect(client?.trainingCompliance).toBeLessThanOrEqual(100);
    expect(client?.nutritionCompliance).toBeGreaterThanOrEqual(0);
    expect(client?.nutritionCompliance).toBeLessThanOrEqual(100);
  });

  it("renders safe fallback states for invalid client routes and unknown routes", () => {
    render(
      <MemoryRouter initialEntries={["/client/not-real"]}>
        <Routes>
          <Route path="/client/:id" element={<ClientHome />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Client profile not found.")).toBeInTheDocument();
    cleanup();

    render(
      <MemoryRouter initialEntries={["/coach/clients/not-real"]}>
        <Routes>
          <Route path="/coach/clients/:id" element={<ClientProfile />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Athlete not found.")).toBeInTheDocument();
    cleanup();

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={["/missing"]}>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("Remediation R2 storage recovery", () => {
  beforeEach(() => {
    cleanup();
    vi.resetModules();
    localStorage.clear();
  });

  it("falls back safely from malformed persisted JSON", async () => {
    localStorage.setItem("mad-scientist-lab-state", "{broken");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = await import("@/data/store");

    expect(store.getClient("c-001")?.name).toBe("Marcus Reign");
    expect(store.getClientTrainingPlan("c-001")).toBeTruthy();
    errorSpy.mockRestore();
  });

  it("defaults missing arrays and normalizes legacy check-in fields", async () => {
    localStorage.setItem(
      "mad-scientist-lab-state",
      JSON.stringify({
        clients: [
          {
            id: "legacy-client",
            name: "Legacy Client",
            email: "legacy@example.com",
            avatarColor: "from-slate-400 to-slate-600",
            initials: "LC",
            goal: "Legacy migration",
            bodyWeightKg: 80,
            startedAt: "2026-01-01",
            status: "active",
            trainingCompliance: 0,
            nutritionCompliance: 0,
            nextCheckIn: "2026-06-01",
          },
        ],
        panels: [],
        checkIns: [
          {
            id: "legacy-checkin",
            clientId: "legacy-client",
            date: "2026-05-18",
            bodyWeightKg: 80,
            energyScore: 6,
            sleepQuality: 6,
            moodScore: 6,
            stressScore: 4,
            trainingAdherence: 70,
            nutritionAdherence: 75,
            digestionNotes: "Legacy digestion note",
            winsThisWeek: "Legacy win",
            strugglesThisWeek: "Legacy struggle",
            questionForCoach: "Legacy question",
          },
        ],
      })
    );

    const store = await import("@/data/store");
    const legacyCheckIn = store.getCheckInsForClient("legacy-client")[0];

    expect(store.getClient("legacy-client")?.name).toBe("Legacy Client");
    expect(store.getClientExerciseLogs("legacy-client", today())).toEqual([]);
    expect(store.getClientSupplementLogs("legacy-client", today())).toEqual([]);
    expect(store.getClientTrainingPlan("c-001")).toBeTruthy();
    expect(legacyCheckIn.weekKey).toMatch(/^2026-W/);
    expect(legacyCheckIn.status).toBe("reviewed");
    expect(legacyCheckIn.submittedAt).toBeTruthy();
  });
});
