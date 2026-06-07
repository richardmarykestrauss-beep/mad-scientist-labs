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
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center">
            <Pill className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Supplement Protocol</h3>
            <p className="text-xs text-zinc-400">
              Follow timing guidelines. Supplements support biological pathways flagged in labs.
            </p>
          </div>
        </div>
        <div className="space-y-1.5 min-w-[150px]">
          <div className="flex justify-between text-xs font-sans font-medium">
            <span>Taken: {completedCount} / {totalCount}</span>
            <span className="text-emerald-400 font-semibold">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
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
                "rounded-xl border p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-zinc-700/60 transition",
                isCompleted ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/40"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "h-5 w-5 rounded border shrink-0 mt-0.5 grid place-items-center transition",
                    isCompleted
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "border-zinc-800 bg-zinc-950/40"
                  )}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <h4
                    className={cn(
                      "font-display text-sm font-semibold truncate",
                      isCompleted ? "text-emerald-400 font-semibold" : "text-zinc-200"
                    )}
                  >
                    {supp.name}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {supp.purpose}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-[10px] uppercase shrink-0 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-800">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="max-w-[120px] truncate">{supp.timing.split(",")[0]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-3 flex gap-2.5 items-start">
        <ShieldAlert className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
        <p className="text-[10px] text-zinc-500">
          Protocols are customized by your coach based on lab test results. Do not exceed suggested dosages without consulting your coach or physician.
        </p>
      </div>
    </div>
  );
}
