import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient();

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
  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { profile } = useAuth();
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
        <Route index element={<CoachDashboard />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/:id" element={<ClientProfile />} />
        <Route path="lab" element={<BloodPanelLab />} />
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
