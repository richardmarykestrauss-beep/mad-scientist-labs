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

export default function Settings() {
  const [open, setOpen] = useState(false);
  
  const handleReset = () => {
    actions.resetStore();
    toast.success("Demo data reset to default seed values");
  };

  return (
    <div className="space-y-4.5 animate-fade-in max-w-3xl">
      <div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-primary font-bold">OPERATING SYSTEM SETTINGS</span>
        <h1 className="font-display text-2xl font-bold mt-0.5 tracking-tight">Lab Command Settings</h1>
      </div>

      {/* Coach Profile Card */}
      <div className="lab-card-glow p-4 border border-border/80 rounded-xl space-y-3.5">
        <h3 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
          <User className="h-3.5 w-3.5" /> Coach Profile Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-mono text-muted-foreground uppercase">Name</Label>
            <Input 
              defaultValue={COACH.name} 
              className="bg-background/40 border-border text-[11px] h-7.5 py-1 px-2.5 font-mono focus:ring-primary/60 rounded"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-mono text-muted-foreground uppercase">Email</Label>
            <Input 
              defaultValue={COACH.email} 
              className="bg-background/40 border-border text-[11px] h-7.5 py-1 px-2.5 font-mono focus:ring-primary/60 rounded"
            />
          </div>
        </div>
      </div>

      {/* Branding Card */}
      <div className="lab-card-glow p-4 border border-border/80 rounded-xl space-y-3.5">
        <h3 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
          <Palette className="h-3.5 w-3.5" /> White-Label Branding System
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <p className="text-[11px] text-muted-foreground/90 leading-relaxed">
              Upload custom logo configurations, design system tokens, and accents to tailor the Athlete OS client portal branding.
            </p>
            <span className="inline-block text-[8.5px] text-muted-foreground/50 font-mono uppercase">
              SVG / High Resolution PNG Support
            </span>
          </div>
          <div className="border border-border/60 bg-background/25 p-2 rounded-lg shrink-0">
            <Logo compact />
          </div>
        </div>
      </div>

      {/* Backend Cloud Card */}
      <div className="lab-card-glow p-4 border border-border/80 rounded-xl space-y-3.5">
        <h3 className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
          <Database className="h-3.5 w-3.5" /> Cloud Synchronization Pipeline
        </h3>
        <p className="text-[11px] text-muted-foreground/90 leading-relaxed">
          Lovable Cloud database synchronization is not yet enabled. Connect the workspace backend to activate secure athlete authentication, role access constraints, blood chemistry persistence, and storage pipelines.
        </p>
        <div className="pt-1">
          <Button 
            variant="neon" 
            className="h-7.5 px-4 text-[10.5px] uppercase font-bold tracking-wider font-mono shadow-[0_0_10px_rgba(0,255,128,0.1)] rounded"
            onClick={() => setOpen(true)}
          >
            Connect Lovable Cloud
          </Button>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="lab-card-glow p-4 border border-border/85 rounded-xl space-y-3 bg-gradient-to-r from-background/40 to-destructive/5 border-destructive/20 shadow-[0_0_10px_rgba(244,63,94,0.01)]">
        <h3 className="text-xs font-semibold text-status-high uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-destructive/20 pb-2">
          <Sliders className="h-3.5 w-3.5" /> Workspace Reset Control
        </h3>
        <p className="text-[11px] text-muted-foreground/90 leading-relaxed">
          Reset local telemetry database to defaults. Warning: This action will restore default mock profiles, check-ins, and panels, and clear any prototype uploads added during this demo session.
        </p>
        <div className="pt-1">
          <Button 
            variant="outline" 
            className="h-7.5 px-4 text-[10.5px] uppercase font-bold tracking-wider font-mono border-destructive/40 hover:bg-destructive/15 text-destructive rounded hover:border-destructive transition"
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
