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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-28 md:pb-12 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-900/60 px-6 py-4 flex items-center gap-3 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span className="text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Athlete OS
          </span>
        </div>
        <div className="flex-1" />
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 border border-zinc-800 bg-zinc-900/40 rounded-full p-1 mr-4">
          {[
            { id: "home", label: "Dashboard", icon: HomeIcon },
            { id: "labs", label: "Performance", icon: Beaker },
            { id: "program", label: "Protocol", icon: Dumbbell },
            { id: "checkin", label: "Check-in", icon: ClipboardCheck },
            { id: "notes", label: "Coach Note", icon: StickyNote },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as "home" | "labs" | "program" | "checkin" | "notes")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200",
                activeTab === t.id
                  ? "bg-zinc-100 text-zinc-900 font-bold shadow-lg"
                  : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        <Link to="/" className="text-xs text-zinc-400 hover:text-zinc-100 inline-flex items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 rounded-xl transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit Portal
        </Link>
      </header>

      {/* Main viewport wrapped in a centered max-width mobile column */}
      <main className="max-w-md md:max-w-lg w-full mx-auto p-4 flex-1 flex flex-col justify-start space-y-6">
        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in">
            {/* Branded Aspirational Welcome Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-xl">
              {/* Subtle design gradient accent */}
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">WARREN ATHLETICS</span>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      Hello, {client.name.split(" ")[0]}
                    </h1>
                    <p className="text-sm text-zinc-400">
                      Coached by <span className="text-zinc-200 font-medium">Warren Germishuizen</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-medium border border-zinc-800 bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full uppercase tracking-wider">
                    Active Client
                  </span>
                </div>

                <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">Program Focus</span>
                    <div className="text-sm font-semibold text-zinc-200 mt-0.5">{client.goal}</div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-semibold h-9 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => { setActiveTab("program"); }}
                  >
                    View Today's Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Performance SVG Rings Section */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 ml-1">Daily Completion Status</span>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { 
                    label: "Bio Score", 
                    value: score, 
                    display: `${score}`, 
                    color: "stroke-emerald-400",
                    action: () => setActiveTab("labs") 
                  },
                  { 
                    label: "Training", 
                    value: client.trainingCompliance, 
                    display: `${client.trainingCompliance}%`, 
                    color: "stroke-emerald-400",
                    action: () => { setActiveTab("program"); }
                  },
                  { 
                    label: "Protocol", 
                    value: client.nutritionCompliance, 
                    display: `${client.nutritionCompliance}%`, 
                    color: "stroke-emerald-400",
                    action: () => { setActiveTab("program"); } 
                  },
                  { 
                    label: "Check-in", 
                    value: hasCheckedInToday ? 100 : 0, 
                    display: hasCheckedInToday ? "DONE" : "DUE", 
                    color: hasCheckedInToday ? "stroke-emerald-400" : "stroke-amber-400",
                    action: () => setActiveTab("checkin") 
                  }
                ].map((ring, idx) => {
                  const size = 62;
                  const strokeWidth = 3.5;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = radius * 2 * Math.PI;
                  const offset = circumference - (ring.value / 100) * circumference;

                  return (
                    <div 
                      key={idx}
                      onClick={ring.action}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60 transition-all cursor-pointer shadow-md"
                    >
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className="stroke-zinc-850"
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-sans text-xs font-bold text-white leading-none">
                          {ring.display}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium tracking-normal mt-3 text-center truncate w-full">
                        {ring.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Focus Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Today's Focus Status</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active Protocol
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-850">
                  <span className="text-[10px] font-medium text-zinc-500 block">Training Target</span>
                  <span className="font-semibold text-zinc-200 mt-1 block">Pull Strength + Recovery</span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-850">
                  <span className="text-[10px] font-medium text-zinc-500 block">Nutrition Intake</span>
                  <span className="font-semibold text-zinc-200 mt-1 block">Standard Protocol Targets</span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-850">
                  <span className="text-[10px] font-medium text-zinc-500 block">Supplementation</span>
                  <span className="font-semibold text-zinc-200 mt-1 block">{client.nutritionCompliance}% Completed</span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-850">
                  <span className="text-[10px] font-medium text-zinc-500 block">Weekly Review</span>
                  <span className={cn(
                    "font-semibold mt-1 block",
                    hasCheckedInToday ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {hasCheckedInToday ? "Submitted" : "Action Needed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Lab Snapshot Card */}
            <div 
              onClick={() => setActiveTab("labs")}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700/60 transition-all cursor-pointer shadow-md space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-sm font-bold flex items-center gap-1.5 text-zinc-200">
                  <Beaker className="h-4 w-4 text-emerald-400" /> Performance Markers Snapshot
                </h3>
                <span className="text-[9px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                  Read Only
                </span>
              </div>
              <p className="text-xs text-zinc-450 leading-relaxed">
                Biomarkers are verified against clinical health thresholds. Your metrics indicate stable metabolic and recovery status.
              </p>
              <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 block">Health Rating</span>
                  <div className="font-display text-2xl font-black text-white mt-1">
                    {score} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-medium text-zinc-500 block">Last Verified Date</span>
                  <div className="font-sans text-[11px] font-medium text-zinc-200 mt-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full inline-block">
                    {latestPanel ? latestPanel.date : "Pending"}
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Note Overview */}
            <div 
              onClick={() => setActiveTab("notes")}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700/60 transition-all cursor-pointer shadow-md border-l-4 border-l-emerald-500 space-y-3"
            >
              <h3 className="font-display text-sm font-bold flex items-center gap-1.5 text-zinc-200">
                <StickyNote className="h-4 w-4 text-emerald-400" /> Coach Guidance Note
              </h3>
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                "{client.notes || "Focus on hitting the correct tempos on your training splits. Let's keep hydration elevated."}"
              </p>
              <div className="text-[10px] flex items-center justify-between text-zinc-500">
                <span>Updated recently</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                  Read details & respond →
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "labs" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="h-5 w-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold text-white">Performance Markers History</h2>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
              <BloodPanelDashboard clientId={id} panels={panels} readOnly={true} />
            </div>
          </div>
        )}

        {activeTab === "program" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold text-white">Active Coaching Protocol</h2>
            </div>

            <TrainingPlanCards clientId={id} />

            <div className="pt-6 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4 text-emerald-400" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">Today's Supplement Protocol</h3>
              </div>
              <SupplementChecklist clientId={id} />
            </div>
          </div>
        )}

        {activeTab === "checkin" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold text-white">Weekly Performance Reflection</h2>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
              <CheckInSubmissionForm clientId={id} onSubmitSuccess={() => setActiveTab("home")} />
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 border-l-4 border-l-emerald-500 shadow-md">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h3 className="font-display text-lg font-bold flex items-center gap-2 text-white">
                  <StickyNote className="h-5 w-5 text-emerald-400" /> Coach Protocol Notes
                </h3>
                <span className="text-[10px] font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-zinc-200">
                  "{client.notes || "Focus on hitting the correct tempos on your training splits. Let's keep hydration elevated."}"
                </p>
                <div className="text-[11px] text-zinc-500 font-sans">
                  Recommended by Coach Warren Germishuizen on 2026-05-23
                </div>
              </div>

              {/* Functional Acknowledge Button */}
              <div className="pt-2 flex justify-start">
                <Button 
                  onClick={handleAcknowledge}
                  disabled={isAcknowledged}
                  variant={isAcknowledged ? "outline" : "hero"}
                  className={cn(
                    "w-full sm:w-auto font-semibold rounded-xl text-xs h-10 px-5",
                    isAcknowledged ? "border-zinc-800 text-zinc-400" : "bg-emerald-500 text-zinc-950 hover:bg-emerald-600"
                  )}
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
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-md">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display text-base font-bold text-white">Coach Feedback Thread</h3>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {/* Seed messages */}
                <div className="bg-zinc-900/80 rounded-xl p-3.5 max-w-[85%] self-start border border-zinc-800/80">
                  <span className="block text-[9px] font-semibold text-emerald-400 uppercase mb-1">Coach Warren</span>
                  <p className="text-sm text-zinc-200">Marcus, let's push the incline DB press this week. How is your shoulder feeling on the concentric phase?</p>
                </div>
                
                {replies.map((r, i) => (
                  <div key={i} className="bg-zinc-800 border border-zinc-750 rounded-xl p-3.5 max-w-[85%] ml-auto text-right shadow-sm">
                    <span className="block text-[9px] font-semibold text-zinc-400 uppercase mb-1">You</span>
                    <p className="text-sm text-zinc-200">{r}</p>
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
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/60 text-white placeholder-zinc-500"
                />
                <Button type="submit" size="sm" className="px-4 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl h-10">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom navigation bar for Mobile Viewports (< 768px) */}
      <div className="md:hidden fixed bottom-5 left-5 right-5 border border-zinc-800 bg-zinc-950/90 backdrop-blur-md z-30 flex justify-around py-3 px-2 rounded-2xl shadow-xl">
        {[
          { id: "home", label: "Home", icon: HomeIcon },
          { id: "labs", label: "Performance", icon: Beaker },
          { id: "program", label: "Protocol", icon: Dumbbell },
          { id: "checkin", label: "Check-in", icon: ClipboardCheck },
          { id: "notes", label: "Notes", icon: StickyNote },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as "home" | "labs" | "program" | "checkin" | "notes")}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 transition-all rounded-xl",
              activeTab === t.id ? "text-emerald-400 scale-105" : "text-zinc-500"
            )}
          >
            <t.icon className={cn("h-5 w-5", activeTab === t.id ? "stroke-[2.5]" : "stroke-[1.8]")} />
            <span className="text-[9px] font-sans font-medium tracking-normal">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
