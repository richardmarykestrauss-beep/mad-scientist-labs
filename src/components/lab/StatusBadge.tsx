import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/biomarkers";
import type { BiomarkerStatus } from "@/lib/types";

export function StatusBadge({ status, className }: { status: BiomarkerStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
      meta.color, className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
