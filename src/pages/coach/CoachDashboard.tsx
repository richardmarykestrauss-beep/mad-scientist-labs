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
  Sparkles
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
    actions.addClient(inviteName, inviteEmail || "pending@invite.fit", inviteGoal || "Athletic optimization");
    setIsInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInviteGoal("");
    toast.success("Client invited successfully (added to prototype roster)");
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      
      {/* Calm Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Welcome back, Warren
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Today's coaching operations</span>
            <span className="h-1 w-1 rounded-full bg-border/40" />
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-status-optimal/25 text-status-optimal/80 bg-status-optimal/5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-optimal animate-pulse" /> System Online
            </span>
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-border/40 text-muted-foreground bg-secondary/40">
              Mock Roster
            </span>
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-border/40 text-muted-foreground bg-secondary/40">
              Live Database Planned
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 self-start md:self-center">
          <Button 
            variant="outline" 
            className="border-purple-500/20 bg-purple-500/5 text-purple-300 hover:bg-purple-500/10 font-mono text-[9px] uppercase tracking-wider h-7.5" 
            onClick={() => setIsBriefingOpen(true)}
          >
            <Brain className="h-3.5 w-3.5 mr-1 text-purple-400" /> AI Briefing
          </Button>
          <Button 
            variant="outline" 
            className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-mono text-[9px] uppercase tracking-wider h-7.5" 
            onClick={() => setIsUploadSelectOpen(true)}
          >
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload Report
          </Button>
          
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border/40 hover:bg-secondary/40 font-mono text-[9px] uppercase tracking-wider h-7.5">
                <Plus className="h-3.5 w-3.5 mr-1 text-primary" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-lg font-bold text-primary">Invite New Athlete</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Generate an onboarding record and set starting targets.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteClient} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name" className="text-xs font-mono">Athlete Full Name</Label>
                  <Input 
                    id="invite-name" 
                    value={inviteName} 
                    onChange={e => setInviteName(e.target.value)} 
                    placeholder="e.g. Marcus Reign" 
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email" className="text-xs font-mono">Email Address</Label>
                  <Input 
                    id="invite-email" 
                    type="email" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="e.g. marcus@reign.io" 
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-goal" className="text-xs font-mono">Coaching Focus / Primary Goal</Label>
                  <Input 
                    id="invite-goal" 
                    value={inviteGoal} 
                    onChange={e => setInviteGoal(e.target.value)} 
                    placeholder="e.g. Recomp + raising free testosterone" 
                    className="bg-background/40"
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-xs">Cancel</Button>
                  <Button type="submit" variant="neon" className="text-xs">Generate Access Invite</Button>
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
          
          {/* Today's Coaching Priorities Hero Grid */}
          <div className="bg-[#0e1115]/80 p-4 border border-border/40 rounded-xl backdrop-blur-md space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
              Today's Coaching Priorities
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-3.5">
              
              <div 
                onClick={() => setPlannedFeature("Check-in Operations Checklist")}
                className="p-3 border border-border/30 hover:border-primary/20 bg-background/20 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block">Check-ins Pending</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-primary" /> {checkInsDue} Athlete Submissions
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
              </div>

              <div 
                onClick={() => setPlannedFeature("Lab Alert Console")}
                className="p-3 border border-border/30 hover:border-amber-500/20 bg-background/20 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block">Biomarker Flags</span>
                  <span className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> {alerts.length} Out-of-Range Markers
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
              </div>

              <div 
                onClick={() => setPlannedFeature("Adherence Management")}
                className="p-3 border border-border/30 hover:border-primary/20 bg-background/20 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block">Compliance Telemetry</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" /> {lowAdherence} Low Compliance Trends
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
              </div>

              <div 
                onClick={() => setPlannedFeature("Protocol Automation Console")}
                className="p-3 border border-border/30 hover:border-primary/20 bg-background/20 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block">Protocol Updates</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" /> 2 Actionable Reviews Pending
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
              </div>

            </div>
          </div>

          {/* Compact Metric Strip Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            <MetricWidget label="Roster" value={totalClients} sub="Mock data" icon={Users} />
            <MetricWidget label="Active" value={activeClients} sub="In program" icon={Users} tone="green" />
            <MetricWidget label="Needs Review" value={review} sub="check-ins" icon={CheckSquare} tone={review > 0 ? "amber" : "default"} />
            <MetricWidget label="Due" value={checkInsDue} sub="submitted" icon={Calendar} tone={checkInsDue > 0 ? "amber" : "default"} />
            <MetricWidget label="Low Adhere" value={lowAdherence} sub="under 75%" icon={Activity} tone={lowAdherence > 0 ? "amber" : "default"} />
            <MetricWidget label="Lab Alerts" value={alerts.length} sub="out-of-range" icon={ShieldAlert} tone={alerts.length > 0 ? "amber" : "default"} />
          </div>

          {/* Attention Queue & Daily Actions Stack */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-[360px] overflow-hidden">
              <AttentionQueue />
            </div>
            <div className="h-[360px] overflow-hidden">
              <CoachWorkQueue />
            </div>
          </div>

          {/* Recent Client Activity Feed */}
          <div className="bg-[#0e1115]/80 p-4 border border-border/40 rounded-xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-border/20 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                Recent Client Activity
              </h3>
              <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
                Prototype activity feed
              </span>
            </div>
            
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
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

          {/* 250-Client Roster Command Table */}
          <div className="bg-[#0e1115]/80 p-4 border border-border/40 rounded-xl backdrop-blur-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-foreground">
                  Roster Table
                </h3>
                <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                  Showing {Math.min(visibleRosterCount, filteredRoster.length)} of {filteredRoster.length} clients
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs shrink-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search roster..." 
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  className="pl-8 bg-background/50 text-xs h-7.5 border-border/40 focus:border-primary/45 rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/20">
              <table className="w-full text-xs">
                <thead className="bg-[#12161c] text-[8.5px] uppercase tracking-wider text-muted-foreground font-mono">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Client</th>
                    <th className="text-left px-2.5 py-2 font-medium">Primary Goal</th>
                    <th className="text-left px-2.5 py-2 font-medium">Status</th>
                    <th className="text-right px-2.5 py-2 font-medium">Training</th>
                    <th className="text-right px-2.5 py-2 font-medium">Nutrition</th>
                    <th className="text-left px-2.5 py-2 font-medium">Next Check-In</th>
                    <th className="text-center px-2.5 py-2 font-medium">Lab Alerts</th>
                    <th className="text-right px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr key={c.id} className="border-t border-border/20 hover:bg-secondary/20 transition">
                        <td className="px-3 py-2 font-medium flex items-center gap-2">
                          <div className={`grid h-5.5 w-5.5 place-items-center rounded bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[8px]`}>
                            {c.initials}
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-foreground">{c.name}</div>
                            <div className="text-[9px] text-muted-foreground/80 font-mono mt-0.5">{c.email}</div>
                          </div>
                        </td>
                        <td className="px-2.5 py-2 text-muted-foreground text-[10.5px] truncate max-w-[150px]">{c.goal}</td>
                        <td className="px-2.5 py-2">
                          <span className={cn(
                            "text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold",
                            c.status === "review" 
                              ? "text-status-above border-status-above/30 bg-status-above/10" 
                              : c.status === "inactive"
                                ? "text-muted-foreground border-border/40 bg-secondary/40"
                                : "text-status-optimal border-status-optimal/30 bg-status-optimal/10"
                          )}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono text-[10.5px] font-semibold">{c.trainingCompliance}%</td>
                        <td className="px-2.5 py-2 text-right font-mono text-[10.5px] text-muted-foreground">{c.nutritionCompliance}%</td>
                        <td className="px-2.5 py-2 text-muted-foreground font-mono text-[10px]">{c.nextCheckIn}</td>
                        <td className="px-2.5 py-2 text-center">
                          {alertCount > 0 ? (
                            <span className="font-mono font-bold text-status-above bg-status-above/10 border border-status-above/30 rounded px-1.5 py-0.25 text-[8.5px]">{alertCount}</span>
                          ) : (
                            <span className="text-muted-foreground font-mono text-[9px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-[9px] px-2 hover:text-primary border border-transparent hover:border-border/45 hover:bg-secondary/40"
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
                  className="text-[10px] h-7.5 px-5 font-mono uppercase border-border/45 hover:bg-secondary/40"
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
          
          {/* Client Radar grid */}
          <div className="w-full">
            <ClientRadarGrid />
          </div>

          {/* AI Briefing Summary widget */}
          <div className="bg-[#0e1115]/80 p-4 border border-border/40 rounded-xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                <Brain className="h-3.5 w-3.5 text-purple-400" /> AI Briefing Digest
              </div>
              <span className="text-[7.5px] font-mono uppercase px-1.5 py-0.5 border border-purple-500/25 bg-purple-500/5 text-purple-400 rounded">
                Assisted
              </span>
            </div>
            
            <p className="text-[10.5px] text-muted-foreground leading-normal">
              Today's highlights show lab flag recovery in 2 clients, with thyroid telemetry pending Warren's manual updates.
            </p>

            <Button 
              variant="outline" 
              onClick={() => setIsBriefingOpen(true)}
              className="w-full border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[9.5px] font-mono uppercase tracking-wider h-7.5"
            >
              Open AI Briefing Console
            </Button>
          </div>

          {/* Upcoming Check-ins / Reviews Mock Calendar */}
          <div className="bg-[#0e1115]/80 p-4 border border-border/40 rounded-xl backdrop-blur-md space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-display">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Upcoming Check-Ins
            </div>
            
            <div className="space-y-2">
              <div className="p-2 border border-border/30 bg-background/20 rounded-lg flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">Marcus Reign</span>
                  <span className="text-muted-foreground block text-[9px]">Weekly progress scan due</span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground">May 28</span>
              </div>

              <div className="p-2 border border-border/30 bg-background/20 rounded-lg flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">Sora Nakamura</span>
                  <span className="text-muted-foreground block text-[9px]">Monthly metric review</span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground">May 29</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Select Client for Blood Report Upload Dialog */}
      <Dialog open={isUploadSelectOpen} onOpenChange={setIsUploadSelectOpen}>
        <DialogContent className="bg-[#0e1115] border-border/40 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-primary">Upload Requires Client</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Blood reports must belong to a specific client. Search and select a client below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search athlete by name..." 
                value={inviteSearch}
                onChange={e => setInviteSearch(e.target.value)}
                className="pl-8 bg-[#0b0c0e]/80 text-xs h-9 border-border/40 focus:border-primary/45 rounded-lg"
              />
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {filteredUploadClients.length === 0 ? (
                <div className="text-xs text-center py-4 text-muted-foreground font-mono">No matching athletes found</div>
              ) : (
                filteredUploadClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleOpenUploadForClient(c.id)}
                    className="w-full text-left rounded-lg p-2 transition flex items-center justify-between border border-transparent hover:border-border/40 hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`grid h-8 w-8 place-items-center rounded bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[10px] shrink-0`}>
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{c.email}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setIsUploadSelectOpen(false)} className="text-xs">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-over AI Briefing Drawer */}
      {isBriefingOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsBriefingOpen(false)} 
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-4xl transform bg-[#0d0f12] border-l border-border/40 p-6 shadow-2xl transition-all flex flex-col h-full z-10">
              <div className="flex items-center justify-between pb-4 border-b border-border/20 mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <h2 className="font-display text-lg font-bold text-purple-300">Roster AI Briefing</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsBriefingOpen(false)} className="text-xs">
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
        <SheetContent className="bg-[#0d0f12] border-l border-border/40 sm:max-w-3xl overflow-y-auto flex flex-col h-full z-50">
          <SheetHeader className="pb-4 border-b border-border/20">
            <SheetTitle className="text-xl font-bold font-display tracking-tight text-primary flex items-center gap-2">
              <Beaker className="h-5 w-5" /> Blood Report Upload Intelligence
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Simulating extraction for client: <span className="text-foreground font-semibold">{selectedUploadClient?.name}</span>
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
  const toneCls = tone === "green" ? "text-status-optimal" : tone === "amber" ? "text-status-above" : "text-foreground";
  const borderCls = tone === "green" ? "border-status-optimal/20 bg-[#0e1115]/50" : tone === "amber" ? "border-status-above/20 bg-[#0e1115]/50" : "border-border/40 bg-[#0e1115]/80";

  return (
    <div className={cn("p-2 px-3 border rounded-lg transition duration-200", borderCls)}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[8.5px] uppercase tracking-wider font-mono font-medium">{label}</span>
        <Icon className={cn("h-3 w-3", tone === "green" ? "text-status-optimal" : tone === "amber" ? "text-status-above" : "text-muted-foreground")} />
      </div>
      <div className={`mt-0.5 font-display text-base font-bold ${toneCls}`}>{value}</div>
      {sub && <div className="text-[8px] text-muted-foreground/80 font-mono mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function ActivityRow({ user, action, time, details, alert = false }: { user: string; action: string; time: string; details: string; alert?: boolean }) {
  return (
    <div className={cn("p-2 border rounded-lg bg-background/10 text-[10px] space-y-0.5 border-border/30", alert ? "hover:border-amber-500/20" : "hover:border-primary/10")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-bold text-foreground">{user}</span>
          <span className="text-muted-foreground">{action}</span>
        </div>
        <span className="text-[8px] font-mono text-muted-foreground">{time}</span>
      </div>
      <p className="text-[9px] text-muted-foreground/80 pl-1 border-l border-border/20">{details}</p>
    </div>
  );
}
