import type { CheckIn } from "@/lib/types";
import type { Database } from "@/lib/database.types";
import type { CheckInRepository, UserProfile, CheckInWithReview, CheckInReview } from "./checkInRepository";
import { getSupabaseClient } from "@/lib/supabase";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type CheckInRow = Database["public"]["Tables"]["check_ins"]["Row"];
type ReviewRow = Database["public"]["Tables"]["check_in_reviews"]["Row"];

function getWeekKey(dateStr?: string): string {
  const date = dateStr ? new Date(`${dateStr}T12:00:00Z`) : new Date();
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

function toProfile(row: ProfileRow): UserProfile {
  return { id: row.id, fullName: row.full_name, role: row.role, status: row.status };
}

function toReview(row: ReviewRow): CheckInReview {
  return {
    id: row.id,
    checkInId: row.check_in_id,
    coachId: row.coach_id,
    feedback: row.feedback,
    reviewedAt: row.reviewed_at,
  };
}

function toCheckIn(row: CheckInRow, review?: ReviewRow): CheckInWithReview {
  const checkIn: CheckIn = {
    id: row.id,
    clientId: row.client_id,
    date: row.submitted_at.slice(0, 10),
    bodyWeightKg: Number(row.weight),
    energyScore: row.energy,
    sleepQuality: row.sleep,
    moodScore: row.mood,
    stressScore: row.stress,
    trainingAdherence: row.training,
    nutritionAdherence: row.nutrition,
    digestionNotes: row.digestion,
    winsThisWeek: row.wins,
    strugglesThisWeek: row.struggles,
    questionForCoach: row.questions,
    submittedAt: row.submitted_at,
    weekKey: row.week_key,
    status: review ? "reviewed" : "needs_review",
  };
  return { checkIn, review: review ? toReview(review) : undefined };
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase mode is not configured.");
  return client;
}

async function getAuthenticatedUser() {
  const supabase = requireClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not authenticated.");
  return { supabase, user };
}

async function attachReviews(rows: CheckInRow[]): Promise<CheckInWithReview[]> {
  if (rows.length === 0) return [];
  const supabase = requireClient();
  const { data: reviews, error } = await supabase
    .from("check_in_reviews")
    .select("*")
    .in("check_in_id", rows.map((row) => row.id));
  if (error) throw error;
  const byCheckIn = new Map((reviews ?? []).map((review) => [review.check_in_id, review]));
  return rows.map((row) => toCheckIn(row, byCheckIn.get(row.id)));
}

export const supabaseCheckInRepository: CheckInRepository = {
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const { supabase, user } = await getAuthenticatedUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? toProfile(data) : null;
  },

  async listAssignedClients(): Promise<UserProfile[]> {
    const { supabase } = await getAuthenticatedUser();
    const { data: assignments, error: assignmentError } = await supabase
      .from("coach_client_assignments")
      .select("client_id")
      .eq("status", "active");
    if (assignmentError) throw assignmentError;
    const clientIds = (assignments ?? []).map((row) => row.client_id);
    if (clientIds.length === 0) return [];
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", clientIds)
      .eq("role", "client")
      .eq("status", "active");
    if (profileError) throw profileError;
    return (profiles ?? []).map(toProfile);
  },

  async listOwnCheckIns(): Promise<CheckInWithReview[]> {
    const { supabase, user } = await getAuthenticatedUser();
    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("client_id", user.id)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return attachReviews(data ?? []);
  },

  async submitOwnCheckIn(input): Promise<CheckIn> {
    const { supabase, user } = await getAuthenticatedUser();
    const { data, error } = await supabase
      .from("check_ins")
      .insert({
        client_id: user.id,
        week_key: getWeekKey(input.date),
        weight: input.bodyWeightKg,
        energy: input.energyScore,
        sleep: input.sleepQuality,
        mood: input.moodScore,
        stress: input.stressScore,
        training: input.trainingAdherence,
        nutrition: input.nutritionAdherence,
        digestion: input.digestionNotes,
        wins: input.winsThisWeek,
        struggles: input.strugglesThisWeek,
        questions: input.questionForCoach,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toCheckIn(data).checkIn;
  },

  async listAssignedClientCheckIns(clientId: string): Promise<CheckInWithReview[]> {
    const { supabase } = await getAuthenticatedUser();
    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("client_id", clientId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return attachReviews(data ?? []);
  },

  async reviewAssignedCheckIn(input): Promise<CheckInReview> {
    const { supabase, user } = await getAuthenticatedUser();
    const feedback = input.feedback.trim();
    if (!feedback) throw new Error("Feedback is required.");
    const { data, error } = await supabase
      .from("check_in_reviews")
      .insert({ check_in_id: input.checkInId, coach_id: user.id, feedback })
      .select("*")
      .single();
    if (error) throw error;
    return toReview(data);
  },
};
