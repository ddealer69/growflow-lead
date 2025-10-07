import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyDetails from "./pages/CompanyDetails";
import Settings from "./pages/Settings";
import Social from "./pages/Social";
import Auth from "./pages/Auth";
import GetLeads from "./pages/GetLeads";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/companies" element={<AppLayout><Companies /></AppLayout>} />
            <Route path="/companies/:id" element={<AppLayout><CompanyDetails /></AppLayout>} />
            <Route path="/leads" element={<AppLayout><GetLeads /></AppLayout>} />
            <Route path="/campaigns" element={<AppLayout><Placeholder title="Campaigns" description="Email and LinkedIn campaign management" /></AppLayout>} />
            <Route path="/social" element={<AppLayout><Social /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
