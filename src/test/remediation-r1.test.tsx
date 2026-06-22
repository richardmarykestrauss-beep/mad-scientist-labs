import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingPlanCards } from "@/components/client/TrainingPlanCards";
import { SupplementChecklist } from "@/components/client/SupplementChecklist";
import { CheckInSubmissionForm } from "@/components/client/CheckInSubmissionForm";
import { actions, getCheckInsForClient } from "@/data/store";
import { createId } from "@/lib/id";
import NotFound from "@/pages/NotFound";

const fillRequiredCheckInFields = () => {
  fireEvent.change(screen.getByLabelText("Current Body Weight (kg)"), { target: { value: "82.4" } });
  fireEvent.change(screen.getByLabelText("Digestion & Gut Health Notes"), { target: { value: "Recovery felt normal." } });
  fireEvent.change(screen.getByLabelText("Wins This Week"), { target: { value: "Completed every workout." } });
  fireEvent.change(screen.getByLabelText("Struggles & Bottlenecks"), { target: { value: "Sleep was inconsistent." } });
  fireEvent.change(screen.getByLabelText("Question for Coach"), { target: { value: "Should I change my rest days?" } });
};

describe("Remediation R1", () => {
  beforeEach(() => {
    localStorage.clear();
    actions.resetStore();
  });

  it("does not show c-001 training content for an unsupported client", () => {
    render(<TrainingPlanCards clientId="c-no-training" />);

    expect(screen.getByText("No training programme assigned yet.")).toBeInTheDocument();
    expect(screen.queryByText("Incline Dumbbell Press")).not.toBeInTheDocument();
  });

  it("does not show c-001 supplement content for an unsupported client", () => {
    render(<SupplementChecklist clientId="c-no-supplements" />);

    expect(screen.getByText("No supplement protocol assigned yet.")).toBeInTheDocument();
    expect(screen.queryByText("Omega-3 Fish Oil")).not.toBeInTheDocument();
  });

  it("blocks check-in submission when required reflections are missing", async () => {
    const clientId = actions.addClient("Demo Athlete", "demo.athlete@example.com", "Demo goal");
    const onSubmitSuccess = vi.fn();

    render(<CheckInSubmissionForm clientId={clientId} onSubmitSuccess={onSubmitSuccess} />);
    fireEvent.change(screen.getByLabelText("Current Body Weight (kg)"), { target: { value: "82.4" } });
    fireEvent.click(screen.getByRole("button", { name: /submit weekly check-in/i }));

    expect(await screen.findByText("Wins this week is required.")).toBeInTheDocument();
    expect(onSubmitSuccess).not.toHaveBeenCalled();
    expect(getCheckInsForClient(clientId)).toHaveLength(0);
  });

  it("blocks whitespace-only required reflections at the store layer", () => {
    const clientId = actions.addClient("Whitespace Athlete", "whitespace.athlete@example.com", "Demo goal");

    expect(() =>
      actions.submitCheckIn(clientId, 82.4, 7, 7, 7, 5, 90, 90, "   ", "Completed every workout.", "Sleep was inconsistent.", "No questions.")
    ).toThrow("Digestion and recovery reflection is required");
    expect(getCheckInsForClient(clientId)).toHaveLength(0);
  });

  it("submits a valid check-in with required reflections intact", async () => {
    const clientId = actions.addClient("Valid Athlete", "valid.athlete@example.com", "Demo goal");
    const onSubmitSuccess = vi.fn();

    render(<CheckInSubmissionForm clientId={clientId} onSubmitSuccess={onSubmitSuccess} />);
    fillRequiredCheckInFields();
    fireEvent.click(screen.getByRole("button", { name: /submit weekly check-in/i }));

    await waitFor(() => expect(onSubmitSuccess).toHaveBeenCalledTimes(1));
    const checkIns = getCheckInsForClient(clientId);
    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].winsThisWeek).toBe("Completed every workout.");
  });

  it("generates unique IDs rapidly", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId("probe")));
    expect(ids.size).toBe(1000);
  });

  it("does not emit the 404 console error when DEV is false", () => {
    vi.stubEnv("DEV", false);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/missing"]}>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});
