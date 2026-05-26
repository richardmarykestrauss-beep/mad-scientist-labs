import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Sparkles,
  ArrowRight,
  Upload
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
import { useStore, getClientPanels, actions } from "@/data/store";
import { BIOMARKERS, getStatus, STATUS_META } from "@/lib/biomarkers";
import type { BiomarkerStatus, Client } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Search and Actions row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="chip mb-2"><FlaskConical className="h-3 w-3 text-primary" /> Bio-Performance Command Center</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-glow text-primary flex items-center gap-2">
            Coach Console <span className="text-xs font-mono text-muted-foreground font-normal bg-secondary/40 border border-border/80 px-2 py-0.5 rounded-full">v1.2 Active</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Logged in as Coach Warren Germishuizen · System Online
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="neon" 
            className="border-primary/60 bg-primary/10 text-primary hover:bg-primary/15 font-semibold text-xs h-9" 
            onClick={() => setIsBriefingOpen(true)}
          >
            <Brain className="h-4 w-4 mr-1.5" /> Review Intelligence Brief
          </Button>
          <Button 
            variant="neon" 
            className="border-primary/60 bg-primary/10 text-primary hover:bg-primary/15 font-semibold text-xs h-9" 
            onClick={() => setIsUploadSelectOpen(true)}
          >
            <Upload className="h-4 w-4 mr-1.5" /> Upload Blood Report
          </Button>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="font-semibold text-xs h-9">
                <Plus className="h-4 w-4 mr-1.5" /> Add Client
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
                  <Button type="submit" variant="hero" className="text-xs">Generate Access Invite</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Large Glowing Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={Users} label="Total Roster" value={250} sub="Showing mock database" />
        <MetricCard icon={Users} label="Active Clients" value={activeClients} sub="In training status" tone="good" />
        <MetricCard icon={CheckSquare} label="Needs Review" value={review} sub="check-ins submitted" tone={review > 0 ? "warn" : "default"} />
        <MetricCard icon={Calendar} label="Check-Ins Due" value={checkInsDue} sub="overdue or submitted" tone={checkInsDue > 0 ? "warn" : "default"} />
        <MetricCard icon={Activity} label="Low Adherence" value={lowAdherence} sub="compliance < 75%" tone={lowAdherence > 0 ? "warn" : "default"} />
        <MetricCard icon={ShieldAlert} label="Lab Alerts" value={alerts.length} sub="biomarker thresholds" tone={alerts.length > 0 ? "warn" : "default"} />
      </div>

      {/* Roster Radar Grid */}
      <ClientRadarGrid />

      {/* Three-Column Command Panel */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Column 1: Attention Queue */}
        <div className="h-[480px] overflow-hidden">
          <AttentionQueue />
        </div>

        {/* Column 2: AI Coach Briefing Card */}
        <div className="lab-card-glow p-5 flex flex-col h-[480px] border border-border/80">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400 animate-pulse" />
                AI Coach Briefing
              </div>
              <p className="text-[10px] text-purple-400/80 uppercase font-mono mt-0.5 tracking-wider font-semibold">
                For coach review only
              </p>
            </div>
            <span className="chip border-purple-500/30 bg-purple-500/10 text-purple-400 font-mono text-[9px] uppercase">
              Assisted
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin pr-1 text-xs">
            {/* Coaching Summary */}
            <div className="space-y-2">
              <h4 className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider font-bold">Today's Coaching Summary</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/25">
                  <span className="text-muted-foreground">Critical lab alerts</span>
                  <span className="font-bold text-status-above">2 clients</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/25">
                  <span className="text-muted-foreground">Low adherence trends</span>
                  <span className="font-bold text-amber-500">5 clients</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/25">
                  <span className="text-muted-foreground">Check-ins submitted for review</span>
                  <span className="font-bold text-primary">3 clients</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/25">
                  <span className="text-muted-foreground">Check-ins due this week</span>
                  <span className="font-mono font-semibold">31 clients</span>
                </div>
              </div>
            </div>

            {/* Suggested Focus */}
            <div className="space-y-2">
              <h4 className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider font-bold">Suggested Focus</h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Thyroid Health", "Recovery Telemetry", "Nutrient Gaps", "Androgen Output"].map(tag => (
                  <span key={tag} className="border border-purple-500/25 bg-purple-500/5 text-purple-400 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 text-muted-foreground text-[11px] leading-relaxed">
              Ensure you review Sora Nakamura's thyroid panel and Marcus Reign's androgen compliance during today's workout review.
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <Button 
              variant="neon" 
              className="w-full border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15 font-semibold text-xs h-9 uppercase tracking-wider" 
              onClick={() => setIsBriefingOpen(true)}
            >
              Open AI Briefing
            </Button>
          </div>
        </div>

        {/* Column 3: Daily Actions */}
        <div className="h-[480px] overflow-hidden">
          <CoachWorkQueue />
        </div>
      </div>

      {/* 250-Client Roster Command Table */}
      <div className="lab-card-glow p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-semibold">250-Client Roster Command Table</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
              Showing {Math.min(visibleRosterCount, filteredRoster.length)} of {filteredRoster.length} clients
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search roster..." 
              value={rosterSearch}
              onChange={e => setRosterSearch(e.target.value)}
              className="pl-8 bg-background/50 text-xs h-8 border-border"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Client</th>
                <th className="text-left px-3 py-2.5">Primary Goal</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-right px-3 py-2.5">Training</th>
                <th className="text-right px-3 py-2.5">Nutrition</th>
                <th className="text-left px-3 py-2.5">Next Check-In</th>
                <th className="text-center px-3 py-2.5">Lab Alerts</th>
                <th className="text-right px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.slice(0, visibleRosterCount).map((c) => {
                // Fetch lab alerts for client
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
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/20 transition">
                    <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                      <div className={`grid h-6 w-6 place-items-center rounded bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[9px]`}>
                        {c.initials}
                      </div>
                      <div>
                        <div>{c.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{c.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[200px]">{c.goal}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "chip py-0.5 px-2 text-[9px] uppercase tracking-wider",
                        c.status === "review" 
                          ? "text-status-above border-status-above/30 bg-status-above/10" 
                          : c.status === "inactive"
                            ? "text-muted-foreground border-border/80 bg-secondary/40"
                            : "text-status-optimal border-status-optimal/30 bg-status-optimal/10"
                      )}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-data font-semibold">{c.trainingCompliance}%</td>
                    <td className="px-3 py-2.5 text-right font-mono-data font-semibold text-muted-foreground">{c.nutritionCompliance}%</td>
                    <td className="px-3 py-2.5 text-muted-foreground font-mono">{c.nextCheckIn}</td>
                    <td className="px-3 py-2.5 text-center">
                      {alertCount > 0 ? (
                        <span className="font-mono font-bold text-status-above bg-status-above/10 border border-status-above/30 rounded px-1.5 py-0.5 text-[10px]">{alertCount}</span>
                      ) : (
                        <span className="text-muted-foreground font-mono">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-[10px] hover:text-primary border border-transparent hover:border-border hover:bg-secondary/40"
                        onClick={() => navigate(`/coach/clients/${c.id}`)}
                      >
                        Open Profile <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRoster.length > visibleRosterCount && (
          <div className="flex justify-center pt-2">
            <Button
              variant="neon"
              className="text-xs h-8 px-6 font-semibold"
              onClick={() => setVisibleRosterCount(prev => prev + 10)}
            >
              Load More Clients (+10)
            </Button>
          </div>
        )}
      </div>

      {/* Select Client for Blood Report Upload Dialog */}
      <Dialog open={isUploadSelectOpen} onOpenChange={setIsUploadSelectOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
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
                className="pl-8 bg-background/50 text-xs h-9 border-border"
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
                    className="w-full text-left rounded-xl p-2.5 transition flex items-center justify-between border border-transparent hover:border-border hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[10px] shrink-0`}>
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
            <div className="w-screen max-w-4xl transform bg-card border-l border-border p-6 shadow-2xl transition-all flex flex-col h-full z-10">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400 animate-pulse-glow" />
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
        <SheetContent className="bg-card border-l border-border sm:max-w-3xl overflow-y-auto flex flex-col h-full z-50">
          <SheetHeader className="pb-4 border-b border-border/80">
            <SheetTitle className="text-xl font-bold font-display tracking-tight text-glow text-primary flex items-center gap-2">
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
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; tone?: "default" | "good" | "warn" }) {
  const toneCls = tone === "good" ? "text-status-optimal" : tone === "warn" ? "text-status-above" : "text-foreground";
  const borderGlow = tone === "good" ? "border-status-optimal/20 shadow-[0_0_12px_rgba(0,255,128,0.05)]" : tone === "warn" ? "border-status-above/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]" : "border-border/80";

  return (
    <div className={cn("lab-card-glow p-4 border transition duration-300", borderGlow)}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
        <Icon className={cn("h-4 w-4", tone === "good" ? "text-status-optimal" : tone === "warn" ? "text-status-above" : "text-primary")} />
      </div>
      <div className={`mt-2 font-display text-2xl md:text-3xl font-bold ${toneCls}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
