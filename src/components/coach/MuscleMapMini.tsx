// src/components/coach/MuscleMapMini.tsx
import type { MuscleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MuscleMapMiniProps {
  highlighted?: MuscleGroup;
  className?: string;
}

/**
 * Premium custom inline SVG muscle map visualizer.
 * Provides interactive-feeling, high-fidelity anatomical outlines
 * without external dependencies or heavy media files.
 */
export default function MuscleMapMini({ highlighted, className }: MuscleMapMiniProps) {
  // Check if a specific muscle group is active
  const isChest = highlighted === "Chest";
  const isBack = highlighted === "Back";
  const isLegs = highlighted === "Legs";
  const isShoulders = highlighted === "Shoulders";
  const isArms = highlighted === "Arms";
  const isCore = highlighted === "Core";

  return (
    <div className={cn("relative flex items-center justify-center p-2 rounded-xl bg-background/30 border border-border/40 w-[70px] h-[95px] shrink-0", className)}>
      <svg
        viewBox="0 0 100 140"
        className="w-full h-full text-muted-foreground/30 fill-current stroke-border/50 stroke-[1.5]"
      >
        {/* Silhouette Body Background (Muted Ghostly Outline) */}
        {/* Head */}
        <circle cx="50" cy="18" r="8" className="fill-background/40" />
        {/* Neck */}
        <rect x="47" y="26" width="6" height="5" className="fill-background/40" />

        {/* Shoulders */}
        <path
          d="M 28 36 C 36 32, 64 32, 72 36 L 68 45 L 32 45 Z"
          className={cn("transition-colors duration-300", isShoulders ? "fill-primary/60 stroke-primary text-primary" : "fill-background/40")}
        />

        {/* Chest */}
        <path
          d="M 33 46 L 67 46 L 64 64 L 36 64 Z"
          className={cn("transition-colors duration-300", isChest ? "fill-primary/60 stroke-primary text-primary" : "fill-background/40")}
        />

        {/* Core (Abs/Midsection) */}
        <path
          d="M 36 65 L 64 65 L 61 80 L 39 80 Z"
          className={cn("transition-colors duration-300", isCore ? "fill-primary/60 stroke-primary text-primary" : "fill-background/40")}
        />

        {/* Back (Visualized as wings behind/under the chest in silhouette view) */}
        <path
          d="M 29 46 L 35 70 L 38 65 L 35 46 Z M 71 46 L 65 70 L 62 65 L 65 46 Z"
          className={cn("transition-colors duration-300", isBack ? "fill-primary/60 stroke-primary text-primary" : "fill-background/40")}
        />

        {/* Arms */}
        <path
          d="M 27 37 L 22 65 L 18 85 L 24 85 L 29 60 L 31 44 Z M 73 37 L 78 65 L 82 85 L 76 85 L 71 60 L 69 44 Z"
          className={cn("transition-colors duration-300", isArms ? "fill-primary/60 stroke-primary text-primary" : "fill-background/40")}
        />

        {/* Legs (Quads / Hamstrings) */}
        <path
          d="M 38 82 L 48 82 L 46 112 L 34 135 L 27 135 L 34 110 Z M 62 82 L 52 82 L 54 112 L 66 135 L 73 135 L 66 110 Z"
          className={cn("transition-colors duration-300", isLegs ? "fill-primary/60 stroke-primary text-primary" : "fill-background/40")}
        />
      </svg>
      {/* Dynamic Small Badge Indicator */}
      {highlighted && (
        <span className="absolute bottom-0.5 right-1 text-[7px] font-mono uppercase bg-primary/20 text-primary border border-primary/30 px-1 rounded">
          {highlighted}
        </span>
      )}
    </div>
  );
}
