import { useState } from "react";
import { Logo } from "@/components/lab/Logo";
import { FeaturePlannedDialog } from "@/components/lab/FeaturePlannedDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COACH } from "@/data/mock";
import { actions } from "@/data/store";
import { toast } from "sonner";
import { User, Palette, Database, Sliders, RotateCcw, AlertTriangle } from "lucide-react";
import { dataMode } from "@/lib/supabase";
import { PILOT_DISCLAIMER, PILOT_STATUS_COPY } from "@/lib/pilotFeatures";
import { PrototypeFeatureNotice } from "@/components/pilot/PrototypeFeatureNotice";

export default function Settings() {
  const [open, setOpen] = useState(false);
  
  const handleReset = () => {
    actions.resetStore();
    toast.success("Demo data reset to default seed values");
  };

  if (dataMode === "supabase") {
    return (
      <div className="space-y-5 max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-slate-900">Pilot Settings</h1>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <h2 className="font-bold">{PILOT_STATUS_COPY}</h2>
          <p className="mt-2 text-sm">Authentication, client identity, weekly check-ins, and coach reviews sync through Supabase.</p>
          <p className="mt-2 text-xs">{PILOT_DISCLAIMER}</p>
        </div>
        <PrototypeFeatureNotice feature="Profile editing, branding, labs, protocols, local reset controls, and other workspace settings" />
      </div>
    );
  }

  return (
    <div className="space-y-4.5 animate-fade-in max-w-3xl pb-10">
      <div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-600 font-bold">OPERATING SYSTEM SETTINGS</span>
        <h1 className="font-display text-2xl font-bold mt-0.5 tracking-tight text-slate-900">Lab Command Settings</h1>
      </div>

      {/* Coach Profile Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-3.5 text-slate-800">
        <h3 className="text-xs font-semibold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <User className="h-3.5 w-3.5 text-slate-500" /> Coach Profile Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-mono text-slate-500 uppercase">Name</Label>
            <Input 
              defaultValue={COACH.name} 
              className="bg-slate-50 border-slate-200 text-[11px] h-7.5 py-1 px-2.5 font-mono focus:ring-slate-400 text-slate-800 focus:bg-white rounded"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-mono text-slate-500 uppercase">Email</Label>
            <Input 
              defaultValue={COACH.email} 
              className="bg-slate-50 border-slate-200 text-[11px] h-7.5 py-1 px-2.5 font-mono focus:ring-slate-400 text-slate-800 focus:bg-white rounded"
            />
          </div>
        </div>
      </div>

      {/* Branding Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-3.5 text-slate-800">
        <h3 className="text-xs font-semibold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Palette className="h-3.5 w-3.5 text-slate-500" /> White-Label Branding System
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upload custom logo configurations, design system tokens, and accents to tailor the Athlete OS client portal branding.
            </p>
            <span className="inline-block text-[8.5px] text-slate-400 font-mono uppercase">
              SVG / High Resolution PNG Support
            </span>
          </div>
          <div className="border border-slate-200 bg-slate-50 p-2 rounded-lg shrink-0">
            <Logo compact className="[&_.text-foreground]:text-slate-900 [&_.text-primary]:text-emerald-600 [&_.bg-primary\\/10]:bg-emerald-50 [&_.border-primary\\/40]:border-emerald-200" />
          </div>
        </div>
      </div>

      {/* Backend Cloud Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-3.5 text-slate-800">
        <h3 className="text-xs font-semibold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Database className="h-3.5 w-3.5 text-slate-500" /> Cloud Synchronization Pipeline
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Lovable Cloud database synchronization is not yet enabled. Connect the workspace backend to activate secure athlete authentication, role access constraints, blood chemistry persistence, and storage pipelines.
        </p>
        <div className="pt-1">
          <Button 
            variant="outline" 
            className="h-7.5 px-4 text-[10.5px] uppercase font-bold tracking-wider font-mono border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded"
            onClick={() => setOpen(true)}
          >
            Connect Lovable Cloud
          </Button>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="p-4 border rounded-xl space-y-3 bg-red-50/30 border-red-200 shadow-sm text-slate-800">
        <h3 className="text-xs font-semibold text-red-700 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-red-100 pb-2">
          <Sliders className="h-3.5 w-3.5 text-red-500" /> Workspace Reset Control
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Reset local telemetry database to defaults. Warning: This action will restore default mock profiles, check-ins, and panels, and clear any prototype uploads added during this demo session.
        </p>
        <div className="pt-1">
          <Button 
            variant="outline" 
            className="h-7.5 px-4 text-[10.5px] uppercase font-bold tracking-wider font-mono border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded transition"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Demo Data
          </Button>
        </div>
      </div>

      {open && (
        <FeaturePlannedDialog
          isOpen={open}
          onOpenChange={setOpen}
          featureName="Backend Cloud Sync"
        />
      )}
    </div>
  );
}
