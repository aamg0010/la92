import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/tratamientos" element={<PlaceholderPage title="Tratamientos" />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/laboratorios" element={<Laboratorios />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/facturacion" element={<Facturacion />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="/asistente-ia" element={<AsistenteIA />} />
          <Route path="/mensajes" element={<PlaceholderPage title="Mensajes" />} />
          <Route path="/configuracion" element={<PlaceholderPage title="Configuración" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
