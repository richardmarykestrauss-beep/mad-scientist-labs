import { useState, useEffect, useMemo } from "react";
import { 
  Upload, 
  Beaker, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  Copy, 
  FileText, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useStore, actions, getClientPanels } from "@/data/store";
import { BIOMARKERS, getStatus, STATUS_META, pctChange } from "@/lib/biomarkers";
import type { BloodPanel, BiomarkerResult, Client } from "@/lib/types";
import { toast } from "sonner";

interface ExtractedRow {
  key: string;
  name: string;
  value: number;
  unit: string;
  confidence: number;
  status: "accepted" | "ignored";
  isEditing: boolean;
  editValue: string;
}

const INITIAL_ROWS = (): ExtractedRow[] => [
  { key: "total_test", name: "Total Testosterone", value: 520, unit: "ng/dL", confidence: 98, status: "accepted", isEditing: false, editValue: "520" },
  { key: "free_test", name: "Free Testosterone", value: 9.2, unit: "pg/mL", confidence: 95, status: "accepted", isEditing: false, editValue: "9.2" },
  { key: "tsh", name: "TSH", value: 3.8, unit: "µIU/mL", confidence: 99, status: "accepted", isEditing: false, editValue: "3.8" },
  { key: "free_t3", name: "Free T3", value: 2.4, unit: "pg/mL", confidence: 94, status: "accepted", isEditing: false, editValue: "2.4" },
  { key: "vitamin_d", name: "Vitamin D", value: 24, unit: "ng/mL", confidence: 97, status: "accepted", isEditing: false, editValue: "24" },
  { key: "ferritin", name: "Ferritin", value: 18, unit: "ng/mL", confidence: 96, status: "accepted", isEditing: false, editValue: "18" },
  { key: "ldl", name: "LDL Cholesterol", value: 112, unit: "mg/dL", confidence: 98, status: "accepted", isEditing: false, editValue: "112" },
  { key: "hdl", name: "HDL Cholesterol", value: 42, unit: "mg/dL", confidence: 98, status: "accepted", isEditing: false, editValue: "42" },
  { key: "alt", name: "ALT", value: 28, unit: "U/L", confidence: 97, status: "accepted", isEditing: false, editValue: "28" },
  { key: "fasting_glucose", name: "Fasting Glucose", value: 104, unit: "mg/dL", confidence: 98, status: "accepted", isEditing: false, editValue: "104" },
];

const SCAN_MESSAGES = [
  "Reading report PDF file structure...",
  "Detecting biomarker table coordinates...",
  "Extracting raw data values and mapping units...",
  "Running optical confidence validation checks...",
  "Formatting review console panel..."
];

interface Props {
  clientId: string;
  onComplete: () => void;
}

