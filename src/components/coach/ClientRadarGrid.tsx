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
    <div className="bg-[#0e1115]/85 p-3.5 px-4 flex flex-col h-full space-y-3.5 border border-border/40 rounded-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Client Radar Snapshot</h3>
          <p className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">
            Mock roster
          </p>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground bg-secondary/40 border border-border/40 px-2 py-0.5 rounded-full shrink-0">
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
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/40"
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
                ? "bg-status-optimal/10 border-status-optimal/30 hover:border-status-optimal" 
                : tile.color === "amber"
                  ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500"
                  : tile.color === "red"
                    ? "bg-status-high/15 border-status-high/30 hover:border-status-high"
                    : "bg-secondary/45 border-border/40 hover:border-muted-foreground"
            )}
          >
            {/* Tile Tooltip overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 z-10 text-[8px] font-bold font-mono">
              {tile.initials}
            </div>

            {/* Glowing dot -> Flat indicator dot */}
            <span className={cn(
              "absolute bottom-0.5 right-0.5 h-1 w-1 rounded-full",
              tile.color === "green" && "bg-status-optimal",
              tile.color === "amber" && "bg-amber-500",
              tile.color === "red" && "bg-status-high",
              tile.color === "gray" && "bg-muted-foreground"
            )} />

            {/* Hover Tooltip tooltip node */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col bg-popover/95 border border-border/40 p-2 rounded shadow-2xl w-36 z-20 text-[9.5px] space-y-0.5">
              <span className="font-semibold text-foreground truncate">{tile.name}</span>
              <span className="text-muted-foreground font-mono">Compliance: {tile.compliance}%</span>
              <span className={cn(
                "font-mono text-[8.5px] uppercase font-bold",
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
      <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground border-t border-border/20 pt-1.5 flex-wrap gap-2">
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
