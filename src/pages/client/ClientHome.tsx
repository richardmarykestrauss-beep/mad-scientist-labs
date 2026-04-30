import { useParams, Link } from "react-router-dom";
import { useStore, getClientPanels } from "@/data/store";
import { BloodPanelDashboard } from "@/components/blood/BloodPanelDashboard";
import { ArrowLeft, Beaker, Dumbbell, MessageSquare, Pill, Salad } from "lucide-react";
import { Logo } from "@/components/lab/Logo";

export default function ClientHome() {
  const { id = "c-001" } = useParams();
  const { clients } = useStore();
  const client = clients.find((c) => c.id === id);
  const panels = getClientPanels(id);
  if (!client) return <div className="p-6">Client not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-5 py-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur z-10">
        <Logo compact />
        <div className="flex-1" />
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> exit</Link>
      </header>
      <main className="max-w-5xl mx-auto p-5 space-y-5">
        <div className="lab-card-glow p-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-primary">Welcome back</div>
          <h1 className="font-display text-3xl font-bold mt-1">{client.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-1">{client.goal}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { i: Dumbbell, l: "Today's Workout", v: "Push A" },
            { i: Salad, l: "Calories", v: "2,640" },
            { i: Pill, l: "Supplements", v: "4 due" },
            { i: MessageSquare, l: "Coach Note", v: "1 new" },
          ].map((m) => (
            <div key={m.l} className="lab-card-glow p-4">
              <m.i className="h-4 w-4 text-primary" />
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2">{m.l}</div>
              <div className="font-display text-lg font-bold mt-0.5">{m.v}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Beaker className="h-4 w-4 text-primary" />
            <h2 className="font-display text-xl font-bold">Your Blood Panel</h2>
          </div>
          <BloodPanelDashboard clientId={id} panels={panels} />
        </div>
      </main>
    </div>
  );
}
