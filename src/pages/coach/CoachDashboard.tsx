// src/pages/coach/CoachDashboard.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  Beaker, 
  FlaskConical, 
  Plus, 
  ShieldAlert, 
  Users, 
  Brain,
  CheckSquare,
  Calendar,
  Search,
  ChevronRight,
  Upload,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttentionQueue } from "@/components/coach/AttentionQueue";
import { CoachWorkQueue } from "@/components/coach/CoachWorkQueue";
import { ClientRadarGrid } from "@/components/coach/ClientRadarGrid";
import { BloodReportUploadFlow } from "@/components/blood/BloodReportUploadFlow";
import { AICoachBriefing } from "@/components/coach/AICoachBriefing";
import { FeaturePlannedDialog } from "@/components/lab/FeaturePlannedDialog";
import { useStore, getClientPanels, actions } from "@/data/store";
import { BIOMARKERS, getStatus } from "@/lib/biomarkers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { clients, panels } = useStore();
  const TODAY = "2026-05-26";
  
  // Dashboard state
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isUploadSelectOpen, setIsUploadSelectOpen] = useState(false);
  const [isUploadFlowOpen, setIsUploadFlowOpen] = useState(false);
  const [uploadClientId, setUploadClientId] = useState<string | null>(null);
  
  // Client invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteGoal, setInviteGoal] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");

  // Roster table pagination & search
  const [rosterSearch, setRosterSearch] = useState("");
  const [visibleRosterCount, setVisibleRosterCount] = useState(10);
  const [plannedFeature, setPlannedFeature] = useState<string | null>(null);

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const review = clients.filter(c => c.status === "review").length;
  const checkInsDue = clients.filter(c => c.status === "review" || c.nextCheckIn <= TODAY).length;
  const lowAdherence = clients.filter(c => c.trainingCompliance < 75 || c.nutritionCompliance < 75).length;

  // Build alerts from latest panel of each client
  const alerts = useMemo(() => {
    const list: { client: string; clientId: string; marker: string; status: string }[] = [];
    for (const c of clients) {
      const cp = getClientPanels(c.id);
      const latest = cp[cp.length - 1];
      if (!latest) continue;
      for (const r of latest.results) {
        const def = BIOMARKERS.find((b) => b.key === r.key);
        if (!def) continue;
        const s = getStatus(def, r.value);
        if (s === "high" || s === "low") {
          list.push({ client: c.name, clientId: c.id, marker: def.name, status: s });
        }
      }
    }
    return list;
  }, [clients, panels]);

  // Clients filtered for upload selection
  const filteredUploadClients = useMemo(() => {
    const q = inviteSearch.trim().toLowerCase();
    if (!q) return clients.slice(0, 5);
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, inviteSearch]);

  // Roster table filtering & sorting
  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    const list = clients;
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q) || c.goal.toLowerCase().includes(q));
  }, [clients, rosterSearch]);

  // Selected client for uploading
  const selectedUploadClient = useMemo(() => {
    return clients.find(c => c.id === uploadClientId) || null;
  }, [clients, uploadClientId]);

  const handleOpenUploadForClient = (clientId: string) => {
    setUploadClientId(clientId);
    setIsUploadSelectOpen(false);
    setIsUploadFlowOpen(true);
    setInviteSearch("");
  };

  const handleInviteClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) {
      toast.error("Name is required");
      return;
    }
    actions.addClient(inviteName, inviteEmail || "pending@example.com", inviteGoal || "Athletic optimization");
    setIsInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInviteGoal("");
    toast.success("Client invited successfully (added to prototype roster)");
  };

  return (
    <div className="-my-6 py-6 min-h-screen bg-[#f8f9fa] text-slate-800 space-y-6">
      
      {/* Calm Operations Header (Light) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, Warren
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[11px] text-slate-500 font-medium">Today's coaching operations</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-[#00ff80]/30 text-emerald-600 bg-emerald-50 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Online
            </span>
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-slate-200 text-slate-500 bg-white">
              Mock Roster
            </span>
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-slate-200 text-slate-500 bg-white">
              Live Database Planned
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 self-start md:self-center">
          <Button 
            variant="outline" 
            className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-mono text-[9px] uppercase tracking-wider h-7.5" 
            onClick={() => setIsBriefingOpen(true)}
          >
            <Brain className="h-3.5 w-3.5 mr-1 text-purple-600" /> AI Briefing
          </Button>
          <Button 
            variant="outline" 
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-mono text-[9px] uppercase tracking-wider h-7.5" 
            onClick={() => setIsUploadSelectOpen(true)}
          >
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload Report
          </Button>
          
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-mono text-[9px] uppercase tracking-wider h-7.5">
                <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 sm:max-w-md text-slate-800">
              <DialogHeader>
                <DialogTitle className="font-display text-lg font-bold text-slate-900">Invite New Athlete</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Generate an onboarding record and set starting targets.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteClient} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name" className="text-xs font-mono text-slate-600">Athlete Full Name</Label>
                  <Input 
                    id="invite-name" 
                    value={inviteName} 
                    onChange={e => setInviteName(e.target.value)} 
                    placeholder="e.g. Marcus Reign" 
                    className="bg-slate-50 border-slate-200 text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email" className="text-xs font-mono text-slate-600">Email Address</Label>
                  <Input 
                    id="invite-email" 
                    type="email" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="e.g. athlete@example.com"
                    className="bg-slate-50 border-slate-200 text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-goal" className="text-xs font-mono text-slate-600">Coaching Focus / Goal</Label>
                  <Input 
                    id="invite-goal" 
                    value={inviteGoal} 
                    onChange={e => setInviteGoal(e.target.value)} 
                    placeholder="e.g. Recomp + raising free testosterone" 
                    className="bg-slate-50 border-slate-200 text-slate-800"
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-xs text-slate-500">Cancel</Button>
                  <Button type="submit" variant="default" className="text-xs bg-slate-900 text-white hover:bg-slate-800">Generate Access Invite</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left main operations panel (70% width) */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Today's Coaching Priorities Hero Card */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400">
              Today's Coaching Priorities
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-3.5">
              
              <div 
                onClick={() => setPlannedFeature("Check-in Operations Checklist")}
                className="p-3.5 border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Check-ins Pending</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-emerald-500" /> {checkInsDue} Athlete Submissions
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>

              <div 
                onClick={() => setPlannedFeature("Lab Alert Console")}
                className="p-3.5 border border-slate-200 hover:border-amber-300 bg-slate-50/50 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Biomarker Flags</span>
                  <span className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> {alerts.length} Out-of-Range Markers
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>

              <div 
                onClick={() => setPlannedFeature("Adherence Management")}
                className="p-3.5 border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Compliance Telemetry</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> {lowAdherence} Low Compliance Trends
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>

              <div 
                onClick={() => setPlannedFeature("Protocol Automation Console")}
                className="p-3.5 border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Protocol Updates</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-500" /> 2 Actionable Reviews Pending
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>

            </div>
          </div>

          {/* Compact Metric Strip Row (Light) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <MetricWidget label="Roster" value={totalClients} sub="Mock data" icon={Users} />
            <MetricWidget label="Active" value={activeClients} sub="In program" icon={Users} tone="green" />
            <MetricWidget label="Needs Review" value={review} sub="check-ins" icon={CheckSquare} tone={review > 0 ? "amber" : "default"} />
            <MetricWidget label="Due" value={checkInsDue} sub="submitted" icon={Calendar} tone={checkInsDue > 0 ? "amber" : "default"} />
            <MetricWidget label="Low Adhere" value={lowAdherence} sub="under 75%" icon={Activity} tone={lowAdherence > 0 ? "amber" : "default"} />
            <MetricWidget label="Lab Alerts" value={alerts.length} sub="out-of-range" icon={ShieldAlert} tone={alerts.length > 0 ? "amber" : "default"} />
          </div>

          {/* Client Progress / Adherence Graph Section (Light) */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Compliance & Adherence Trends
              </h3>
              <span className="text-[8.5px] font-mono text-slate-400 uppercase">
                Last 30 Days
              </span>
            </div>

            {/* Custom SVG Graph area */}
            <div className="grid sm:grid-cols-2 gap-6">
              
              <div className="space-y-2 p-3 border border-slate-100 rounded-lg bg-slate-50/55">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Training Plan Consistency</span>
                  <span className="text-xs font-bold text-slate-800">88.5% avg</span>
                </div>
                {/* SVG Area Sparkline */}
                <div className="h-16 w-full pt-2">
                  <svg viewBox="0 0 100 25" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad-training" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0 20 Q 15 15, 30 18 T 60 8 T 90 12 L 100 5 L 100 25 L 0 25 Z" 
                      fill="url(#grad-training)"
                    />
                    <path 
                      d="M0 20 Q 15 15, 30 18 T 60 8 T 90 12 L 100 5" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2 p-3 border border-slate-100 rounded-lg bg-slate-50/55">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Nutrition Plan Compliance</span>
                  <span className="text-xs font-bold text-slate-800">82.1% avg</span>
                </div>
                {/* SVG Area Sparkline */}
                <div className="h-16 w-full pt-2">
                  <svg viewBox="0 0 100 25" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad-nutrition" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0 18 Q 20 22, 40 12 T 70 16 T 90 10 L 100 15 L 100 25 L 0 25 Z" 
                      fill="url(#grad-nutrition)"
                    />
                    <path 
                      d="M0 18 Q 20 22, 40 12 T 70 16 T 90 10 L 100 15" 
                      fill="none" 
                      stroke="#0ea5e9" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

            </div>
          </div>

          {/* Attention Queue & Daily Actions Stack (Class Overrides for Light Mode) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-[360px] overflow-hidden">
              <AttentionQueue />
            </div>
            <div className="h-[360px] overflow-hidden">
              <CoachWorkQueue />
            </div>
          </div>

          {/* Recent Client Activity Feed (Light) */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400">
                Recent Client Activity
              </h3>
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                Prototype activity feed
              </span>
            </div>
            
            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              <ActivityRow 
                user="Marcus Reign" 
                action="submitted a weekly check-in" 
                time="2 hours ago" 
                details="Weight stable at 92.8kg. Sleep latency improved."
              />
              <ActivityRow 
                user="Sora Nakamura" 
                action="has thyroid markers flagged for review" 
                time="4 hours ago" 
                details="Free T3 levels registered at 2.4 pg/mL."
                alert
              />
              <ActivityRow 
                user="Marcus Reign" 
                action="blood report scan completed" 
                time="Yesterday" 
                details="OCR parsed 18 biomarkers with 98% confidence."
              />
              <ActivityRow 
                user="Sora Nakamura" 
                action="acknowledged protocol updates" 
                time="Yesterday" 
                details="Magnesium timing shift to evening accepted."
              />
            </div>
          </div>

          {/* 250-Client Roster Command Table (Light) */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-900">
                  Client Roster
                </h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Showing {Math.min(visibleRosterCount, filteredRoster.length)} of {filteredRoster.length} clients
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs shrink-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Search roster..." 
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  className="pl-8 bg-slate-50 border-slate-200 text-slate-800 text-xs h-7.5 focus:ring-slate-400 rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-[900px] w-full text-xs">
                <thead className="bg-slate-50 text-[8.5px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold">Client</th>
                    <th className="text-left px-2.5 py-2.5 font-semibold">Primary Goal</th>
                    <th className="text-left px-2.5 py-2.5 font-semibold">Status</th>
                    <th className="text-right px-2.5 py-2.5 font-semibold">Training</th>
                    <th className="text-right px-2.5 py-2.5 font-semibold">Nutrition</th>
                    <th className="text-left px-2.5 py-2.5 font-semibold">Next Check-In</th>
                    <th className="text-center px-2.5 py-2.5 font-semibold">Lab Alerts</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRoster.slice(0, visibleRosterCount).map((c) => {
                    const cp = getClientPanels(c.id);
                    const latest = cp[cp.length - 1];
                    let alertCount = 0;
                    if (latest) {
                      for (const r of latest.results) {
                        const def = BIOMARKERS.find((b) => b.key === r.key);
                        if (!def) continue;
                        const s = getStatus(def, r.value);
                        if (s === "high" || s === "low") alertCount++;
                      }
                    }

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2 font-medium flex items-center gap-2">
                          <div className={`grid h-5.5 w-5.5 place-items-center rounded bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[8px]`}>
                            {c.initials}
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-slate-900">{c.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">{c.email}</div>
                          </div>
                        </td>
                        <td className="px-2.5 py-2 text-slate-500 text-[10.5px] truncate max-w-[150px]">{c.goal}</td>
                        <td className="px-2.5 py-2">
                          <span className={cn(
                            "text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold",
                            c.status === "review" 
                              ? "text-red-700 border-red-200 bg-red-50" 
                              : c.status === "inactive"
                                ? "text-slate-500 border-slate-200 bg-slate-100"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50"
                          )}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono text-[10.5px] font-semibold text-slate-800">{c.trainingCompliance}%</td>
                        <td className="px-2.5 py-2 text-right font-mono text-[10.5px] text-slate-500">{c.nutritionCompliance}%</td>
                        <td className="px-2.5 py-2 text-slate-500 font-mono text-[10px]">{c.nextCheckIn}</td>
                        <td className="px-2.5 py-2 text-center">
                          {alertCount > 0 ? (
                            <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.25 text-[8.5px]">{alertCount}</span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[9px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6.5 text-[9.5px] px-2 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
                            onClick={() => navigate(`/coach/clients/${c.id}`)}
                          >
                            Open Profile <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRoster.length > visibleRosterCount && (
              <div className="flex justify-center pt-1.5">
                <Button
                  variant="outline"
                  className="text-[10px] h-7.5 px-5 font-mono uppercase border-slate-200 hover:bg-slate-50 text-slate-600"
                  onClick={() => setVisibleRosterCount(prev => prev + 10)}
                >
                  Load More Clients (+10)
                </Button>
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar operations panel (30% width) */}
        <div className="space-y-5">
          
          {/* Upcoming Check-ins / Reviews Mock Calendar */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 font-display">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" /> Upcoming Check-Ins
            </div>
            
            <div className="space-y-2">
              <div className="p-2 border border-slate-100 bg-slate-50/50 rounded-lg flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Marcus Reign</span>
                  <span className="text-slate-500 block text-[9px]">Weekly progress scan due</span>
                </div>
                <span className="font-mono text-[9px] text-slate-400">May 28</span>
              </div>

              <div className="p-2 border border-slate-100 bg-slate-50/50 rounded-lg flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Sora Nakamura</span>
                  <span className="text-slate-500 block text-[9px]">Monthly metric review</span>
                </div>
                <span className="font-mono text-[9px] text-slate-400">May 29</span>
              </div>
            </div>
          </div>

          {/* Client Radar Snapshot (Light themed sidebar component) */}
          <div className="w-full [&_h3]:text-slate-800 [&_.bg-\[\#0e1115\]\/85]:bg-white [&_.bg-\[\#0e1115\]\/85]:border-slate-200 [&_.bg-\[\#0e1115\]\/85]:shadow-sm">
            <ClientRadarGrid />
          </div>

          {/* AI Briefing Summary widget (Light purple card) */}
          <div className="bg-purple-50/50 p-4 border border-purple-100 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                <Brain className="h-3.5 w-3.5 text-purple-600 animate-pulse" /> AI Briefing Digest
              </div>
              <span className="text-[7.5px] font-mono uppercase px-1.5 py-0.5 border border-purple-200 bg-purple-100/50 text-purple-700 rounded">
                Assisted
              </span>
            </div>
            
            <p className="text-[10.5px] text-purple-900/80 leading-normal">
              Today's highlights show lab flag recovery in 2 clients, with thyroid telemetry pending Warren's manual updates.
            </p>

            <Button 
              variant="outline" 
              onClick={() => setIsBriefingOpen(true)}
              className="w-full border-purple-200 bg-white hover:bg-purple-50 text-purple-700 text-[9.5px] font-mono uppercase tracking-wider h-7.5"
            >
              Open AI Briefing Console
            </Button>
          </div>

        </div>

      </div>

      {/* Select Client for Blood Report Upload Dialog */}
      <Dialog open={isUploadSelectOpen} onOpenChange={setIsUploadSelectOpen}>
        <DialogContent className="bg-white border-slate-200 sm:max-w-md text-slate-800">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-slate-900">Upload Requires Client</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Blood reports must belong to a specific client. Search and select a client below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search athlete by name..." 
                value={inviteSearch}
                onChange={e => setInviteSearch(e.target.value)}
                className="pl-8 bg-slate-50 border-slate-200 text-slate-800 text-xs h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {filteredUploadClients.length === 0 ? (
                <div className="text-xs text-center py-4 text-slate-500 font-mono">No matching athletes found</div>
              ) : (
                filteredUploadClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleOpenUploadForClient(c.id)}
                    className="w-full text-left rounded-lg p-2 transition flex items-center justify-between border border-transparent hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`grid h-8 w-8 place-items-center rounded bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[10px] shrink-0`}>
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{c.email}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setIsUploadSelectOpen(false)} className="text-xs text-slate-500">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-over AI Briefing Drawer */}
      {isBriefingOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsBriefingOpen(false)} 
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-4xl transform bg-white border-l border-slate-200 p-6 shadow-2xl transition-all flex flex-col h-full z-10 text-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h2 className="font-display text-lg font-bold text-purple-700">Roster AI Briefing</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsBriefingOpen(false)} className="text-xs text-slate-500">
                  Close Panel
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                <AICoachBriefing />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Blood Report Upload Flow Drawer */}
      <Sheet open={isUploadFlowOpen} onOpenChange={setIsUploadFlowOpen}>
        <SheetContent className="bg-white border-l border-slate-200 sm:max-w-3xl overflow-y-auto flex flex-col h-full z-50 text-slate-800">
          <SheetHeader className="pb-4 border-b border-slate-200">
            <SheetTitle className="text-xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2">
              <Beaker className="h-5 w-5 text-emerald-600" /> Blood Report Upload Intelligence
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Simulating extraction for client: <span className="text-slate-900 font-semibold">{selectedUploadClient?.name}</span>
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {uploadClientId && (
              <BloodReportUploadFlow clientId={uploadClientId} onComplete={() => setIsUploadFlowOpen(false)} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Feature Planned fallback dialog */}
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

function MetricWidget({ icon: Icon, label, value, sub, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; tone?: "default" | "green" | "amber" }) {
  const toneCls = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-800";
  const borderCls = tone === "green" ? "border-emerald-200 bg-emerald-50/50" : tone === "amber" ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-white";

  return (
    <div className={cn("p-3 border rounded-xl shadow-sm transition duration-200", borderCls)}>
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[8.5px] uppercase tracking-wider font-mono font-bold">{label}</span>
        <Icon className={cn("h-3 w-3", tone === "green" ? "text-emerald-600" : tone === "amber" ? "text-amber-500" : "text-slate-400")} />
      </div>
      <div className={`mt-0.5 font-display text-base font-bold ${toneCls}`}>{value}</div>
      {sub && <div className="text-[8px] text-slate-400/80 font-mono mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function ActivityRow({ user, action, time, details, alert = false }: { user: string; action: string; time: string; details: string; alert?: boolean }) {
  return (
    <div className={cn("p-2.5 border rounded-lg bg-slate-50/30 text-[10px] space-y-0.5 border-slate-200", alert ? "hover:border-amber-300" : "hover:border-emerald-200")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-800">{user}</span>
          <span className="text-slate-500">{action}</span>
        </div>
        <span className="text-[8px] font-mono text-slate-400">{time}</span>
      </div>
      <p className="text-[9px] text-slate-500/85 pl-1 border-l border-slate-200">{details}</p>
    </div>
  );
}
