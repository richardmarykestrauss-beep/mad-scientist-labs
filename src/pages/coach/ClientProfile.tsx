import { useState, useMemo } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FeaturePlannedDialog } from "@/components/lab/FeaturePlannedDialog";
import { 
  ArrowLeft, 
  Beaker, 
  ClipboardList, 
  Dumbbell, 
  FileText, 
  MessageSquare, 
  Pill, 
  Salad, 
  StickyNote, 
  ImageIcon, 
  CalendarCheck, 
  ChevronRight, 
  Brain, 
  Calendar,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Upload,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  CheckCircle,
  Check
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useStore, getClientPanels, getCheckInsForClient, actions } from "@/data/store";
import type { Client, BloodPanel, CheckIn } from "@/lib/types";
import { BloodPanelDashboard } from "@/components/blood/BloodPanelDashboard";
import { BloodReportUploadFlow } from "@/components/blood/BloodReportUploadFlow";
import { Button } from "@/components/ui/button";
import { AICoachBriefing } from "@/components/coach/AICoachBriefing";
import NutritionPlanPanel from "@/components/coach/NutritionPlanPanel";
import TrainingPlanPanel from "@/components/coach/TrainingPlanPanel";
import SupplementProtocolPanel from "@/components/coach/SupplementProtocolPanel";
import CoachNotesPanel from "@/components/coach/CoachNotesPanel";
import { BIOMARKERS, getStatus, STATUS_META } from "@/lib/biomarkers";
import { cn } from "@/lib/utils";

