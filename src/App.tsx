import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import ProjectsPage from "./pages/ProjectsPage";
import OffersPage from "./pages/OffersPage";
import MethodsPage from "./pages/MethodsPage";
import ClientsPage from "./pages/ClientsPage";
import PeoplePage from "./pages/PeoplePage";
import SearchPage from "./pages/SearchPage";
import AssistantPage from "./pages/AssistantPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/offers" element={<ProtectedRoute><OffersPage /></ProtectedRoute>} />
            <Route path="/methods" element={<ProtectedRoute><MethodsPage /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
