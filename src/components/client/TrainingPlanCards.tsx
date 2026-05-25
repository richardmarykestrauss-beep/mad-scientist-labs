import { useStore, actions, getClientExerciseLogs } from "@/data/store";
import { Dumbbell, ShieldAlert, Check, HelpCircle, Trophy } from "lucide-react";
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

function MuscleMap({ target }: { target: string }) {
  const muscles = [
    { name: "Delts", active: ["shoulders", "delts", "deltoids"].some(x => target.toLowerCase().includes(x)) },
    { name: "Chest", active: ["chest", "pectoral", "pecs"].some(x => target.toLowerCase().includes(x)) },
    { name: "Arms", active: ["arms", "triceps", "biceps", "tricep", "bicep"].some(x => target.toLowerCase().includes(x)) },
    { name: "Lats", active: ["lats", "back", "pullups"].some(x => target.toLowerCase().includes(x)) },
    { name: "Core", active: ["core", "abs", "abdomen", "plank"].some(x => target.toLowerCase().includes(x)) },
    { name: "Glutes", active: ["glutes", "butt"].some(x => target.toLowerCase().includes(x)) },
    { name: "Quads", active: ["quads", "thighs", "quadriceps", "squats"].some(x => target.toLowerCase().includes(x)) },
    { name: "Hams", active: ["hams", "hamstrings", "rdl"].some(x => target.toLowerCase().includes(x)) },
  ];

  return (
    <div className="grid grid-cols-4 gap-1 w-full max-w-[200px] bg-background/60 p-2 rounded-xl border border-border/40 font-mono text-[9px] text-center">
      {muscles.map((m) => (
        <div
          key={m.name}
          className={cn(
            "py-1 rounded border transition text-[8px]",
            m.active
              ? "bg-primary/20 border-primary text-primary font-bold shadow-glow"
              : "bg-secondary/20 border-border/20 text-muted-foreground"
          )}
        >
          {m.name}
        </div>
      ))}
    </div>
  );
}

export function TrainingPlanCards({ clientId }: Props) {
  // Subscribe to store updates
  useStore();
  const today = new Date().toISOString().slice(0, 10);
  const exercises = CLIENT_EXERCISES[clientId] || CLIENT_EXERCISES["c-001"];
  const logs = getClientExerciseLogs(clientId, today);

  // Calculate stats
  const exerciseStats = exercises.map((ex) => {
    const log = logs.find((l) => l.exerciseName === ex.name);
    const setsCompleted = log ? log.completedSets.filter(Boolean).length : 0;
    const isCompleted = setsCompleted === ex.sets;
    return { name: ex.name, setsCompleted, totalSets: ex.sets, isCompleted };
  });

  const completedCount = exerciseStats.filter((e) => e.isCompleted).length;
  const progressPct = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Progress Card */}
      <div className="lab-card-glow p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 grid place-items-center">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Today's Focus: Push & Posterior Pull</h3>
            <p className="text-xs text-muted-foreground">
              Mark off your training sets in real-time as you complete them.
            </p>
          </div>
        </div>
        <div className="space-y-1.5 min-w-[150px]">
          <div className="flex justify-between text-xs font-mono">
            <span>Exercises: {completedCount} / {exercises.length}</span>
            <span className="text-primary font-bold">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="grid md:grid-cols-2 gap-4">
        {exercises.map((ex) => {
          const log = logs.find((l) => l.exerciseName === ex.name);
          const completedSets = log ? log.completedSets : Array(ex.sets).fill(false);
          const isCompleted = completedSets.filter(Boolean).length === ex.sets;

          return (
            <div
              key={ex.name}
              className={cn(
                "lab-card-glow p-5 space-y-4 flex flex-col justify-between transition-colors border",
                isCompleted ? "border-primary/40 bg-primary/5" : "border-border"
              )}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-display text-base font-bold flex items-center gap-1.5">
                      {ex.name}
                      {isCompleted && (
                        <span className="h-5 w-5 rounded-full bg-primary/20 border border-primary/40 grid place-items-center">
                          <Trophy className="h-3 w-3 text-primary" />
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ex.equipment} · Target: <span className="text-foreground">{ex.muscle}</span>
                    </p>
                  </div>
                  <span className="chip font-mono text-[10px] uppercase">
                    {ex.sets}x{ex.reps}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 text-center text-[10px] font-mono border-y border-border/40">
                  <div>
                    <span className="text-muted-foreground block uppercase text-[8px]">Tempo</span>
                    <span className="text-foreground font-semibold">{ex.tempo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block uppercase text-[8px]">Rest</span>
                    <span className="text-foreground font-semibold">{ex.rest}</span>
                  </div>
                  <div className="flex justify-center items-center">
                    <MuscleMap target={ex.muscle} />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="rounded-lg bg-secondary/30 p-2.5 border border-border/20">
                    <span className="font-mono text-[9px] font-bold text-primary block uppercase tracking-wider">Coach Cue</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ex.cue}</p>
                  </div>
                  <div className="rounded-lg bg-destructive/5 p-2.5 border border-destructive/10 flex items-start gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-status-high shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono text-[9px] font-bold text-status-high block uppercase tracking-wider">Avoid Mistake</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{ex.mistake}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Set Tracker */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">Set Completion Tracker</span>
                <div className="flex flex-wrap gap-1.5">
                  {completedSets.map((completed, idx) => (
                    <button
                      key={idx}
                      onClick={() => actions.toggleExerciseSet(clientId, ex.name, idx)}
                      className={cn(
                        "flex-1 min-w-[65px] h-8 rounded-lg border text-xs font-mono transition flex items-center justify-center gap-1.5",
                        completed
                          ? "bg-primary/20 border-primary text-primary font-bold shadow-glow"
                          : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {completed ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Set {idx + 1}
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-3.5 w-3.5 opacity-40" /> Set {idx + 1}
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
