import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, ArrowRight, Eye, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, actions } from "@/data/store";
import { BIOMARKERS, getStatus } from "@/lib/biomarkers";
import { toast } from "sonner";

interface AttentionItem {
  clientId: string;
  name: string;
  avatarColor: string;
  initials: string;
  reason: string;
  severity: "High" | "Medium" | "Low";
  actionText: string;
  status: "active" | "review" | "inactive";
}

export function AttentionQueue() {
  const { clients, panels } = useStore();
  const TODAY = "2026-05-26";

  const attentionList = useMemo(() => {
    const list: AttentionItem[] = [];

    for (const c of clients) {
      const reasons: string[] = [];
      let severity: "High" | "Medium" | "Low" = "Low";
      let actionText = "";

      // 1. Check-In submitted for review
      const isReview = c.status === "review";
      
      // 2. Lab alerts from latest blood panel
      const clientPanels = panels.filter((p) => p.clientId === c.id);
      const latestPanel = clientPanels.length > 0 
        ? [...clientPanels].sort((a, b) => b.date.localeCompare(a.date))[0] 
        : null;

      let hasLabAlerts = false;
      const alertMarkers: string[] = [];
      if (latestPanel) {
        for (const r of latestPanel.results) {
          const def = BIOMARKERS.find((b) => b.key === r.key);
          if (!def) continue;
          const status = getStatus(def, r.value);
          if (status === "high" || status === "low") {
            hasLabAlerts = true;
            alertMarkers.push(def.name);
          }
        }
      }

      // 3. Adherence flags
      const lowTraining = c.trainingCompliance < 75;
      const lowNutrition = c.nutritionCompliance < 75;

      // 4. Overdue check-ins
      const checkInOverdue = c.status !== "review" && c.nextCheckIn <= TODAY;

      // Determine severity and construct reason & actions
      if (isReview) {
        severity = "High";
        reasons.push("Weekly check-in submitted for review");
        actionText = "Review check-in submission and adjust protocol";
      } else if (hasLabAlerts) {
        severity = "High";
        reasons.push(`Biomarker alerts: ${alertMarkers.slice(0, 2).join(", ")}${alertMarkers.length > 2 ? "..." : ""}`);
        actionText = "Analyze latest blood panel and update supplements";
      } else if (lowTraining || lowNutrition) {
        severity = "Medium";
        const complianceMsg = [];
        if (lowTraining) complianceMsg.push(`Training (${c.trainingCompliance}%)`);
        if (lowNutrition) complianceMsg.push(`Nutrition (${c.nutritionCompliance}%)`);
        reasons.push(`Low adherence: ${complianceMsg.join(" & ")}`);
        actionText = "Reach out to troubleshoot adherence barriers";
      } else if (checkInOverdue) {
        severity = "Medium";
        reasons.push(`Check-in overdue (Due ${c.nextCheckIn})`);
        actionText = "Nudge client to submit weekly check-in";
      } else if (c.status === "inactive") {
        severity = "Low";
        reasons.push("Client profile is inactive");
        actionText = "Re-engage client or archive profile";
      }

      if (reasons.length > 0) {
        list.push({
          clientId: c.id,
          name: c.name,
          avatarColor: c.avatarColor,
          initials: c.initials,
          reason: reasons[0],
          severity,
          actionText,
          status: c.status,
        });
      }
    }

    // Sort priority: High -> Medium -> Low, then by name
    return list.sort((a, b) => {
      const sevOrder = { High: 0, Medium: 1, Low: 2 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) {
        return sevOrder[a.severity] - sevOrder[b.severity];
      }
      return a.name.localeCompare(b.name);
    });
  }, [clients, panels]);

  const handleMarkReviewed = (clientId: string, clientName: string) => {
    actions.setClientStatus(clientId, "active");
    toast.success(`${clientName} marked reviewed`);
  };

  return (
    <div className="lab-card-glow p-4 flex flex-col h-full border border-border/80">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border/60">
        <div>
          <div className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            Attention Queue
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider font-mono">
            Prototype attention queue · Live database planned
          </p>
        </div>
        <span className="chip text-status-above border-status-above/30 bg-status-above/10 text-[8px] px-1.5 py-0.5">
          {attentionList.length} Action{attentionList.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-thin pr-1 max-h-[300px]">
        {attentionList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground">
            <CheckCircle className="h-6 w-6 text-status-optimal mb-1.5 opacity-60" />
            No immediate client attention actions. Roster is fully aligned.
          </div>
        ) : (
          attentionList.slice(0, 5).map((item) => (
            <div
              key={item.clientId}
              className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2.5 rounded-xl border border-border/80 bg-background/40 hover:border-primary/30 transition group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.avatarColor} text-background font-bold text-xs`}>
                  {item.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold truncate group-hover:text-primary transition">{item.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      item.severity === "High" 
                        ? "text-status-above border-status-above/30 bg-status-above/5" 
                        : item.severity === "Medium"
                          ? "text-amber-500 border-amber-500/30 bg-amber-500/5"
                          : "text-muted-foreground border-border bg-secondary/5"
                    }`}>
                      {item.severity} Priority
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <AlertTriangle className={`h-3 w-3 shrink-0 ${
                      item.severity === "High" ? "text-status-above" : "text-amber-500"
                    }`} />
                    <span className="truncate">{item.reason}</span>
                  </div>
                  <div className="text-[10px] text-primary/80 mt-1 font-mono-data font-medium flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Action: {item.actionText}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 md:self-center self-end mt-1 md:mt-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] px-2 gap-1 hover:text-primary hover:bg-secondary/40 border border-transparent hover:border-border"
                  asChild
                >
                  <Link to={`/coach/clients/${item.clientId}`}>
                    <Eye className="h-3 w-3" />
                    Open
                  </Link>
                </Button>
                
                {item.status === "review" && (
                  <Button
                    size="sm"
                    variant="neon"
                    className="h-7 text-[10px] px-2 font-semibold"
                    onClick={() => handleMarkReviewed(item.clientId, item.name)}
                  >
                    <CheckCircle className="h-3 w-3 mr-0.5" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {attentionList.length > 5 && (
        <div className="mt-3 text-center">
          <Button variant="link" size="sm" className="text-xs text-primary hover:underline gap-1" asChild>
            <Link to="/coach/clients">
              View all {attentionList.length} attention issues <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
