import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Copy, 
  Filter, 
  Link2, 
  Plus, 
  Search, 
  UserPlus, 
  ArrowUpDown, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  Beaker,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useStore, actions } from "@/data/store";
import { BIOMARKERS, getStatus } from "@/lib/biomarkers";
import type { Client, BloodPanel } from "@/lib/types";
import { toast } from "sonner";
import { dataMode } from "@/lib/supabase";
import { getCheckInRepository } from "@/repositories/checkInRepository";
import { useAuth } from "@/context/AuthContext";

const repository = getCheckInRepository();

// Helper to detect if client has lab alerts in latest panel
function getClientAlerts(clientId: string, panels: BloodPanel[]) {
  const clientPanels = panels.filter((p) => p.clientId === clientId);
  if (clientPanels.length === 0) return { hasAlerts: false, markers: [] as string[], latestDate: null };
  const latest = [...clientPanels].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return { hasAlerts: false, markers: [] as string[], latestDate: null };
  
  const markers: string[] = [];
  for (const r of latest.results) {
    const def = BIOMARKERS.find((b) => b.key === r.key);
    if (!def) continue;
    const status = getStatus(def, r.value);
    if (status === "high" || status === "low") {
      markers.push(def.name);
    }
  }
  return {
    hasAlerts: markers.length > 0,
    markers,
    latestDate: latest.date
  };
}

