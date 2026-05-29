// src/components/coach/TrainingPlanPanel.tsx
import { useState, useEffect, useMemo } from "react";
import { actions, getClientTrainingPlan, getMasterExercises } from "@/data/store";
import type { TrainingPlan, TrainingDay, TrainingPlanExercise, Exercise, MuscleGroup, EquipmentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Edit, Save, X, Search, Plus, Trash2, ShieldAlert, Award, Dumbbell, HelpCircle } from "lucide-react";
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
      <div className="p-10 text-center text-muted-foreground lab-card-glow border border-border/80">
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
      id: `tpe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-glow text-primary">
            Client Training Program
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
            Prototype training builder · Live database planned
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-[10px] font-mono font-bold uppercase text-status-above border border-status-above/30 bg-status-above/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" /> Unsaved program edits
            </span>
          )}
          {editMode ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 text-xs">
                <X className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button variant="neon" size="sm" onClick={handleSave} className="h-8 text-xs">
                <Save className="mr-1 h-3.5 w-3.5" /> Save Plan
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)} className="h-8 text-xs">
              <Edit className="mr-1 h-3.5 w-3.5" /> Edit Program
            </Button>
          )}
        </div>
      </div>

      {/* Program Summary Card */}
      <div className="lab-card-glow p-4 border border-border/80 bg-background/25">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div>
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Program Name</span>
              {editMode ? (
                <input
                  type="text"
                  value={plan.programName}
                  onChange={(e) => handlePlanNameChange(e.target.value)}
                  className="input-glass mt-1 text-sm font-semibold py-1 px-2.5 w-full text-primary"
                />
              ) : (
                <h3 className="text-base font-bold text-primary font-display">{plan.programName}</h3>
              )}
            </div>
            <div className="flex gap-4 text-xs font-mono text-muted-foreground">
              <div>Days: <span className="text-foreground font-bold">{plan.days.length}</span></div>
              <div>Total Exercises: <span className="text-foreground font-bold">{plan.days.reduce((acc, d) => acc + d.exercises.length, 0)}</span></div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-1">
            <span className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1">
              <Award className="h-3 w-3 text-primary" /> Client-Safe Training Summary
            </span>
            {editMode ? (
              <textarea
                value={plan.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="input-glass text-xs p-2 w-full h-16 resize-none leading-normal text-muted-foreground"
                placeholder="Training focus guidelines, movement control, and tempo awareness notes..."
              />
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "{plan.notes}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Builder & Drawer Section */}
      <div className={cn("grid gap-6 transition-all duration-300", editMode ? "lg:grid-cols-3" : "grid-cols-1")}>
        
        {/* Workout Builder Tab Pane */}
        <div className={cn("space-y-4", editMode ? "lg:col-span-2" : "")}>
          {/* Day Tabs */}
          <div className="flex gap-2 border-b border-border/40 pb-2">
            {plan.days.map((day) => (
              <button
                key={day.id}
                onClick={() => setActiveDayId(day.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-lg border transition",
                  activeDayId === day.id
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                )}
              >
                {day.dayName}
              </button>
            ))}
          </div>

          {/* Active Day Exercises List */}
          {activeDay && (
            <div className="space-y-3">
              {activeDay.exercises.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                  No exercises programmed for this day yet. {editMode && "Use the library drawer to add some."}
                </div>
              ) : (
                activeDay.exercises.map((tpe) => {
                  const details = getExerciseDetails(tpe.exerciseId);
                  return (
                    <div
                      key={tpe.id}
                      className="lab-card-glow p-4 border border-border/80 bg-background/25 flex flex-col md:flex-row gap-4 justify-between items-start"
                    >
                      <div className="flex gap-4 items-start w-full md:w-auto">
                        <MuscleMapMini highlighted={tpe.primaryMuscle} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-primary">{tpe.name}</h4>
                            <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-secondary/60 text-muted-foreground border border-border/40">
                              {tpe.equipment}
                            </span>
                          </div>

                          {/* Render Cue Card Details */}
                          {details && (
                            <div className="space-y-1.5 mt-2 max-w-lg">
                              <div>
                                <span className="text-[8px] font-mono uppercase text-muted-foreground block">Movement Control Cues</span>
                                <ul className="list-disc list-inside text-[10px] text-muted-foreground leading-normal pl-0.5">
                                  {details.cues.map((cue, i) => (
                                    <li key={i}>{cue}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <span className="text-[8px] font-mono uppercase text-status-above block">Technique Consistency (Avoid)</span>
                                <ul className="list-disc list-inside text-[10px] text-muted-foreground/80 leading-normal pl-0.5">
                                  {details.mistakes.map((mistake, i) => (
                                    <li key={i}>{mistake}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prescriptions and Controls */}
                      <div className="flex flex-col md:items-end justify-between h-full w-full md:w-auto gap-4 self-stretch">
                        {editMode ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                            <div>
                              <label className="text-[8px] font-mono uppercase text-muted-foreground block">Sets</label>
                              <input
                                type="number"
                                value={tpe.sets}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "sets", Number(e.target.value))}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5"
                                min={1}
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-mono uppercase text-muted-foreground block">Reps</label>
                              <input
                                type="text"
                                value={tpe.repsPrescription}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "repsPrescription", e.target.value)}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-mono uppercase text-muted-foreground block">Tempo</label>
                              <input
                                type="text"
                                value={tpe.tempo}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "tempo", e.target.value)}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-mono uppercase text-muted-foreground block">Rest (s)</label>
                              <input
                                type="number"
                                value={tpe.restSeconds}
                                onChange={(e) => handleExerciseChange(activeDay.id, tpe.id, "restSeconds", Number(e.target.value))}
                                className="input-glass py-0.5 px-2 w-full text-center text-xs mt-0.5"
                                min={0}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 text-xs font-mono text-muted-foreground justify-between w-full md:justify-end">
                            <div>Sets: <span className="text-foreground font-semibold">{tpe.sets}</span></div>
                            <div>Reps: <span className="text-foreground font-semibold">{tpe.repsPrescription}</span></div>
                            <div>Tempo: <span className="text-foreground font-semibold">{tpe.tempo}</span></div>
                            <div>Rest: <span className="text-foreground font-semibold">{tpe.restSeconds}s</span></div>
                          </div>
                        )}

                        {editMode && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveExercise(activeDay.id, tpe.id)}
                            className="h-7 w-7 rounded-lg text-xs self-end mt-auto"
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

        {/* Exercise Library Drawer (Only visible in edit mode) */}
        {editMode && (
          <div className="space-y-4 border-l border-border/30 pl-6 h-fit lg:sticky lg:top-4">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-sm text-primary flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4" /> Exercise Library
              </h3>
              <p className="text-[9px] text-muted-foreground uppercase font-mono">
                Click to add exercises to {activeDay?.dayName || "selected day"}
              </p>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-glass pl-8 pr-3 py-1.5 w-full text-xs"
                />
              </div>

              {/* Muscle Filter */}
              <div className="flex flex-wrap gap-1">
                {["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"].map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() => setSelectedMuscle(muscle as MuscleGroup | "All")}
                    className={cn(
                      "text-[9px] font-mono px-2 py-0.5 rounded border transition",
                      selectedMuscle === muscle
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-background/20 border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {muscle}
                  </button>
                ))}
              </div>

              {/* Equipment Filter */}
              <div className="flex flex-wrap gap-1">
                {["All", "Barbell", "Dumbbell", "Cables", "Machine", "Bodyweight"].map((equip) => (
                  <button
                    key={equip}
                    onClick={() => setSelectedEquipment(equip as EquipmentType | "All")}
                    className={cn(
                      "text-[9px] font-mono px-2 py-0.5 rounded border transition",
                      selectedEquipment === equip
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-background/20 border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {equip}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises List scrollable box */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {filteredExercises.length === 0 ? (
                <p className="text-[10px] text-center text-muted-foreground p-4">No exercises match search criteria.</p>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-2 border border-border/60 bg-background/10 hover:bg-background/25 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MuscleMapMini highlighted={ex.primaryMuscle} className="w-[30px] h-[40px] p-0.5" />
                      <div>
                        <h4 className="font-semibold text-primary text-[11px] leading-tight">{ex.name}</h4>
                        <span className="text-[8px] font-mono text-muted-foreground block uppercase mt-0.5">
                          {ex.primaryMuscle} · {ex.equipment}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddExercise(ex)}
                      className="h-6 w-6 rounded hover:bg-primary/20 text-primary border border-transparent hover:border-primary/30 shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
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
