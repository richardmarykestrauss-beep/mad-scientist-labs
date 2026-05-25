import { useState } from "react";
import { Link } from "react-router-dom";
import { FeaturePlannedDialog } from "@/components/lab/FeaturePlannedDialog";
import { Activity, AlertTriangle, ArrowUpRight, Beaker, FlaskConical, Plus, ShieldAlert, TrendingUp, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, getClientPanels } from "@/data/store";
import { BIOMARKER_MAP, getStatus, STATUS_META } from "@/lib/biomarkers";
import type { BiomarkerStatus } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function CoachDashboard() {
  const [plannedFeature, setPlannedFeature] = useState<string | null>(null);
  const { clients, panels } = useStore();
  const review = clients.filter((c) => c.status === "review").length;
  const recentPanels = [...panels].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const avgTraining = Math.round(clients.reduce((s, c) => s + c.trainingCompliance, 0) / clients.length);
  const avgNutrition = Math.round(clients.reduce((s, c) => s + c.nutritionCompliance, 0) / clients.length);

  // Build alerts from latest panel of each client
  const alerts: { client: string; clientId: string; marker: string; status: string }[] = [];
  for (const c of clients) {
    const cp = getClientPanels(c.id);
    const latest = cp[cp.length - 1];
    if (!latest) continue;
    for (const r of latest.results) {
      const def = BIOMARKER_MAP[r.key]; if (!def) continue;
      const s = getStatus(def, r.value);
      if (s === "high" || s === "low") alerts.push({ client: c.name, clientId: c.id, marker: def.name, status: s });
    }
  }

  // Mini chart of avg training compliance over weeks (mocked from current numbers)
  const chartData = Array.from({ length: 8 }).map((_, i) => ({
    w: `W${i + 1}`,
    training: Math.max(60, Math.round(avgTraining - 8 + Math.sin(i) * 4 + i * 1.2)),
    nutrition: Math.max(60, Math.round(avgNutrition - 6 + Math.cos(i) * 5 + i * 0.8)),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <div className="chip mb-3"><FlaskConical className="h-3 w-3 text-primary" /> Coach Lab Console</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Welcome back, Dr. Vance</h1>
          <p className="text-muted-foreground mt-1">{clients.length} active clients · {panels.length} blood panels on file · {alerts.length} biomarker alerts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="hero" onClick={() => setPlannedFeature("Add Client")}><UserPlus className="h-4 w-4" /> Add Client</Button>
          <Button variant="neon" onClick={() => setPlannedFeature("Create Program")}><Plus className="h-4 w-4" /> Create Program</Button>
          <Button variant="outline" onClick={() => setPlannedFeature("Upload Panel")}><Beaker className="h-4 w-4" /> Upload Panel</Button>
        </div>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Active Clients" value={clients.length} sub={`${review} need review`} />
        <MetricCard icon={Beaker} label="Panels on File" value={panels.length} sub={`${recentPanels.length} this quarter`} />
        <MetricCard icon={TrendingUp} label="Training Compliance" value={`${avgTraining}%`} sub="avg across clients" tone={avgTraining >= 85 ? "good" : "warn"} />
        <MetricCard icon={Activity} label="Nutrition Compliance" value={`${avgNutrition}%`} sub="avg across clients" tone={avgNutrition >= 85 ? "good" : "warn"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lab-card-glow p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Compliance Telemetry</div>
              <div className="text-xs text-muted-foreground">8-week rolling average across roster</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Training</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-low" /> Nutrition</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="w" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="training" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="nutrition" stroke="hsl(var(--status-low))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lab-card-glow p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-status-above" /> Biomarker Alerts</div>
            <span className="chip">{alerts.length}</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
            {alerts.length === 0 && <div className="text-xs text-muted-foreground">No critical alerts.</div>}
            {alerts.slice(0, 8).map((a, i) => (
              <Link key={i} to={`/coach/clients/${a.clientId}?tab=blood`} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-2.5 hover:border-primary/40 transition">
                <AlertTriangle className={`h-4 w-4 ${a.status === "high" ? "text-status-high" : "text-status-low"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{a.marker}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{a.client}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase ${STATUS_META[a.status as BiomarkerStatus].color}`}>{a.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent panels + client list */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lab-card-glow p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Recent Blood Panel Uploads</div>
            <Link to="/coach/lab" className="text-xs text-primary hover:underline inline-flex items-center gap-1">All panels <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left px-3 py-2">Client</th><th className="text-left px-3 py-2">Panel</th><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Markers</th></tr>
              </thead>
              <tbody>
                {recentPanels.map((p) => {
                  const c = clients.find((x) => x.id === p.clientId);
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="px-3 py-2.5"><Link to={`/coach/clients/${p.clientId}`} className="hover:text-primary">{c?.name}</Link></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.label}</td>
                      <td className="px-3 py-2.5 font-mono-data text-xs">{p.date}</td>
                      <td className="px-3 py-2.5 font-mono-data text-xs">{p.results.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lab-card-glow p-5">
          <div className="text-sm font-semibold mb-3">Upcoming Check-ins</div>
          <div className="space-y-2">
            {[...clients].sort((a, b) => a.nextCheckIn.localeCompare(b.nextCheckIn)).slice(0, 5).map((c) => (
              <Link key={c.id} to={`/coach/clients/${c.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-2.5 hover:border-primary/40">
                <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${c.avatarColor} text-background font-bold text-xs`}>{c.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.goal}</div>
                </div>
                <div className="text-[11px] font-mono text-primary">{c.nextCheckIn.slice(5)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
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

function MetricCard({ icon: Icon, label, value, sub, tone = "default" }: { icon: LucideIcon; label: string; value: string | number; sub?: string; tone?: "default" | "good" | "warn" }) {
  const toneCls = tone === "good" ? "text-status-optimal" : tone === "warn" ? "text-status-above" : "text-foreground";
  return (
    <div className="lab-card-glow p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className={`mt-2 font-display text-2xl md:text-3xl font-bold ${toneCls}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
