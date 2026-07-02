import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardCheck, BatteryCharging, Moon, Smile, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCheckInRepository } from "@/repositories/checkInRepository";
import type { CheckIn } from "@/lib/types";
import { dataMode } from "@/lib/supabase";
import { getCurrentWeekCheckIn } from "@/data/store";

interface Props {
  clientId: string;
  onSubmitSuccess?: () => void;
}

const repository = getCheckInRepository();

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error && error.code === "23505") {
    return "A check-in has already been submitted for this week.";
  }
  return error instanceof Error ? error.message : fallback;
}

function getWeekKey(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export function CheckInSubmissionForm({ clientId, onSubmitSuccess }: Props) {
  const [currentWeekCheckIn, setCurrentWeekCheckIn] = useState<CheckIn | null>(() => {
    if (dataMode !== "supabase") {
      return getCurrentWeekCheckIn(clientId);
    }
    return null;
  });
  const [loading, setLoading] = useState(dataMode === "supabase");

  const [weight, setWeight] = useState("");
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [mood, setMood] = useState(7);
  const [stress, setStress] = useState(5);
  const [training, setTraining] = useState(90);
  const [nutrition, setNutrition] = useState(90);
  const [digestion, setDigestion] = useState("");
  const [wins, setWins] = useState("");
  const [struggles, setStruggles] = useState("");
  const [question, setQuestion] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCurrentWeekCheckIn = useCallback(async () => {
    try {
      const list = await repository.listOwnCheckIns();
      const currentWeekKey = getWeekKey();
      const match = list.find((item) => item.checkIn.weekKey === currentWeekKey);
      if (match) {
        setCurrentWeekCheckIn({
          ...match.checkIn,
          coachFeedback: match.review?.feedback,
          reviewedAt: match.review?.reviewedAt,
          reviewedBy: match.review?.coachId
        });
      } else {
        setCurrentWeekCheckIn(null);
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to load check-ins."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dataMode === "supabase") {
      setCurrentWeekCheckIn(null);
      setLoading(true);
    }
    if (dataMode !== "supabase" && clientId) {
      localStorage.setItem("demo-session-user-id", clientId);
      localStorage.setItem("demo-session-role", "client");
    }
    fetchCurrentWeekCheckIn();
  }, [clientId, fetchCurrentWeekCheckIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Please enter a valid positive body weight");
      return;
    }

    const nextErrors: Record<string, string> = {};
    const trimmedDigestion = digestion.trim();
    const trimmedWins = wins.trim();
    const trimmedStruggles = struggles.trim();
    const trimmedQuestion = question.trim();

    if (!trimmedDigestion) nextErrors.digestion = "Digestion and recovery reflection is required.";
    if (!trimmedWins) nextErrors.wins = "Wins this week is required.";
    if (!trimmedStruggles) nextErrors.struggles = "Struggles and bottlenecks is required.";
    if (!trimmedQuestion) nextErrors.question = "Questions or concerns is required.";

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please complete all required reflections");
      return;
    }

    setSubmitting(true);
    try {
      await repository.submitOwnCheckIn({
        date: new Date().toISOString().slice(0, 10),
        bodyWeightKg: weightNum,
        energyScore: energy,
        sleepQuality: sleep,
        moodScore: mood,
        stressScore: stress,
        trainingAdherence: training,
        nutritionAdherence: nutrition,
        digestionNotes: trimmedDigestion,
        winsThisWeek: trimmedWins,
        strugglesThisWeek: trimmedStruggles,
        questionForCoach: trimmedQuestion
      });
      toast.success("Weekly check-in submitted successfully!");
      await fetchCurrentWeekCheckIn();
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to submit check-in."));
    } finally {
      setSubmitting(false);
    }
  };

  const getEnergyLabel = (val: number) => val <= 3 ? "Exhausted" : val <= 7 ? "Moderate" : "Elite";
  const getSleepLabel = (val: number) => val <= 3 ? "Restless" : val <= 7 ? "Restful" : "Deep";
  const getMoodLabel = (val: number) => val <= 3 ? "Suboptimal" : val <= 7 ? "Stable" : "Excellent";
  const getStressLabel = (val: number) => val <= 3 ? "Low" : val <= 7 ? "Moderate" : "Burnout";

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Checking submission status...</div>;
  }

  if (currentWeekCheckIn) {
    const isReviewed = currentWeekCheckIn.status === "reviewed";
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-10">
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 space-y-6 shadow-lg backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850/60 pb-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="font-display text-lg font-bold text-white">Check-in Submitted</h2>
            </div>
            <span className={cn(
              "text-[10px] font-bold border px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-center",
              isReviewed
                ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-400"
                : "border-amber-700/50 bg-amber-950/30 text-amber-400"
            )}>
              {isReviewed ? "Reviewed" : "Awaiting Coach Review"}
            </span>
          </div>

          <div className="text-xs text-zinc-450 font-mono">
            Submitted on: {currentWeekCheckIn.submittedAt ? new Date(currentWeekCheckIn.submittedAt).toLocaleString() : currentWeekCheckIn.date}
          </div>

          {isReviewed && currentWeekCheckIn.coachFeedback && (
            <div className="p-4 rounded-xl border border-emerald-900/30 bg-emerald-950/15 border-l-4 border-l-emerald-500/80 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                Coach Feedback (Warren Germishuizen)
              </div>
              <p className="text-sm leading-relaxed text-zinc-200">
                "{currentWeekCheckIn.coachFeedback}"
              </p>
              {currentWeekCheckIn.reviewedAt && (
                <div className="text-[10px] text-zinc-550 font-mono">
                  Reviewed on: {new Date(currentWeekCheckIn.reviewedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">Submitted Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-3">
                <span className="text-[9px] font-mono uppercase text-zinc-500">Weight</span>
                <div className="text-base font-bold text-white mt-0.5">{currentWeekCheckIn.bodyWeightKg} kg</div>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-3">
                <span className="text-[9px] font-mono uppercase text-zinc-500">Energy</span>
                <div className="text-base font-bold text-white mt-0.5">{currentWeekCheckIn.energyScore}/10</div>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-3">
                <span className="text-[9px] font-mono uppercase text-zinc-500">Sleep</span>
                <div className="text-base font-bold text-white mt-0.5">{currentWeekCheckIn.sleepQuality}/10</div>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-955/30 p-3">
                <span className="text-[9px] font-mono uppercase text-zinc-500">Mood</span>
                <div className="text-base font-bold text-white mt-0.5">{currentWeekCheckIn.moodScore}/10</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-3">
                <span className="text-[9px] font-mono uppercase text-zinc-500">Training Adherence</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{currentWeekCheckIn.trainingAdherence}%</div>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-3">
                <span className="text-[9px] font-mono uppercase text-zinc-500">Nutrition Adherence</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{currentWeekCheckIn.nutritionAdherence}%</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-zinc-850/60 pt-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">Reflection & Notes</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Digestion & Gut Health</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-955 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
                  {currentWeekCheckIn.digestionNotes}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Wins This Week</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-955 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
                  {currentWeekCheckIn.winsThisWeek}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Struggles & Bottlenecks</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-955 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
                  {currentWeekCheckIn.strugglesThisWeek}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Question for Coach</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-955 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
                  {currentWeekCheckIn.questionForCoach}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 space-y-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-zinc-850/60 pb-3">
          <ClipboardCheck className="h-5 w-5 text-zinc-400" />
          <h2 className="font-display text-lg font-bold text-white">Weekly Performance Reflection</h2>
        </div>
        <p className="text-xs text-zinc-550 leading-relaxed">
          Submit your check-in metrics. Your coach will review your bio-markers, bio-feedback, and adherence trends to update your protocol.
        </p>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">1. Biometrics & Bio-feedback</h3>
          
          <div className="space-y-1.5">
            <Label htmlFor="weight" className="text-zinc-300">Current Body Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => {
                const val = e.target.value;
                if (parseFloat(val) >= 0 || val === "") {
                  setWeight(val);
                }
              }}
              placeholder="e.g. 92.4"
              required
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-zinc-700 text-zinc-200"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><BatteryCharging className="h-3.5 w-3.5 text-zinc-400" /> Energy Level</span>
                <span className="font-sans text-zinc-200 font-bold text-xs">{energy}/10 <span className="text-zinc-500 text-[10px] ml-1">({getEnergyLabel(energy)})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><Moon className="h-3.5 w-3.5 text-zinc-400" /> Sleep Quality</span>
                <span className="font-sans text-zinc-200 font-bold text-xs">{sleep}/10 <span className="text-zinc-500 text-[10px] ml-1">({getSleepLabel(sleep)})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sleep}
                onChange={(e) => setSleep(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><Smile className="h-3.5 w-3.5 text-zinc-400" /> Mood / Well-being</span>
                <span className="font-sans text-zinc-200 font-bold text-xs">{mood}/10 <span className="text-zinc-500 text-[10px] ml-1">({getMoodLabel(mood)})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><AlertOctagon className="h-3.5 w-3.5 text-zinc-400" /> Stress Load</span>
                <span className="font-sans text-zinc-200 font-bold text-xs">{stress}/10 <span className="text-zinc-500 text-[10px] ml-1">({getStressLabel(stress)})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-zinc-850/60 pt-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">2. Adherence Metrics</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300">Training Consistency</span>
                <span className="font-sans text-emerald-400 font-bold">{training}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={training}
                onChange={(e) => setTraining(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300">Nutrition Adherence</span>
                <span className="font-sans text-emerald-400 font-bold">{nutrition}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={nutrition}
                onChange={(e) => setNutrition(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-zinc-850/60 pt-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">3. Reflection & Notes</h3>
          
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="digestion" className="text-zinc-300">Digestion & Gut Health Notes</Label>
              <Textarea
                id="digestion"
                rows={2}
                value={digestion}
                onChange={(e) => setDigestion(e.target.value)}
                placeholder="How was digestion, recovery, energy, gut health?"
                className={cn("bg-zinc-955 border-zinc-850 text-zinc-250 placeholder-zinc-600 focus-visible:ring-zinc-700", fieldErrors.digestion && "border-red-900/60")}
              />
              {fieldErrors.digestion && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.digestion}</span>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wins" className="text-zinc-300">Wins This Week</Label>
              <Textarea
                id="wins"
                rows={2}
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="What went well? Strength PRs, consistency gains?"
                className={cn("bg-zinc-955 border-zinc-850 text-zinc-250 placeholder-zinc-600 focus-visible:ring-zinc-700", fieldErrors.wins && "border-red-900/60")}
              />
              {fieldErrors.wins && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.wins}</span>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="struggles" className="text-zinc-300">Struggles & Bottlenecks</Label>
              <Textarea
                id="struggles"
                rows={2}
                value={struggles}
                onChange={(e) => setStruggles(e.target.value)}
                placeholder="Any struggles? Sleep, stress, meals missed?"
                className={cn("bg-zinc-955 border-zinc-850 text-zinc-250 placeholder-zinc-600 focus-visible:ring-zinc-700", fieldErrors.struggles && "border-red-900/60")}
              />
              {fieldErrors.struggles && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.struggles}</span>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="question" className="text-zinc-300">Question for Coach</Label>
              <Textarea
                id="question"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Questions about next week's protocol adjustments?"
                className={cn("bg-zinc-955 border-zinc-850 text-zinc-250 placeholder-zinc-600 focus-visible:ring-zinc-700", fieldErrors.question && "border-red-900/60")}
              />
              {fieldErrors.question && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.question}</span>}
            </div>
          </div>
        </div>

        <Button type="submit" variant="hero" disabled={submitting} className="w-full bg-zinc-100 hover:bg-white text-zinc-955 font-bold h-11 rounded-xl shadow-lg mt-2">
          {submitting ? "Submitting Weekly Check-in..." : "Submit Weekly Check-in"}
        </Button>
      </div>
    </form>
  );
}
