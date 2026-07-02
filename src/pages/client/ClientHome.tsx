import { useState, useEffect } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { useStore, getClientPanels, getLatestActiveCoachNote, actions } from "@/data/store";
import { BloodPanelDashboard } from "@/components/blood/BloodPanelDashboard";
import { TrainingPlanCards } from "@/components/client/TrainingPlanCards";
import { SupplementChecklist } from "@/components/client/SupplementChecklist";
import { CheckInSubmissionForm } from "@/components/client/CheckInSubmissionForm";
import { Logo } from "@/components/lab/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ArrowLeft, Beaker, Dumbbell, MessageSquare, Pill, 
  Home as HomeIcon, ClipboardCheck, StickyNote, Check, Send 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BIOMARKER_MAP, getStatus } from "@/lib/biomarkers";
import { useAuth } from "@/context/AuthContext";
import { getCheckInRepository, type CheckInWithReview } from "@/repositories/checkInRepository";
import { dataMode } from "@/lib/supabase";
import { localPrototypeClientId, PILOT_DISCLAIMER, PILOT_STATUS_COPY } from "@/lib/pilotFeatures";
import { PrototypeFeatureNotice } from "@/components/pilot/PrototypeFeatureNotice";

const repository = getCheckInRepository();

function currentWeekKey(): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default function ClientHome() {
  const { id } = useParams();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"home" | "labs" | "program" | "checkin" | "notes">("home");
  const [replyText, setReplyText] = useState("");
  const [checkInHistory, setCheckInHistory] = useState<CheckInWithReview[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setCheckInHistory([]);
    setLoadingHistory(true);
    repository.listOwnCheckIns()
      .then((history) => {
        setCheckInHistory(history);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load check-ins.");
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [profile?.id, id, activeTab]);

  const store = useStore();

  // Enforce auth role checks and identity boundary
  if (!profile) {
    return <Navigate to="/" replace />;
  }

  // Identity derivation: derive active athlete ID from authenticated profile
  const prototypeClientId = localPrototypeClientId(dataMode, id);
  const activeClientId = dataMode === "supabase" ? profile.id : prototypeClientId!;

  // In supabase mode, reject/redirect legacy mismatched route IDs
  if (dataMode === "supabase" && id && id !== profile.id) {
    return <Navigate to="/client" replace />;
  }

  const { clients } = store;
  
  // Map local client or fallback for layout fields
  const localClient = prototypeClientId ? clients.find((c) => c.id === prototypeClientId) : undefined;
  if (!localClient && dataMode !== "supabase") {
    return <div className="p-6 text-center text-muted-foreground">Client profile not found.</div>;
  }
  const clientInfo = {
    name: profile.fullName || (dataMode === "supabase" ? "Pilot Client" : localClient?.name || "Demo Client"),
    goal: dataMode === "supabase" ? "Not yet connected" : localClient?.goal || "Demo coaching goal",
    trainingCompliance: dataMode === "supabase" ? 0 : localClient?.trainingCompliance ?? 0,
    nutritionCompliance: dataMode === "supabase" ? 0 : localClient?.nutritionCompliance ?? 0,
    notes: dataMode === "supabase" ? "Coach notes are not yet connected." : localClient?.notes || "Demo coach note"
  };

  const panels = prototypeClientId ? getClientPanels(prototypeClientId) : [];
  const activeNote = prototypeClientId ? getLatestActiveCoachNote(prototypeClientId) : undefined;
  const isAcknowledged = !!activeNote?.acknowledgedByClient;

  const latestPanel = panels[panels.length - 1];
  const hasCheckedInThisWeek = checkInHistory.some((c) => c.checkIn.weekKey === currentWeekKey());

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
    if (!activeNote) return;
    actions.acknowledgeCoachNote(activeNote.id);
    toast.success("Coach note acknowledged. Notification sent to Coach Warren!");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeNote) return;
    actions.replyToCoachNote(activeNote.id, replyText.trim());
    setReplyText("");
    toast.success("Response sent to your coach!");
  };

  return (
    <div className="min-h-screen bg-zinc-955 text-zinc-100 flex flex-col pb-28 md:pb-12 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-900/60 px-6 py-4 flex items-center gap-3 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span className="text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Pilot
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

        <button 
          onClick={async () => {
            try {
              await signOut();
              navigate("/");
            } catch (error: unknown) {
              toast.error(error instanceof Error ? error.message : "Sign-out failed.");
            }
          }}
          className="text-xs text-zinc-400 hover:text-zinc-100 inline-flex items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Log Out
        </button>
      </header>

      {/* Main viewport wrapped in a centered max-width mobile column */}
      <main className="max-w-md md:max-w-lg w-full mx-auto p-4 flex-1 flex flex-col justify-start space-y-6">
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-200">
          {dataMode === "supabase"
            ? `${PILOT_STATUS_COPY}. Prototype features are disabled and receive no live client data. ${PILOT_DISCLAIMER}`
            : "Demo/local-only workspace. Nothing on this screen is connected to a live client account."}
        </div>
        {activeTab === "home" && dataMode === "supabase" && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-6">
              <h1 className="text-xl font-bold">Welcome, {clientInfo.name}</h1>
              <p className="mt-2 text-sm text-zinc-300">Your identity, weekly check-ins, and coach feedback are live.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-zinc-800 p-3">This week: {hasCheckedInThisWeek ? "Submitted" : "Not submitted"}</div>
                <div className="rounded-xl border border-zinc-800 p-3">History: {loadingHistory ? "Loading" : `${checkInHistory.length} check-in(s)`}</div>
              </div>
              <Button className="mt-4" onClick={() => setActiveTab("checkin")}>Open weekly check-in</Button>
            </div>
            <PrototypeFeatureNotice feature="Training, nutrition, supplements, labs, recommendations, notes, and messaging" dark />
          </div>
        )}
        {activeTab === "home" && dataMode === "local" && (
          <div className="space-y-6 animate-fade-in">
            {/* Branded Aspirational Welcome Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-850 bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-md">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-zinc-800/10 blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">WARREN ATHLETICS</span>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      Hello, {clientInfo.name.split(" ")[0]}
                    </h1>
                    <p className="text-sm text-zinc-400">
                      Coached by <span className="text-zinc-200 font-medium">Warren Germishuizen</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-medium border border-zinc-850 bg-zinc-900/60 text-zinc-400 px-3 py-1 rounded-full uppercase tracking-wider">
                    Active Client
                  </span>
                </div>

                <div className="border-t border-zinc-850/60 pt-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">Program Focus</span>
                    <div className="text-sm font-semibold text-zinc-200 mt-0.5">{clientInfo.goal}</div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-zinc-100 hover:bg-white text-zinc-955 text-xs font-bold h-9 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => { setActiveTab("program"); }}
                  >
                    View Today's Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Performance Status Section */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 ml-1">Daily Completion Status</span>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { 
                    label: "Bio Score", 
                    value: score, 
                    display: `${score}`, 
                    color: "stroke-emerald-600",
                    action: () => setActiveTab("labs") 
                  },
                  { 
                    label: "Training", 
                    value: clientInfo.trainingCompliance, 
                    display: `${clientInfo.trainingCompliance}%`, 
                    color: "stroke-emerald-600",
                    action: () => { setActiveTab("program"); }
                  },
                  { 
                    label: "Protocol", 
                    value: clientInfo.nutritionCompliance, 
                    display: `${clientInfo.nutritionCompliance}%`, 
                    color: "stroke-emerald-600",
                    action: () => { setActiveTab("program"); } 
                  },
                  { 
                    label: "Check-in", 
                    value: hasCheckedInThisWeek ? 100 : 0,
                    display: loadingHistory ? "..." : hasCheckedInThisWeek ? "DONE" : "DUE",
                    color: hasCheckedInThisWeek ? "stroke-emerald-600" : "stroke-amber-600/90",
                    action: () => setActiveTab("checkin") 
                  }
                ].map((ring, idx) => {
                  const size = 62;
                  const strokeWidth = 2.0;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = radius * 2 * Math.PI;
                  const offset = circumference - (ring.value / 100) * circumference;

                  return (
                    <div 
                      key={idx}
                      onClick={ring.action}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-850 bg-zinc-900/20 hover:border-zinc-800 hover:bg-zinc-900/40 transition-all cursor-pointer shadow-lg"
                    >
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className="stroke-zinc-850/60"
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
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-5 space-y-4 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Today's Focus Status</span>
                <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Active Protocol
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-850/60">
                  <span className="text-[10px] font-medium text-zinc-500 block">Training Target</span>
                  <span className="font-semibold text-zinc-200 mt-1 block">Pull Strength + Recovery</span>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-850/60">
                  <span className="text-[10px] font-medium text-zinc-500 block">Nutrition Intake</span>
                  <span className="font-semibold text-zinc-200 mt-1 block">Standard Protocol Targets</span>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-850/60">
                  <span className="text-[10px] font-medium text-zinc-500 block">Supplementation</span>
                  <span className="font-semibold text-zinc-200 mt-1 block">{clientInfo.nutritionCompliance}% Completed</span>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-850/60">
                  <span className="text-[10px] font-medium text-zinc-500 block">Weekly Review</span>
                  <span className={cn(
                    "font-semibold mt-1 block",
                    hasCheckedInThisWeek ? "text-emerald-500" : "text-amber-500"
                  )}>
                    {hasCheckedInThisWeek ? "Submitted" : "Action Needed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Lab Snapshot Card */}
            <div 
              onClick={() => setActiveTab("labs")}
              className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-5 hover:border-zinc-800 hover:bg-zinc-900/30 transition-all cursor-pointer shadow-lg space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-sm font-bold flex items-center gap-1.5 text-zinc-200">
                  <Beaker className="h-4 w-4 text-zinc-400" /> Performance Markers Snapshot
                </h3>
                <span className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full font-medium">
                  Read Only
                </span>
              </div>
              <p className="text-xs text-zinc-450 leading-relaxed">
                Biomarkers are verified against clinical health thresholds. Your metrics indicate stable metabolic and recovery status.
              </p>
              <div className="flex items-center justify-between bg-zinc-950/40 border border-zinc-850/60 p-4 rounded-xl">
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
              className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-5 hover:border-zinc-800 hover:bg-zinc-900/30 transition-all cursor-pointer shadow-lg border-l-4 border-l-emerald-700/60 space-y-3"
            >
              <h3 className="font-display text-sm font-bold flex items-center gap-1.5 text-zinc-200">
                <StickyNote className="h-4 w-4 text-zinc-400" /> Coach Guidance Note
              </h3>
              <p className="text-xs text-zinc-350 italic leading-relaxed">
                "{clientInfo.notes}"
              </p>
              <div className="text-[10px] flex items-center justify-between text-zinc-500">
                <span>Updated recently</span>
                <span className="text-zinc-450 hover:text-zinc-350 font-semibold flex items-center gap-1 hover:underline">
                  Read details & respond →
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "labs" && dataMode === "supabase" && <PrototypeFeatureNotice feature="Labs and biomarker analysis" dark />}
        {activeTab === "labs" && dataMode === "local" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="h-5 w-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold text-white">Performance Markers History</h2>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
              <BloodPanelDashboard clientId={activeClientId} panels={panels} readOnly={true} />
            </div>
          </div>
        )}

        {activeTab === "program" && dataMode === "supabase" && <PrototypeFeatureNotice feature="Training, nutrition, and supplement protocols" dark />}
        {activeTab === "program" && dataMode === "local" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold text-white">Active Coaching Protocol</h2>
            </div>

            <TrainingPlanCards clientId={activeClientId} />

            <div className="pt-6 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4 text-emerald-400" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">Today's Supplement Protocol</h3>
              </div>
              <SupplementChecklist clientId={activeClientId} />
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
              <CheckInSubmissionForm clientId={activeClientId} onSubmitSuccess={() => setActiveTab("home")} />
            </div>
          </div>
        )}

        {activeTab === "notes" && dataMode === "supabase" && <PrototypeFeatureNotice feature="Coach notes and messaging" dark />}
        {activeTab === "notes" && dataMode === "local" && (
          <div className="space-y-6 animate-fade-in">
            {!activeNote ? (
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-8 text-center text-zinc-450 shadow-lg backdrop-blur-md">
                <StickyNote className="h-8 w-8 text-zinc-650 mx-auto mb-2.5" />
                <h3 className="font-display text-sm font-bold text-zinc-300 uppercase tracking-wider mb-1">No Active Notes</h3>
                <p className="text-xs text-zinc-550">There are no active feedback protocols or coach notes for you at this time.</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 space-y-4 border-l-4 border-l-emerald-700/60 shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-zinc-850/60 pb-3">
                    <h3 className="font-display text-lg font-bold flex items-center gap-2 text-white">
                      <StickyNote className="h-5 w-5 text-zinc-400" /> {activeNote.title}
                    </h3>
                    <span className="text-[9px] font-bold border border-zinc-800 bg-zinc-900 text-zinc-455 px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeNote.category}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed text-zinc-200">
                      "{activeNote.body}"
                    </p>
                    <div className="text-[11px] text-zinc-550 font-mono">
                      Recommended on {new Date(activeNote.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <Button
                      onClick={handleAcknowledge}
                      disabled={isAcknowledged}
                      variant={isAcknowledged ? "outline" : "hero"}
                      className={cn(
                        "w-full sm:w-auto font-bold rounded-xl text-xs h-10 px-5",
                        isAcknowledged ? "border-zinc-800 text-zinc-500 bg-zinc-900/20" : "bg-zinc-100 hover:bg-white text-zinc-950"
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

                <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 space-y-4 shadow-lg backdrop-blur-md">
                  <div className="flex items-center gap-2 border-b border-zinc-850/60 pb-3">
                    <MessageSquare className="h-5 w-5 text-zinc-400" />
                    <h3 className="font-display text-base font-bold text-white">Coach Feedback Thread</h3>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin flex flex-col">
                    {(!activeNote.messages || activeNote.messages.length === 0) ? (
                      <p className="text-xs text-zinc-550 italic text-center py-4">No conversation messages yet. Send a response to start the thread.</p>
                    ) : (
                      activeNote.messages.map((msg) => (
                        msg.senderRole === "coach" ? (
                          <div key={msg.id} className="bg-zinc-905 border border-zinc-850 p-4 rounded-2xl rounded-tl-sm max-w-[85%] self-start shadow-sm">
                            <span className="block text-[9px] font-bold text-emerald-600/85 uppercase mb-1">Coach Warren</span>
                            <p className="text-sm text-zinc-200">{msg.text}</p>
                            <span className="block text-[7.5px] text-zinc-550 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <div key={msg.id} className="bg-zinc-800/80 border border-zinc-750 p-4 rounded-2xl rounded-tr-sm max-w-[85%] self-end text-right shadow-sm">
                            <span className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">You</span>
                            <p className="text-sm text-zinc-200">{msg.text}</p>
                            <span className="block text-[7.5px] text-zinc-550 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-zinc-850/60">
                    <input
                      type="text"
                      placeholder="Type a response to your coach..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-700 text-white placeholder-zinc-500"
                    />
                    <Button type="submit" size="sm" aria-label="Send reply" className="px-4 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl h-10">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom navigation bar for Mobile Viewports (< 768px) */}
      <div className="md:hidden fixed bottom-5 left-5 right-5 border border-zinc-800/80 bg-zinc-900/85 backdrop-blur-lg z-30 flex justify-around py-2 px-1.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
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
              "flex flex-col items-center justify-center gap-1 px-3.5 py-1.5 transition-all duration-300 rounded-xl min-w-[62px] h-12",
              activeTab === t.id
                ? "text-zinc-100 bg-zinc-800/60 shadow-inner scale-102"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <t.icon className={cn("h-4.5 w-4.5", activeTab === t.id ? "stroke-[2.2]" : "stroke-[1.6]")} />
            <span className="text-[8.5px] font-sans font-medium tracking-normal">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
