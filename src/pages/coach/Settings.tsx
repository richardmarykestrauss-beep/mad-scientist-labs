import { useState } from "react";
import { Logo } from "@/components/lab/Logo";
import { FeaturePlannedDialog } from "@/components/lab/FeaturePlannedDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COACH } from "@/data/mock";
import { actions } from "@/data/store";
import { toast } from "sonner";

export default function Settings() {
  const [open, setOpen] = useState(false);
  const handleReset = () => {
    actions.resetStore();
    toast.success("Demo data reset to default seed values");
  };
  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div>
        <div className="chip mb-2">Settings</div>
        <h1 className="font-display text-3xl font-bold">Lab Settings</h1>
      </div>
      <div className="lab-card-glow p-5 space-y-4">
        <div className="text-sm font-semibold">Coach Profile</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Name</Label><Input defaultValue={COACH.name} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={COACH.email} /></div>
        </div>
      </div>
      <div className="lab-card-glow p-5 space-y-3">
        <div className="text-sm font-semibold">Branding</div>
        <Logo />
        <p className="text-xs text-muted-foreground">Upload a custom logo and accent color in v2 to white-label the client portal.</p>
      </div>
      <div className="lab-card-glow p-5 space-y-3">
        <div className="text-sm font-semibold">Backend</div>
        <p className="text-xs text-muted-foreground">Lovable Cloud integration is not yet enabled. Connect Cloud to power authentication, role-based access, blood panel persistence, and file storage.</p>
        <Button variant="neon" onClick={() => setOpen(true)}>Connect Lovable Cloud (placeholder)</Button>
      </div>
      <div className="lab-card-glow p-5 space-y-3">
        <div className="text-sm font-semibold">Demo Control</div>
        <p className="text-xs text-muted-foreground">Reset the workspace to the default mock clients and blood panels. This will overwrite any additions made during the demo.</p>
        <Button variant="outline" className="border-destructive/40 hover:bg-destructive/10 text-destructive" onClick={handleReset}>Reset Demo Data</Button>
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
