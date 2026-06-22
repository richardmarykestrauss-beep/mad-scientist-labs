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
      <div className="rounded-2xl border border-zinc-855 bg-zinc-900/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-850 grid place-items-center">
            <Pill className="h-4.5 w-4.5 text-zinc-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">Supplement Protocol</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Follow timing guidelines. Supplements support biological pathways.
            </p>
          </div>
        </div>
        <div className="space-y-1.5 min-w-[150px]">
          <div className="flex justify-between text-xs font-sans font-medium">
            <span className="text-zinc-400">Taken: {completedCount} / {totalCount}</span>
            <span className="text-emerald-500 font-semibold">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-950 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
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
                "rounded-xl border p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-zinc-800 transition-all duration-200",
                isCompleted ? "border-emerald-700/20 bg-emerald-700/5 shadow-inner" : "border-zinc-850 bg-zinc-900/15"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "h-5 w-5 rounded border shrink-0 mt-0.5 grid place-items-center transition duration-200",
                    isCompleted
                      ? "bg-emerald-700/20 border-emerald-700/30 text-emerald-500"
                      : "border-zinc-800 bg-zinc-950/40"
                  )}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <h4
                    className={cn(
                      "font-display text-sm font-semibold truncate transition",
                      isCompleted ? "text-emerald-550 font-semibold" : "text-zinc-200"
                    )}
                  >
                    {supp.name}
                  </h4>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {supp.purpose}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-[9.5px] uppercase shrink-0 bg-zinc-950/40 px-2.5 py-1 rounded-xl border border-zinc-850">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span className="max-w-[120px] truncate">{supp.timing.split(",")[0]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="rounded-xl border border-zinc-850 bg-zinc-950/10 p-3.5 flex gap-2.5 items-start">
        <ShieldAlert className="h-4 w-4 text-zinc-550 mt-0.5 shrink-0" />
        <p className="text-[10px] text-zinc-550 leading-relaxed">
          Protocols are customized by your coach based on lab test results. Do not exceed suggested dosages without consulting your coach or physician.
        </p>
      </div>
    </div>
  );
}
