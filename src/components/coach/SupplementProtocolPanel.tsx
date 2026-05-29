// src/components/coach/SupplementProtocolPanel.tsx
import { useState, useEffect, useMemo } from "react";
import { actions, getClientSupplementProtocol, getClientPanels } from "@/data/store";
import type { SupplementProtocol, SupplementProtocolItem, SupplementCategory, SupplementStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Pause, Play, Archive, HelpCircle, Save, X, Activity, Award, ShieldAlert } from "lucide-react";
import { BIOMARKERS, getStatus } from "@/lib/biomarkers";

interface SupplementProtocolPanelProps {
  clientId: string;
}

export default function SupplementProtocolPanel({ clientId }: SupplementProtocolPanelProps) {
  const storedProtocol = useMemo(() => getClientSupplementProtocol(clientId), [clientId]);
  const clientPanels = useMemo(() => getClientPanels(clientId), [clientId]);

  // Local component state
  const [protocol, setProtocol] = useState<SupplementProtocol | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<SupplementCategory>("Custom");
  const [formDose, setFormDose] = useState<number>(0);
  const [formUnit, setFormUnit] = useState("mg");
  const [formTiming, setFormTiming] = useState("");
  const [formFrequency, setFormFrequency] = useState("Daily");
  const [formSupportFocus, setFormSupportFocus] = useState("");
  const [formLinkedBiomarkerKey, setFormLinkedBiomarkerKey] = useState("");
  const [formCoachNote, setFormCoachNote] = useState("");
  const [formClientInstruction, setFormClientInstruction] = useState("");

  // Sync state with store changes
  useEffect(() => {
    if (storedProtocol) {
      setProtocol(JSON.parse(JSON.stringify(storedProtocol))); // Deep clone for local editing
    } else {
      setProtocol(null);
    }
  }, [storedProtocol]);

  // Is dirty state (unsaved protocol edits)
  const isDirty = useMemo(() => {
    return JSON.stringify(protocol) !== JSON.stringify(storedProtocol);
  }, [protocol, storedProtocol]);

  // Calculate out of range markers (Informational only: Useful for coach review)
  const latestPanel = clientPanels[clientPanels.length - 1];
  const outOfRangeMarkers = useMemo(() => {
    if (!latestPanel) return [];
    const markers: { name: string; key: string; value: number; unit: string }[] = [];
    for (const r of latestPanel.results) {
      const def = BIOMARKERS.find(b => b.key === r.key);
      if (!def) continue;
      const status = getStatus(def, r.value);
      if (status === "high" || status === "low") {
        markers.push({
          name: def.name,
          key: def.key,
          value: r.value,
          unit: def.unit
        });
      }
    }
    return markers;
  }, [latestPanel]);

  // Count item states
  const counts = useMemo(() => {
    if (!protocol) return { active: 0, paused: 0, archived: 0, linked: 0 };
    return {
      active: protocol.items.filter((i) => i.status === "active").length,
      paused: protocol.items.filter((i) => i.status === "paused").length,
      archived: protocol.items.filter((i) => i.status === "archived").length,
      linked: protocol.items.filter((i) => i.linkedBiomarkerKey).length
    };
  }, [protocol]);

  // Determine if a reference guardrail applies to the current form inputs
  const referenceGuardrail = useMemo(() => {
    const nameLower = formName.toLowerCase();
    if (nameLower.includes("zinc") && formDose > 40) {
      return "Zinc dosage exceeds standard daily guidance (40mg/day).";
    }
    if (nameLower.includes("d3") && formDose > 10000) {
      return "Vitamin D3 dosage exceeds standard daily guidance (10,000 IU/day).";
    }
    if (nameLower.includes("selenium") && formDose > 400) {
      return "Selenium dosage exceeds standard daily guidance (400mcg/day).";
    }
    if (nameLower.includes("magnesium") && formDose > 800) {
      return "Magnesium dosage exceeds standard daily guidance (800mg/day).";
    }
    return null;
  }, [formName, formDose]);

  if (!protocol) {
    return (
      <div className="p-10 text-center text-muted-foreground lab-card-glow border border-border/80 bg-background/10">
        No active supplement protocol found for this client.
      </div>
    );
  }

  // Preset autocomplete templates
  const handleTemplateSelect = (templateName: string) => {
    const templates: Record<string, Partial<SupplementProtocolItem>> = {
      "Vitamin D3 + K2": {
        category: "Micronutrient Support",
        dose: 5000,
        unit: "IU",
        timing: "Morning, with breakfast",
        frequency: "Daily",
        supportFocus: "Bone density & androgen synthesis pathway support",
        linkedBiomarkerKey: "d3"
      },
      "Magnesium Glycinate": {
        category: "Sleep & Recovery",
        dose: 400,
        unit: "mg",
        timing: "Evening, 30-60 min before sleep",
        frequency: "Daily",
        supportFocus: "CNS relaxation & deep sleep pathway support",
        linkedBiomarkerKey: "mg"
      },
      "Omega-3 Fish Oil": {
        category: "Metabolic Optimization",
        dose: 2000,
        unit: "mg",
        timing: "With lunch or dinner",
        frequency: "Daily",
        supportFocus: "Cardiovascular and lipid pathway support",
        linkedBiomarkerKey: "ldl"
      },
      "Ashwagandha KSM-66": {
        category: "Sleep & Recovery",
        dose: 600,
        unit: "mg",
        timing: "Evening, with water",
        frequency: "Daily (8-week cycles)",
        supportFocus: "Cortisol control & recovery pathway support",
        linkedBiomarkerKey: "cortisol"
      }
    };

    const t = templates[templateName];
    if (t) {
      setFormName(templateName);
      setFormCategory(t.category || "Custom");
      setFormDose(t.dose || 0);
      setFormUnit(t.unit || "mg");
      setFormTiming(t.timing || "");
      setFormFrequency(t.frequency || "Daily");
      setFormSupportFocus(t.supportFocus || "");
      setFormLinkedBiomarkerKey(t.linkedBiomarkerKey || "");
    }
  };

  // Setup form fields for editing
  const startEditItem = (item: SupplementProtocolItem) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormDose(item.dose);
    setFormUnit(item.unit);
    setFormTiming(item.timing);
    setFormFrequency(item.frequency);
    setFormSupportFocus(item.supportFocus);
    setFormLinkedBiomarkerKey(item.linkedBiomarkerKey || "");
    setFormCoachNote(item.coachNote || "");
    setFormClientInstruction(item.clientInstruction || "");
    setEditMode(true);
  };

  const clearForm = () => {
    setEditingItemId(null);
    setFormName("");
    setFormCategory("Custom");
    setFormDose(0);
    setFormUnit("mg");
    setFormTiming("");
    setFormFrequency("Daily");
    setFormSupportFocus("");
    setFormLinkedBiomarkerKey("");
    setFormCoachNote("");
    setFormClientInstruction("");
    setEditMode(false);
  };

  const handleSaveItem = () => {
    if (!formName.trim()) return;

    const itemData: Omit<SupplementProtocolItem, "id"> & { id?: string } = {
      name: formName,
      category: formCategory,
      dose: Number(formDose),
      unit: formUnit,
      timing: formTiming,
      frequency: formFrequency,
      supportFocus: formSupportFocus,
      linkedBiomarkerKey: formLinkedBiomarkerKey || undefined,
      status: "active",
      coachNote: formCoachNote || undefined,
      clientInstruction: formClientInstruction || undefined
    };

    if (editingItemId) {
      // Update existing item in local state
      setProtocol((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === editingItemId
              ? { ...i, ...itemData }
              : i
          ),
          updatedAt: new Date().toISOString()
        };
      });
    } else {
      // Add new item to local state
      const newItem: SupplementProtocolItem = {
        ...itemData,
        id: `spi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: "active"
      };
      setProtocol((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: [...prev.items, newItem],
          updatedAt: new Date().toISOString()
        };
      });
    }

    clearForm();
  };

  const handleToggleStatus = (itemId: string, newStatus: SupplementStatus) => {
    setProtocol((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i)),
        updatedAt: new Date().toISOString()
      };
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setProtocol((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
        updatedAt: new Date().toISOString()
      };
    });
  };

  const handleSaveProtocol = () => {
    if (!protocol) return;
    actions.updateSupplementProtocol(protocol);
  };

  const handleCancelProtocol = () => {
    if (storedProtocol) {
      setProtocol(JSON.parse(JSON.stringify(storedProtocol)));
    }
    clearForm();
  };



  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-glow text-primary flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Coach Supplement Protocol
          </h2>
          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest mt-0.5">
            Prototype supplement guidance · Live database planned
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {isDirty && (
            <span className="text-[9px] font-mono font-bold uppercase text-status-above border border-status-above/30 bg-status-above/10 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="h-3 w-3" /> Unsaved protocol edits
            </span>
          )}
          {isDirty && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelProtocol} className="h-7.5 px-3 text-xs font-semibold uppercase tracking-wider font-mono">
                <X className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button variant="neon" size="sm" onClick={handleSaveProtocol} className="h-7.5 px-4 text-xs font-semibold uppercase tracking-wider font-mono">
                <Save className="mr-1 h-3.5 w-3.5" /> Save Guidance
              </Button>
            </div>
          )}
          {!isDirty && !editMode && (
            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)} className="h-7.5 px-3.5 text-xs font-semibold uppercase tracking-wider font-mono border border-border/40 hover:border-primary/20">
              <Plus className="mr-1 h-3.5 w-3.5 text-primary" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Overview Block */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="lab-card-glow p-3 border border-border/60 bg-[#0e1217]/50 rounded-lg">
          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider block">Active Supplements</span>
          <span className="text-xl font-bold font-display text-primary mt-1 block">{counts.active}</span>
        </div>
        <div className="lab-card-glow p-3 border border-border/60 bg-[#0e1217]/50 rounded-lg">
          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider block">Paused Guidance</span>
          <span className="text-xl font-bold font-display text-status-above mt-1 block">{counts.paused}</span>
        </div>
        <div className="lab-card-glow p-3 border border-border/60 bg-[#0e1217]/50 rounded-lg">
          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider block">Archived Protocols</span>
          <span className="text-xl font-bold font-display text-muted-foreground mt-1 block">{counts.archived}</span>
        </div>
        <div className="lab-card-glow p-3 border border-border/60 bg-[#0e1217]/50 rounded-lg">
          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider block">Linked Biomarkers</span>
          <span className="text-xl font-bold font-display text-cyan-400 mt-1 block">{counts.linked}</span>
        </div>
      </div>

      {/* Biomarker Deficit / Review display */}
      {outOfRangeMarkers.length > 0 && (
        <div className="lab-card-glow p-4 border border-cyan-500/20 bg-cyan-950/5 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 font-display">
            <Activity className="h-4 w-4" /> Linked Biomarker Focus
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            These markers may be useful for coach review when adjusting supplement guidance.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {outOfRangeMarkers.map((marker) => (
              <span
                key={marker.key}
                onClick={() => {
                  if (editMode) setFormLinkedBiomarkerKey(marker.key);
                }}
                className={cn(
                  "text-[9px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 bg-cyan-950/40 border-cyan-500/30 text-cyan-300",
                  editMode ? "cursor-pointer hover:bg-cyan-500/25 transition" : ""
                )}
              >
                {marker.name}: {marker.value} {marker.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className={cn("grid gap-5 transition-all duration-300", editMode ? "lg:grid-cols-3" : "grid-cols-1")}>
        
        {/* Left Side: Cards list */}
        <div className={cn("space-y-3.5", editMode ? "lg:col-span-2" : "")}>
          {protocol.items.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-background/10">
              No supplement guidance active in this protocol.
            </div>
          ) : (
            protocol.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "lab-card-glow p-4 border rounded-xl flex flex-col md:flex-row gap-4 justify-between items-stretch transition-all duration-300",
                  item.status === "active"
                    ? "border-border/60 bg-[#0e1217]/40 hover:border-cyan-500/20"
                    : item.status === "paused"
                    ? "border-status-above/20 bg-status-above/5 opacity-80"
                    : "border-border/20 bg-background/5 opacity-60"
                )}
              >
                {/* Information blocks */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-glow text-primary truncate max-w-[200px]">
                      {item.name}
                    </h4>
                    <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground border border-border/30 tracking-wider">
                      {item.category}
                    </span>
                    {item.linkedBiomarkerKey && (
                      <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 tracking-wider">
                        Linked: {BIOMARKERS.find(b => b.key === item.linkedBiomarkerKey)?.name || item.linkedBiomarkerKey}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[8px] font-mono uppercase px-1.5 py-0.5 rounded tracking-wider border ml-auto md:ml-0",
                        item.status === "active"
                          ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400"
                          : item.status === "paused"
                          ? "bg-status-above/10 border-status-above/30 text-status-above"
                          : "bg-background/40 border-border/20 text-muted-foreground"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Pills row */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-muted-foreground">
                    <div className="bg-[#12161b] border border-border/40 px-2.5 py-0.5 rounded-md">
                      Dose: <span className="text-foreground font-semibold">{item.dose} {item.unit}</span>
                    </div>
                    <div className="bg-[#12161b] border border-border/40 px-2.5 py-0.5 rounded-md">
                      Timing: <span className="text-foreground font-semibold">{item.timing}</span>
                    </div>
                    <div className="bg-[#12161b] border border-border/40 px-2.5 py-0.5 rounded-md">
                      Frequency: <span className="text-foreground font-semibold">{item.frequency}</span>
                    </div>
                  </div>

                  {/* Support Focus & Notes */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border/10">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono uppercase text-muted-foreground block">Support Focus</span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">{item.supportFocus}</p>
                    </div>
                    {(item.coachNote || item.clientInstruction) && (
                      <div className="space-y-1">
                        {item.coachNote && (
                          <div className="text-[9px] text-muted-foreground/80 leading-normal">
                            <strong className="text-primary/70">Coach Note:</strong> {item.coachNote}
                          </div>
                        )}
                        {item.clientInstruction && (
                          <div className="text-[9px] text-muted-foreground/80 leading-normal">
                            <strong className="text-cyan-500/70">Instruction:</strong> {item.clientInstruction}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex flex-row md:flex-col justify-end md:justify-start items-center gap-2 border-t md:border-t-0 md:border-l border-border/20 pt-3 md:pt-0 md:pl-4 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditItem(item)}
                    className="h-7 w-7 rounded-lg text-xs hover:bg-secondary/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/40"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  
                  {item.status === "active" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(item.id, "paused")}
                      className="h-7 w-7 rounded-lg text-xs hover:bg-status-above/10 text-status-above hover:text-status-above border border-transparent hover:border-status-above/30"
                      title="Pause Guidance"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </Button>
                  ) : item.status === "paused" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(item.id, "active")}
                      className="h-7 w-7 rounded-lg text-xs hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-400 border border-transparent hover:border-cyan-500/30"
                      title="Resume Guidance"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}

                  {item.status !== "archived" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(item.id, "archived")}
                      className="h-7 w-7 rounded-lg text-xs hover:bg-red-500/10 text-red-400 hover:text-red-400 border border-transparent hover:border-red-500/30"
                      title="Archive Item"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-7 w-7 rounded-lg text-xs hover:bg-red-600 text-foreground border border-transparent"
                      title="Permanently Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Client-Safe Summary Box */}
          <div className="lab-card-glow p-4 border border-border/60 bg-[#0e1217]/50 rounded-xl space-y-2">
            <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Client Supplement Guidance Summary
            </h3>
            <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1 pl-0.5">
              {protocol.items.filter(i => i.status === "active").map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong> ({item.dose} {item.unit}) - {item.timing} · <span className="italic text-primary/70">{item.supportFocus}</span>
                </li>
              ))}
              {protocol.items.filter(i => i.status === "active").length === 0 && (
                <li>No active supplement guidance recorded.</li>
              )}
            </ul>
            <p className="text-[10px] text-muted-foreground font-mono pt-1 text-right">
              Coach reviewed guidance for athletic performance support.
            </p>
          </div>
        </div>

        {/* Right Side: Builder Drawer/Card (Edit Mode Only) */}
        {editMode && (
          <div className="space-y-4 border-l border-border/20 pl-5 h-fit lg:sticky lg:top-4 bg-[#0e1217]/30 p-4 rounded-xl border border-border/40 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-primary flex items-center gap-2">
                <Plus className="h-4 w-4" /> {editingItemId ? "Edit Item" : "Add Item"}
              </h3>
              <Button variant="ghost" size="icon" onClick={clearForm} className="h-6 w-6">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Template Autocomplete Selector */}
            {!editingItemId && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Templates</label>
                <div className="flex flex-wrap gap-1">
                  {["Vitamin D3 + K2", "Magnesium Glycinate", "Omega-3 Fish Oil", "Ashwagandha KSM-66"].map((tName) => (
                    <button
                      key={tName}
                      onClick={() => handleTemplateSelect(tName)}
                      className="text-[9px] font-mono px-2 py-0.5 bg-background/40 hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 border border-border/40 rounded transition duration-200"
                    >
                      {tName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Supplement Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs"
                  placeholder="e.g. Creatine Monohydrate"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SupplementCategory)}
                    className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs bg-[#0e1217]"
                  >
                    <option value="Hormonal Support">Hormonal Support</option>
                    <option value="Metabolic Optimization">Metabolic Optimization</option>
                    <option value="Micronutrient Support">Micronutrient Support</option>
                    <option value="Nootropic/CNS">Nootropic/CNS</option>
                    <option value="Sleep & Recovery">Sleep & Recovery</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Linked Biomarker</label>
                  <select
                    value={formLinkedBiomarkerKey}
                    onChange={(e) => setFormLinkedBiomarkerKey(e.target.value)}
                    className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs bg-[#0e1217]"
                  >
                    <option value="">None</option>
                    {BIOMARKERS.map(b => (
                      <option key={b.key} value={b.key}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Dose</label>
                  <input
                    type="number"
                    value={formDose}
                    onChange={(e) => setFormDose(Number(e.target.value))}
                    className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Unit</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs font-mono"
                    placeholder="mg, capsules, IU"
                  />
                </div>
              </div>

              {/* Reference Guardrail display */}
              {referenceGuardrail && (
                <div className="p-2 border border-amber-500/20 bg-amber-500/5 text-[9px] text-amber-300 font-mono rounded flex items-start gap-1">
                  <ShieldAlert className="h-3 w-3 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block uppercase tracking-wider text-[7px] text-amber-400">Reference Guardrail</strong>
                    {referenceGuardrail}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Timing</label>
                <input
                  type="text"
                  value={formTiming}
                  onChange={(e) => setFormTiming(e.target.value)}
                  className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs"
                  placeholder="e.g. Morning, with breakfast"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Frequency</label>
                <input
                  type="text"
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs"
                  placeholder="e.g. Daily"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Support Focus</label>
                <input
                  type="text"
                  value={formSupportFocus}
                  onChange={(e) => setFormSupportFocus(e.target.value)}
                  className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs"
                  placeholder="e.g. Cellular energy pathway support"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Coach Note</label>
                <input
                  type="text"
                  value={formCoachNote}
                  onChange={(e) => setFormCoachNote(e.target.value)}
                  className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs"
                  placeholder="Private notes (Q1 labs target)"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Client Instruction</label>
                <input
                  type="text"
                  value={formClientInstruction}
                  onChange={(e) => setFormClientInstruction(e.target.value)}
                  className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs"
                  placeholder="Visible to athlete"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={clearForm} className="h-7 text-xs font-mono uppercase">
                  Cancel
                </Button>
                <Button variant="neon" size="sm" onClick={handleSaveItem} className="h-7 text-xs font-mono uppercase">
                  {editingItemId ? "Apply" : "Add Item"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
