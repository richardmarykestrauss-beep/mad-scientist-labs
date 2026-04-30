import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-primary/40 bg-primary/10 shadow-glow">
        <FlaskConical className="h-5 w-5 text-primary" strokeWidth={2.25} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-primary/20 animate-pulse-glow" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[15px] font-700 tracking-wide text-foreground">MAD SCIENTIST</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Coaching Lab</div>
        </div>
      )}
    </div>
  );
}