export default function ClientProfile() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const { clients, panels } = useStore();
  const client = clients.find((c) => c.id === id);
  const clientPanels = getClientPanels(id);
  const checkIns = getCheckInsForClient(id);

  const [plannedFeature, setPlannedFeature] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Calculate Biology Score & out of range count dynamically
  const latestPanel = clientPanels[clientPanels.length - 1];
  const { biologyScore, outOfRangeCount, outOfRangeMarkers } = useMemo(() => {
    if (!latestPanel) return { biologyScore: 75, outOfRangeCount: 0, outOfRangeMarkers: [] };
    let optimal = 0, total = 0, alertCount = 0;
    const alertMarkers: { name: string; value: number; unit: string; statusLabel: string; color: string }[] = [];

    for (const r of latestPanel.results) {
      const def = BIOMARKERS.find(b => b.key === r.key);
      if (!def) continue;
      const status = getStatus(def, r.value);
      if (status === "optimal") {
        optimal++;
      } else {
        if (status === "high" || status === "low") {
          alertCount++;
          const meta = STATUS_META[status];
          alertMarkers.push({
            name: def.name,
            value: r.value,
            unit: def.unit,
            statusLabel: meta.label,
            color: meta.color
          });
        }
      }
      total++;
    }
    const score = total ? Math.round((optimal / total) * 100) : 75;
    return { 
      biologyScore: score, 
      outOfRangeCount: alertCount,
      outOfRangeMarkers: alertMarkers
    };
  }, [latestPanel]);

  // Derived metrics
  const trainingAdherence = client ? client.trainingCompliance : 0;
  const nutritionAdherence = client ? client.nutritionCompliance : 0;
  const sleepAdherence = checkIns[0] ? Math.round(checkIns[0].sleepQuality * 10) : 68;
  const combinedAdherence = Math.round((trainingAdherence + nutritionAdherence) / 2);

  // Dynamic Timeline events
  const timelineEvents = useMemo(() => {
    if (!client) return [];
    const list: { date: string; title: string; desc: string; type: "checkin" | "upload" | "protocol" | "note" | "onboard" }[] = [];
    
    // StartedAt onboarded event
    list.push({
      date: client.startedAt,
      title: "Client onboarded",
      desc: "Welcome to the Bio-Performance Lab",
      type: "onboard"
    });

    // Checkins events
    checkIns.forEach(c => {
      list.push({
        date: c.date,
        title: "Check-in submitted",
        desc: `Weekly telemetry logs: Sleep ${c.sleepQuality}/10, Energy ${c.energyScore}/10`,
        type: "checkin"
      });
    });

    // Blood panels uploads
    clientPanels.forEach(p => {
      list.push({
        date: p.date,
        title: "Blood report uploaded",
        desc: `Biomarker panel: "${p.label}" with ${p.results.length} markers`,
        type: "upload"
      });
    });

    // Coach notes
    if (client.notes) {
      list.push({
        date: "2026-05-23",
        title: "Coach note added",
        desc: "Special focus on evening bloating and sleep consistency",
        type: "note"
      });
    }

    // Protocol updates
    list.push({
      date: "2026-05-20",
      title: "Protocol updated",
      desc: "Adjusted training volume and supplement schedules",
      type: "protocol"
    });

    // Sort descending by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [client, checkIns, clientPanels]);

  if (!client) return <div className="text-muted-foreground p-6 text-center">Athlete not found.</div>;

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <Link to="/coach/clients" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition">
        <ArrowLeft className="h-3 w-3" /> Back to Roster
      </Link>

      {/* Premium Identity Card */}
      <div className="lab-card-glow p-4 flex flex-col xl:flex-row gap-5 items-start xl:items-center justify-between border border-border/80">
        <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center min-w-0 flex-1">
          <div className={`grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br ${client.avatarColor} text-background font-bold text-xl shadow-lg shrink-0`}>
            {client.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl md:text-2xl font-bold truncate text-glow text-primary">{client.name}</h1>
              <span className={cn(
                "chip capitalize py-0.5 px-2 text-[8px] font-mono tracking-wider font-bold",
                client.status === "review"
                  ? "text-status-above border-status-above/30 bg-status-above/10"
                  : "text-status-optimal border-status-optimal/30 bg-status-optimal/10"
              )}>
                {client.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              Onboarded: {client.startedAt} · Email: {client.email} · Next Check-In: {client.nextCheckIn}
            </div>
            <div className="text-xs text-foreground font-semibold mt-2 flex items-center gap-1.5">
              <span className="text-muted-foreground font-mono uppercase text-[8px] tracking-wider">Goal:</span> {client.goal}
            </div>
          </div>
        </div>

        {/* Biology Score Dial */}
        <div className="flex items-center gap-3 bg-background/25 border border-border/50 p-2.5 rounded-xl shrink-0 w-full sm:w-auto self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="text-left">
            <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">Biology Score</span>
            <div className="font-display text-2xl font-bold text-glow text-primary mt-0.5">
              {biologyScore} <span className="text-[10px] text-muted-foreground font-normal font-sans">/ 100</span>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right sm:text-left">
            <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">Biology Rating</span>
            <div className="text-xs font-semibold text-foreground mt-1 uppercase font-mono tracking-wide">
              {biologyScore >= 80 ? "Optimal" : biologyScore >= 65 ? "Good" : "Needs Review"}
            </div>
          </div>
        </div>
      </div>

      {/* Circular Performance Metrics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <MetricTile label="Training" value={trainingAdherence} unit="%" rating={trainingAdherence >= 80 ? "Good" : "Fair"} color="primary" />
        <MetricTile label="Nutrition" value={nutritionAdherence} unit="%" rating={nutritionAdherence >= 80 ? "Good" : "Fair"} color="primary" />
        <MetricTile label="Recovery" value={sleepAdherence} unit="%" rating={sleepAdherence >= 70 ? "Good" : "Fair"} color="primary" />
        <MetricTile label="Adherence" value={combinedAdherence} unit="%" rating={combinedAdherence >= 80 ? "Good" : "Fair"} color="primary" />
        <MetricTile label="Lab Alerts" value={outOfRangeCount} unit="alerts" rating={outOfRangeCount === 0 ? "Optimal" : "Watch"} color={outOfRangeCount === 0 ? "primary" : "warn"} />
      </div>

      {/* Command Pills Navigation Tabs */}
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="w-full">
        <TabsList className="bg-card/30 border border-border/60 h-auto p-1 flex flex-wrap gap-0.5 justify-start rounded-lg">
          {[
            { v: "overview", l: "Overview", i: ClipboardList },
            { v: "ai-briefing", l: "AI Briefing", i: Brain },
            { v: "blood", l: "Labs & Chemistry", i: Beaker },
            { v: "upload", l: "Upload Report", i: Upload },
            { v: "training", l: "Training Protocol", i: Dumbbell },
            { v: "nutrition", l: "Nutrition Plan", i: Salad },
            { v: "supplements", l: "Supplements", i: Pill },
            { v: "checkins", l: "Check-ins", i: CalendarCheck },
            { v: "notes", l: "Coach Notes", i: StickyNote },
          ].map((t) => (
            <TabsTrigger 
              key={t.v} 
              value={t.v} 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none gap-1 text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md border border-transparent data-[state=active]:border-primary/20 transition-all duration-150"
            >
              <t.i className="h-3 w-3" /> {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab contents */}
        <TabsContent value="overview" className="mt-4 space-y-3">
          <div className="grid lg:grid-cols-3 gap-3.5">
            
            {/* Timeline Left Column */}
            <div className="lab-card-glow p-4 space-y-3.5 border border-border/80 lg:col-span-1">
              <div>
                <h3 className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Roster Telemetry Log
                </h3>
                <p className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">
                  Chronological action timeline
                </p>
              </div>

              <div className="relative border-l border-border pl-3 ml-2 py-1 space-y-4.5 text-xs">
                {timelineEvents.slice(0, 5).map((evt, idx) => (
                  <div key={idx} className="relative">
                    {/* timeline node dot */}
                    <span className={cn(
                      "absolute -left-[17px] top-1 h-2 w-2 rounded-full border border-card",
                      evt.type === "checkin" && "bg-primary",
                      evt.type === "upload" && "bg-cyan-400",
                      evt.type === "note" && "bg-purple-400 animate-pulse",
                      evt.type === "protocol" && "bg-amber-500",
                      evt.type === "onboard" && "bg-muted-foreground"
                    )} />
                    <div className="font-mono text-[8.5px] text-muted-foreground">{evt.date}</div>
                    <div className="font-semibold text-foreground mt-0.5">{evt.title}</div>
                    <div className="text-[10.5px] text-muted-foreground leading-normal mt-0.5">{evt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overview & Biology details Right Column */}
            <div className="lg:col-span-2 space-y-3.5">
              
              {/* Primary goals card */}
              <div className="lab-card-glow p-4 space-y-3 border border-border/80">
                <div>
                  <h3 className="text-xs font-semibold">Primary Coaching Focus</h3>
                  <p className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">Coaching boundaries</p>
                </div>
                <div className="p-3 rounded-xl border border-border/60 bg-background/25 leading-relaxed text-xs">
                  {client.goal}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5">
                  <MiniTile label="Bodyweight" value={`${client.bodyWeightKg || "—"} kg`} />
                  <MiniTile label="Started At" value={client.startedAt} />
                  <MiniTile label="Train Compliance" value={`${trainingAdherence}%`} />
                  <MiniTile label="Nutrition Adherence" value={`${nutritionAdherence}%`} />
                </div>
              </div>

              {/* Recent Lab Summary Card */}
              <div className="lab-card-glow p-4 space-y-3 border border-border/80">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-semibold flex items-center gap-1.5">
                      <Beaker className="h-3.5 w-3.5 text-primary" /> Recent Lab Summary
                    </h3>
                    <p className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">
                      OutOfRange markers detected in latest scan
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6.5 text-[9.5px] hover:text-primary border border-transparent hover:border-border hover:bg-secondary/40 font-mono uppercase tracking-wider font-semibold"
                    onClick={() => setParams({ tab: "blood" })}
                  >
                    View Labs <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>

                <div className="space-y-2 pt-0.5">
                  {outOfRangeMarkers.length === 0 ? (
                    <div className="text-xs text-status-optimal flex items-center gap-1.5 p-2.5 rounded-xl border border-status-optimal/20 bg-status-optimal/5 font-mono">
                      All biomarkers fall within optimal ranges.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {outOfRangeMarkers.map((marker, index) => (
                        <div key={index} className="p-2.5 rounded-xl border border-border/80 bg-background/20 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-semibold text-foreground">{marker.name}</div>
                            <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{marker.value} {marker.unit}</div>
                          </div>
                          <span className={`font-mono font-bold uppercase text-[8px] border px-1.5 py-0.5 rounded ${marker.color}`}>
                            {marker.statusLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-briefing" className="mt-5">
          <AICoachBriefing clientId={id} />
        </TabsContent>
        
        <TabsContent value="blood" className="mt-5">
          <BloodPanelDashboard clientId={id} panels={clientPanels} readOnly={false} />
        </TabsContent>

        <TabsContent value="upload" className="mt-5">
          <div className="max-w-2xl mx-auto">
            <div className="lab-card-glow p-6 border border-border/80 space-y-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-primary" /> Blood Report Upload Pipeline
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                  Simulating OCR scan mapping for {client.name}
                </p>
              </div>
              <BloodReportUploadFlow clientId={id} onComplete={() => setParams({ tab: "blood" })} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="training" className="mt-5">
          <TrainingPlanPanel clientId={id} />
        </TabsContent>

        <TabsContent value="nutrition" className="mt-5">
          <NutritionPlanPanel clientId={id} />
        </TabsContent>

        <TabsContent value="supplements" className="mt-5">
          <SupplementProtocolPanel clientId={id} />
        </TabsContent>

        <TabsContent value="checkins" className="mt-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">Weekly Check-in Submissions</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                  Review historical metrics, adherence trends, and submit adjustments.
                </p>
              </div>
            </div>

            {checkIns.length === 0 ? (
              <div className="lab-card-glow p-8 text-center text-muted-foreground border border-border/80 rounded-xl">
                No check-in history found for this athlete.
              </div>
            ) : (
              <div className="space-y-3">
                {checkIns.map((ch) => (
                  <CoachCheckInItem
                    key={ch.id}
                    checkIn={ch}
                    onReview={(id, feedback) => {
                      try {
                        actions.reviewCheckIn(id, feedback, "Coach Warren");
                        toast.success("Check-in reviewed successfully!");
                      } catch (err) {
                        const error = err as Error;
                        toast.error(error.message || "Failed to submit review");
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-5">
          <CoachNotesPanel clientId={id} />
        </TabsContent>
      </Tabs>

      {plannedFeature && (
        <FeaturePlannedDialog
          isOpen={!!plannedFeature}
          onOpenChange={(open) => !open && setPlannedFeature(null)}
          featureName={plannedFeature}
        />
      )}
    </div>
  );
}

function MetricTile({ label, value, unit, rating, color = "primary" }: { label: string; value: string | number; unit: string; rating: string; color: "primary" | "warn" }) {
  return (
    <div className={cn(
      "lab-card-glow p-2.5 px-3 border transition duration-200",
      color === "primary" ? "border-border/80 hover:border-primary/30" : "border-status-above/20 hover:border-status-above/40"
    )}>
      <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1 mt-0.5">
        <div className={cn("text-xl font-bold font-display", color === "primary" ? "text-primary text-glow" : "text-status-above")}>{value}</div>
        <span className="text-[9px] text-muted-foreground font-mono">{unit}</span>
      </div>
      <div className="text-[8.5px] uppercase font-mono tracking-wide text-muted-foreground mt-1">
        Rating: <span className={cn("font-bold", color === "primary" ? "text-primary" : "text-status-above")}>{rating}</span>
      </div>
    </div>
  );
}

function MiniTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground mt-1 truncate">{value}</div>
    </div>
  );
}

function Scaffold({ title, desc, cta, onCta }: { title: string; desc: string; cta: string; onCta: () => void }) {
  return (
    <div className="lab-card-glow p-10 text-center border border-border/80">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 grid place-items-center mb-3">
        <Beaker className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{desc}</p>
      <div className="mt-4">
        <Button variant="neon" onClick={onCta} className="text-xs h-9 px-6 font-semibold">{cta}</Button>
      </div>
      <div className="mt-3 text-[10px] text-muted-foreground font-mono">Module scaffold — full builder ships in v2.</div>
    </div>
  );
}

function CoachCheckInItem({ checkIn, onReview }: { checkIn: CheckIn; onReview: (id: string, feedback: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(checkIn.coachFeedback || "");

  const isReviewed = checkIn.status === "reviewed";

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Feedback cannot be empty");
      return;
    }
    onReview(checkIn.id, feedback.trim());
  };

  return (
    <div className="lab-card-glow border border-border/80 overflow-hidden text-xs transition duration-200 hover:border-primary/30 rounded-xl">
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="checkin-header flex items-center justify-between p-4 cursor-pointer bg-background/20 hover:bg-background/40 select-none"
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-primary" />
          <div>
            <div className="font-bold text-foreground text-sm">
              Week: {checkIn.weekKey || "Legacy"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Submitted: {checkIn.submittedAt ? new Date(checkIn.submittedAt).toLocaleDateString() : checkIn.date}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={cn(
            "text-[9px] font-bold border px-2 py-0.5 rounded uppercase tracking-wider font-mono",
            isReviewed
              ? "border-emerald-500/25 bg-emerald-950/20 text-emerald-455"
              : "border-amber-500/25 bg-amber-950/20 text-amber-455"
          )}>
            {isReviewed ? "Reviewed" : "Needs Review"}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-border/60 bg-background/10 space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Body Weight</span>
              <div className="font-bold text-foreground text-sm mt-0.5">{checkIn.bodyWeightKg} kg</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Energy Level</span>
              <div className="font-bold text-foreground text-sm mt-0.5">{checkIn.energyScore}/10</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Sleep Quality</span>
              <div className="font-bold text-foreground text-sm mt-0.5">{checkIn.sleepQuality}/10</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Mood & Focus</span>
              <div className="font-bold text-foreground text-sm mt-0.5">{checkIn.moodScore}/10</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Stress Perception</span>
              <div className="font-bold text-foreground text-sm mt-0.5">{checkIn.stressScore}/10</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Training Compliance</span>
              <div className="font-bold text-emerald-450 text-sm mt-0.5">{checkIn.trainingAdherence}%</div>
            </div>
            <div className="col-span-2 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Nutrition Adherence</span>
              <div className="font-bold text-emerald-450 text-sm mt-0.5">{checkIn.nutritionAdherence}%</div>
            </div>
          </div>

          {/* Reflections */}
          <div className="space-y-2.5 pt-2 border-t border-border/40">
            <div>
              <div className="font-semibold text-muted-foreground text-[10px] uppercase font-mono tracking-wider">Digestion & Gut Health</div>
              <p className="mt-1 leading-relaxed text-foreground bg-background/30 p-2.5 rounded-lg border border-border/30">{checkIn.digestionNotes}</p>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground text-[10px] uppercase font-mono tracking-wider">Wins This Week</div>
              <p className="mt-1 leading-relaxed text-foreground bg-background/30 p-2.5 rounded-lg border border-border/30">{checkIn.winsThisWeek}</p>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground text-[10px] uppercase font-mono tracking-wider">Struggles & Bottlenecks</div>
              <p className="mt-1 leading-relaxed text-foreground bg-background/30 p-2.5 rounded-lg border border-border/30">{checkIn.strugglesThisWeek}</p>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground text-[10px] uppercase font-mono tracking-wider">Question for Coach</div>
              <p className="mt-1 leading-relaxed text-foreground bg-background/30 p-2.5 rounded-lg border border-border/30">{checkIn.questionForCoach}</p>
            </div>
          </div>

          {/* Feedback Form / Display */}
          <div className="pt-3 border-t border-border/60">
            {isReviewed ? (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-1.5">
                <div className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> Reviewed Feedback
                </div>
                <p className="text-foreground text-xs italic">
                  "{checkIn.coachFeedback}"
                </p>
                <div className="text-[9px] text-muted-foreground mt-2 font-mono">
                  Reviewed by {checkIn.reviewedBy || "Coach Warren"} {checkIn.reviewedAt && `on ${new Date(checkIn.reviewedAt).toLocaleString()}`}
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-2.5">
                <div className="space-y-1">
                  <label htmlFor={`feedback-${checkIn.id}`} className="font-semibold text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                    Coach Feedback & Protocol Adjustments
                  </label>
                  <textarea
                    id={`feedback-${checkIn.id}`}
                    rows={3}
                    placeholder="Enter actionable feedback, protocol updates, or adjustments based on this check-in..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-background/60 border border-border/80 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder-muted-foreground"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="neon"
                    className="text-xs h-9 px-4 font-semibold gap-1.5 flex items-center"
                  >
                    <CheckSquare className="h-3.5 w-3.5" /> Complete Review
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
