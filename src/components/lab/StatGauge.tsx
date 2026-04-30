import { cn } from "@/lib/utils";
import type { BiomarkerDef } from "@/lib/types";
import { getStatus, STATUS_META } from "@/lib/biomarkers";

/**
 * Horizontal gauge: shows full standard range with optimal band highlighted and current value indicator.
 */
export function StatGauge({ def, value, className }: { def: BiomarkerDef; value: number; className?: string }) {
  const min = Math.min(def.standardLow, value, def.optimalLow) * 0.92;
  const max = Math.max(def.standardHigh, value, def.optimalHigh) * 1.08;
  const span = max - min || 1;
  const pct = (n: number) => ((n - min) / span) * 100;
  const status = getStatus(def, value);
  const meta = STATUS_META[status];

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-2 rounded-full bg-secondary/80 overflow-hidden">
        {/* standard range */}
        <div className="absolute inset-y-0 bg-muted/60"
          style={{ left: `${pct(def.standardLow)}%`, right: `${100 - pct(def.standardHigh)}%` }} />
        {/* optimal range */}
        <div className="absolute inset-y-0 bg-status-optimal/30"
          style={{ left: `${pct(def.optimalLow)}%`, right: `${100 - pct(def.optimalHigh)}%` }} />
        {/* marker */}
        <div className={cn("absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background", meta.dot)}
          style={{ left: `${pct(value)}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{def.standardLow}</span>
        <span className="text-status-optimal">{def.optimalLow}–{def.optimalHigh}</span>
        <span>{def.standardHigh}</span>
      </div>
    </div>
  );
}
