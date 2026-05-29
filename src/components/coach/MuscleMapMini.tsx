// src/components/coach/MuscleMapMini.tsx
import type { MuscleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MuscleMapMiniProps {
  highlighted?: MuscleGroup;
  className?: string;
}

/**
 * Premium tech-schematic anatomical targeting indicator.
 * Visualized as a clean, high-end radar/sensor readout using modern vector geometries.
 * Uses restraining CSS filters and high-density telemetry patterns to look professional.
 */
export default function MuscleMapMini({ highlighted, className }: MuscleMapMiniProps) {
  const isChest = highlighted === "Chest";
  const isBack = highlighted === "Back";
  const isLegs = highlighted === "Legs";
  const isShoulders = highlighted === "Shoulders";
  const isArms = highlighted === "Arms";
  const isCore = highlighted === "Core";

  return (
    <div className={cn("relative flex items-center justify-center p-1 rounded-lg bg-[#0e1217]/60 border border-border/30 w-16 h-20 shrink-0 select-none overflow-hidden", className)}>
      {/* Sensor Grid lines in background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:6px_6px] pointer-events-none" />
      
      <svg
        viewBox="0 0 80 100"
        className="w-full h-full text-muted-foreground/20 fill-current stroke-border/40 stroke-[1]"
      >
        {/* Glow Filters */}
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Head Sensor */}
        <circle cx="40" cy="12" r="5" className="fill-muted-foreground/10 stroke-border/20" />

        {/* Shoulders Telemetry */}
        <path
          d="M 22 28 C 30 24, 50 24, 58 28 L 54 34 L 26 34 Z"
          className={cn("transition-all duration-300", isShoulders ? "fill-cyan-500/30 stroke-cyan-400 text-cyan-400 [filter:url(#glow-cyan)]" : "fill-muted-foreground/5")}
        />

        {/* Chest Plate */}
        <rect
          x="28" y="35" width="24" height="15" rx="3"
          className={cn("transition-all duration-300", isChest ? "fill-cyan-500/30 stroke-cyan-400 text-cyan-400 [filter:url(#glow-cyan)]" : "fill-muted-foreground/5")}
        />

        {/* Core (Abs) Indicator */}
        <rect
          x="30" y="52" width="20" height="12" rx="2"
          className={cn("transition-all duration-300", isCore ? "fill-cyan-500/30 stroke-cyan-400 text-cyan-400 [filter:url(#glow-cyan)]" : "fill-muted-foreground/5")}
        />

        {/* Back (Visualized as lateral wings) */}
        <path
          d="M 23 35 L 27 50 L 29 45 L 27 35 Z M 57 35 L 53 50 L 51 45 L 53 35 Z"
          className={cn("transition-all duration-300", isBack ? "fill-cyan-500/30 stroke-cyan-400 text-cyan-400 [filter:url(#glow-cyan)]" : "fill-muted-foreground/5")}
        />

        {/* Arms Capsules */}
        <rect
          x="19" y="32" width="6" height="26" rx="3"
          className={cn("transition-all duration-300", isArms ? "fill-cyan-500/30 stroke-cyan-400 text-cyan-400 [filter:url(#glow-cyan)]" : "fill-muted-foreground/5")}
        />
        <rect
          x="55" y="32" width="6" height="26" rx="3"
          className={cn("transition-all duration-300", isArms ? "fill-cyan-500/30 stroke-cyan-400 text-cyan-400 [filter:url(#glow-cyan)]" : "fill-muted-foreground/5")}
        />

        {/* Legs Quadrants */}
        <path
          d="M 29 66 L 38 66 L 36 92 L 28 92 Z M 51 66 L 42 66 L 44 92 L 52 92 Z"
          className={cn("transition-all duration-300", isLegs ? "fill-cyan-500/30 stroke-cyan-400 text-cyan-400 [filter:url(#glow-cyan)]" : "fill-muted-foreground/5")}
        />
      </svg>

      {/* Target Marker */}
      {highlighted && (
        <span className="absolute bottom-1 right-1 text-[6.5px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-1 rounded tracking-wider leading-none scale-90">
          {highlighted}
        </span>
      )}
    </div>
  );
}