export default function ClientList() {
  const { profile } = useAuth();
  const { clients: localClients, panels, checkIns } = useStore();
  const [liveClients, setLiveClients] = useState<Client[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(dataMode === "supabase");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "review" | "lab-alerts" | "check-in-due" | "low-adherence" | "inactive">("all");
  const [sortBy, setSortBy] = useState<string>("needs-attention");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  
  // Pagination State
  const [visibleCount, setVisibleCount] = useState(12);

  // Selected client for preview drawer
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inviteCode = useMemo(() => "MSL-" + Math.random().toString(36).slice(2, 8).toUpperCase(), [open]);
  const TODAY = "2026-05-26";

  useEffect(() => {
    if (dataMode !== "supabase") return;
    setLiveClients([]);
    setLiveError(null);
    setLiveLoading(true);
    repository.listAssignedClients()
      .then((profiles) => {
        setLiveClients(profiles.map((profile) => {
          const name = profile.fullName?.trim() || "Pilot Client";
          return {
            id: profile.id,
            name,
            email: "Individual pilot account",
            avatarColor: "from-emerald-500 to-teal-700",
            initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
            goal: "Not yet connected",
            bodyWeightKg: 0,
            startedAt: "",
            status: "active",
            trainingCompliance: 0,
            nutritionCompliance: 0,
            nextCheckIn: "Weekly",
          };
        }));
        setLiveError(null);
      })
      .catch((error: unknown) => setLiveError(error instanceof Error ? error.message : "Unable to load assigned clients."))
      .finally(() => setLiveLoading(false));
  }, [profile?.id]);

  const clients = dataMode === "supabase" ? liveClients : localClients;

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setVisibleCount(12);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setVisibleCount(12);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
    setVisibleCount(12);
  };


  // Filter clients
  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch = 
        q === "" || 
        c.name.toLowerCase().includes(q.toLowerCase()) || 
        c.email.toLowerCase().includes(q.toLowerCase()) ||
        c.goal.toLowerCase().includes(q.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === "all") return true;
      if (filter === "active") return c.status === "active";
      if (filter === "review") return c.status === "review";
      if (filter === "inactive") return c.status === "inactive";
      
      if (filter === "lab-alerts") {
        if (dataMode === "supabase") return false;
        const { hasAlerts } = getClientAlerts(c.id, panels);
        return hasAlerts;
      }

      if (filter === "check-in-due") {
        return c.status === "review" || c.nextCheckIn <= TODAY;
      }

      if (filter === "low-adherence") {
        return c.trainingCompliance < 75 || c.nutritionCompliance < 75;
      }

      return true;
    });
  }, [clients, panels, q, filter]);

  // Sort clients
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "needs-attention") {
      return list.sort((a, b) => {
        // review status is absolute top priority
        if (a.status === "review" && b.status !== "review") return -1;
        if (b.status === "review" && a.status !== "review") return 1;

        // check-in overdue is next
        const dueA = a.nextCheckIn <= TODAY;
        const dueB = b.nextCheckIn <= TODAY;
        if (dueA && !dueB) return -1;
        if (dueB && !dueA) return 1;

        // then lowest adherence
        const avgA = (a.trainingCompliance + a.nutritionCompliance) / 2;
        const avgB = (b.trainingCompliance + b.nutritionCompliance) / 2;
        return avgA - avgB;
      });
    }
    if (sortBy === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "check-in") {
      return list.sort((a, b) => a.nextCheckIn.localeCompare(b.nextCheckIn));
    }
    if (sortBy === "training") {
      return list.sort((a, b) => b.trainingCompliance - a.trainingCompliance);
    }
    if (sortBy === "nutrition") {
      return list.sort((a, b) => b.nutritionCompliance - a.nutritionCompliance);
    }
    return list;
  }, [filtered, sortBy]);

  // Paginated clients
  const paginatedClients = sorted.slice(0, visibleCount);

  // Loaded alerts for selected preview client
  const selectedClientAlerts = useMemo(() => {
    if (!selectedClient || dataMode === "supabase") return { hasAlerts: false, markers: [], latestDate: null };
    return getClientAlerts(selectedClient.id, panels);
  }, [selectedClient, panels]);

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between min-w-0">
        <div className="min-w-0">
          <div className="chip mb-2 bg-slate-50 border-slate-200 text-slate-500">Roster Console</div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2 text-slate-900">
            Clients
            <span className="text-xs font-mono text-slate-500 font-normal border border-slate-200 px-2 py-0.5 rounded-full bg-white">
              {dataMode === "supabase" ? "Live assigned roster" : "Mock demo roster"}
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {dataMode === "supabase" ? "Only clients actively assigned to this coach are shown." : "Prototype roster with local demo data."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {dataMode !== "supabase" && <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-mono text-[10px] uppercase tracking-wider h-9">
                <UserPlus className="h-4 w-4 mr-1 text-emerald-600" /> Invite Client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-800">
              <DialogHeader>
                <DialogTitle className="text-slate-900 font-display font-bold">Invite a new client</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Generate an invite link or add them manually.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Link2 className="h-4 w-4 text-emerald-600" />
                  <code className="flex-1 truncate font-mono text-xs text-slate-600">https://madsci.lab/invite/{inviteCode}</code>
                  <Button size="sm" variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-mono text-[9px] uppercase tracking-wider" onClick={() => { navigator.clipboard.writeText(`https://madsci.lab/invite/${inviteCode}`); toast.success("Invite link copied"); }}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
                <div className="text-xs text-slate-500 text-center">— or add manually —</div>
                <div className="grid gap-3">
                  <div className="space-y-1.5"><Label className="text-slate-600">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="bg-slate-50 border-slate-200 text-slate-800" /></div>
                  <div className="space-y-1.5"><Label className="text-slate-600">Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@athlete.com" className="bg-slate-50 border-slate-200 text-slate-800" /></div>
                  <div className="space-y-1.5"><Label className="text-slate-600">Primary Goal</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Recomp, recover thyroid…" className="bg-slate-50 border-slate-200 text-slate-800" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-500">Cancel</Button>
                <Button variant="default" className="bg-slate-900 hover:bg-slate-800 text-white" onClick={() => {
                  if (!name) return toast.error("Name required");
                  actions.addClient(name, email || "pending@invite", goal || "—");
                  setOpen(false); setName(""); setEmail(""); setGoal("");
                  toast.success("Client added to mock store");
                }}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>}
        </div>
      </div>

      {dataMode === "supabase" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Pilot: roster identity and weekly check-ins are live. Compliance, training, nutrition, labs, and invitation controls are not yet connected.
        </div>
      )}

      {liveLoading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading assigned pilot clients…</div>}
      {liveError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{liveError}</div>}

      {/* Search and Filters */}
      <div className="bg-white p-4 flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between border border-slate-200 rounded-xl shadow-sm min-w-0">
        {/* Search */}
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            value={q} 
            onChange={handleSearchChange} 
            placeholder="Search roster by name, email, or goal..." 
            className="pl-9 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white placeholder-slate-400" 
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3 items-stretch md:items-center min-w-0">
          {/* Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
            <span className="text-xs text-slate-500 font-mono whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort By:
            </span>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer h-9 w-full sm:w-auto min-w-0"
            >
              <option value="needs-attention">Needs Attention</option>
              <option value="name">Name (A-Z)</option>
              <option value="check-in">Check-in Date</option>
              <option value="training">Training Compliance</option>
              <option value="nutrition">Nutrition Compliance</option>
            </select>
          </div>

          {/* Counts */}
          <div className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-center">
            Showing {Math.min(visibleCount, sorted.length)} of {sorted.length} clients
          </div>
        </div>
      </div>

      {/* 7 Filter Tabs */}
      <div className="flex min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-2 scrollbar-thin gap-1">
        {(
          [
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "review", label: "Needs Review" },
            { id: "lab-alerts", label: "Lab Alerts" },
            { id: "check-in-due", label: "Check-In Due" },
            { id: "low-adherence", label: "Low Adherence" },
            { id: "inactive", label: "Inactive" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleFilterChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition border ${
              filter === tab.id
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Clients */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm py-16 text-center text-slate-500 flex flex-col items-center">
          <Filter className="h-8 w-8 text-emerald-500 mb-3 opacity-60" />
          <div className="text-sm font-semibold">No clients match your filter criteria</div>
          <div className="text-xs mt-1">Try resetting search query or tab filters.</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
          {paginatedClients.map((c) => {
            const { hasAlerts, markers } = dataMode === "local"
              ? getClientAlerts(c.id, panels)
              : { hasAlerts: false, markers: [] as string[] };
            return (
              <div
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className="bg-white w-full min-w-0 max-w-full box-border p-5 border border-slate-200 hover:border-emerald-300 rounded-xl shadow-sm transition group cursor-pointer flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${c.avatarColor} text-white font-bold`}>
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-slate-800 group-hover:text-emerald-600 transition flex items-center gap-1.5">
                      {c.name}
                      {hasAlerts && (
                        <span title={`${markers.length} lab alerts`} className="shrink-0">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{c.email}</div>
                  </div>
                  <span className={`chip shrink-0 ${
                    c.status === "review" 
                      ? "text-amber-700 border-amber-200 bg-amber-50" 
                      : c.status === "inactive"
                        ? "text-slate-500 border-slate-200 bg-slate-50"
                        : "text-emerald-700 border-emerald-200 bg-emerald-50"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-500 line-clamp-2 min-h-[2.5em] flex-1">
                  {c.goal}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <Bar label="Training" value={c.trainingCompliance} />
                  <Bar label="Nutrition" value={c.nutritionCompliance} />
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>BW {c.bodyWeightKg || "—"} kg</span>
                  <span className={c.nextCheckIn <= TODAY && c.status !== "review" ? "text-amber-600 font-bold" : ""}>
                    Check-in: {c.nextCheckIn}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Load More Button */}
      {sorted.length > visibleCount && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            className="w-full sm:w-auto px-10 h-10 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => setVisibleCount((prev) => prev + 12)}
          >
            Load More Clients (+12)
          </Button>
        </div>
      )}

      {/* Quick Preview Slide-over Drawer */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        {selectedClient && (
          <SheetContent className="bg-white border-l border-slate-200 sm:max-w-md overflow-y-auto flex flex-col h-full z-50 text-slate-800">
            <SheetHeader className="pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${selectedClient.avatarColor} text-white font-bold text-lg shadow-lg`}>
                  {selectedClient.initials}
                </div>
                <div className="text-left">
                  <SheetTitle className="text-xl font-bold font-display tracking-tight text-slate-900">
                    {selectedClient.name}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-500">
                    {selectedClient.email}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 py-5 space-y-6">
              {/* Status Section */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs text-slate-500 uppercase font-mono">Profile Status</span>
                <span className={`chip capitalize ${
                  selectedClient.status === "review" 
                    ? "text-amber-700 border-amber-200 bg-amber-50" 
                    : selectedClient.status === "inactive"
                      ? "text-slate-500 border-slate-200 bg-slate-50"
                      : "text-emerald-700 border-emerald-200 bg-emerald-50"
                }`}>
                  {selectedClient.status}
                </span>
              </div>

              {/* Goal Box */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Coaching Focus</h4>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs leading-relaxed text-slate-700 font-medium font-display">
                  {selectedClient.goal}
                </div>
              </div>

              {/* Adherence / Compliance */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Roster Adherence Averages</h4>
                <div className="grid gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <Bar label="Training Compliance" value={selectedClient.trainingCompliance} />
                  <Bar label="Nutrition Compliance" value={selectedClient.nutritionCompliance} />
                </div>
              </div>

              {/* Core Telemetry */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Last Weight</div>
                  <div className="text-lg font-bold mt-1 font-mono-data text-slate-800">{selectedClient.bodyWeightKg || "—"} kg</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Next Check-In</div>
                  <div className={`text-sm font-bold mt-2 font-mono-data ${selectedClient.nextCheckIn <= TODAY && selectedClient.status !== "review" ? "text-amber-600 font-bold" : "text-slate-800"}`}>
                    {selectedClient.nextCheckIn}
                  </div>
                </div>
              </div>

              {/* Latest Lab Alerts */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
                  <Beaker className="h-3 w-3 text-emerald-600" /> Lab Telemetry Alert Status
                </h4>
                {selectedClientAlerts.hasAlerts ? (
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Anomalies Detected ({selectedClientAlerts.markers.length})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      The latest panel from <span className="font-mono">{selectedClientAlerts.latestDate}</span> reports out-of-bounds values:
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedClientAlerts.markers.map((marker) => (
                        <span key={marker} className="text-[10px] font-semibold bg-amber-100/50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                          {marker}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : selectedClientAlerts.latestDate ? (
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <div className="text-xs font-semibold text-emerald-700">
                      All Biomarkers Optimal (Latest: {selectedClientAlerts.latestDate})
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                    No blood panel records on file.
                  </div>
                )}
              </div>
            </div>

            {/* Actions at bottom */}
            <div className="pt-4 border-t border-slate-200 mt-auto space-y-2">
              <Button
                variant="default"
                className="w-full h-11 text-xs gap-1.5 font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800"
                asChild
                onClick={() => setSelectedClient(null)}
              >
                <Link to={`/coach/clients/${selectedClient.id}`}>
                  Open Full Profile
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              
              {dataMode !== "supabase" && selectedClient.status === "review" && (
                <Button
                  variant="outline"
                  className="w-full h-10 text-xs font-semibold border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => {
                    const pending = checkIns.find(ch => ch.clientId === selectedClient.id && (ch.status === "needs_review" || ch.status === "submitted"));
                    if (pending) {
                      actions.reviewCheckIn(pending.id, "Reviewed via client roster", "Coach Warren");
                    } else {
                      actions.setClientStatus(selectedClient.id, "active");
                    }
                    setSelectedClient({ ...selectedClient, status: "active" });
                    toast.success("Client marked active/reviewed");
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Mark Check-In Reviewed
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full h-10 text-xs text-slate-500 hover:text-slate-800"
                onClick={() => setSelectedClient(null)}
              >
                Close Preview
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
