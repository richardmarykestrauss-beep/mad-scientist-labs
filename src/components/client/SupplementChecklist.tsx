import { useStore, actions, getClientSupplementLogs } from "@/data/store";
import { Pill, Check, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
}

interface Supplement {
  name: string;
  timing: string;
  purpose: string;
}

const CLIENT_SUPPLEMENTS: Record<string, Supplement[]> = {
  "c-001": [
    { name: "Vitamin D3 + K2", timing: "Morning, with breakfast", purpose: "Hormone support & bone density" },
    { name: "Omega-3 Fish Oil", timing: "Morning, with breakfast", purpose: "Joint recovery & lipid regulation" },
    { name: "Thyroid Complex (Iodine/Selenium)", timing: "Morning, empty stomach", purpose: "Metabolic support (Preventative)" },
    { name: "Magnesium Glycinate", timing: "Evening, 1 hour before sleep", purpose: "CNS relaxation & deep sleep" },
    { name: "Creatine Monohydrate", timing: "Post-workout or morning", purpose: "ATP synthesis & cellular hydration" }
  ],
  "c-002": [
    { name: "Thyroid Complex (Iodine/Selenium)", timing: "Morning, empty stomach", purpose: "Optimize Free T3/T4 conversion" },
    { name: "Vitamin D3 + K2", timing: "Morning, with breakfast", purpose: "Immune tolerance & raise base levels" },
    { name: "Magnesium Glycinate", timing: "Evening, 1 hour before sleep", purpose: "Lower stress cortisol & improve recovery" }
  ]
};

export function SupplementChecklist({ clientId }: Props) {
  // Subscribe to store updates
  useStore();
  const today = new Date().toISOString().slice(0, 10);
  const supplements = CLIENT_SUPPLEMENTS[clientId] || CLIENT_SUPPLEMENTS["c-001"];
  const logs = getClientSupplementLogs(clientId, today);

  // Calculate statistics
  const totalCount = supplements.length;
  const completedCount = supplements.filter((s) => {
    const log = logs.find((l) => l.supplementName === s.name);
    return log ? log.completed : false;
  }).length;

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="lab-card-glow p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 grid place-items-center">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Supplement Protocol</h3>
            <p className="text-xs text-muted-foreground">
              Follow timing guidelines. Supplements support biological pathways flagged in labs.
            </p>
          </div>
        </div>
        <div className="space-y-1.5 min-w-[150px]">
          <div className="flex justify-between text-xs font-mono">
            <span>Taken: {completedCount} / {totalCount}</span>
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

      {/* Supplement Checklist */}
      <div className="space-y-2">
        {supplements.map((supp) => {
          const log = logs.find((l) => l.supplementName === supp.name);
          const isCompleted = log ? log.completed : false;

          return (
            <div
              key={supp.name}
              onClick={() => actions.toggleSupplement(clientId, supp.name)}
              className={cn(
                "lab-card-glow p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/30 transition border",
                isCompleted ? "border-primary/40 bg-primary/5" : "border-border"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "h-5 w-5 rounded border shrink-0 mt-0.5 grid place-items-center transition",
                    isCompleted
                      ? "bg-primary/20 border-primary text-primary shadow-glow"
                      : "border-border bg-background/40"
                  )}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <h4
                    className={cn(
                      "font-display text-sm font-semibold truncate",
                      isCompleted ? "text-primary font-bold" : "text-foreground"
                    )}
                  >
                    {supp.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {supp.purpose}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[10px] uppercase shrink-0 bg-secondary/30 px-2 py-1 rounded-lg border border-border/20">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[120px] truncate">{supp.timing.split(",")[0]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="rounded-xl border border-border bg-card/20 p-3 flex gap-2.5 items-start">
        <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground">
          Protocols are customized by your coach based on lab test results. Do not exceed suggested dosages without consulting your coach or physician.
        </p>
      </div>
    </div>
  );
}
