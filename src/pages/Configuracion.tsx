import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, MessageSquare, Settings2, Brain, Receipt, Shield } from "lucide-react";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { MessageTemplatesSettings } from "@/components/settings/MessageTemplatesSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { AISettings } from "@/components/settings/AISettings";
import { InvoiceSettings } from "@/components/settings/InvoiceSettings";
import { LegalDocumentsPanel } from "@/components/legal/LegalDocumentsPanel";
import { useUserRole } from "@/hooks/useUserRole";

const Configuracion = () => {
  const { data: role } = useUserRole();
  const isAdmin = role === "admin";

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Configuración
          </h1>
          <p className="text-muted-foreground mt-1">
            Personaliza tu experiencia y configura los ajustes del sistema
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-2">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="clinic" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Consultorio</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Plantillas</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Preferencias</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Recibos</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Legal</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="clinic">
            <ClinicSettings />
          </TabsContent>

          <TabsContent value="templates">
            <MessageTemplatesSettings />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSettings />
          </TabsContent>

          <TabsContent value="ai">
            <AISettings />
          </TabsContent>

          <TabsContent value="invoice">
            <InvoiceSettings />
          </TabsContent>

          <TabsContent value="legal">
            <LegalDocumentsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Configuracion;
