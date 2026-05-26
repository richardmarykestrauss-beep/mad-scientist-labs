import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore, getClientPanels, getClientCheckIns } from "@/data/store";
import { BloodPanelDashboard } from "@/components/blood/BloodPanelDashboard";
import { TrainingPlanCards } from "@/components/client/TrainingPlanCards";
import { SupplementChecklist } from "@/components/client/SupplementChecklist";
import { CheckInSubmissionForm } from "@/components/client/CheckInSubmissionForm";
import { Logo } from "@/components/lab/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ArrowLeft, Beaker, Dumbbell, MessageSquare, Pill, Salad, 
  Home as HomeIcon, ClipboardCheck, LayoutDashboard, StickyNote, Check, Send 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BIOMARKER_MAP, getStatus } from "@/lib/biomarkers";

export default function ClientHome() {
  const { id = "c-001" } = useParams();
  
  // Hook store state
  useStore();
  
  const [activeTab, setActiveTab] = useState<"home" | "labs" | "program" | "checkin" | "notes">("home");
  const [programSubTab, setProgramSubTab] = useState<"workout" | "supplements">("workout");
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<string[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const { clients } = useStore();
  const client = clients.find((c) => c.id === id);
  const panels = getClientPanels(id);
  const checkIns = getClientCheckIns(id);

  if (!client) {
    return <div className="p-6 text-center text-muted-foreground">Client profile not found.</div>;
  }

  const latestPanel = panels[panels.length - 1];
  const hasCheckedInToday = checkIns.some((c) => c.date === today);

  // Calculate lab summary stats
  const score = latestPanel ? Math.round(
    (() => {
      let optimal = 0, below = 0, above = 0, total = 0;
      for (const r of latestPanel.results) {
        const def = BIOMARKER_MAP[r.key];
        if (!def) continue;
        const s = getStatus(def, r.value);
        if (s === "optimal") optimal++;
        else if (s === "below-optimal") below++;
        else if (s === "above-optimal") above++;
        total++;
      }
      return total ? ((optimal + below * 0.6 + above * 0.6) / total) * 100 : 0;
    })()
  ) : 0;

  const handleAcknowledge = () => {
    setIsAcknowledged(true);
    toast.success("Coach note acknowledged. Notification sent to Coach Warren!");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplies([...replies, replyText.trim()]);
    setReplyText("");
    toast.success("Response sent to your coach!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-6">
      {/* Header */}
      <header className="border-b border-border px-5 py-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur z-10">
        <Logo compact />
        <div className="flex-1" />
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 border border-border/80 bg-card/40 rounded-full p-1 mr-4">
          {[
            { id: "home", label: "Dashboard", icon: HomeIcon },
            { id: "labs", label: "Labs & Health", icon: Beaker },
            { id: "program", label: "Protocol", icon: Dumbbell },
            { id: "checkin", label: "Weekly Check-in", icon: ClipboardCheck },
            { id: "notes", label: "Coach Note", icon: StickyNote },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as "home" | "labs" | "program" | "checkin" | "notes")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition",
                activeTab === t.id
                  ? "bg-primary/10 text-primary font-bold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 border border-border bg-card/60 px-3 py-1.5 rounded-xl transition">
          <ArrowLeft className="h-3 w-3" /> Exit
        </Link>
      </header>

      {/* Main viewport */}
      <main className="max-w-5xl w-full mx-auto p-4 md:p-6 flex-1">
        {activeTab === "home" && (
          <div className="space-y-4 animate-fade-in">
            {/* Today's Focus Card */}
            <div className="lab-card-glow p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border border-border/85 rounded-xl">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-primary">Lab Connected · Athlete OS</span>
                <h1 className="font-display text-xl md:text-2xl font-bold mt-0.5">Welcome back, {client.name.split(" ")[0]}</h1>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5 flex items-center gap-2">
                  <span>Goal: {client.goal}</span>
                  <span>•</span>
                  <span className="text-primary font-mono font-semibold">Coach Warren Germishuizen</span>
                </div>
              </div>
              <div className="w-full md:w-auto p-3 rounded-lg border border-primary/20 bg-primary/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
                <div>
                  <span className="text-[8.5px] font-mono uppercase text-muted-foreground/80">Today's Focus</span>
                  <div className="text-xs font-bold text-foreground">Pull Strength + Recovery</div>
                </div>
                <Button 
                  size="sm" 
                  variant="hero" 
                  className="text-[9.5px] font-bold h-6 px-3 shadow-[0_0_8px_rgba(0,255,128,0.05)] rounded font-mono uppercase tracking-wider"
                  onClick={() => { setActiveTab("program"); setProgramSubTab("workout"); }}
                >
                  View Today's Plan
                </Button>
              </div>
            </div>

            {/* Compliance Quick Dashboard / Progress Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => { setActiveTab("program"); setProgramSubTab("workout"); }}
                className="lab-card-glow p-4 cursor-pointer border border-border/85 hover:border-primary/40 hover:shadow-[0_0_8px_rgba(0,255,128,0.02)] transition flex flex-col justify-between rounded-xl"
              >
                <div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[9.5px] font-mono uppercase tracking-wider font-semibold">Training Adherence</span>
                    <Dumbbell className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <div className="font-display text-2xl font-bold text-primary text-glow">{client.trainingCompliance}%</div>
                    <span className="text-[8.5px] text-muted-foreground/80 uppercase font-mono">completed</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${client.trainingCompliance}%` }} />
                  </div>
                  <div className="flex justify-between text-[8px] text-muted-foreground/75 mt-1 font-mono">
                    <span>Target: 85%+</span>
                    <span className="text-primary font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => { setActiveTab("program"); setProgramSubTab("supplements"); }}
                className="lab-card-glow p-4 cursor-pointer border border-border/85 hover:border-primary/40 hover:shadow-[0_0_8px_rgba(0,255,128,0.02)] transition flex flex-col justify-between rounded-xl"
              >
                <div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[9.5px] font-mono uppercase tracking-wider font-semibold">Supplement Protocol</span>
                    <Pill className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <div className="font-display text-2xl font-bold text-primary text-glow">{client.nutritionCompliance}%</div>
                    <span className="text-[8.5px] text-muted-foreground/80 uppercase font-mono">taken today</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${client.nutritionCompliance}%` }} />
                  </div>
                  <div className="flex justify-between text-[8px] text-muted-foreground/75 mt-1 font-mono">
                    <span>Target: 100%</span>
                    <span className="text-primary font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Lab Snapshot */}
              <div 
                onClick={() => setActiveTab("labs")}
                className="lab-card-glow p-4 md:col-span-2 cursor-pointer border border-border/85 hover:border-primary/40 transition flex flex-col justify-between rounded-xl"
              >
                <div>
                  <h3 className="font-display text-xs font-bold flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                    <Beaker className="h-3.5 w-3.5 text-primary" /> Blood Chemistry Snapshot
                  </h3>
                  <p className="text-[11px] text-muted-foreground/80 mb-3 leading-relaxed">
                    Your biology score represents overall metabolic, hormone, and cardiovascular biomarker health.
                  </p>
                </div>
                <div className="flex items-center justify-between bg-background/40 border border-border/40 p-3 rounded-lg">
                  <div>
                    <span className="text-[8.5px] font-mono uppercase text-muted-foreground/75">Latest Score</span>
                    <div className="font-display text-2xl font-bold text-glow text-primary mt-0.5">{score} <span className="text-[11px] text-muted-foreground font-normal">/ 100</span></div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] font-mono uppercase text-muted-foreground/75">Panel Date</span>
                    <div className="font-mono text-[10px] font-semibold text-foreground mt-1 bg-secondary/40 border border-border/80 px-2 py-0.5 rounded-full inline-block">{latestPanel ? latestPanel.date : "None"}</div>
                  </div>
                </div>
              </div>

              {/* Check-in status card */}
              <div 
                onClick={() => setActiveTab("checkin")}
                className="lab-card-glow p-4 cursor-pointer border border-border/85 hover:border-primary/40 transition flex flex-col justify-between rounded-xl"
              >
                <div>
                  <h3 className="font-display text-xs font-bold flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                    <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Check-in Status
                  </h3>
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                    Weekly reviews guide adjustments to your supplement and training limits.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/40 text-center">
                  {hasCheckedInToday ? (
                    <div className="rounded bg-primary/10 border border-primary/20 p-1.5 text-[10.5px] text-primary font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Check-in Submitted
                    </div>
                  ) : (
                    <div className="rounded bg-destructive/10 border border-destructive/20 p-1.5 text-[10.5px] text-status-high font-bold uppercase tracking-wider font-mono">
                      Check-in Due Today
                    </div>
                  )}
                  <p className="text-[8.5px] text-muted-foreground/70 mt-1.5 font-mono">
                    Last check-in: {checkIns[0] ? checkIns[0].date : "None"}
                  </p>
                </div>
              </div>
            </div>

            {/* Coach Note Overview */}
            <div 
              onClick={() => setActiveTab("notes")}
              className="lab-card-glow p-4 cursor-pointer border border-border/85 hover:border-primary/40 transition border-l-2 border-l-primary rounded-xl"
            >
              <h3 className="font-display text-xs font-bold flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <StickyNote className="h-3.5 w-3.5 text-primary" /> Latest Note from Coach Warren
              </h3>
              <p className="text-[11px] text-foreground italic leading-relaxed">
                "{client.notes || "Focus on hitting the correct tempos on your training splits. Digestion was reported as bloated in the evenings, let's keep hydration elevated and see if sleep improves."}"
              </p>
              <div className="mt-2.5 text-[8.5px] text-muted-foreground/70 font-mono flex items-center justify-between">
                <span>Updated recently</span>
                <span className="text-primary font-bold hover:underline flex items-center gap-0.5 uppercase tracking-wider">Read details & respond →</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "labs" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Biomarker History & Trends</h2>
            </div>
            <BloodPanelDashboard clientId={id} panels={panels} readOnly={true} />
          </div>
        )}

        {activeTab === "program" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Active Coaching Protocol</h2>
              </div>
              <div className="flex rounded-lg border border-border p-0.5 bg-card/60">
                <button
                  onClick={() => setProgramSubTab("workout")}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-mono transition uppercase",
                    programSubTab === "workout" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  Workout
                </button>
                <button
                  onClick={() => setProgramSubTab("supplements")}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-mono transition uppercase",
                    programSubTab === "supplements" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  Supplements
                </button>
              </div>
            </div>

            {programSubTab === "workout" ? (
              <TrainingPlanCards clientId={id} />
            ) : (
              <SupplementChecklist clientId={id} />
            )}
          </div>
        )}

        {activeTab === "checkin" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Submit Weekly Check-In</h2>
            </div>
            <CheckInSubmissionForm clientId={id} onSubmitSuccess={() => setActiveTab("home")} />
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
            <div className="lab-card-glow p-5 space-y-4 border-l-4 border-l-primary">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-display text-lg font-bold flex items-center gap-1.5">
                  <StickyNote className="h-5 w-5 text-primary" /> Coach Protocol Notes
                </h3>
                <span className="chip border-primary/40 text-primary font-mono text-[9px] uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-foreground">
                  "{client.notes || "Focus on hitting the correct tempos on your training splits. Digestion was reported as bloated in the evenings, let's keep hydration elevated and see if sleep improves."}"
                </p>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Recommended by Coach Warren Germishuizen on 2026-05-23
                </div>
              </div>

              {/* Functional Acknowledge Button */}
              <div className="pt-2 flex justify-start">
                <Button 
                  onClick={handleAcknowledge}
                  disabled={isAcknowledged}
                  variant={isAcknowledged ? "outline" : "hero"}
                  className="w-full sm:w-auto"
                >
                  {isAcknowledged ? (
                    <>
                      <Check className="h-4 w-4 mr-2" /> Acknowledged by Athlete
                    </>
                  ) : (
                    "Acknowledge Protocol"
                  )}
                </Button>
              </div>
            </div>

            {/* Coach Messaging Thread */}
            <div className="lab-card-glow p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-bold">Feedback Thread</h3>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {/* Seed messages */}
                <div className="bg-secondary/40 rounded-xl p-3 max-w-[85%] self-start border border-border/20">
                  <span className="block text-[8px] font-mono text-primary uppercase font-bold mb-1">Coach Warren</span>
                  <p className="text-xs text-foreground">Marcus, let's push the incline DB press this week. How is your shoulder feeling on the concentric phase?</p>
                </div>
                
                {replies.map((r, i) => (
                  <div key={i} className="bg-primary/10 border border-primary/20 rounded-xl p-3 max-w-[85%] ml-auto text-right">
                    <span className="block text-[8px] font-mono text-primary uppercase font-bold mb-1">You</span>
                    <p className="text-xs text-foreground">{r}</p>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-border/40">
                <input
                  type="text"
                  placeholder="Type a response to your coach..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-background/60 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
                <Button type="submit" size="sm" variant="neon" className="px-3">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation bar for Mobile Viewports (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur z-20 flex justify-around py-2 px-1">
        {[
          { id: "home", label: "Home", icon: HomeIcon },
          { id: "labs", label: "Labs", icon: Beaker },
          { id: "program", label: "Protocol", icon: Dumbbell },
          { id: "checkin", label: "Check-In", icon: ClipboardCheck },
          { id: "notes", label: "Notes", icon: StickyNote },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as "home" | "labs" | "program" | "checkin" | "notes")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 transition-all rounded-xl",
              activeTab === t.id ? "text-primary" : "text-muted-foreground"
            )}
          >
            <t.icon className={cn("h-5 w-5", activeTab === t.id ? "stroke-[2.5]" : "stroke-[1.8]")} />
            <span className="text-[9px] uppercase font-mono tracking-wider">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
