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
    <div className="min-h-screen bg-zinc-950 text-foreground flex flex-col pb-24 md:pb-8">
      {/* Header */}
      <header className="border-b border-zinc-900 px-5 py-4 flex items-center gap-3 sticky top-0 bg-zinc-950/80 backdrop-blur z-30">
        <div className="flex items-center gap-2">
          <Logo compact />
          <span className="text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Athlete OS
          </span>
        </div>
        <div className="flex-1" />
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 border border-zinc-800/80 bg-zinc-900/40 rounded-full p-1 mr-4">
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
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                activeTab === t.id
                  ? "bg-primary text-black font-bold shadow-[0_0_12px_rgba(0,255,128,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 rounded-xl transition">
          <ArrowLeft className="h-3 w-3" /> Exit
        </Link>
      </header>

      {/* Main viewport wrapped in a centered max-width mobile column */}
      <main className="max-w-md md:max-w-lg w-full mx-auto p-4 flex-1 flex flex-col justify-start">
        {activeTab === "home" && (
          <div className="space-y-5 animate-fade-in">
            {/* Welcome Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 shadow-2xl">
              {/* Radial glow background pattern */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-primary/80 font-bold">Athlete Command Center</span>
                    <h1 className="font-display text-2xl font-black text-white tracking-tight mt-1">
                      Welcome, {client.name.split(" ")[0]}
                    </h1>
                    <p className="text-[11.5px] text-zinc-400 mt-1 font-medium">
                      Coach: <span className="text-zinc-200 font-bold">Warren Germishuizen</span>
                    </p>
                  </div>
                  <span className="text-[8.5px] font-mono border border-zinc-700 bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    V1.2 Active
                  </span>
                </div>

                <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[8.5px] font-mono uppercase text-zinc-500">Active Goal Focus</span>
                    <div className="text-xs font-bold text-zinc-100">{client.goal}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="hero" 
                    className="text-[9.5px] font-bold h-7 px-3.5 shadow-[0_0_12px_rgba(0,255,128,0.15)] rounded-lg font-mono uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
                    onClick={() => { setActiveTab("program"); setProgramSubTab("workout"); }}
                  >
                    View Today's Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Performance SVG Rings Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold ml-1">Live Adherence Status</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { 
                    label: "Bio Score", 
                    value: score, 
                    display: `${score}`, 
                    color: "stroke-primary",
                    action: () => setActiveTab("labs") 
                  },
                  { 
                    label: "Training", 
                    value: client.trainingCompliance, 
                    display: `${client.trainingCompliance}%`, 
                    color: "stroke-primary",
                    action: () => { setActiveTab("program"); setProgramSubTab("workout"); }
                  },
                  { 
                    label: "Protocol", 
                    value: client.nutritionCompliance, 
                    display: `${client.nutritionCompliance}%`, 
                    color: "stroke-primary",
                    action: () => { setActiveTab("program"); setProgramSubTab("supplements"); } 
                  },
                  { 
                    label: "Check-in", 
                    value: hasCheckedInToday ? 100 : 0, 
                    display: hasCheckedInToday ? "DONE" : "DUE", 
                    color: hasCheckedInToday ? "stroke-primary" : "stroke-destructive",
                    action: () => setActiveTab("checkin") 
                  }
                ].map((ring, idx) => {
                  const size = 55;
                  const strokeWidth = 4;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = radius * 2 * Math.PI;
                  const offset = circumference - (ring.value / 100) * circumference;

                  return (
                    <div 
                      key={idx}
                      onClick={ring.action}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700/80 transition-all cursor-pointer shadow-lg"
                    >
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className="stroke-zinc-800"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                          />
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className={cn("transition-all duration-500 ease-out", ring.color)}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-[10px] font-bold text-white leading-none">
                          {ring.display}
                        </div>
                      </div>
                      <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-400 mt-2 text-center truncate w-full">
                        {ring.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Focus Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Today's Focus Status</span>
                <span className="text-[9px] font-mono text-primary flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Active Protocol
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-500 block">Training Target</span>
                  <span className="font-bold text-zinc-200 mt-0.5 block">Pull Strength + Recovery</span>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-500 block">Nutrition Intake</span>
                  <span className="font-bold text-zinc-200 mt-0.5 block">Standard Protocol Targets</span>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-500 block">Supplementation</span>
                  <span className="font-bold text-zinc-200 mt-0.5 block">{client.nutritionCompliance}% Completed</span>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-500 block">Weekly Review</span>
                  <span className={cn(
                    "font-bold mt-0.5 block",
                    hasCheckedInToday ? "text-primary" : "text-destructive"
                  )}>
                    {hasCheckedInToday ? "Submitted" : "Action Needed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Lab Snapshot Card */}
            <div 
              onClick={() => setActiveTab("labs")}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700/80 transition-all cursor-pointer shadow-lg space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-zinc-300">
                  <Beaker className="h-3.5 w-3.5 text-primary" /> Biological Health Snapshot
                </h3>
                <span className="font-mono text-[9px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                  Read Only
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Your biomarkers are linked directly with clinical validation parameters. All values remain within targeted coaching adjustments.
              </p>
              <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-850 p-3 rounded-lg">
                <div>
                  <span className="text-[8px] font-mono uppercase text-zinc-500">Overall Health Score</span>
                  <div className="font-display text-xl font-black text-glow text-primary mt-0.5">
                    {score} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-mono uppercase text-zinc-500">Last Verified Date</span>
                  <div className="font-mono text-[9.5px] font-semibold text-zinc-200 mt-0.5 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full inline-block">
                    {latestPanel ? latestPanel.date : "Pending Setup"}
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Note Overview */}
            <div 
              onClick={() => setActiveTab("notes")}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-zinc-700/80 transition-all cursor-pointer shadow-lg border-l-4 border-l-primary space-y-2.5"
            >
              <h3 className="font-display text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-zinc-300">
                <StickyNote className="h-3.5 w-3.5 text-primary" /> Note from Coach Warren
              </h3>
              <p className="text-[11px] text-zinc-200 italic leading-relaxed">
                "{client.notes || "Focus on hitting the correct tempos on your training splits. Let's keep hydration elevated."}"
              </p>
              <div className="text-[8.5px] font-mono flex items-center justify-between text-zinc-500">
                <span>Updated recently</span>
                <span className="text-primary font-bold uppercase tracking-wider flex items-center gap-0.5 hover:underline">
                  Read details & respond →
                </span>
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
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Dumbbell className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Active Coaching Protocol</h2>
            </div>

            <TrainingPlanCards clientId={id} />

            <div className="pt-6 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">Today's Supplement Protocol</h3>
              </div>
              <SupplementChecklist clientId={id} />
            </div>
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
          <div className="space-y-5 animate-fade-in">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4 border-l-4 border-l-primary shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h3 className="font-display text-lg font-bold flex items-center gap-1.5 text-zinc-150">
                  <StickyNote className="h-5 w-5 text-primary" /> Coach Protocol Notes
                </h3>
                <span className="chip border-primary/40 text-primary font-mono text-[9px] uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-zinc-200">
                  "{client.notes || "Focus on hitting the correct tempos on your training splits. Let's keep hydration elevated."}"
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">
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
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-bold text-zinc-150">Feedback Thread</h3>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {/* Seed messages */}
                <div className="bg-zinc-900/80 rounded-xl p-3 max-w-[85%] self-start border border-zinc-800/80">
                  <span className="block text-[8px] font-mono text-primary uppercase font-bold mb-1">Coach Warren</span>
                  <p className="text-xs text-zinc-200">Marcus, let's push the incline DB press this week. How is your shoulder feeling on the concentric phase?</p>
                </div>
                
                {replies.map((r, i) => (
                  <div key={i} className="bg-primary/10 border border-primary/20 rounded-xl p-3 max-w-[85%] ml-auto text-right shadow-sm">
                    <span className="block text-[8px] font-mono text-primary uppercase font-bold mb-1">You</span>
                    <p className="text-xs text-zinc-150">{r}</p>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-zinc-800/80">
                <input
                  type="text"
                  placeholder="Type a response to your coach..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 text-white placeholder-zinc-500"
                />
                <Button type="submit" size="sm" variant="neon" className="px-3">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom navigation bar for Mobile Viewports (< 768px) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-lg z-30 flex justify-around py-2 px-1 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
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
              activeTab === t.id ? "text-primary scale-105" : "text-zinc-500"
            )}
          >
            <t.icon className={cn("h-5 w-5", activeTab === t.id ? "stroke-[2.5]" : "stroke-[1.8]")} />
            <span className="text-[8px] uppercase font-mono tracking-wider">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
