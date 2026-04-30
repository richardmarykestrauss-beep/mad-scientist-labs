import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Filter, Link2, Plus, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useStore, actions } from "@/data/store";
import { toast } from "sonner";

export default function ClientList() {
  const { clients } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "review">("all");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");

  const inviteCode = useMemo(() => "MSL-" + Math.random().toString(36).slice(2, 8).toUpperCase(), [open]);

  const filtered = clients.filter((c) =>
    (filter === "all" || c.status === filter) &&
    (q === "" || c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
        <div>
          <div className="chip mb-2">Roster</div>
          <h1 className="font-display text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage every athlete connected to your lab.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero"><UserPlus className="h-4 w-4" /> Invite Client</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Invite a new client</DialogTitle>
                <DialogDescription>Generate an invite link or add them manually.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="lab-card p-3 flex items-center gap-3">
                  <Link2 className="h-4 w-4 text-primary" />
                  <code className="flex-1 truncate font-mono text-xs">https://madsci.lab/invite/{inviteCode}</code>
                  <Button size="sm" variant="neon" onClick={() => { navigator.clipboard.writeText(`https://madsci.lab/invite/${inviteCode}`); toast.success("Invite link copied"); }}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">— or add manually —</div>
                <div className="grid gap-3">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@athlete.com" /></div>
                  <div className="space-y-1.5"><Label>Primary Goal</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Recomp, recover thyroid…" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={() => {
                  if (!name) return toast.error("Name required");
                  actions.addClient(name, email || "pending@invite", goal || "—");
                  setOpen(false); setName(""); setEmail(""); setGoal("");
                  toast.success("Client added");
                }}><Plus className="h-4 w-4" /> Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="lab-card-glow p-3 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="pl-9 bg-background/40" />
        </div>
        <div className="flex gap-1 rounded-xl border border-border p-1 bg-background/40">
          {(["all", "active", "review"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-medium transition ${filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Filter className="h-3 w-3 inline mr-1.5" />{f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <Link key={c.id} to={`/coach/clients/${c.id}`} className="lab-card-glow p-5 hover:border-primary/40 transition group">
            <div className="flex items-start gap-3">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${c.avatarColor} text-background font-bold`}>{c.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate group-hover:text-primary transition">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.email}</div>
              </div>
              <span className={`chip ${c.status === "review" ? "text-status-above border-status-above/40" : "text-status-optimal border-status-optimal/40"}`}>{c.status}</span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">{c.goal}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Bar label="Training" value={c.trainingCompliance} />
              <Bar label="Nutrition" value={c.nutritionCompliance} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>BW {c.bodyWeightKg || "—"} kg</span>
              <span>Next: {c.nextCheckIn}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
