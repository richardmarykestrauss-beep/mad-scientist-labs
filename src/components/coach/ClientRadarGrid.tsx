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
    <div className="lab-card-glow p-5 flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Client Radar Grid</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
            Mock 250-client radar · Live database planned
          </p>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground bg-secondary/40 border border-border/80 px-2 py-0.5 rounded-full shrink-0">
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
              "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition border",
              activeFilter === chip.id
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/40"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-15 gap-1.5 py-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
        {displayTiles.map((tile) => (
          <div
            key={tile.id}
            onClick={() => navigate(`/coach/clients/${tile.id}`)}
            className={cn(
              "aspect-square rounded-md cursor-pointer transition relative group overflow-hidden border",
              tile.color === "green" 
                ? "bg-status-optimal/10 border-status-optimal/30 hover:border-status-optimal hover:shadow-[0_0_8px_rgba(0,255,128,0.4)]" 
                : tile.color === "amber"
                  ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500 hover:shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                  : tile.color === "red"
                    ? "bg-status-high/10 border-status-high/30 hover:border-status-high hover:shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse-glow"
                    : "bg-secondary/40 border-border/80 hover:border-muted-foreground"
            )}
          >
            {/* Tile Tooltip overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 z-10 text-[9px] font-bold font-mono">
              {tile.initials}
            </div>

            {/* Glowing dot */}
            <span className={cn(
              "absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full",
              tile.color === "green" && "bg-status-optimal shadow-[0_0_4px_#00ff80]",
              tile.color === "amber" && "bg-amber-500 shadow-[0_0_4px_#f59e0b]",
              tile.color === "red" && "bg-status-high shadow-[0_0_4px_#ef4444]",
              tile.color === "gray" && "bg-muted-foreground"
            )} />

            {/* Hover Tooltip tooltip node */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col bg-popover border border-border p-2 rounded-lg shadow-xl w-32 z-20 text-[10px] space-y-0.5">
              <span className="font-semibold text-foreground truncate">{tile.name}</span>
              <span className="text-muted-foreground">Compliance: {tile.compliance}%</span>
              <span className={cn(
                "font-mono text-[9px] uppercase",
                tile.color === "green" && "text-status-optimal",
                tile.color === "amber" && "text-amber-500",
                tile.color === "red" && "text-status-high",
                tile.color === "gray" && "text-muted-foreground"
              )}>
                {tile.reasons[0]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground border-t border-border/40 pt-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-status-optimal" /> Stable</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Watch</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-status-high" /> Alert</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Inactive</span>
        </div>
        <span>Hover for info · Click to open</span>
      </div>
    </div>
  );
}
