/**
 * Rips Page - Modulo RIPS (Registro Individual de Prestacion de Servicios)
 * Resolucion 2275/2023 - Ministerio de Salud Colombia
 */

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileJson,
  ClipboardCheck,
  History,
  Eye,
  Settings,
  Database,
} from 'lucide-react';

import {
  RipsGenerator,
  RipsValidator,
  RipsHistory,
  RipsPreview,
  RipsSettings,
  RipsCatalogs,
} from '@/components/rips';

const Rips = () => {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                RIPS
              </h1>
              <Badge variant="secondary" className="text-xs">
                Res. 2275/2023
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Registro Individual de Prestacion de Servicios de Salud
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-success/10 border border-primary/20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Reporte al Ministerio de Salud
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos JSON (nueva resolucion) y Plano (tradicional)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 lg:ml-auto text-sm">
              <div>
                <span className="text-muted-foreground">Consultas:</span>
                <span className="ml-1 font-medium">AC</span>
              </div>
              <div>
                <span className="text-muted-foreground">Procedimientos:</span>
                <span className="ml-1 font-medium">AP</span>
              </div>
              <div>
                <span className="text-muted-foreground">Medicamentos:</span>
                <span className="ml-1 font-medium">AM</span>
              </div>
              <div>
                <span className="text-muted-foreground">Otros:</span>
                <span className="ml-1 font-medium">AT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="generate" className="gap-2 data-[state=active]:bg-background">
              <FileJson className="w-4 h-4" />
              Generar RIPS
            </TabsTrigger>
            <TabsTrigger value="validate" className="gap-2 data-[state=active]:bg-background">
              <ClipboardCheck className="w-4 h-4" />
              Validar
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-background">
              <Eye className="w-4 h-4" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-background">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="catalogs" className="gap-2 data-[state=active]:bg-background">
              <Database className="w-4 h-4" />
              Catalogos
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background">
              <Settings className="w-4 h-4" />
              Configuracion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <RipsGenerator />
          </TabsContent>

          <TabsContent value="validate">
            <RipsValidator />
          </TabsContent>

          <TabsContent value="preview">
            <RipsPreview />
          </TabsContent>

          <TabsContent value="history">
            <RipsHistory />
          </TabsContent>

          <TabsContent value="catalogs">
            <RipsCatalogs />
          </TabsContent>

          <TabsContent value="settings">
            <RipsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Rips;
