import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Pacientes from "./pages/Pacientes";
import Finanzas from "./pages/Finanzas";
import Facturacion from "./pages/Facturacion";
import FacturacionES from "./pages/FacturacionES";
import Presupuestos from "./pages/Presupuestos";
import Cobros from "./pages/Cobros";
import Inventario from "./pages/Inventario";
import Laboratorios from "./pages/Laboratorios";
import Egresos from "./pages/Egresos";
import Rips from "./pages/Rips";
import RH1 from "./pages/RH1";
import ControlAmbiental from "./pages/ControlAmbiental";
import AsistenteIA from "./pages/AsistenteIA";
import Administracion from "./pages/Administracion";
import Configuracion from "./pages/Configuracion";
import Tratamientos from "./pages/Tratamientos";
import Fichaje from "./pages/Fichaje";
import RemoteSignature from "./pages/RemoteSignature";
import { PlaceholderPage } from "./components/layout/PlaceholderPage";
import NotFound from "./pages/NotFound";

// Admin panel imports
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClinics from "./pages/admin/AdminClinics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLicenses from "./pages/admin/AdminLicenses";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />

            {/* Public route for remote signature (patients accessing from mobile via token) */}
            <Route path="/firma/:token" element={<RemoteSignature />} />

            {/* Admin panel routes (superadmin only) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="clinics" element={<AdminClinics />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="licenses" element={<AdminLicenses />} />
            </Route>

            {/* Clinic app routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
            <Route path="/tratamientos" element={<ProtectedRoute><Tratamientos /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
            <Route path="/laboratorios" element={<ProtectedRoute><Laboratorios /></ProtectedRoute>} />
            <Route path="/finanzas" element={<ProtectedRoute><Finanzas /></ProtectedRoute>} />
            <Route path="/presupuestos" element={<ProtectedRoute><Presupuestos /></ProtectedRoute>} />
            <Route path="/facturacion" element={<ProtectedRoute><Facturacion /></ProtectedRoute>} />
            <Route path="/facturacion-es" element={<ProtectedRoute><FacturacionES /></ProtectedRoute>} />
            <Route path="/cobros" element={<ProtectedRoute><Cobros /></ProtectedRoute>} />
            <Route path="/egresos" element={<ProtectedRoute><Egresos /></ProtectedRoute>} />
            <Route path="/rips" element={<ProtectedRoute><Rips /></ProtectedRoute>} />
            <Route path="/rh1" element={<ProtectedRoute><RH1 /></ProtectedRoute>} />
            <Route path="/control-ambiental" element={<ProtectedRoute><ControlAmbiental /></ProtectedRoute>} />
            <Route path="/asistente-ia" element={<ProtectedRoute><AsistenteIA /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
            <Route path="/fichaje" element={<ProtectedRoute><Fichaje /></ProtectedRoute>} />
            <Route path="/administracion" element={<ProtectedRoute requiredRoles={["admin"]}><Administracion /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
