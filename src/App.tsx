import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Pacientes from "./pages/Pacientes";
import Finanzas from "./pages/Finanzas";
import Facturacion from "./pages/Facturacion";
import Cobros from "./pages/Cobros";
import Inventario from "./pages/Inventario";
import Laboratorios from "./pages/Laboratorios";
import AsistenteIA from "./pages/AsistenteIA";
import { PlaceholderPage } from "./components/layout/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
            <Route path="/tratamientos" element={<ProtectedRoute><PlaceholderPage title="Tratamientos" /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
            <Route path="/laboratorios" element={<ProtectedRoute><Laboratorios /></ProtectedRoute>} />
            <Route path="/finanzas" element={<ProtectedRoute><Finanzas /></ProtectedRoute>} />
            <Route path="/facturacion" element={<ProtectedRoute><Facturacion /></ProtectedRoute>} />
            <Route path="/cobros" element={<ProtectedRoute><Cobros /></ProtectedRoute>} />
            <Route path="/asistente-ia" element={<ProtectedRoute><AsistenteIA /></ProtectedRoute>} />
            <Route path="/mensajes" element={<ProtectedRoute><PlaceholderPage title="Mensajes" /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><PlaceholderPage title="Configuración" /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
