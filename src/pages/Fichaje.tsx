import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar, Users, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClockWidget,
  TimesheetTable,
  EmployeesList,
  TimeSettingsPanel
} from '@/components/fichaje';

export default function Fichaje() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('fichar');

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Control Horario</h1>
        <p className="text-muted-foreground mt-1">
          Registra tu jornada laboral y consulta tu historial de fichajes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-xl">
          <TabsTrigger value="fichar" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Fichar</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="equipo" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Equipo</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="configuracion" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Fichar */}
        <TabsContent value="fichar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Widget principal de fichaje */}
            <div className="lg:col-span-2">
              <ClockWidget />
            </div>

            {/* Panel lateral - solo para admins */}
            {isAdmin && (
              <div>
                <EmployeesList />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="historial">
          <TimesheetTable
            userId={!isManager ? user?.id : undefined}
            showUserColumn={isManager}
          />
        </TabsContent>

        {/* Tab: Equipo (solo managers/admin) */}
        {isManager && (
          <TabsContent value="equipo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TimesheetTable showUserColumn />
              </div>
              <div>
                <EmployeesList />
              </div>
            </div>
          </TabsContent>
        )}

        {/* Tab: Configuracion (solo admin) */}
        {isAdmin && (
          <TabsContent value="configuracion">
            <TimeSettingsPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
