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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
        <Sonner position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/coach" element={<AppShell />}>
            <Route index element={<CoachDashboard />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="clients/:id" element={<ClientProfile />} />
            <Route path="lab" element={<BloodPanelLab />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/client/:id" element={<ClientHome />} />
          <Route path="/client" element={<Navigate to="/client/c-001" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
