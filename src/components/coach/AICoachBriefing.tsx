import { useState } from "react";
import { useStore, actions, getClientPanels, getClientCheckIns } from "@/data/store";
import { BIOMARKER_MAP, getStatus, STATUS_META, pctChange } from "@/lib/biomarkers";
import type { BiomarkerStatus, Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Brain, 
  Sparkles, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Beaker, 
  TrendingUp, 
  HelpCircle, 
  ArrowRight,
  Shield,
  ThumbsUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clientId?: string;
}

export function AICoachBriefing({ clientId }: Props) {
  const { clients } = useStore();
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clientId || clients.find((c) => c.status === "review")?.id || clients[0]?.id || ""
  );

  // Ask AI console states
  const [question, setQuestion] = useState("");
  const [cannedAnswer, setCannedAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  // If a clientId was passed, force focus on that client (no general list)
  const activeClientId = clientId || selectedClientId;
  const activeClient = clients.find((c) => c.id === activeClientId);

  if (!activeClient) {
    return (
      <div className="lab-card-glow p-8 text-center text-muted-foreground">
        No active client selected.
      </div>
    );
  }

  // Get active client data
  const clientPanels = getClientPanels(activeClientId);
  const latestPanel = clientPanels[clientPanels.length - 1];
  const prevPanel = clientPanels[clientPanels.length - 2];
  const clientCheckIns = getClientCheckIns(activeClientId);
  const latestCheckIn = clientCheckIns[0];

  // Compile biomarker anomalies for the client
  const anomalies: { markerName: string; status: string; value: number; unit: string }[] = [];
  if (latestPanel) {
    for (const r of latestPanel.results) {
      const def = BIOMARKER_MAP[r.key];
      if (!def) continue;
      const status = getStatus(def, r.value);
      if (status === "high" || status === "low") {
        anomalies.push({ markerName: def.name, status, value: r.value, unit: def.unit });
      }
    }
  }

  // Determine risk profile
  let riskLevel: "low" | "medium" | "high" = "low";
  const lowCompliance = activeClient.trainingCompliance < 80 || activeClient.nutritionCompliance < 80;
  if (anomalies.length >= 2 || (anomalies.length >= 1 && lowCompliance)) {
    riskLevel = "high";
  } else if (anomalies.length === 1 || lowCompliance) {
    riskLevel = "medium";
  }

  // Calculate panel comparison differences
  const diffs: { name: string; current: number; prev: number; pct: number; isGood: boolean }[] = [];
  if (latestPanel && prevPanel) {
    for (const curRes of latestPanel.results) {
      const prevRes = prevPanel.results.find((p) => p.key === curRes.key);
      if (prevRes && prevRes.value !== curRes.value) {
        const def = BIOMARKER_MAP[curRes.key];
        if (!def) continue;
        const pct = pctChange(curRes.value, prevRes.value);
        
        // Determine if change is positive
        let isGood = false;
        if (def.category === "Lipids" || def.category === "Glucose") {
          // Generally decrease is better for cholesterol and sugar
          isGood = pct < 0;
        } else if (curRes.key === "free_test" || curRes.key === "total_test") {
          // Increase is better for testosterone
          isGood = pct > 0;
        } else if (curRes.key === "vitamin_d" || curRes.key === "vitamin_b12" || curRes.key === "ferritin") {
          // Increase is better for vitamins/iron stores
          isGood = pct > 0;
        } else {
          // Closer to optimal is better
          const currentDist = Math.abs(curRes.value - (def.optimalLow + def.optimalHigh) / 2);
          const prevDist = Math.abs(prevRes.value - (def.optimalLow + def.optimalHigh) / 2);
          isGood = currentDist < prevDist;
        }

        diffs.push({
          name: def.name,
          current: curRes.value,
          prev: prevRes.value,
          pct,
          isGood
        });
      }
    }
  }

  // Context-aware questions for the coach
  const getSuggestedQuestions = (client: Client) => {
    if (client.id === "c-002") {
      return [
        "How has your physical energy and mental focus changed in the afternoons since starting the thyroid complex?",
        "Your sleep score dropped to 4/10 this week. Let's analyze what specific stress points are disrupting your rest.",
        "Are you feeling unusually cold, or notice any skin dryness or hair changes that might indicate thyroid conversion issues?"
      ];
    }
    if (client.id === "c-001") {
      return [
        "Your Free Testosterone is up 32%. Have you noticed a corresponding boost in strength, drive, or physical recovery?",
        "Your mid-week sleep was inconsistent. Can we construct a wind-down routine to buffer work stress?",
        "How did your digestion feel during the PR attempt on incline dumbbell presses?"
      ];
    }
    return [
      `Let's discuss your compliance this week. What were the main barriers to hitting your training target?`,
      "How did your digestion feel this week compared to last week?",
      "Can we look at your hydration schedule to support recovery?"
    ];
  };

  // Context-aware next steps
  const getSuggestedActions = (client: Client) => {
    if (client.id === "c-002") {
      return [
        "Recheck TSH, Free T3, and Free T4 in 4 weeks to track conversion.",
        "Reduce training workload by 15% next week to manage cumulative cortisol.",
        "Focus on daily supplement compliance (currently missing Magnesium at night)."
      ];
    }
    if (client.id === "c-001") {
      return [
        "Maintain current macronutrient targets; the recomp is working.",
        "Prioritize consistent 7-8 hours sleep window to optimize further hormone conversion.",
        "Acknowledge PR and transition incline dumbell press weights up slightly."
      ];
    }
    return [
      "Improve hydration to support metabolic baseline.",
      "Check in on supplement compliance during the next scheduled call.",
      "Ensure training volume matches progressive overload targets."
    ];
  };

  // Handle Ask AI submit
  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    setCannedAnswer(null);

    // Simulate loading for high-end look
    setTimeout(() => {
      const q = question.toLowerCase();
      let answer = "";

      if (q.includes("thyroid") || q.includes("tsh") || q.includes("t3") || q.includes("sora")) {
        answer = "Sora's thyroid markers are suboptimal. TSH has drifted from 2.6 to 3.4 µIU/mL (+30.8%), while Free T3 dropped from 2.9 to 2.6 pg/mL (-10.3%). This correlates with low sleep quality (4/10) and high stress (8/10). Recommendation: Prioritize sleep restoration, manage glycemic load, and ensure daily Thyroid Complex compliance. Consider reducing cardiorespiratory training volume temporarily.";
      } else if (q.includes("testosterone") || q.includes("marcus") || q.includes("free test")) {
        answer = "Marcus's hormonal profile is responding exceptionally well. Free Testosterone increased by 32.4% (from 142 to 188 pg/mL) and Total Testosterone is up at 760 ng/dL. Fasting glucose has dropped to 84 mg/dL. The limiting factor is sleep consistency (7/10). Recommendation: Keep nutrition targets constant, maintain creatine compliance, and target a regular sleep-wake schedule to facilitate further androgen optimization.";
      } else if (q.includes("ferritin") || q.includes("lina") || q.includes("iron")) {
        answer = "Lina's ferritin has recovered to 72 ng/mL. Iron stores are stable, and energy scores are rising. Focus should shift to maintaining iron-rich dietary intake and scheduling a light recheck in 8 weeks. Keep training intensity at moderate levels on days with lower recovery markers.";
      } else if (q.includes("lipid") || q.includes("cholesterol") || q.includes("kade")) {
        answer = "Kade's total cholesterol is elevated at 192 mg/dL with LDL at 110 mg/dL. Recommended interventions include adding 20-30 minutes of daily Zone 2 cardio, increasing soluble fiber intake to 40g+, and ensuring high compliance with Omega-3 supplementation. Recheck in 8 weeks.";
      } else {
        answer = `AI analysis for ${activeClient.name}: Review the latest biomarker reports alongside training/nutrition adherence. Systemic recovery (sleep and stress scores) is the primary driver of biological markers. Correct any supplement gaps before adjusting caloric or training protocols.`;
      }

      setCannedAnswer(answer);
      setIsAsking(false);
    }, 600);
  };

  // Handle Mark Reviewed
  const handleMarkReviewed = () => {
    // Add setClientStatus action inside store.ts and update state here
    if (typeof actions.setClientStatus === "function") {
      actions.setClientStatus(activeClientId, "active");
    }
    toast.success(`AI brief reviewed and acknowledged for ${activeClient.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex gap-2.5 items-center">
        <Shield className="h-4 w-4 text-primary shrink-0" />
        <p className="text-[11px] font-mono text-primary uppercase tracking-wide">
          AI-assisted coaching brief — for coach review only. Not medical advice.
        </p>
      </div>

      {/* Main Grid */}
      <div className={cn("grid gap-5", !clientId ? "md:grid-cols-[200px_1fr]" : "grid-cols-1")}>
        
        {/* Client Roster List (General Mode only) */}
        {!clientId && (
          <div className="space-y-2 border-r border-border/40 pr-3 hidden md:block">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Client Attention
            </div>
            {clients.map((c) => {
              const isSelected = c.id === selectedClientId;
              const hasAlert = c.status === "review" || c.trainingCompliance < 80 || c.nutritionCompliance < 80;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClientId(c.id);
                    setCannedAnswer(null);
                    setQuestion("");
                  }}
                  className={cn(
                    "w-full text-left rounded-xl p-2 transition flex items-center gap-2.5 border",
                    isSelected 
                      ? "bg-primary/10 border-primary/40 text-primary" 
                      : "bg-background/40 border-transparent hover:border-border/60 hover:bg-secondary/20"
                  )}
                >
                  <div className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[10px] shrink-0`}>
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.goal}</div>
                  </div>
                  {hasAlert && (
                    <span className="h-2 w-2 rounded-full bg-status-above animate-pulse-glow" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Client Briefing Area */}
        <div className="space-y-5">
          {/* Client Header Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-border/40 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-display text-xl font-bold">{activeClient.name}</h3>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 font-bold uppercase rounded-full border",
                  riskLevel === "high" ? "text-status-high border-status-high/30 bg-status-high/5" :
                  riskLevel === "medium" ? "text-status-above border-status-above/30 bg-status-above/5" :
                  "text-status-optimal border-status-optimal/30 bg-status-optimal/5"
                )}>
                  {riskLevel === "high" ? "High Risk Attention" : 
                   riskLevel === "medium" ? "Moderate Attention" : 
                   "Optimal / Low Risk"}
                </span>
                {activeClient.status === "review" && (
                  <span className="chip border-status-above/40 text-status-above">Review Required</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Goal: {activeClient.goal}</p>
            </div>
            
            {activeClient.status === "review" && (
              <Button variant="neon" size="sm" onClick={handleMarkReviewed} className="w-full sm:w-auto">
                <ThumbsUp className="h-3.5 w-3.5" /> Mark Reviewed
              </Button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Adherence and Biomarkers */}
            <div className="space-y-4">
              {/* Adherence compliance stats */}
              <div className="lab-card p-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" /> Protocol Compliance
                </h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-background/40 border border-border p-2">
                    <div className="text-[10px] text-muted-foreground font-mono">TRAINING</div>
                    <div className={cn("font-mono-data text-lg mt-0.5", activeClient.trainingCompliance >= 80 ? "text-status-optimal" : "text-status-above")}>
                      {activeClient.trainingCompliance}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-background/40 border border-border p-2">
                    <div className="text-[10px] text-muted-foreground font-mono">NUTRITION</div>
                    <div className={cn("font-mono-data text-lg mt-0.5", activeClient.nutritionCompliance >= 80 ? "text-status-optimal" : "text-status-above")}>
                      {activeClient.nutritionCompliance}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Biomarker anomalies */}
              <div className="lab-card p-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-status-above" /> Biomarker Alerts
                </h4>
                {anomalies.length === 0 ? (
                  <div className="text-xs text-muted-foreground">All tested biomarkers are within standard or optimal bounds.</div>
                ) : (
                  <div className="space-y-2">
                    {anomalies.map((a, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-background/40 border border-border/60 p-2.5 text-xs">
                        <span className="font-semibold">{a.markerName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-data">{a.value} {a.unit}</span>
                          <span className={cn(
                            "text-[9px] font-bold uppercase",
                            a.status === "high" ? "text-status-high" : "text-status-low"
                          )}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lab changes and Adherence changes */}
            <div className="space-y-4">
              <div className="lab-card p-4 h-full flex flex-col">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Beaker className="h-3.5 w-3.5 text-primary" /> Key Biomarker Trends
                </h4>
                {!latestPanel ? (
                  <div className="text-xs text-muted-foreground flex-1 flex items-center justify-center">No blood panels uploaded yet.</div>
                ) : !prevPanel ? (
                  <div className="text-xs text-muted-foreground flex-1 flex flex-col justify-center gap-1">
                    <span>Only baseline panel on file ({latestPanel.date}).</span>
                    <span className="text-[11px] text-muted-foreground/80">Compare trends after adding a second panel.</span>
                  </div>
                ) : diffs.length === 0 ? (
                  <div className="text-xs text-muted-foreground flex-1 flex items-center justify-center">No significant marker changes between recent panels.</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin flex-1">
                    {diffs.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                        <span className="text-muted-foreground">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-data text-muted-foreground/80">{d.prev} → {d.current}</span>
                          <span className={cn(
                            "font-bold font-mono",
                            d.isGood ? "text-status-optimal" : "text-status-above"
                          )}>
                            {d.pct > 0 ? "+" : ""}{d.pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Check-in summary */}
          {latestCheckIn && (
            <div className="lab-card p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Latest Weekly Check-in Summary ({latestCheckIn.date})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center mb-3">
                <MiniScore label="Energy" value={latestCheckIn.energyScore} />
                <MiniScore label="Sleep" value={latestCheckIn.sleepQuality} />
                <MiniScore label="Mood" value={latestCheckIn.moodScore} />
                <MiniScore label="Stress" value={latestCheckIn.stressScore} />
                <MiniScore label="Weight" value={`${latestCheckIn.bodyWeightKg} kg`} />
              </div>
              <div className="space-y-2 text-xs">
                {latestCheckIn.winsThisWeek && (
                  <div className="rounded-lg bg-background/20 border border-border p-2">
                    <span className="text-status-optimal font-bold">Weekly Wins: </span>
                    <span className="text-muted-foreground">{latestCheckIn.winsThisWeek}</span>
                  </div>
                )}
                {latestCheckIn.strugglesThisWeek && (
                  <div className="rounded-lg bg-background/20 border border-border p-2">
                    <span className="text-status-above font-bold">Weekly Struggles: </span>
                    <span className="text-muted-foreground">{latestCheckIn.strugglesThisWeek}</span>
                  </div>
                )}
                {latestCheckIn.questionForCoach && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                    <span className="text-primary font-bold">Question for Coach: </span>
                    <span className="text-foreground">{latestCheckIn.questionForCoach}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggested Coach Questions & Next Actions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="lab-card p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" /> Suggested Roster Questions
              </h4>
              <ul className="space-y-2 text-xs list-disc list-inside text-muted-foreground">
                {getSuggestedQuestions(activeClient).map((q, i) => (
                  <li key={i} className="leading-relaxed pl-1 -indent-4 ml-4">
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lab-card p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-primary" /> Recommended Next Actions
              </h4>
              <ul className="space-y-2 text-xs list-disc list-inside text-muted-foreground">
                {getSuggestedActions(activeClient).map((a, i) => (
                  <li key={i} className="leading-relaxed pl-1 -indent-4 ml-4">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ask AI Console */}
          <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-foreground">Ask AI Assistant</h4>
            </div>
            
            <form onSubmit={handleAskAI} className="flex gap-2">
              <Input
                placeholder={`Ask about ${activeClient.name}'s thyroid, sleep, training, or lipids…`}
                className="bg-background border-border text-xs flex-1 h-9"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isAsking}
              />
              <Button type="submit" variant="neon" size="sm" className="h-9 shrink-0 px-3" disabled={isAsking}>
                {isAsking ? "Analyzing..." : <><Send className="h-3.5 w-3.5" /> Ask</>}
              </Button>
            </form>

            {cannedAnswer && (
              <div className="rounded-lg border border-primary/30 bg-card p-3 text-xs leading-relaxed animate-fade-in">
                <div className="text-[9px] font-mono text-primary uppercase mb-1.5 flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Co-Pilot Recommendation
                </div>
                <p className="text-muted-foreground">{cannedAnswer}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background/30 border border-border/60 py-1.5 px-1">
      <div className="text-[9px] font-mono text-muted-foreground uppercase">{label}</div>
      <div className="text-xs font-semibold mt-0.5">{value}</div>
    </div>
  );
}
