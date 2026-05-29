import { Link } from "react-router-dom";
import { Beaker, ChevronRight } from "lucide-react";
import { useStore } from "@/data/store";

export default function BloodPanelLab() {
  const { panels, clients } = useStore();
  const sorted = [...panels].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-5 animate-fade-in pb-10">
      <div>
        <div className="chip mb-2 bg-slate-50 border-slate-200 text-slate-500"><Beaker className="h-3 w-3 text-emerald-600 mr-1" /> Blood Panel Lab</div>
        <h1 className="font-display text-3xl font-bold text-slate-900">All Panels</h1>
        <p className="text-slate-500 text-sm mt-1">Every functional blood chemistry workup across your roster.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr><th className="text-left px-4 py-3">Client</th><th className="text-left px-3 py-3">Panel</th><th className="text-left px-3 py-3">Date</th><th className="text-right px-3 py-3">Markers</th><th className="px-3 py-3"></th></tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const c = clients.find((x) => x.id === p.clientId);
              return (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{c?.name}</td>
                  <td className="px-3 py-3 text-slate-500">{p.label}</td>
                  <td className="px-3 py-3 font-mono-data text-xs text-slate-600">{p.date}</td>
                  <td className="px-3 py-3 text-right font-mono-data text-slate-800">{p.results.length}</td>
                  <td className="px-3 py-3 text-right">
                    <Link to={`/coach/clients/${p.clientId}?tab=blood`} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:underline">Open <ChevronRight className="h-3 w-3" /></Link>
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
