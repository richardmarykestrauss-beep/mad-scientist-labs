import { Logo } from "@/components/lab/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COACH } from "@/data/mock";

export default function Settings() {
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
        <Button variant="neon">Connect Lovable Cloud (placeholder)</Button>
      </div>
    </div>
  );
}