export function BloodReportUploadFlow({ clientId, onComplete }: Props) {
  const { clients } = useStore();
  const client = clients.find((c) => c.id === clientId) as Client;
  const clientPanels = getClientPanels(clientId);
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Upload, 2: Scan, 3: Review, 4: Findings
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  
  // Input fields for Step 3 Import metadata
  const [panelDate, setPanelDate] = useState("2026-05-26");
  const [panelLabel, setPanelLabel] = useState("AI Scan Import");

  // Reference to newly created panel
  const [newPanel, setNewPanel] = useState<BloodPanel | null>(null);

  // Load mock data when starting
  useEffect(() => {
    setRows(INITIAL_ROWS());
  }, []);

  // Step 2: Simulated Scan effect
  useEffect(() => {
    if (step !== 2) return;

    setScanProgress(0);
    setScanMessageIndex(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setStep(3);
          }, 400);
          return 100;
        }
        
        const nextProgress = prev + 5;
        // Shift message every 20% progress
        const nextMsgIndex = Math.min(
          Math.floor(nextProgress / 20),
          SCAN_MESSAGES.length - 1
        );
        setScanMessageIndex(nextMsgIndex);
        return nextProgress;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [step]);

  const handleSimulateUpload = () => {
    setStep(2);
  };

  const handleAcceptRow = (key: string) => {
    setRows(rows.map(r => r.key === key ? { ...r, status: "accepted" } : r));
  };

  const handleIgnoreRow = (key: string) => {
    setRows(rows.map(r => r.key === key ? { ...r, status: "ignored" } : r));
  };

  const handleEditRow = (key: string) => {
    setRows(rows.map(r => r.key === key ? { ...r, isEditing: true } : r));
  };

  const handleSaveRow = (key: string) => {
    setRows(rows.map(r => {
      if (r.key === key) {
        const floatVal = parseFloat(r.editValue);
        return {
          ...r,
          value: isNaN(floatVal) ? r.value : floatVal,
          isEditing: false
        };
      }
      return r;
    }));
  };

  const handleEditValueChange = (key: string, val: string) => {
    setRows(rows.map(r => r.key === key ? { ...r, editValue: val } : r));
  };

  const handleImport = () => {
    const acceptedRows = rows.filter(r => r.status === "accepted");
    if (acceptedRows.length === 0) {
      toast.error("Please accept at least one biomarker to import.");
      return;
    }

    const results: BiomarkerResult[] = acceptedRows.map(r => ({
      key: r.key,
      value: r.value
    }));

    const summary = `AI-assisted lab report extraction imported by Coach Warren Germishuizen on ${new Date().toISOString().slice(0, 10)}.`;
    
    // Add panel to store
    const panel = actions.addPanel(clientId, panelDate, panelLabel, results, summary);
    setNewPanel(panel);
    toast.success("Blood panel imported successfully");
    setStep(4);
  };

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Client draft message copied to clipboard");
  };

  // Compute findings for Step 4
  const findings = useMemo(() => {
    if (!newPanel) return null;

    const outOfOptimal: { name: string; value: number; unit: string; statusLabel: string; statusColor: string }[] = [];
    const trendNotes: string[] = [];

    // Prior panel for trend line (excluding the newly imported one)
    const priorPanels = clientPanels.filter(p => p.id !== newPanel.id);
    const prevPanel = priorPanels.length > 0 
      ? [...priorPanels].sort((a, b) => b.date.localeCompare(a.date))[0] 
      : null;

    for (const r of newPanel.results) {
      const def = BIOMARKERS.find(b => b.key === r.key);
      if (!def) continue;

      const status = getStatus(def, r.value);
      if (status !== "optimal") {
        const meta = STATUS_META[status];
        outOfOptimal.push({
          name: def.name,
          value: r.value,
          unit: def.unit,
          statusLabel: meta.label,
          statusColor: meta.color
        });
      }

      // Check trends
      if (prevPanel) {
        const prevVal = prevPanel.results.find(x => x.key === r.key)?.value;
        if (prevVal != null) {
          const delta = pctChange(r.value, prevVal);
          const percent = Math.abs(Math.round(delta * 10) / 10);
          if (percent > 0.5) {
            const dir = delta > 0 ? "increased" : "decreased";
            trendNotes.push(`${def.name} has ${dir} by ${percent}% since previous panel (${prevPanel.date}).`);
          }
        }
      }
    }

    // Suggested coach questions
    const questions: string[] = [];
    if (newPanel.results.some(r => r.key === "ferritin" && r.value < 30)) {
      questions.push("How has your midday fatigue or recovery between heavy squats/lifts been since last check-in?");
    }
    if (newPanel.results.some(r => r.key === "vitamin_d" && r.value < 30)) {
      questions.push("Are you noticing any joint discomfort, muscle soreness, or mood dips during low daylight hours?");
    }
    if (newPanel.results.some(r => r.key === "fasting_glucose" && r.value > 100)) {
      questions.push("Did you experience high stress, poor sleep, or have a late carbohydrate meal the night before this draw?");
    }
    if (newPanel.results.some(r => (r.key === "tsh" && r.value > 2.5) || (r.key === "free_t3" && r.value < 2.8))) {
      questions.push("How has your cold tolerance, cognitive clarity, and overall baseline metabolic rate felt recently?");
    }
    if (questions.length === 0) {
      questions.push("How are your recovery, sleep quality, and daily energy levels aligning with our current training volume?");
    }

    // Suggested next actions
    const nextActions: string[] = [];
    if (newPanel.results.some(r => r.key === "vitamin_d" && r.value < 30)) {
      nextActions.push("Consider adjusting Vitamin D3 + K2 recommendations to support calcium metabolism and bone health.");
    }
    if (newPanel.results.some(r => r.key === "ferritin" && r.value < 30)) {
      nextActions.push("Discuss dietary iron intake or suggest baseline iron supplementation protocol.");
    }
    if (newPanel.results.some(r => (r.key === "tsh" && r.value > 3.0) || (r.key === "free_t3" && r.value < 2.5))) {
      nextActions.push("Flag thyroid conversion as a potential coaching discussion point; review calorie boundaries.");
      nextActions.push("Recommend client discuss thyroid markers with a qualified medical professional if metabolic signs persist.");
    }
    nextActions.push("Schedule a routine biomarker recheck in 8-12 weeks to monitor compliance trends.");

    // Draft client message
    const draftMessage = `Hi ${client?.name || "there"},

I've successfully uploaded and reviewed your latest blood report. 

Overall, we have some solid indicators. However, a few markers are currently outside our optimal coaching ranges:
${outOfOptimal.map(o => `- ${o.name}: ${o.value} ${o.unit} (${o.statusLabel})`).join("\n")}

These are valuable discussion points for our next check-in. We'll make minor updates to your nutrition and supplement guidelines to support your ferritin, vitamin D levels, and thyroid conversion. 

As always, these adjustments are for coaching and athletic optimization. I recommend reviewing these findings and discussing them with a qualified medical professional if you have any clinical concerns or need medical guidance.

Let's discuss these details on our scheduled check-in call!

Best,
Coach Warren`;

    return {
      outOfOptimal,
      trendNotes,
      questions,
      nextActions,
      draftMessage
    };
  }, [newPanel, clientPanels, client]);

  return (
    <div className="space-y-6">
      {/* Stepper progress */}
      <div className="flex items-center justify-between px-2 py-3 rounded-xl border border-border/60 bg-background/20">
        {[
          { label: "Upload", s: 1 },
          { label: "Scan Report", s: 2 },
          { label: "Review Labs", s: 3 },
          { label: "Findings", s: 4 }
        ].map((item, idx, arr) => (
          <div key={item.s} className="flex items-center flex-1 last:flex-initial">
            <div className="flex items-center gap-2">
              <div className={`grid h-6 w-6 place-items-center rounded-full text-xs font-mono font-bold border transition ${
                step === item.s 
                  ? "bg-primary/20 text-primary border-primary" 
                  : step > item.s
                    ? "bg-primary text-background border-primary"
                    : "bg-secondary text-muted-foreground border-border"
              }`}>
                {item.s}
              </div>
              <span className={`text-xs font-medium ${
                step === item.s ? "text-primary font-bold" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 mx-auto" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload Card */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="lab-card-glow p-8 border-dashed border-2 border-border/80 flex flex-col items-center justify-center text-center hover:border-primary/40 transition group py-12">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center mb-4 group-hover:scale-105 transition duration-200">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-sm text-foreground">Drag and drop blood report</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Supports scanned PDFs, JPG, or PNG formats from HelixLabs or standard clinics.
            </p>
            <div className="mt-5">
              <Button variant="neon" className="h-9 px-6 font-bold" onClick={handleSimulateUpload}>
                Simulate Report Upload
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono tracking-widest mt-4">
              Prototype scan — no real file stored
            </span>
          </div>
        </div>
      )}

      {/* Step 2: Simulated Scan progress */}
      {step === 2 && (
        <div className="lab-card-glow p-8 flex flex-col items-center justify-center py-16 text-center space-y-5 animate-pulse-glow">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-1" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Simulated OCR Scanning...</h3>
            <p className="text-xs text-primary font-mono font-medium">
              {SCAN_MESSAGES[scanMessageIndex]}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Progress value={scanProgress} className="h-2" />
            <div className="text-[10px] text-muted-foreground mt-1 text-right font-mono">{scanProgress}%</div>
          </div>
        </div>
      )}

      {/* Step 3: Review Table */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-sm font-semibold">Review Extracted Biomarkers</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                Verify confidence index and units before importing
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="panel-date" className="text-[10px] font-mono text-muted-foreground uppercase">Draw Date</Label>
                <Input 
                  id="panel-date" 
                  type="date" 
                  value={panelDate} 
                  onChange={(e) => setPanelDate(e.target.value)} 
                  className="w-32 bg-background/50 text-xs h-8 py-1 px-2 border-border"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="panel-label" className="text-[10px] font-mono text-muted-foreground uppercase">Label</Label>
                <Input 
                  id="panel-label" 
                  type="text" 
                  value={panelLabel} 
                  onChange={(e) => setPanelLabel(e.target.value)} 
                  className="w-36 bg-background/50 text-xs h-8 py-1 px-2 border-border"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Table Column */}
            <div className="lg:col-span-2 space-y-3">
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2.5">Biomarker</th>
                      <th className="text-right px-3 py-2.5">Value</th>
                      <th className="text-left px-3 py-2.5">Unit</th>
                      <th className="text-right px-3 py-2.5">Conf.</th>
                      <th className="text-left px-3 py-2.5">Mapped Key</th>
                      <th className="text-left px-3 py-2.5">Status</th>
                      <th className="text-center px-3 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const def = BIOMARKERS.find(b => b.key === row.key);
                      const isIgnored = row.status === "ignored";
                      
                      let statusNode = <span className="text-muted-foreground font-mono">—</span>;
                      if (!isIgnored && def) {
                        const status = getStatus(def, row.value);
                        const meta = STATUS_META[status];
                        statusNode = <span className={`font-semibold ${meta.color}`}>{meta.label}</span>;
                      }

                      return (
                        <tr 
                          key={row.key} 
                          className={`border-t border-border/80 hover:bg-secondary/10 transition ${
                            isIgnored ? "opacity-40" : ""
                          }`}
                        >
                          <td className="px-3 py-2.5 font-medium">{row.name}</td>
                          <td className="px-3 py-2.5 text-right font-mono-data">
                            {row.isEditing ? (
                              <input 
                                type="text" 
                                value={row.editValue} 
                                onChange={(e) => handleEditValueChange(row.key, e.target.value)}
                                className="bg-background border border-border rounded px-1.5 py-0.5 text-right w-16 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              row.value
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-mono">{row.unit}</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`font-mono font-bold ${
                              row.confidence >= 95 ? "text-status-optimal" : "text-amber-500"
                            }`}>{row.confidence}%</span>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-mono">{row.key}</td>
                          <td className="px-3 py-2.5">{statusNode}</td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {row.isEditing ? (
                                <Button 
                                  size="sm" 
                                  variant="neon" 
                                  className="h-6 px-2 text-[10px] rounded" 
                                  onClick={() => handleSaveRow(row.key)}
                                >
                                  Save
                                </Button>
                              ) : (
                                <button 
                                  onClick={() => handleEditRow(row.key)}
                                  className="p-1 hover:text-primary text-muted-foreground transition"
                                  title="Edit value"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {isIgnored ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-[10px] text-primary hover:text-primary rounded border border-transparent hover:border-border hover:bg-secondary/40"
                                  onClick={() => handleAcceptRow(row.key)}
                                >
                                  Accept
                                </Button>
                              ) : (
                                <button
                                  onClick={() => handleIgnoreRow(row.key)}
                                  className="p-1 hover:text-status-above text-muted-foreground transition"
                                  title="Ignore biomarker"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confidence Card Column */}
            <div className="lg:col-span-1 space-y-4">
              <div className="lab-card-glow p-5 border border-border/80 space-y-5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Extraction Confidence</h4>
                
                {/* Circular Gauge mockup */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative h-28 w-28 rounded-full border-4 border-dashed border-status-optimal/30 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,255,128,0.05)] animate-pulse-glow">
                    <span className="absolute h-24 w-24 rounded-full border border-status-optimal/20" />
                    <div className="text-center">
                      <div className="text-3xl font-display font-bold text-glow text-status-optimal">97%</div>
                      <div className="text-[9px] font-mono text-muted-foreground uppercase font-semibold">Optical Conf.</div>
                    </div>
                  </div>
                  <span className="mt-3 text-xs font-bold text-status-optimal uppercase tracking-wide">High Confidence</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">10 markers parsed</span>
                </div>

                {/* Score breakdown list */}
                <div className="space-y-2 text-xs border-t border-border/40 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-status-optimal" /> High (&gt;95%):
                    </span>
                    <span className="font-bold font-mono">8 markers</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Medium (80-94%):
                    </span>
                    <span className="font-bold font-mono">2 markers</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-status-high" /> Low (&lt;80%):
                    </span>
                    <span className="font-bold font-mono text-muted-foreground">0 markers</span>
                  </div>
                </div>

                {/* File summary info box */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background/40">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold truncate text-foreground">lab_report_chemistry.pdf</div>
                    <div className="text-[9px] text-muted-foreground font-mono">1.2 MB · Verified Structure</div>
                  </div>
                  <CheckCircle className="h-4.5 w-4.5 text-status-optimal shrink-0" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button 
              variant="outline" 
              className="h-9 px-5 text-muted-foreground" 
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button 
              variant="hero" 
              className="h-9 px-6 font-bold uppercase tracking-wider" 
              onClick={handleImport}
            >
              Approve & Import Labs
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Coach Findings Summary */}
      {step === 4 && findings && (
        <div className="space-y-6">
          {/* Health Disclaimer */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-status-above/30 bg-status-above/5">
            <AlertTriangle className="h-5 w-5 text-status-above shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-status-above">AI-assisted lab review</span> — for coach review only. Not medical advice. Wording is structured strictly for coaching support; consider referral or discussion with a qualified medical professional where appropriate.
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Out of Optimal & Trends */}
            <div className="md:col-span-2 space-y-4">
              {/* Anomalies Card */}
              <div className="lab-card p-4 space-y-2">
                <h4 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Priority Findings (Outside Optimal Range)
                </h4>
                <div className="space-y-2 pt-2">
                  {findings.outOfOptimal.length === 0 ? (
                    <div className="text-xs text-status-optimal flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> All imported biomarkers fall within optimal ranges.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {findings.outOfOptimal.map((o) => (
                        <div key={o.name} className="p-2.5 rounded-lg border border-border/80 bg-background/20 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-medium text-foreground">{o.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{o.value} {o.unit}</div>
                          </div>
                          <span className={`font-semibold uppercase tracking-wider text-[9px] border px-1.5 py-0.5 rounded ${o.statusColor}`}>
                            {o.statusLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Trends Card */}
              <div className="lab-card p-4 space-y-2">
                <h4 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Telemetry Trend Analysis
                </h4>
                <div className="space-y-2 text-xs pt-1.5 text-muted-foreground leading-relaxed">
                  {findings.trendNotes.length === 0 ? (
                    <div>No significant biomarker delta shifts detected or no previous panel on file.</div>
                  ) : (
                    findings.trendNotes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{note}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Next Actions & Discussion points */}
            <div className="space-y-4">
              {/* Discussion Points */}
              <div className="lab-card p-4 space-y-2">
                <h4 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" /> Coach Discussion Points
                </h4>
                <div className="space-y-2.5 pt-1.5 text-xs text-muted-foreground leading-normal">
                  {findings.questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-primary font-mono font-bold">{idx + 1}.</span>
                      <p>{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Actions */}
              <div className="lab-card p-4 space-y-2">
                <h4 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4" /> Suggested Next Actions
                </h4>
                <div className="space-y-2.5 pt-1.5 text-xs text-muted-foreground leading-normal">
                  {findings.nextActions.map((act, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <p>{act}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Draft Message copy card */}
          <div className="lab-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Client-Safe Summary Draft (Warren's Review Required)
              </h4>
              <Button 
                size="sm" 
                variant="neon" 
                className="h-7 text-[10px] font-semibold"
                onClick={() => handleCopySummary(findings.draftMessage)}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy Draft
              </Button>
            </div>
            <textarea
              readOnly
              value={findings.draftMessage}
              className="w-full h-44 bg-background/40 border border-border rounded-xl p-3 text-xs leading-relaxed font-mono text-muted-foreground select-all focus:outline-none"
            />
          </div>

          {/* Finish Button */}
          <div className="flex justify-end pt-2">
            <Button 
              variant="hero" 
              className="h-10 px-8 font-bold uppercase tracking-wider" 
              onClick={onComplete}
            >
              Complete Lab Review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
