import { Link } from "react-router-dom";
import { Beaker, ChevronRight } from "lucide-react";
import { useStore } from "@/data/store";

export default function BloodPanelLab() {
  const { panels, clients } = useStore();
  const sorted = [...panels].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="chip mb-2"><Beaker className="h-3 w-3 text-primary" /> Blood Panel Lab</div>
        <h1 className="font-display text-3xl font-bold">All Panels</h1>
        <p className="text-muted-foreground text-sm mt-1">Every functional blood chemistry workup across your roster.</p>
      </div>
      <div className="lab-card-glow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left px-4 py-3">Client</th><th className="text-left px-3 py-3">Panel</th><th className="text-left px-3 py-3">Date</th><th className="text-right px-3 py-3">Markers</th><th className="px-3 py-3"></th></tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const c = clients.find((x) => x.id === p.clientId);
              return (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">{c?.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.label}</td>
                  <td className="px-3 py-3 font-mono-data text-xs">{p.date}</td>
                  <td className="px-3 py-3 text-right font-mono-data">{p.results.length}</td>
                  <td className="px-3 py-3 text-right">
                    <Link to={`/coach/clients/${p.clientId}?tab=blood`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Open <ChevronRight className="h-3 w-3" /></Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
