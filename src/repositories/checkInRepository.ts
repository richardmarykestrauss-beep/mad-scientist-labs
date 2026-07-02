import type { CheckIn } from "@/lib/types";

export interface UserProfile {
  id: string;
  fullName: string | null;
  role: "client" | "coach" | "admin";
  status: string;
}

export interface CheckInReview {
  id: string;
  checkInId: string;
  coachId: string;
  feedback: string;
  reviewedAt: string;
}

export interface CheckInWithReview {
  checkIn: CheckIn;
  review?: CheckInReview;
}

export interface CheckInRepository {
  getCurrentUserProfile(): Promise<UserProfile | null>;
  listAssignedClients(): Promise<UserProfile[]>;
  listOwnCheckIns(): Promise<CheckInWithReview[]>;
  submitOwnCheckIn(input: Omit<CheckIn, "id" | "clientId" | "submittedAt" | "status" | "reviewedAt" | "reviewedBy" | "coachFeedback">): Promise<CheckIn>;
  listAssignedClientCheckIns(clientId: string): Promise<CheckInWithReview[]>;
  reviewAssignedCheckIn(input: { checkInId: string; feedback: string }): Promise<CheckInReview>;
}

// Global factory accessor
import { dataMode, type DataMode } from "@/lib/supabase";
import { localCheckInRepository } from "./localCheckInRepository";
import { supabaseCheckInRepository } from "./supabaseCheckInRepository";

export function getCheckInRepository(mode: DataMode = dataMode): CheckInRepository {
  if (mode === "supabase") {
    return supabaseCheckInRepository;
  }
  return localCheckInRepository;
}
