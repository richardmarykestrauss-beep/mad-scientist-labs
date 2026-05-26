import { useMemo, useState } from "react";
import { BIOMARKER_MAP, BIOMARKERS, CATEGORIES, STATUS_META, getStatus, pctChange } from "@/lib/biomarkers";
import type { BloodPanel, BiomarkerStatus } from "@/lib/types";
import { StatusBadge } from "@/components/lab/StatusBadge";
import { StatGauge } from "@/components/lab/StatGauge";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, Beaker, ChevronRight, Info, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { BloodReportUploadFlow } from "@/components/blood/BloodReportUploadFlow";
import { actions } from "@/data/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
  panels: BloodPanel[];
  readOnly?: boolean;
}

export function BloodPanelDashboard({ clientId, panels, readOnly = false }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const latest = panels[panels.length - 1];
  const previous = panels[panels.length - 2];

  // Aggregate status counts
  const counts = useMemo(() => {
    const c: Record<BiomarkerStatus, number> = { low: 0, "below-optimal": 0, optimal: 0, "above-optimal": 0, high: 0, untested: 0 };
    if (!latest) return c;
    for (const r of latest.results) {
      const def = BIOMARKER_MAP[r.key]; if (!def) continue;
      c[getStatus(def, r.value)]++;
    }
    return c;
  }, [latest]);

  const total = latest?.results.length ?? 0;
  const score = total ? Math.round(((counts.optimal + counts["below-optimal"] * 0.6 + counts["above-optimal"] * 0.6) / total) * 100) : 0;

  const filteredMarkers = (latest?.results ?? []).filter((r) => {
    const def = BIOMARKER_MAP[r.key]; if (!def) return false;
    return activeCategory === "All" || def.category === activeCategory;
  });

  if (!latest) {
    return (
      <div className="lab-card-glow p-12 text-center">
        <Beaker className="h-10 w-10 mx-auto text-primary mb-3" />
        <div className="font-semibold">No blood panels yet</div>
        <div className="text-sm text-muted-foreground mt-1">Add the client's first panel to begin tracking biomarker trends.</div>
        {!readOnly && (
          <div className="mt-5 flex gap-2 justify-center">
            <Button
              variant="neon"
              className="border-primary/60 bg-primary/10 text-primary hover:bg-primary/15"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1.5" /> Upload Blood Report
            </Button>
            <AddPanelDialog clientId={clientId} />
          </div>
        )}

        <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <SheetContent className="bg-card border-l border-border sm:max-w-3xl overflow-y-auto flex flex-col h-full z-50">
            <SheetHeader className="pb-4 border-b border-border/80">
              <SheetTitle className="text-xl font-bold font-display tracking-tight text-glow text-primary flex items-center gap-2">
                <Beaker className="h-5 w-5" /> Blood Report Upload Intelligence
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Simulate OCR extraction and generate AI-assisted analysis for coach review.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4">
              <BloodReportUploadFlow clientId={clientId} onComplete={() => setIsUploadOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lab-card-glow p-5 lg:col-span-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Overall Blood Health Score</div>
          <div className="mt-2 flex items-end gap-3">
            <div className="font-display text-5xl font-bold text-glow text-primary">{score}</div>
            <div className="text-sm text-muted-foreground mb-2">/ 100</div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-primary" style={{ width: `${score}%` }} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Latest panel: <span className="text-foreground font-mono">{latest.date}</span> · {latest.label}</div>
        </div>

        <div className="lab-card-glow p-5 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Marker Distribution</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Stat label="Optimal" count={counts.optimal} status="optimal" />
            <Stat label="Below Optimal" count={counts["below-optimal"]} status="below-optimal" />
            <Stat label="Above Optimal" count={counts["above-optimal"]} status="above-optimal" />
            <Stat label="Low" count={counts.low} status="low" />
            <Stat label="High" count={counts.high} status="high" />
          </div>
          {latest.coachSummary && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Coach Summary</div>
              {latest.coachSummary}
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CATEGORIES.map((c) => c.key)].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                activeCategory === c
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              variant="neon"
              className="border-primary/60 bg-primary/10 text-primary hover:bg-primary/15"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1.5" /> Upload Blood Report
            </Button>
            <AddPanelDialog clientId={clientId} />
          </div>
        )}
      </div>

      {/* Biomarker table */}
      <div className="lab-card-glow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Biomarker</th>
                <th className="text-left px-3 py-3">Category</th>
                <th className="text-right px-3 py-3">Current</th>
                <th className="text-right px-3 py-3">Previous</th>
                <th className="text-right px-3 py-3">Δ</th>
                <th className="text-left px-3 py-3 w-[28%]">Range</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkers.map((r) => {
                const def = BIOMARKER_MAP[r.key]; if (!def) return null;
                const prev = previous?.results.find((x) => x.key === r.key)?.value;
                const delta = prev != null ? pctChange(r.value, prev) : null;
                const status = getStatus(def, r.value);
                const dir = delta == null ? null : delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat";
                return (
                  <tr key={r.key} className="border-t border-border hover:bg-secondary/20 cursor-pointer" onClick={() => setSelected(r.key)}>
                    <td className="px-4 py-3 font-medium">{def.name}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{def.category}</td>
                    <td className="px-3 py-3 text-right font-mono-data">{r.value}<span className="text-muted-foreground text-[11px] ml-1">{def.unit}</span></td>
                    <td className="px-3 py-3 text-right font-mono-data text-muted-foreground">{prev ?? "—"}</td>
                    <td className="px-3 py-3 text-right font-mono-data">
                      {delta == null ? "—" : (
                        <span className={cn("inline-flex items-center gap-1 text-xs", dir === "up" ? "text-status-above" : dir === "down" ? "text-status-low" : "text-muted-foreground")}>
                          {dir === "up" && <ArrowUp className="h-3 w-3" />}
                          {dir === "down" && <ArrowDown className="h-3 w-3" />}
                          {dir === "flat" && <ArrowRight className="h-3 w-3" />}
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3"><StatGauge def={def} value={r.value} /></td>
                    <td className="px-3 py-3"><StatusBadge status={status} /></td>
                    <td className="px-2 py-3 text-muted-foreground"><ChevronRight className="h-4 w-4" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DisclaimerCard />

      {selected && <BiomarkerDetailDialog markerKey={selected} panels={panels} onClose={() => setSelected(null)} />}

      <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <SheetContent className="bg-card border-l border-border sm:max-w-3xl overflow-y-auto flex flex-col h-full z-50">
          <SheetHeader className="pb-4 border-b border-border/80">
            <SheetTitle className="text-xl font-bold font-display tracking-tight text-glow text-primary flex items-center gap-2">
              <Beaker className="h-5 w-5" /> Blood Report Upload Intelligence
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Simulate OCR extraction and generate AI-assisted analysis for coach review.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <BloodReportUploadFlow clientId={clientId} onComplete={() => setIsUploadOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, count, status }: { label: string; count: number; status: BiomarkerStatus }) {
  const meta = STATUS_META[status];
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
        <span className="text-[10px] font-mono uppercase text-muted-foreground">{label}</span>
      </div>
      <div className={cn("mt-2 font-display text-2xl font-bold", meta.color)}>{count}</div>
    </div>
  );
}

function DisclaimerCard() {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 flex gap-3 items-start">
      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground">
        This app does not diagnose, treat, or cure disease. Blood marker insights are for coaching, tracking, and educational purposes only.
        Clients should consult a licensed medical professional for medical interpretation.
      </p>
    </div>
  );
}

function BiomarkerDetailDialog({ markerKey, panels, onClose }: { markerKey: string; panels: BloodPanel[]; onClose: () => void }) {
  const def = BIOMARKER_MAP[markerKey];
  const series = panels
    .map((p) => {
      const r = p.results.find((x) => x.key === markerKey);
      return r ? { date: p.date, value: r.value } : null;
    })
    .filter(Boolean) as { date: string; value: number }[];
  const latest = series[series.length - 1];
  const previous = series[series.length - 2];
  const status = latest ? getStatus(def, latest.value) : "untested";
  const delta = latest && previous ? pctChange(latest.value, previous.value) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {def.name}
            <StatusBadge status={status as BiomarkerStatus} />
          </DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-3 gap-3">
          <Mini label="Current" value={latest ? `${latest.value} ${def.unit}` : "—"} />
          <Mini label="Previous" value={previous ? `${previous.value} ${def.unit}` : "—"} />
          <Mini label="Change" value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`} />
        </div>
        <div className="lab-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Trend over time</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[(dataMin: number) => Math.min(dataMin, def.standardLow) * 0.9, (dataMax: number) => Math.max(dataMax, def.standardHigh) * 1.1]} />
                <ReferenceArea y1={def.optimalLow} y2={def.optimalHigh} fill="hsl(var(--status-optimal))" fillOpacity={0.12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="lab-card p-3">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Standard Range</div>
            <div className="font-mono-data text-sm mt-1">{def.standardLow} – {def.standardHigh} {def.unit}</div>
          </div>
          <div className="lab-card p-3">
            <div className="text-[10px] font-mono uppercase text-status-optimal">Optimal Range</div>
            <div className="font-mono-data text-sm mt-1">{def.optimalLow} – {def.optimalHigh} {def.unit}</div>
          </div>
        </div>
        {def.clientExplanation && (
          <div className="rounded-xl border border-border bg-background/40 p-3 text-sm">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Client-friendly explanation</div>
            {def.clientExplanation}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="lab-card p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono-data text-lg">{value}</div>
    </div>
  );
}

function AddPanelDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState("New Panel");
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Lipids");

  const visible = BIOMARKERS.filter((b) => b.category === activeCat && (search === "" || b.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero"><Plus className="h-4 w-4" /> Add Panel</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Blood Panel</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Q3 Recheck" /></div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Autofill Demo Presets</Label>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setLabel("Lipid Panel");
                setValues({
                  total_cholesterol: "185",
                  ldl: "95",
                  hdl: "58",
                  triglycerides: "80",
                  vldl: "16",
                  non_hdl: "127",
                  tc_hdl_ratio: "3.2",
                  tg_hdl_ratio: "1.4",
                  ldl_hdl_ratio: "1.6"
                });
                setActiveCat("Lipids");
              }}
            >
              Lipid Panel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setLabel("Thyroid Panel");
                setValues({
                  tsh: "1.6",
                  free_t4: "1.3",
                  free_t3: "3.5",
                  ft3_ft4_ratio: "2.7"
                });
                setActiveCat("Thyroid");
              }}
            >
              Thyroid Panel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setLabel("Complete Blood Count");
                setValues({
                  wbc: "6.2",
                  rbc: "4.8",
                  hemoglobin: "15.1",
                  hematocrit: "44.5",
                  platelets: "250",
                  mcv: "90",
                  mch: "29",
                  mchc: "34",
                  rdw: "13.0"
                });
                setActiveCat("Red Blood Cells");
              }}
            >
              Complete Blood Count
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setLabel("Hormone Snapshot");
                setValues({
                  total_test: "720",
                  free_test: "175",
                  estradiol: "24",
                  prolactin: "7.8",
                  lh: "4.5",
                  fsh: "3.2",
                  bio_test: "380"
                });
                setActiveCat("Hormones");
              }}
            >
              Hormone Snapshot
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setActiveCat(c.key)} className={cn("rounded-full border px-2.5 py-1 text-[11px] transition", activeCat === c.key ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{c.label}</button>
          ))}
        </div>
        <Input placeholder="Search biomarker…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1 pr-1">
          {visible.map((b) => (
            <div key={b.key} className="grid grid-cols-[1fr_120px_auto] items-center gap-2 rounded-lg border border-border bg-background/40 p-2">
              <div>
                <div className="text-sm font-medium">{b.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">opt {b.optimalLow}–{b.optimalHigh} {b.unit}</div>
              </div>
              <Input type="number" step="0.01" value={values[b.key] ?? ""} onChange={(e) => setValues({ ...values, [b.key]: e.target.value })} placeholder="value" className="h-8" />
              <span className="text-[10px] font-mono text-muted-foreground w-10">{b.unit}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="hero" onClick={() => {
            const results = Object.entries(values)
              .filter(([_, v]) => v !== "")
              .map(([key, v]) => ({ key, value: parseFloat(v) }));
            if (!results.length) return toast.error("Add at least one value");
            actions.addPanel(clientId, date, label, results);
            toast.success(`Panel added with ${results.length} markers`);
            setOpen(false); setValues({});
          }}>Save Panel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
