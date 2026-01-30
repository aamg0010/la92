import { MainLayout } from "@/components/layout/MainLayout";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, FileText } from "lucide-react";
import { StatsCards } from "@/components/admin/StatsCards";
import { UsersTable } from "@/components/admin/UsersTable";
import { DocumentsPanel } from "@/components/admin/DocumentsPanel";

const Administracion = () => {
  const { data: users, isLoading } = useAdminUsers();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona usuarios, roles, documentación y permisos del sistema
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards users={users} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Usuarios y Roles
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Documentación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTable />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Administracion;
