import { useState } from "react";
import { actions, useStore, getCurrentWeekCheckIn } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardCheck, Sparkles, Smile, BatteryCharging, Moon, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
  onSubmitSuccess?: () => void;
}

export function CheckInSubmissionForm({ clientId, onSubmitSuccess }: Props) {
  useStore();
  const currentWeekCheckIn = getCurrentWeekCheckIn(clientId);

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
      await actions.submitCheckIn(
        clientId,
        weightNum,
        energy,
        sleep,
        mood,
        stress,
        training,
        nutrition,
        trimmedDigestion,
        trimmedWins,
        trimmedStruggles,
        trimmedQuestion
      );
      toast.success("Weekly check-in submitted successfully!");
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to submit check-in");
    } finally {
      setSubmitting(false);
    }
  };

  // Midpoint contexts
  const getEnergyLabel = (val: number) => val <= 3 ? "Exhausted" : val <= 7 ? "Moderate" : "Elite";
  const getSleepLabel = (val: number) => val <= 3 ? "Restless" : val <= 7 ? "Restful" : "Deep";
  const getMoodLabel = (val: number) => val <= 3 ? "Suboptimal" : val <= 7 ? "Stable" : "Excellent";
  const getStressLabel = (val: number) => val <= 3 ? "Low" : val <= 7 ? "Moderate" : "Burnout";

  if (currentWeekCheckIn) {
    const isReviewed = currentWeekCheckIn.status === "reviewed";
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-10">
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 space-y-6 shadow-lg backdrop-blur-md">
          {/* Header with Status */}
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

          {/* Coach Feedback Area if Reviewed */}
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

          {/* Metrics summary */}
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
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-3">
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

          {/* Reflections Summary */}
          <div className="space-y-4 border-t border-zinc-850/60 pt-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">Reflection & Notes</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Digestion & Gut Health</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
                  {currentWeekCheckIn.digestionNotes}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Wins This Week</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
                  {currentWeekCheckIn.winsThisWeek}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Struggles & Bottlenecks</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
                  {currentWeekCheckIn.strugglesThisWeek}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-400">Question for Coach</span>
                <p className="text-xs text-zinc-200 mt-1 bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed">
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

        {/* Step 1: Weight & Biofeedback */}
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
            {/* Energy Slider */}
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
                className="w-full accent-zinc-100 bg-zinc-855 h-1 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-550">
                <span>Exhausted</span>
                <span>Moderate</span>
                <span>Elite</span>
              </div>
            </div>

            {/* Sleep Slider */}
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
                className="w-full accent-zinc-100 bg-zinc-855 h-1 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-550">
                <span>Restless</span>
                <span>Restful</span>
                <span>Deep</span>
              </div>
            </div>

            {/* Mood Slider */}
            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><Smile className="h-3.5 w-3.5 text-zinc-400" /> Mood & Focus</span>
                <span className="font-sans text-zinc-200 font-bold text-xs">{mood}/10 <span className="text-zinc-500 text-[10px] ml-1">({getMoodLabel(mood)})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full accent-zinc-100 bg-zinc-855 h-1 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-550">
                <span>Suboptimal</span>
                <span>Stable</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Stress Slider */}
            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><AlertOctagon className="h-3.5 w-3.5 text-zinc-400" /> Stress Perception</span>
                <span className="font-sans text-zinc-200 font-bold text-xs">{stress}/10 <span className="text-zinc-500 text-[10px] ml-1">({getStressLabel(stress)})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full accent-zinc-100 bg-zinc-855 h-1 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-550">
                <span>Low</span>
                <span>Moderate</span>
                <span>Burnout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Adherence */}
        <div className="space-y-4 pt-4 border-t border-zinc-850/60">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">2. Weekly Adherence Rates</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-medium">Training Compliance</span>
                <span className="font-sans text-emerald-500 font-semibold text-xs">{training}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={training}
                onChange={(e) => setTraining(parseInt(e.target.value))}
                className="w-full accent-emerald-650 bg-zinc-850 h-1 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-medium">Nutrition Compliance</span>
                <span className="font-sans text-emerald-500 font-semibold text-xs">{nutrition}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={nutrition}
                onChange={(e) => setNutrition(parseInt(e.target.value))}
                className="w-full accent-emerald-655 bg-zinc-850 h-1 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Reflections */}
        <div className="space-y-4 pt-4 border-t border-zinc-855/60">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">3. Digest & Reflection</h3>
          
          <div className="space-y-1.5">
            <Label htmlFor="digestion" className="text-zinc-350">Digestion & Gut Health Notes</Label>
            <Textarea
              id="digestion"
              value={digestion}
              onChange={(e) => {
                setDigestion(e.target.value);
                if (fieldErrors.digestion) setFieldErrors((prev) => ({ ...prev, digestion: "" }));
              }}
              aria-invalid={!!fieldErrors.digestion}
              aria-describedby={fieldErrors.digestion ? "digestion-error" : undefined}
              placeholder="e.g. Any bloating, stools frequency, indigestion issues..."
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-zinc-700 text-zinc-200 min-h-[70px] rounded-xl"
            />
            {fieldErrors.digestion && <p id="digestion-error" className="text-[11px] text-amber-400">{fieldErrors.digestion}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wins" className="text-zinc-350">Wins This Week</Label>
            <Textarea
              id="wins"
              value={wins}
              onChange={(e) => {
                setWins(e.target.value);
                if (fieldErrors.wins) setFieldErrors((prev) => ({ ...prev, wins: "" }));
              }}
              aria-invalid={!!fieldErrors.wins}
              aria-describedby={fieldErrors.wins ? "wins-error" : undefined}
              placeholder="What went well? Energy, lifts, consistency..."
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-zinc-700 text-zinc-200 min-h-[70px] rounded-xl"
            />
            {fieldErrors.wins && <p id="wins-error" className="text-[11px] text-amber-400">{fieldErrors.wins}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="struggles" className="text-zinc-350">Struggles & Bottlenecks</Label>
            <Textarea
              id="struggles"
              value={struggles}
              onChange={(e) => {
                setStruggles(e.target.value);
                if (fieldErrors.struggles) setFieldErrors((prev) => ({ ...prev, struggles: "" }));
              }}
              aria-invalid={!!fieldErrors.struggles}
              aria-describedby={fieldErrors.struggles ? "struggles-error" : undefined}
              placeholder="What did you struggle with? Sleep bottlenecks, skipped sessions, stress..."
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-zinc-700 text-zinc-200 min-h-[70px] rounded-xl"
            />
            {fieldErrors.struggles && <p id="struggles-error" className="text-[11px] text-amber-400">{fieldErrors.struggles}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="question" className="text-zinc-350">Question for Coach</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (fieldErrors.question) setFieldErrors((prev) => ({ ...prev, question: "" }));
              }}
              aria-invalid={!!fieldErrors.question}
              aria-describedby={fieldErrors.question ? "question-error" : undefined}
              placeholder="Anything specific you'd like your coach to answer?"
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-zinc-700 text-zinc-200 min-h-[70px] rounded-xl"
            />
            {fieldErrors.question && <p id="question-error" className="text-[11px] text-amber-400">{fieldErrors.question}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-855/60 flex justify-end">
          <Button 
            type="submit" 
            className="w-full sm:w-auto font-bold rounded-xl text-xs h-10 px-5 bg-zinc-100 hover:bg-white text-zinc-950 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" /> Submit Weekly Check-in
          </Button>
        </div>
      </div>
    </form>
  );
}
