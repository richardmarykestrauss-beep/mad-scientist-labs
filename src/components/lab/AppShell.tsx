import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, Beaker, LayoutDashboard, Users, Settings, LogOut, Search, Bell } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { COACH } from "@/data/mock";
import { useStore } from "@/data/store";

const NAV = [
  { to: "/coach", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/coach/clients", icon: Users, label: "Clients" },
  { to: "/coach/lab", icon: Beaker, label: "Blood Panel Lab" },
  { to: "/coach/settings", icon: Settings, label: "Settings" },
];

export function AppShell() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { clients } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const isCoachWorkspaceLight =
    loc.pathname === "/coach" ||
    loc.pathname === "/coach/clients" ||
    loc.pathname === "/coach/lab" ||
    loc.pathname === "/coach/settings";

  useEffect(() => {
    if (isCoachWorkspaceLight) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, [isCoachWorkspaceLight]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchedClients = normalizedQuery
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(normalizedQuery) ||
          c.email.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const allPages = [
    { name: "Dashboard", path: "/coach" },
    { name: "Clients", path: "/coach/clients" },
    { name: "Blood Lab", path: "/coach/lab" },
    { name: "Settings", path: "/coach/settings" }
  ];

  const matchedPages = normalizedQuery
    ? allPages.filter((p) => p.name.toLowerCase().includes(normalizedQuery))
    : [];

  return (
    <div className={cn("min-h-screen flex", isCoachWorkspaceLight ? "bg-[#f8f9fa] text-slate-800" : "bg-background text-foreground")}>
      <aside className={cn(
        "hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen backdrop-blur",
        isCoachWorkspaceLight ? "border-r border-slate-200 bg-white shadow-sm" : "border-r border-border bg-sidebar/80"
      )}>
        <div className={cn("px-5 py-5 border-b", isCoachWorkspaceLight ? "border-slate-100" : "border-border")}>
          <Logo className={cn(isCoachWorkspaceLight && "[&_.text-foreground]:text-slate-900 [&_.text-primary]:text-emerald-600 [&_.bg-primary\\/10]:bg-emerald-50 [&_.border-primary\\/40]:border-emerald-200")} />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? (isCoachWorkspaceLight
                      ? "bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]"
                      : "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]")
                  : (isCoachWorkspaceLight
                      ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground")
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={cn("p-3", isCoachWorkspaceLight ? "border-t border-slate-100" : "border-t border-border")}>
          <div className={cn("flex items-center gap-3 rounded-xl p-2.5", isCoachWorkspaceLight ? "border border-slate-200 bg-white shadow-sm" : "border border-border bg-card/60")}>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm">
              {COACH.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn("truncate text-sm font-semibold", isCoachWorkspaceLight ? "text-slate-800" : "text-foreground")}>{COACH.name}</div>
              <div className={cn("truncate text-[11px]", isCoachWorkspaceLight ? "text-slate-400" : "text-muted-foreground")}>Coach · Admin</div>
            </div>
            <LogOut className={cn("h-4 w-4", isCoachWorkspaceLight ? "text-slate-400" : "text-muted-foreground")} />
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className={cn(
          "sticky top-0 z-20 flex items-center gap-3 backdrop-blur px-4 md:px-6 py-3",
          isCoachWorkspaceLight ? "border-b border-slate-200 bg-white/95 shadow-sm" : "border-b border-border bg-background/80"
        )}>
          <div className="md:hidden"><Logo compact /></div>
          <div className={cn("hidden md:flex items-center gap-2 text-xs font-mono uppercase tracking-wider", isCoachWorkspaceLight ? "text-slate-500" : "text-muted-foreground")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isCoachWorkspaceLight ? "bg-emerald-500 animate-pulse" : "bg-primary animate-pulse-glow")} />
            <span>Lab Online</span>
            <span className={isCoachWorkspaceLight ? "text-slate-300" : "text-border"}>/</span>
            <span className="truncate">{loc.pathname}</span>
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            <div className="relative hidden sm:block w-72">
              <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isCoachWorkspaceLight ? "text-slate-400" : "text-muted-foreground animate-pulse-glow")} />
              <Input 
                placeholder="Search clients, pages…" 
                className={cn("pl-9 text-xs h-9", isCoachWorkspaceLight ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white" : "bg-card/60 border-border")} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                  }
                }}
              />
              {searchQuery.trim() !== "" && (
                <>
                  {/* Click-away backdrop */}
                  <div className="fixed inset-0 z-30" onClick={() => setSearchQuery("")} />
                  
                  {/* Dropdown list */}
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-2xl z-40 max-h-[350px] overflow-y-auto scrollbar-thin">
                    {matchedClients.length === 0 && matchedPages.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground font-mono">
                        No matches found
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {matchedClients.length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 mb-1">
                              Clients
                            </div>
                            <div className="space-y-0.5">
                              {matchedClients.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    navigate(`/coach/clients/${c.id}`);
                                    setSearchQuery("");
                                  }}
                                  className="w-full text-left flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs hover:bg-secondary/40 transition"
                                >
                                  <div className={`grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br ${c.avatarColor} text-background font-bold text-[9px] shrink-0`}>
                                    {c.initials}
                                  </div>
                                  <div className="truncate font-medium flex-1">{c.name}</div>
                                  <div className="truncate text-[10px] text-muted-foreground ml-auto">{c.email}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {matchedPages.length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 mb-1">
                              Pages
                            </div>
                            <div className="space-y-0.5">
                              {matchedPages.map((p) => (
                                <button
                                  key={p.path}
                                  onClick={() => {
                                    navigate(p.path);
                                    setSearchQuery("");
                                  }}
                                  className="w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-secondary/40 transition font-medium"
                                >
                                  <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span>{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground ml-auto">{p.path}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <button className={cn("grid h-9 w-9 place-items-center rounded-xl transition", isCoachWorkspaceLight ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600" : "border border-border bg-card/60 hover:bg-card")}>
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
        <footer className={cn("px-6 py-4 text-[11px] flex items-center gap-2 justify-between", isCoachWorkspaceLight ? "border-t border-slate-200 bg-white text-slate-500" : "border-t border-border text-muted-foreground")}>
          <div className="flex items-center gap-2"><Activity className={cn("h-3 w-3 text-primary", isCoachWorkspaceLight ? "text-emerald-600" : "text-primary")} /> Mad Scientist Coaching Lab — v0.1</div>
          <div>Not for medical diagnosis · Educational coaching only</div>
        </footer>
      </div>
    </div>
  );
}
