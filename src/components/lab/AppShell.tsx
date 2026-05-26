import { useState } from "react";
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
              end={item.end}
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-pulse-glow" />
              <Input 
                placeholder="Search clients, pages…" 
                className="pl-9 bg-card/60 border-border text-xs h-9" 
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
