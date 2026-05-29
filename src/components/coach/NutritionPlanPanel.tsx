// src/components/coach/NutritionPlanPanel.tsx
import { useState, useEffect, useMemo } from "react";
import { actions, getClientNutritionPlan } from "@/data/store";
import type { NutritionPlan, MacroTargets, MealTimingBlock, NutritionFocusArea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Edit, Save, X } from "lucide-react";

/**
 * Coach Nutrition Guidance panel – prototype UI for displaying and editing a client's
 * nutrition plan. All data lives in localStorage via the custom store; no external APIs
 * are used. The UI mirrors the dark‑glass, emerald/cyan aesthetic of the rest of the
 * Bio‑Performance Command Center.
 */
export default function NutritionPlanPanel({ clientId }: { clientId: string }) {
  // Load plan from store – it may be undefined for new clients.
  const storedPlan = useMemo(() => getClientNutritionPlan(clientId), [clientId]);
  const [plan, setPlan] = useState<NutritionPlan | null>(storedPlan ?? null);
  const [editMode, setEditMode] = useState(false);

  // Keep the component in sync with external store changes.
  useEffect(() => {
    setPlan(storedPlan ?? null);
  }, [storedPlan]);

  if (!plan) {
    return (
      <div className="p-6 text-muted-foreground text-center">
        No nutrition plan found for this client.
      </div>
    );
  }

  const handleFieldChange = (field: keyof MacroTargets, value: string) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const newMacro: MacroTargets = { ...prev.macroTargets, [field]: Number(value) };
      return { ...prev, macroTargets: newMacro };
    });
  };

  const handleAdherenceChange = (value: string) => {
    setPlan((prev) => (prev ? { ...prev, adherence: Number(value) } : prev));
  };

  const handleMealTimingChange = (idx: number, field: keyof MealTimingBlock, value: string) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const newTiming = prev.mealTiming.map((mt, i) =>
        i === idx ? { ...mt, [field]: value } : mt
      );
      return { ...prev, mealTiming: newTiming };
    });
  };

  const handleSave = () => {
    if (!plan) return;
    actions.updateNutritionPlan(plan);
    setEditMode(false);
  };

  const handleCancel = () => {
    // Re‑load from store to discard unsaved changes.
    setPlan(storedPlan ?? null);
    setEditMode(false);
  };

  const { macroTargets, adherence, focusAreas, mealTiming } = plan;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-glow text-primary">
          Coach Nutrition Guidance
        </h2>
        <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
          Prototype nutrition plan · Live database planned
        </span>
      </div>

      {/* Macro Target Command Card */}
      <div className="lab-card-glow p-4 border border-border/80 bg-background/25">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[120px]">
            <span className="block text-xs text-muted-foreground uppercase">Calories</span>
            <span className="text-xl font-bold font-display text-primary">
              {macroTargets.calories}
            </span>
          </div>
          <div className="min-w-[120px]">
            <span className="block text-xs text-muted-foreground uppercase">Protein (g)</span>
            <span className="text-xl font-bold font-display text-primary">
              {macroTargets.protein}
            </span>
          </div>
          <div className="min-w-[120px]">
            <span className="block text-xs text-muted-foreground uppercase">Carbs (g)</span>
            <span className="text-xl font-bold font-display text-primary">
              {macroTargets.carbs}
            </span>
          </div>
          <div className="min-w-[120px]">
            <span className="block text-xs text-muted-foreground uppercase">Fats (g)</span>
            <span className="text-xl font-bold font-display text-primary">
              {macroTargets.fats}
            </span>
          </div>
          <div className="min-w-[120px]">
            <span className="block text-xs text-muted-foreground uppercase">Fluids (L)</span>
            <span className="text-xl font-bold font-display text-primary">
              {macroTargets.fluidIntakeLiters}
            </span>
          </div>
          <div className="min-w-[120px]">
            <span className="block text-xs text-muted-foreground uppercase">Adherence</span>
            <span className="text-xl font-bold font-display text-primary">
              {adherence}%
            </span>
          </div>
        </div>
        {editMode && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="number"
              className="input-glass"
              value={macroTargets.calories}
              onChange={(e) => handleFieldChange("calories", e.target.value)}
            />
            <input
              type="number"
              className="input-glass"
              value={macroTargets.protein}
              onChange={(e) => handleFieldChange("protein", e.target.value)}
            />
            <input
              type="number"
              className="input-glass"
              value={macroTargets.carbs}
              onChange={(e) => handleFieldChange("carbs", e.target.value)}
            />
            <input
              type="number"
              className="input-glass"
              value={macroTargets.fats}
              onChange={(e) => handleFieldChange("fats", e.target.value)}
            />
            <input
              type="number"
              step="0.1"
              className="input-glass"
              value={macroTargets.fluidIntakeLiters}
              onChange={(e) => handleFieldChange("fluidIntakeLiters", e.target.value)}
            />
            <input
              type="number"
              className="input-glass"
              value={adherence}
              onChange={(e) => handleAdherenceChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Meal Timing Blocks */}
      <div className="grid gap-4 md:grid-cols-2">
        {mealTiming.map((mt, idx) => (
          <div key={idx} className="lab-card-glow p-4 border border-border/80 bg-background/25">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-lg font-bold text-primary">
                {mt.name}
              </h3>
              <span className="text-sm text-muted-foreground">{mt.time}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              <strong>Macro emphasis:</strong> {mt.name.includes("Breakfast") ? "Protein & Carbs" : "Balanced"}
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              <strong>Example foods:</strong> Oats, eggs, fruit, or a post‑workout shake.
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Coach note:</strong> Keep portions moderate and hydrate.
            </p>
            {editMode && (
              <input
                type="time"
                className="input-glass mt-2 w-full"
                value={mt.time}
                onChange={(e) => handleMealTimingChange(idx, "time", e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Nutrition Focus Areas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {focusAreas.map((fa, idx) => (
          <div
            key={idx}
            className={cn(
              "lab-card-glow p-3 border border-border/80 bg-background/25",
              fa.completed ? "border-status-optimal/30" : "border-status-above/30"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-primary">{fa.name}</span>
              <span className={cn(
                "text-xs font-mono uppercase",
                fa.completed ? "text-status-optimal" : "text-status-above"
              )}>
                {fa.completed ? "Done" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Client‑Safe Summary */}
      <div className="lab-card-glow p-4 border border-border/80 bg-background/25">
        <h3 className="font-display text-lg font-bold text-primary mb-2">
          Coach Summary (Client‑Safe)
        </h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Guidance focuses on balanced macro distribution to support training.</li>
          <li>Hydration target ensures optimal recovery and performance.</li>
          <li>Meal timing is structured around training windows for energy availability.</li>
          <li>Focus areas track consistency without prescribing medical treatments.</li>
        </ul>
      </div>

      {/* Edit controls */}
      <div className="flex gap-2 justify-end mt-4">
        {editMode ? (
          <>
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button variant="neon" onClick={handleSave}>
              <Save className="mr-1 h-4 w-4" /> Save
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setEditMode(true)}>
            <Edit className="mr-1 h-4 w-4" /> Edit Nutrition Plan
          </Button>
        )}
      </div>
    </div>
  );
}
