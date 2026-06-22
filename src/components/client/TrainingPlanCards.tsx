import { useState, useEffect } from "react";
import { useStore, actions, getClientExerciseLogs } from "@/data/store";
import { Dumbbell, ShieldAlert, Check, HelpCircle, Trophy, Clock, RotateCcw, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
}

interface Exercise {
  name: string;
  muscle: string;
  equipment: string;
  sets: number;
  reps: string;
  tempo: string;
  rest: string;
  cue: string;
  mistake: string;
}

const CLIENT_EXERCISES: Record<string, Exercise[]> = {
  "c-001": [
    { name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbells, Bench", sets: 4, reps: "8-10", tempo: "3110", rest: "120s", cue: "Drive shoulders back into bench, lead with elbows.", mistake: "Bouncing weights or flaring elbows 90 degrees." },
    { name: "Weighted Pull-ups", muscle: "Lats", equipment: "Pull-up Bar, Belt", sets: 4, reps: "6-8", tempo: "2011", rest: "90s", cue: "Pull through your elbows, squeeze lats at the top.", mistake: "Using momentum or not reaching full extension." },
    { name: "Romanian Deadlifts (RDL)", muscle: "Hams", equipment: "Barbell", sets: 3, reps: "10-12", tempo: "3010", rest: "90s", cue: "Hinge at the hips, push your glutes back.", mistake: "Rounding the lower back or squatting the weight down." },
    { name: "Lateral Raises", muscle: "Delts", equipment: "Dumbbells", sets: 4, reps: "12-15", tempo: "2011", rest: "60s", cue: "Lead with pinkies, keep shoulders down.", mistake: "Shrugging the shoulders or swinging using the torso." },
    { name: "Cambered Bar Skull Crushers", muscle: "Arms", equipment: "EZ Bar, Bench", sets: 3, reps: "12-15", tempo: "3010", rest: "75s", cue: "Keep elbows parallel, bend only at the elbow joint.", mistake: "Flaring elbows outward or letting elbows travel forward." }
  ],
  "c-002": [
    { name: "Barbell Squats", muscle: "Quads", equipment: "Barbell, Squat Rack", sets: 4, reps: "8-10", tempo: "3110", rest: "150s", cue: "Push knees outward, keep chest tall and sit between hips.", mistake: "Letting knees collapse inward or heels lift off ground." },
    { name: "EZ Bar Bicep Curls", muscle: "Arms", equipment: "EZ Bar", sets: 3, reps: "10-12", tempo: "2110", rest: "75s", cue: "Pin elbows to ribs, squeeze biceps hard at the peak.", mistake: "Swinging the back or letting elbows slide forward." },
    { name: "Leg Extensions", muscle: "Quads", equipment: "Leg Extension Machine", sets: 3, reps: "12-15", tempo: "2011", rest: "60s", cue: "Hold handles tight, lock out knees and pause at extension.", mistake: "Kicking the weight up with momentum instead of squeezing." },
    { name: "Face Pulls", muscle: "Delts", equipment: "Cable, Rope Attachment", sets: 4, reps: "15", tempo: "2012", rest: "60s", cue: "Pull rope towards ears, separate hands and squeeze rear delts.", mistake: "Pulling to the chin or using excessive body swing." }
  ]
};

// Mock previous performance logs for UI completeness
const MOCK_PREVIOUS_PERFORMANCE: Record<string, string> = {
  "Incline Dumbbell Press": "Prev: 4 sets x 10 reps @ 36kg",
  "Weighted Pull-ups": "Prev: 4 sets x 8 reps @ +15kg",
  "Romanian Deadlifts (RDL)": "Prev: 3 sets x 12 reps @ 100kg",
  "Lateral Raises": "Prev: 4 sets x 15 reps @ 12kg",
  "Cambered Bar Skull Crushers": "Prev: 3 sets x 15 reps @ 27.5kg",
  "Barbell Squats": "Prev: 4 sets x 10 reps @ 90kg",
  "EZ Bar Bicep Curls": "Prev: 3 sets x 12 reps @ 30kg",
  "Leg Extensions": "Prev: 3 sets x 15 reps @ 65kg",
  "Face Pulls": "Prev: 4 sets x 15 reps @ 22.5kg"
};

function MuscleMap({ target }: { target: string }) {
  return (
    <span className="text-[9px] font-bold bg-zinc-950/60 border border-zinc-850/60 text-zinc-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
      {target}
    </span>
  );
}

export function TrainingPlanCards({ clientId }: Props) {
  // Subscribe to store updates
  useStore();
  const today = new Date().toISOString().slice(0, 10);
  const exercises = CLIENT_EXERCISES[clientId] ?? [];
  const logs = getClientExerciseLogs(clientId, today);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerTotal, setTimerTotal] = useState<number>(0);

  useEffect(() => {
    if (timerSeconds === null || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const startRestTimer = (secondsStr: string) => {
    const parsed = parseInt(secondsStr);
    const targetSeconds = isNaN(parsed) ? 90 : parsed;
    setTimerTotal(targetSeconds);
    setTimerSeconds(targetSeconds);
  };

  const resetRestTimer = () => {
    setTimerSeconds(null);
  };

  // Calculate stats
  const exerciseStats = exercises.map((ex) => {
    const log = logs.find((l) => l.exerciseName === ex.name);
    const setsCompleted = log ? log.completedSets.filter(Boolean).length : 0;
    const isCompleted = setsCompleted === ex.sets;
    return { name: ex.name, setsCompleted, totalSets: ex.sets, isCompleted };
  });

  const completedCount = exerciseStats.filter((e) => e.isCompleted).length;
  const progressPct = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;
  const totalSetsExpected = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalSetsCompleted = exerciseStats.reduce((sum, ex) => sum + ex.setsCompleted, 0);

  if (exercises.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-8 text-center shadow-lg">
        <Dumbbell className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
        <h3 className="font-display text-base font-bold text-zinc-200">No training programme assigned yet.</h3>
        <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto">
          Your coach has not published a training programme for this athlete profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rest Timer Widget */}
      {timerSeconds !== null && (
        <div className="sticky top-20 z-40 bg-zinc-900/90 backdrop-blur-md border border-zinc-850 p-3.5 rounded-2xl flex items-center justify-between shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <Clock className="h-4.5 w-4.5 text-zinc-400 animate-pulse" />
            <div>
              <span className="text-[9px] font-sans font-medium uppercase tracking-wide text-zinc-550">Rest Timer Active</span>
              <div className="font-mono text-base font-bold text-white leading-none mt-0.5">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
          <div className="w-24 bg-zinc-950 h-1.5 rounded-full overflow-hidden mx-4 hidden sm:block">
            <div
              className="h-full bg-emerald-600/80 transition-all duration-1000"
              style={{ width: `${(timerSeconds / timerTotal) * 100}%` }}
            />
          </div>
          <button            onClick={resetRestTimer}
            className="flex items-center gap-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-sans transition"
          >
            <RotateCcw className="h-3 w-3" /> Skip
          </button>
        </div>
      )}

      {/* Today's Workout Hero / Progress Overview */}
      <div className="rounded-2xl border border-zinc-850 bg-gradient-to-b from-zinc-900/40 to-zinc-950/60 p-5 space-y-4 shadow-lg">
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-[10px] font-sans bg-zinc-900 text-zinc-350 border border-zinc-850 px-2.5 py-0.5 rounded-full uppercase font-medium">
              Day 1: Pull & Recovery Focus
            </span>
            <h3 className="font-display text-xl font-bold text-white mt-2.5">Hypertrophy Plan</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Target completion: 45-60 min session. Rest fully between sets.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-sans text-zinc-500">Est. Duration</span>
            <div className="text-xs font-semibold text-zinc-350 mt-0.5">50 mins</div>
          </div>
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-zinc-850/60 pt-3.5">
          <div className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-900/60">
            <span className="text-[10px] font-sans text-zinc-500 block">Exercises Completed</span>
            <span className="font-semibold text-zinc-200 mt-1 block">{completedCount} / {exercises.length}</span>
          </div>
          <div className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-900/60">
            <span className="text-[10px] font-sans text-zinc-500 block">Total Sets Completed</span>
            <span className="font-semibold text-zinc-200 mt-1 block">{totalSetsCompleted} / {totalSetsExpected}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-zinc-950/20 p-3 rounded-xl border border-zinc-900/60 flex flex-col justify-center">
            <div className="flex justify-between text-[10px] font-sans text-zinc-500 mb-1">
              <span>PROGRESS</span>
              <span className="text-emerald-500 font-semibold">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
              <div 
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {exercises.map((ex) => {
          const log = logs.find((l) => l.exerciseName === ex.name);
          const completedSets = log ? log.completedSets : Array(ex.sets).fill(false);
          const setsDone = completedSets.filter(Boolean).length;
          
          let statusText = "Pending";
          let statusColor = "bg-zinc-900/30 text-zinc-550 border-zinc-850/60";
          if (setsDone === ex.sets) {
            statusText = "Complete";
            statusColor = "bg-emerald-700/10 text-emerald-500 border-emerald-700/20";
          } else if (setsDone > 0) {
            statusText = "In Progress";
            statusColor = "bg-amber-700/10 text-amber-500 border-amber-700/20";
          }

          return (
            <div
              key={ex.name}
              className={cn(
                "rounded-2xl border bg-zinc-900/20 p-5 space-y-4 hover:border-zinc-800 transition-all shadow-md",
                setsDone === ex.sets ? "border-emerald-700/20" : "border-zinc-850/80"
              )}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display text-sm font-bold text-white leading-tight">
                      {ex.name}
                    </h4>
                    {setsDone === ex.sets && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {ex.equipment} · Target: <span className="text-zinc-300">{ex.muscle}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={cn("text-[9px] font-sans font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider", statusColor)}>
                    {statusText}
                  </span>
                  <span className="font-sans text-[10px] text-zinc-400 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded-lg">
                    {ex.sets}x{ex.reps}
                  </span>
                </div>
              </div>

              {/* Specifications Sub-Grid */}
              <div className="grid grid-cols-3 gap-2 py-2.5 text-center text-[11px] font-sans border-y border-zinc-850/60">
                <div>
                  <span className="text-zinc-500 block text-[9px]">Tempo</span>
                  <span className="text-zinc-300 font-semibold">{ex.tempo}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">Rest Target</span>
                  <span className="text-zinc-300 font-semibold flex items-center justify-center gap-1">
                    {ex.rest} 
                    <button 
                      onClick={() => startRestTimer(ex.rest)}
                      className="p-0.5 hover:bg-zinc-850 rounded text-emerald-500 transition"
                    >
                      <Play className="h-2.5 w-2.5" />
                    </button>
                  </span>
                </div>
                <div className="flex justify-center items-center">
                  <MuscleMap target={ex.muscle} />
                </div>
              </div>

              {/* Coaching Tips & Avoid Mistakes */}
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-850/60">
                  <span className="font-sans text-[10px] font-semibold text-emerald-600 block uppercase tracking-wider">Coach Cue</span>
                  <p className="text-[10.5px] text-zinc-400 mt-1">{ex.cue}</p>
                </div>
                <div className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-850/60">
                  <span className="font-sans text-[10px] font-semibold text-amber-600/90 block uppercase tracking-wider">Avoid Mistake</span>
                  <p className="text-[10.5px] text-zinc-400 mt-1">{ex.mistake}</p>
                </div>
              </div>

              {/* Previous Performance & Set Logging Row */}
              <div className="pt-1.5 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-sans tracking-normal">
                  <span className="text-zinc-550">Execution Logger</span>
                  <span className="text-zinc-500 font-mono-data text-[9.5px]">
                    {MOCK_PREVIOUS_PERFORMANCE[ex.name] || "Prev: No logged session"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {completedSets.map((completed, idx) => (
                    <button
                      key={idx}
                      onClick={() => actions.toggleExerciseSet(clientId, ex.name, idx)}
                      className={cn(
                        "flex-1 min-w-[75px] h-10 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5",
                        completed
                          ? "bg-emerald-700/20 border-emerald-700/30 text-emerald-450 shadow-sm"
                          : "border-zinc-850 bg-zinc-900/10 text-zinc-450 hover:bg-zinc-900/30 hover:text-zinc-200"
                      )}
                    >
                      {completed ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Set {idx + 1}
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-3.5 w-3.5 opacity-30" /> Set {idx + 1}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
