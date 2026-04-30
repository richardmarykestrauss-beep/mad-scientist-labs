import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Beaker, ClipboardList, Dumbbell, FileText, MessageSquare, Pill, Salad, StickyNote, ImageIcon, CalendarCheck, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, getClientPanels } from "@/data/store";
import { BloodPanelDashboard } from "@/components/blood/BloodPanelDashboard";
import { Button } from "@/components/ui/button";

export default function ClientProfile() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const { clients } = useStore();
  const client = clients.find((c) => c.id === id);
  const panels = getClientPanels(id);

  if (!client) return <div className="text-muted-foreground">Client not found.</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <Link to="/coach/clients" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="h-3 w-3" /> Roster</Link>

      <div className="lab-card-glow p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
        <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${client.avatarColor} text-background font-bold text-xl`}>{client.initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold truncate">{client.name}</h1>
            <span className={`chip ${client.status === "review" ? "text-status-above border-status-above/40" : "text-status-optimal border-status-optimal/40"}`}>{client.status}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{client.email} · started {client.startedAt}</div>
          <div className="text-sm mt-2"><span className="text-muted-foreground">Goal:</span> {client.goal}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Mini label="BW" value={`${client.bodyWeightKg} kg`} />
          <Mini label="Train" value={`${client.trainingCompliance}%`} />
          <Mini label="Nutri" value={`${client.nutritionCompliance}%`} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <TabsList className="bg-card/40 border border-border h-auto p-1 flex flex-wrap gap-1 justify-start">
          {[
            { v: "overview", l: "Overview", i: ClipboardList },
            { v: "blood", l: "Blood Panel", i: Beaker },
            { v: "training", l: "Training", i: Dumbbell },
            { v: "nutrition", l: "Nutrition", i: Salad },
            { v: "supplements", l: "Supplements", i: Pill },
            { v: "checkins", l: "Check-ins", i: CalendarCheck },
            { v: "progress", l: "Progress", i: ImageIcon },
            { v: "messages", l: "Messages", i: MessageSquare },
            { v: "files", l: "Files", i: FileText },
            { v: "notes", l: "Notes", i: StickyNote },
          ].map((t) => (
            <TabsTrigger key={t.v} value={t.v} className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none gap-1.5">
              <t.i className="h-3.5 w-3.5" /> {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <Overview client={client} panelsCount={panels.length} />
        </TabsContent>
        <TabsContent value="blood" className="mt-5">
          <BloodPanelDashboard clientId={id} panels={panels} />
        </TabsContent>
        <TabsContent value="training" className="mt-5"><Scaffold title="Training Program" desc="Build periodized programs, assign weekly workouts, and track exercise compliance." cta="Open Program Builder" /></TabsContent>
        <TabsContent value="nutrition" className="mt-5"><Scaffold title="Nutrition Plan" desc="Macro targets, meal sections, food lists, and weekly adherence review." cta="Build Diet Plan" /></TabsContent>
        <TabsContent value="supplements" className="mt-5"><Scaffold title="Supplementation Protocol" desc="Dosage, timing, frequency, and start/end dates with compliance tracking." cta="Create Protocol" /></TabsContent>
        <TabsContent value="checkins" className="mt-5"><Scaffold title="Weekly Check-ins" desc="Bodyweight, energy, sleep, stress, mood, training and nutrition adherence." cta="Request Check-in" /></TabsContent>
        <TabsContent value="progress" className="mt-5"><Scaffold title="Progress Photos" desc="Side-by-side comparisons across weeks and months." cta="Upload Photo" /></TabsContent>
        <TabsContent value="messages" className="mt-5"><Scaffold title="Messages" desc="Direct coach-client thread tied to this profile." cta="Send Message" /></TabsContent>
        <TabsContent value="files" className="mt-5"><Scaffold title="Files & Documents" desc="Upload PDFs, lab reports, programs, and coach docs." cta="Upload File" /></TabsContent>
        <TabsContent value="notes" className="mt-5">
          <div className="lab-card-glow p-5">
            <div className="text-sm font-semibold mb-2">Coach Notes</div>
            <p className="text-sm text-muted-foreground">{client.notes ?? "No notes yet."}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="font-mono-data text-sm mt-0.5">{value}</div>
    </div>
  );
}

function Overview({ client, panelsCount }: { client: any; panelsCount: number }) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lab-card-glow p-5 lg:col-span-2 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Primary Goal</div>
          <div className="text-base mt-1">{client.goal}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Mini label="Bodyweight" value={`${client.bodyWeightKg} kg`} />
          <Mini label="Training" value={`${client.trainingCompliance}%`} />
          <Mini label="Nutrition" value={`${client.nutritionCompliance}%`} />
          <Mini label="Panels" value={`${panelsCount}`} />
        </div>
        {client.notes && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Coach Note</div>
            {client.notes}
          </div>
        )}
      </div>
      <div className="lab-card-glow p-5">
        <div className="text-sm font-semibold mb-3">Quick Actions</div>
        <div className="space-y-2">
          {[
            { l: "Review latest panel", t: "blood" },
            { l: "Assign training", t: "training" },
            { l: "Update nutrition", t: "nutrition" },
            { l: "Add supplements", t: "supplements" },
            { l: "Request check-in", t: "checkins" },
          ].map((a) => (
            <Link key={a.t} to={`?tab=${a.t}`} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-2.5 hover:border-primary/40 transition">
              <span className="text-sm">{a.l}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Scaffold({ title, desc, cta }: { title: string; desc: string; cta: string }) {
  return (
    <div className="lab-card-glow p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 grid place-items-center mb-3">
        <Beaker className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{desc}</p>
      <div className="mt-4"><Button variant="neon">{cta}</Button></div>
      <div className="mt-3 text-[11px] text-muted-foreground">Module scaffold — full builder ships in v2.</div>
    </div>
  );
}
