import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, getClientPanels } from "@/data/store";
import { BIOMARKERS, getStatus } from "@/lib/biomarkers";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ClientTile {
  id: string;
  name: string;
  initials: string;
  status: "active" | "review" | "inactive";
  color: "green" | "amber" | "red" | "gray";
  compliance: number;
  reasons: string[];
}

export function ClientRadarGrid() {
  const navigate = useNavigate();
  const { clients, panels } = useStore();
  const [activeFilter, setActiveFilter] = useState<"all" | "alerts" | "due" | "adherence" | "review">("all");
  const TODAY = "2026-05-26";

  const allTiles = useMemo(() => {
    return clients.map((c): ClientTile => {
      const reasons: string[] = [];
      let color: "green" | "amber" | "red" | "gray" = "green";

      // 1. Inactive status
      if (c.status === "inactive") {
        return {
          id: c.id,
          name: c.name,
          initials: c.initials,
          status: c.status,
          color: "gray",
          compliance: Math.round((c.trainingCompliance + c.nutritionCompliance) / 2),
          reasons: ["Inactive client profile"],
        };
      }

      // 2. Check-In review status
      if (c.status === "review") {
        color = "red";
        reasons.push("Check-in submitted for review");
      }

      // 3. Lab alerts from latest blood panel
      const clientPanels = panels.filter((p) => p.clientId === c.id);
      const latestPanel = clientPanels.length > 0 
        ? [...clientPanels].sort((a, b) => b.date.localeCompare(a.date))[0] 
        : null;

      let hasLabAlerts = false;
      if (latestPanel) {
        for (const r of latestPanel.results) {
          const def = BIOMARKERS.find((b) => b.key === r.key);
          if (!def) continue;
          const status = getStatus(def, r.value);
          if (status === "high" || status === "low") {
            hasLabAlerts = true;
          }
        }
      }

      if (hasLabAlerts) {
        color = "red";
        reasons.push("Biomarker out-of-range alerts");
      }

      // 4. Compliance check
      const lowTraining = c.trainingCompliance < 75;
      const lowNutrition = c.nutritionCompliance < 75;
      if (lowTraining || lowNutrition) {
        if (color !== "red") color = "amber";
        reasons.push("Compliance below 75%");
      }

      // 5. Overdue check-ins
      const checkInOverdue = c.status !== "review" && c.nextCheckIn <= TODAY;
      if (checkInOverdue) {
        if (color !== "red") color = "amber";
        reasons.push("Check-in overdue");
      }

      if (reasons.length === 0) {
        reasons.push("All bio-telemetry stable");
      }

      return {
        id: c.id,
        name: c.name,
        initials: c.initials,
        status: c.status,
        color,
        compliance: Math.round((c.trainingCompliance + c.nutritionCompliance) / 2),
        reasons,
      };
    });
  }, [clients, panels]);

  // Filter tiles based on selection
  const filteredTiles = useMemo(() => {
    return allTiles.filter((tile) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "review") return tile.status === "review";
      if (activeFilter === "alerts") return tile.reasons.some(r => r.includes("Biomarker"));
      if (activeFilter === "due") return tile.reasons.some(r => r.includes("overdue") || r.includes("review"));
      if (activeFilter === "adherence") return tile.compliance < 75;
      return true;
    });
  }, [allTiles, activeFilter]);

  // Show a maximum subset of 150 tiles for performance/density layout as requested
  const displayTiles = useMemo(() => {
    return filteredTiles.slice(0, 150);
  }, [filteredTiles]);

  return (
    <div className="bg-white p-4 flex flex-col h-full space-y-3.5 border border-slate-200 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-800">Client Radar Snapshot</h3>
          <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">
            Mock roster
          </p>
        </div>
        <div className="text-[9px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
          Showing {displayTiles.length} of {filteredTiles.length}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1">
        {[
          { id: "all", label: "All" },
          { id: "alerts", label: "Lab Alert" },
          { id: "due", label: "Check-In Due" },
          { id: "adherence", label: "Low Adherence" },
          { id: "review", label: "Needs Review" },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveFilter(chip.id as "all" | "alerts" | "due" | "adherence" | "review")}
            className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider transition border",
              activeFilter === chip.id
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] sm:grid-cols-[repeat(15,minmax(0,1fr))] md:grid-cols-[repeat(18,minmax(0,1fr))] lg:grid-cols-[repeat(25,minmax(0,1fr))] gap-1 py-1 max-h-[110px] overflow-y-auto scrollbar-thin pr-1">
        {displayTiles.map((tile) => (
          <div
            key={tile.id}
            onClick={() => navigate(`/coach/clients/${tile.id}`)}
            className={cn(
              "aspect-square rounded-[3px] cursor-pointer transition relative group overflow-hidden border",
              tile.color === "green" 
                ? "bg-emerald-50 border-emerald-100 hover:border-emerald-400" 
                : tile.color === "amber"
                  ? "bg-amber-50 border-amber-100 hover:border-amber-400"
                  : tile.color === "red"
                    ? "bg-red-50 border-red-100 hover:border-red-400"
                    : "bg-slate-50 border-slate-200 hover:border-slate-400"
            )}
          >
            {/* Tile Tooltip overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 z-10 text-[8px] font-bold font-mono text-slate-800">
              {tile.initials}
            </div>

            {/* Flat indicator dot */}
            <span className={cn(
              "absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full",
              tile.color === "green" && "bg-emerald-500",
              tile.color === "amber" && "bg-amber-500",
              tile.color === "red" && "bg-red-500",
              tile.color === "gray" && "bg-slate-400"
            )} />

            {/* Hover Tooltip tooltip node */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col bg-white border border-slate-200 p-2 rounded shadow-lg w-36 z-20 text-[9.5px] space-y-0.5 text-slate-800">
              <span className="font-semibold text-slate-900 truncate">{tile.name}</span>
              <span className="text-slate-500 font-mono">Compliance: {tile.compliance}%</span>
              <span className={cn(
                "font-mono text-[8.5px] uppercase font-bold",
                tile.color === "green" && "text-emerald-600",
                tile.color === "amber" && "text-amber-500",
                tile.color === "red" && "text-red-500",
                tile.color === "gray" && "text-slate-400"
              )}>
                {tile.reasons[0]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 border-t border-slate-100 pt-1.5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Stable</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Watch</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Alert</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inactive</span>
        </div>
        <span>Hover for info · Click to open</span>
      </div>
    </div>
  );
}
