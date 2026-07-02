import type { CheckIn } from "@/lib/types";
import type { CheckInRepository, UserProfile, CheckInWithReview, CheckInReview } from "./checkInRepository";
import { getSupabaseClient } from "@/lib/supabase";

function getWeekKey(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export const supabaseCheckInRepository: CheckInRepository = {
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile, error: dbError } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError || !profile) return null;

    return {
      id: profile.id,
      fullName: profile.full_name,
      role: profile.role,
      status: profile.status
    };
  },

  async listOwnCheckIns(): Promise<CheckInWithReview[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase mode is not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await (supabase as any)
      .from("check_ins")
      .select("*, check_in_reviews(*)")
      .eq("client_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => {
      const reviewRow = row.check_in_reviews;
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
        status: reviewRow ? "reviewed" : "needs_review"
      };

      const review: CheckInReview | undefined = reviewRow ? {
        id: reviewRow.id,
        checkInId: reviewRow.check_in_id,
        coachId: reviewRow.coach_id,
        feedback: reviewRow.feedback,
        reviewedAt: reviewRow.reviewed_at
      } : undefined;

      return { checkIn, review };
    });
  },

  async submitOwnCheckIn(input: Omit<CheckIn, "id" | "clientId" | "submittedAt" | "status" | "reviewedAt" | "reviewedBy" | "coachFeedback">): Promise<CheckIn> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase mode is not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const weekKey = getWeekKey(input.date);

    const { data, error } = await (supabase as any)
      .from("check_ins")
      .insert({
        client_id: user.id,
        week_key: weekKey,
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
        questions: input.questionForCoach
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to retrieve inserted check-in data");

    return {
      id: data.id,
      clientId: data.client_id,
      date: data.submitted_at.slice(0, 10),
      bodyWeightKg: Number(data.weight),
      energyScore: data.energy,
      sleepQuality: data.sleep,
      moodScore: data.mood,
      stressScore: data.stress,
      trainingAdherence: data.training,
      nutritionAdherence: data.nutrition,
      digestionNotes: data.digestion,
      winsThisWeek: data.wins,
      strugglesThisWeek: data.struggles,
      questionForCoach: data.questions,
      submittedAt: data.submitted_at,
      weekKey: data.week_key,
      status: "needs_review"
    };
  },

  async listAssignedClientCheckIns(clientId: string): Promise<CheckInWithReview[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase mode is not configured");

    const { data, error } = await (supabase as any)
      .from("check_ins")
      .select("*, check_in_reviews(*)")
      .eq("client_id", clientId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => {
      const reviewRow = row.check_in_reviews;
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
        status: reviewRow ? "reviewed" : "needs_review"
      };

      const review: CheckInReview | undefined = reviewRow ? {
        id: reviewRow.id,
        checkInId: reviewRow.check_in_id,
        coachId: reviewRow.coach_id,
        feedback: reviewRow.feedback,
        reviewedAt: reviewRow.reviewed_at
      } : undefined;

      return { checkIn, review };
    });
  },

  async reviewAssignedCheckIn(input: { checkInId: string; feedback: string }): Promise<CheckInReview> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase mode is not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await (supabase as any)
      .from("check_in_reviews")
      .insert({
        check_in_id: input.checkInId,
        coach_id: user.id,
        feedback: input.feedback
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to retrieve inserted review data");

    return {
      id: data.id,
      checkInId: data.check_in_id,
      coachId: data.coach_id,
      feedback: data.feedback,
      reviewedAt: data.reviewed_at
    };
  }
};
