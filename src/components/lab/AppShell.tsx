import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, Beaker, LayoutDashboard, Users, Settings, LogOut, Search, Bell } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { COACH } from "@/data/mock";

const NAV = [
  { to: "/coach", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/coach/clients", icon: Users, label: "Clients" },
  { to: "/coach/lab", icon: Beaker, label: "Blood Panel Lab" },
  { to: "/coach/settings", icon: Settings, label: "Settings" },
];

export function AppShell() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end as any}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm">
              {COACH.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{COACH.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">Coach · Admin</div>
            </div>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 md:px-6 py-3">
          <div className="md:hidden"><Logo compact /></div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span>Lab Online</span>
            <span className="text-border">/</span>
            <span className="truncate">{loc.pathname}</span>
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            <div className="relative hidden sm:block w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search clients, biomarkers…" className="pl-9 bg-card/60 border-border" />
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card/60 hover:bg-card transition">
              <Bell className="h-4 w-4" />
            </button>
            <div className="md:hidden grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm">
              {COACH.initials}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 md:px-6 py-6">
          <Outlet />
        </main>
        <footer className="px-6 py-4 text-[11px] text-muted-foreground border-t border-border flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2"><Activity className="h-3 w-3 text-primary" /> Mad Scientist Coaching Lab — v0.1</div>
          <div>Not for medical diagnosis · Educational coaching only</div>
        </footer>
      </div>
    </div>
  );
}
