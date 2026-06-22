// src/components/coach/TrainingPlanPanel.tsx
import { useState, useEffect, useMemo } from "react";
import { actions, getClientTrainingPlan, getMasterExercises } from "@/data/store";
import type { TrainingPlan, TrainingDay, TrainingPlanExercise, Exercise, MuscleGroup, EquipmentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createId } from "@/lib/id";
import { Edit, Save, X, Search, Plus, Trash2, ShieldAlert, Dumbbell, Play, Info, AlertTriangle } from "lucide-react";
import MuscleMapMini from "./MuscleMapMini";

interface TrainingPlanPanelProps {
  clientId: string;
}

export default function TrainingPlanPanel({ clientId }: { clientId: string }) {
  const storedPlan = useMemo(() => getClientTrainingPlan(clientId), [clientId]);
  const masterExercises = useMemo(() => getMasterExercises(), []);

  // Component state
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeDayId, setActiveDayId] = useState<string>("");

  // Search & Filter state for exercise library
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "All">("All");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | "All">("All");

  // Load plan from store
  useEffect(() => {
    if (storedPlan) {
      setPlan(JSON.parse(JSON.stringify(storedPlan))); // Deep clone for local editing
      if (storedPlan.days.length > 0) {
        setActiveDayId(storedPlan.days[0].id);
      }
    } else {
      setPlan(null);
    }
  }, [storedPlan]);

  // Check if dirty (unsaved changes)
  const isDirty = useMemo(() => {
    return JSON.stringify(plan) !== JSON.stringify(storedPlan);
  }, [plan, storedPlan]);

  if (!plan) {
    return (
      <div className="p-10 text-center text-muted-foreground lab-card-glow border border-border/80 bg-background/10">
        No active training program found for this client.
      </div>
    );
  }

  // Active training day details
  const activeDay = plan.days.find((d) => d.id === activeDayId) || plan.days[0];

  // Filtered exercise library list
  const filteredExercises = masterExercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === "All" || ex.primaryMuscle === selectedMuscle;
    const matchesEquipment = selectedEquipment === "All" || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  // Edit Mode state updates
  const handlePlanNameChange = (name: string) => {
    setPlan((prev) => (prev ? { ...prev, programName: name } : null));
  };

  const handleNotesChange = (notes: string) => {
    setPlan((prev) => (prev ? { ...prev, notes } : null));
  };

  const handleExerciseChange = (dayId: string, instanceId: string, field: keyof TrainingPlanExercise, value: string | number) => {
    setPlan((prev) => {
      if (!prev) return null;
      const updatedDays = prev.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex) => (ex.id === instanceId ? { ...ex, [field]: value } : ex))
        };
      });
      return { ...prev, days: updatedDays };
    });
  };

  const handleRemoveExercise = (dayId: string, instanceId: string) => {
    setPlan((prev) => {
      if (!prev) return null;
      const updatedDays = prev.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.filter((ex) => ex.id !== instanceId)
        };
      });
      return { ...prev, days: updatedDays };
    });
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!activeDay) return;
    const newPlanExercise: TrainingPlanExercise = {
      id: createId("tpe"),
      exerciseId: exercise.id,
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      sets: 3,
      repsPrescription: "10-12 reps",
      tempo: "2010",
      restSeconds: 60
    };

    setPlan((prev) => {
      if (!prev) return null;
      const updatedDays = prev.days.map((day) => {
        if (day.id !== activeDayId) return day;
        return {
          ...day,
          exercises: [...day.exercises, newPlanExercise]
        };
      });
      return { ...prev, days: updatedDays };
    });
  };

  const handleSave = () => {
    if (!plan) return;
    actions.updateTrainingPlan(plan);
    setEditMode(false);
  };

  const handleCancel = () => {
    if (storedPlan) {
      setPlan(JSON.parse(JSON.stringify(storedPlan)));
    }
    setEditMode(false);
  };

  // Find underlying master exercise to show cues & mistakes
  const getExerciseDetails = (exerciseId: string): Exercise | undefined => {
    return masterExercises.find((ex) => ex.id === exerciseId);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-glow text-primary flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> Client Training Program
          </h2>
          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest mt-0.5">
            Precision Prescriptions · Real-Time Telemetry Layer
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-center">
          {isDirty && (
            <span className="text-[9px] font-mono font-bold uppercase text-status-above border border-status-above/30 bg-status-above/10 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="h-3 w-3" /> Unsaved program edits
            </span>
          )}
          {editMode ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} className="h-7.5 px-3 text-xs font-semibold uppercase tracking-wider font-mono">
                <X className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button variant="neon" size="sm" onClick={handleSave} className="h-7.5 px-4 text-xs font-semibold uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <Save className="mr-1 h-3.5 w-3.5" /> Save Plan
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)} className="h-7.5 px-3.5 text-xs font-semibold uppercase tracking-wider font-mono border border-border/40 hover:border-primary/20">
              <Edit className="mr-1 h-3.5 w-3.5 text-primary" /> Edit Program
            </Button>
          )}
        </div>
      </div>

      {/* Program Summary Card */}
      <div className="lab-card-glow p-4 border border-border/60 bg-[#0e1217]/50 backdrop-blur-md relative overflow-hidden rounded-xl">
        <div className="absolute right-0 top-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="grid md:grid-cols-3 gap-5 relative z-10">
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block">Program Profile</span>
            {editMode ? (
              <input
                type="text"
                value={plan.programName}
                onChange={(e) => handlePlanNameChange(e.target.value)}
                className="input-glass mt-1 text-sm font-semibold py-1 px-2.5 w-full text-primary font-display"
              />
            ) : (
              <h3 className="text-base font-bold text-primary font-display tracking-tight text-glow">{plan.programName}</h3>
            )}
            <div className="flex gap-4 text-[10px] font-mono text-muted-foreground pt-0.5">
              <div>Days: <span className="text-foreground font-bold">{plan.days.length}</span></div>
              <div>Volume: <span className="text-foreground font-bold">{plan.days.reduce((acc, d) => acc + d.exercises.length, 0)} Movements</span></div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Info className="h-3 w-3 text-cyan-400" /> Client-Safe Training Summary
            </span>
            {editMode ? (
              <textarea
                value={plan.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="input-glass text-xs p-2.5 w-full h-16 resize-none leading-normal text-muted-foreground mt-1"
                placeholder="Prescribe movement control guidelines, target tempos, and overall performance notes..."
              />
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed italic bg-background/20 p-2.5 rounded-lg border border-border/30">
                "{plan.notes}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn("grid gap-5 transition-all duration-300", editMode ? "lg:grid-cols-3" : "grid-cols-1")}>
        
        {/* Left Side: Builder and Active Day Workout */}
        <div className={cn("space-y-4", editMode ? "lg:col-span-2" : "")}>
          
          {/* Day Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-border/20 pb-2">
            {plan.days.map((day) => (
              <button
                key={day.id}
                onClick={() => setActiveDayId(day.id)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md border transition duration-200",
                  activeDayId === day.id
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-[#161c24]/40"
                )}
              >
                {day.dayName}
              </button>
            ))}
          </div>

          {/* Exercises Layout */}
          {activeDay && (
            <div className="space-y-3.5">
              {activeDay.exercises.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-background/10">
                  No movements programmed for this block. {editMode && "Add exercises using the library drawer."}
                </div>
              ) : (
                activeDay.exercises.map((tpe, index) => {
                  const details = getExerciseDetails(tpe.exerciseId);
                  return (
                    <div
                      key={tpe.id}
                      className="lab-card-glow p-4 border border-border/60 bg-[#0e1217]/40 hover:border-cyan-500/20 transition-all duration-300 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-stretch"
                    >
                      {/* Left: Info, Muscle Map, Title & Cues */}
                      <div className="flex gap-4 items-start flex-1 min-w-0">
                        {/* Numerical Badge & Telemetry Map */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border/40">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <MuscleMapMini highlighted={tpe.primaryMuscle} />
                        </div>

                        {/* Text Block */}
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-glow text-primary truncate max-w-[240px]">
                              {tpe.name}
                            </h4>
                            <span className="text-[8.5px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 tracking-wider">
                              {tpe.primaryMuscle}
                            </span>
                            <span className="text-[8.5px] font-mono uppercase px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground border border-border/30 tracking-wider">
                              {tpe.equipment}
                            </span>
                          </div>

                          {details && (
                            <div className="grid sm:grid-cols-2 gap-3 pt-1">
                              {/* Cues Block */}
                              <div className="bg-background/15 border border-border/40 p-2.5 rounded-lg space-y-1">
                                <span className="text-[8px] font-mono uppercase text-cyan-400 tracking-wider flex items-center gap-1 font-semibold">
                                  <Play className="h-2 w-2 text-cyan-400 fill-cyan-400" /> Movement Control Cues
                                </span>
                                <ul className="list-disc list-inside text-[10px] text-muted-foreground leading-normal pl-0.5 space-y-0.5">
                                  {details.cues.map((cue, i) => (
                                    <li key={i} className="truncate">{cue}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Mistakes Warning Box */}
                              <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg space-y-1">
                                <span className="text-[8px] font-mono uppercase text-amber-400 tracking-wider flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="h-2.5 w-2.5 text-amber-400" /> Technique Consistency
                                </span>
                                <ul className="list-disc list-inside text-[10px] text-muted-foreground/90 leading-normal pl-0.5 space-y-0.5">
                                  {details.mistakes.map((mistake, i) => (
                                    <li key={i} className="truncate">{mistake}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Prescriptions & Action Buttons */}
                      <div className="flex flex-row md:flex-col md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-border/20 pt-3 md:pt-0 md:pl-4">
                        {editMode ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2 w-full max-w-[220px]">
                            <div>
                              <span className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Sets</span>
                              <input
                                type="number"
                                value={tpe.sets}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "sets", Number(e.target.value))}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5 font-semibold font-mono"
                                min={1}
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Reps</span>
                              <input
                                type="text"
                                value={tpe.repsPrescription}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "repsPrescription", e.target.value)}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Tempo</span>
                              <input
                                type="text"
                                value={tpe.tempo}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "tempo", e.target.value)}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Rest (s)</span>
                              <input
                                type="number"
                                value={tpe.restSeconds}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "restSeconds", Number(e.target.value))}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5 font-semibold font-mono"
                                min={0}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex md:flex-col gap-2 w-full justify-between md:justify-start">
                            {/* Sets/Reps Pill */}
                            <div className="bg-[#12161b] border border-border/40 px-3 py-1 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-mono text-muted-foreground w-[100px] shrink-0">
                              <span className="text-primary font-bold text-glow text-xs">{tpe.sets}</span> sets <span className="text-foreground">×</span> <span className="text-foreground font-semibold">{tpe.repsPrescription.split(" ")[0]}</span>
                            </div>
                            {/* Tempo/Rest Pill */}
                            <div className="bg-[#12161b] border border-border/40 px-3 py-1 rounded-lg flex flex-col justify-center text-[8.5px] font-mono text-muted-foreground w-[100px] shrink-0 space-y-0.5 leading-none">
                              <div>TEMPO: <span className="text-foreground font-semibold">{tpe.tempo}</span></div>
                              <div className="mt-0.5">REST: <span className="text-cyan-400 font-semibold">{tpe.restSeconds}s</span></div>
                            </div>
                          </div>
                        )}

                        {editMode && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveExercise(activeDay.id, tpe.id)}
                            className="h-7 w-7 rounded-lg text-xs hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 border border-transparent md:self-end mt-auto shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Side: Exercise Library Drawer Panel (Edit Mode Only) */}
        {editMode && (
          <div className="space-y-4 border-l border-border/20 pl-5 h-fit lg:sticky lg:top-4 bg-[#0e1217]/30 p-4 rounded-xl border border-border/40 backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-sm text-primary flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" /> Exercise Library
              </h3>
              <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">
                Click + to add to {activeDay?.dayName.split(":")[0] || "selected block"}
              </p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass pl-8.5 pr-3 py-1.5 w-full text-xs"
              />
            </div>

            {/* Muscle Filters */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Filter Muscle</span>
              <div className="flex flex-wrap gap-1">
                {["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"].map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() => setSelectedMuscle(muscle as MuscleGroup | "All")}
                    className={cn(
                      "text-[9px] font-mono px-2 py-0.5 rounded border transition duration-200",
                      selectedMuscle === muscle
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold"
                        : "bg-background/20 border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Filters */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Filter Equipment</span>
              <div className="flex flex-wrap gap-1">
                {["All", "Barbell", "Dumbbell", "Cables", "Machine", "Bodyweight"].map((equip) => (
                  <button
                    key={equip}
                    onClick={() => setSelectedEquipment(equip as EquipmentType | "All")}
                    className={cn(
                      "text-[9px] font-mono px-2 py-0.5 rounded border transition duration-200",
                      selectedEquipment === equip
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold"
                        : "bg-background/20 border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {equip}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 border-t border-border/20 pt-3">
              {filteredExercises.length === 0 ? (
                <p className="text-[10px] text-center text-muted-foreground py-6">No matching movements found.</p>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-2 border border-border/40 bg-[#0e1217]/50 hover:bg-[#161c24]/60 hover:border-cyan-500/20 transition-all rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MuscleMapMini highlighted={ex.primaryMuscle} className="w-8 h-10 p-0.5 shrink-0 bg-background/40" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-primary text-[11px] leading-tight truncate">{ex.name}</h4>
                        <span className="text-[8px] font-mono text-muted-foreground block uppercase mt-0.5">
                          {ex.primaryMuscle} · {ex.equipment}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddExercise(ex)}
                      className="h-6.5 w-6.5 rounded hover:bg-cyan-500/20 text-cyan-400 border border-transparent hover:border-cyan-500/30 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
