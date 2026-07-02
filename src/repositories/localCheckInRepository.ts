import type { CheckIn, Client } from "@/lib/types";
import type { CheckInRepository, UserProfile, CheckInWithReview, CheckInReview } from "./checkInRepository";
import { actions } from "@/data/store";

export const localCheckInRepository: CheckInRepository = {
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const role = localStorage.getItem("demo-session-role") || "client";
    const userId = localStorage.getItem("demo-session-user-id") || (role === "coach" ? "coach-1" : "c-001");
    
    if (role === "coach") {
      return {
        id: userId,
        fullName: "Warren Germishuizen",
        role: "coach",
        status: "active"
      };
    } else {
      return {
        id: userId,
        fullName: "Marcus Reign",
        role: "client",
        status: "active"
      };
    }
  },

  async listOwnCheckIns(): Promise<CheckInWithReview[]> {
    const profile = await this.getCurrentUserProfile();
    if (!profile) return [];
    
    const state = (window as any).__madScientistState || JSON.parse(localStorage.getItem("mad-scientist-lab-state") || "{}");
    const checkIns: CheckIn[] = state.checkIns || [];
    
    return checkIns
      .filter((c) => c.clientId === profile.id)
      .map((c) => {
        const review: CheckInReview | undefined = c.coachFeedback ? {
          id: `rev-${c.id}`,
          checkInId: c.id,
          coachId: c.reviewedBy || "coach-1",
          feedback: c.coachFeedback,
          reviewedAt: c.reviewedAt || new Date().toISOString()
        } : undefined;
        return { checkIn: c, review };
      });
  },

  async submitOwnCheckIn(input: Omit<CheckIn, "id" | "clientId" | "submittedAt" | "status" | "reviewedAt" | "reviewedBy" | "coachFeedback">): Promise<CheckIn> {
    const profile = await this.getCurrentUserProfile();
    if (!profile || profile.role !== "client") {
      throw new Error("Only clients can submit check-ins");
    }

    const checkIn = actions.submitCheckIn(
      profile.id,
      input.bodyWeightKg,
      input.energyScore,
      input.sleepQuality,
      input.moodScore,
      input.stressScore,
      input.trainingAdherence,
      input.nutritionAdherence,
      input.digestionNotes,
      input.winsThisWeek,
      input.strugglesThisWeek,
      input.questionForCoach
    );
    return checkIn;
  },

  async listAssignedClientCheckIns(clientId: string): Promise<CheckInWithReview[]> {
    const profile = await this.getCurrentUserProfile();
    if (!profile || profile.role !== "coach") {
      throw new Error("Access denied: only coaches can view client check-ins");
    }

    const state = JSON.parse(localStorage.getItem("mad-scientist-lab-state") || "{}");
    const checkIns: CheckIn[] = state.checkIns || [];
    
    return checkIns
      .filter((c) => c.clientId === clientId)
      .map((c) => {
        const review: CheckInReview | undefined = c.coachFeedback ? {
          id: `rev-${c.id}`,
          checkInId: c.id,
          coachId: c.reviewedBy || "coach-1",
          feedback: c.coachFeedback,
          reviewedAt: c.reviewedAt || new Date().toISOString()
        } : undefined;
        return { checkIn: c, review };
      });
  },

  async reviewAssignedCheckIn(input: { checkInId: string; feedback: string }): Promise<CheckInReview> {
    const profile = await this.getCurrentUserProfile();
    if (!profile || profile.role !== "coach") {
      throw new Error("Access denied: only coaches can review check-ins");
    }

    actions.reviewCheckIn(input.checkInId, input.feedback, profile.id);

    return {
      id: `rev-${input.checkInId}`,
      checkInId: input.checkInId,
      coachId: profile.id,
      feedback: input.feedback,
      reviewedAt: new Date().toISOString()
    };
  }
};
