import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Link } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AppShell } from "./components/lab/AppShell";
import CoachDashboard from "./pages/coach/CoachDashboard";
import ClientList from "./pages/coach/ClientList";
import ClientProfile from "./pages/coach/ClientProfile";
import BloodPanelLab from "./pages/coach/BloodPanelLab";
import Settings from "./pages/coach/Settings";
import ClientHome from "./pages/client/ClientHome";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { dataMode } from "./lib/supabase";
import { PILOT_DISCLAIMER, PILOT_STATUS_COPY } from "./lib/pilotFeatures";
import { PrototypeFeatureNotice } from "./components/pilot/PrototypeFeatureNotice";

const queryClient = new QueryClient();

const CoachHome = () => {
  if (dataMode === "local") return <CoachDashboard />;
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <h1 className="text-xl font-bold">{PILOT_STATUS_COPY}</h1>
        <p className="mt-2 text-sm">
          Live: login, assigned client identity, weekly check-ins, and coach review/feedback.
        </p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-semibold">Prototype features are disabled for live clients</p>
        <p className="mt-2 text-sm">
          Training, nutrition, supplements, labs/biomarkers, recommendations, AI, and local notes are not connected to pilot identities.
        </p>
        <p className="mt-3 text-xs">{PILOT_DISCLAIMER}</p>
      </div>
      <Link className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" to="/coach/clients">
        Open live assigned roster
      </Link>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground font-mono">AUTHENTICATING SESSION...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (!profile || profile.status !== "active") {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Coach Routes */}
      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRoles={["coach", "admin"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<CoachHome />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/:id" element={<ClientProfile />} />
        <Route path="lab" element={dataMode === "supabase" ? <PrototypeFeatureNotice feature="Labs, biomarkers, and medical-style recommendations" /> : <BloodPanelLab />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Client Routes */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientHome />
          </ProtectedRoute>
        }
      />
      
      {/* Legacy client route redirection */}
      <Route
        path="/client/:id"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientHome />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
