/**
 * RipsCatalogs Component
 * Gestion de catalogos CUPS y CIE-10 para RIPS
 */

import { useState } from 'react';
import { Search, Loader2, FileText, Stethoscope } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  useRipsDiagnosisCatalog,
  useRipsServicesCatalog,
  type DiagnosisCatalog,
  type ServicesCatalog,
} from '@/hooks/useRips';
import { TIPO_SERVICIO } from '@/lib/utils/rips';

export function RipsCatalogs() {
  const [activeTab, setActiveTab] = useState('services');
  const [servicesSearch, setServicesSearch] = useState('');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="services" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Servicios CUPS
          </TabsTrigger>
          <TabsTrigger value="diagnosis" className="gap-2">
            <FileText className="h-4 w-4" />
            Diagnosticos CIE-10
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          <ServicesCatalogView
            search={servicesSearch}
            onSearchChange={setServicesSearch}
            serviceType={serviceTypeFilter}
            onServiceTypeChange={setServiceTypeFilter}
          />
        </TabsContent>

        <TabsContent value="diagnosis" className="mt-6">
          <DiagnosisCatalogView
            search={diagnosisSearch}
            onSearchChange={setDiagnosisSearch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Services Catalog View
function ServicesCatalogView({
  search,
  onSearchChange,
  serviceType,
  onServiceTypeChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  serviceType?: string;
  onServiceTypeChange: (value: string | undefined) => void;
}) {
  const { data: services = [], isLoading } = useRipsServicesCatalog(serviceType, search);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalogo de Servicios CUPS</CardTitle>
        <CardDescription>
          Codigos de Procedimientos Unificados del Sistema de Salud
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por codigo o nombre..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Badge
              variant={serviceType === undefined ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onServiceTypeChange(undefined)}
            >
              Todos
            </Badge>
            {Object.entries(TIPO_SERVICIO).map(([code, label]) => (
              <Badge
                key={code}
                variant={serviceType === code ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onServiceTypeChange(code)}
              >
                {code} - {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              {search ? 'No se encontraron servicios' : 'Ingrese un termino de busqueda'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[120px]">Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead>Especialidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <ServiceRow key={service.id} service={service} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceRow({ service }: { service: ServicesCatalog }) {
  const typeColors: Record<string, string> = {
    AC: 'bg-blue-100 text-blue-800 border-blue-200',
    AP: 'bg-green-100 text-green-800 border-green-200',
    AM: 'bg-purple-100 text-purple-800 border-purple-200',
    AT: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell>
        <span className="font-mono text-sm font-medium">{service.code}</span>
      </TableCell>
      <TableCell>{service.name}</TableCell>
      <TableCell>
        <Badge variant="outline" className={typeColors[service.service_type] || ''}>
          {service.service_type}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{service.specialty || '-'}</span>
      </TableCell>
    </TableRow>
  );
}

// Diagnosis Catalog View
function DiagnosisCatalogView({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const { data: diagnoses = [], isLoading } = useRipsDiagnosisCatalog(search);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalogo de Diagnosticos CIE-10</CardTitle>
        <CardDescription>
          Clasificacion Internacional de Enfermedades, 10a revision
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por codigo o nombre (ej: K02, caries)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : diagnoses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              {search ? 'No se encontraron diagnosticos' : 'Ingrese un termino de busqueda'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[100px]">Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[80px]">Capitulo</TableHead>
                    <TableHead className="w-[100px]">Grupo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnoses.map((diagnosis) => (
                    <DiagnosisRow key={diagnosis.id} diagnosis={diagnosis} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function DiagnosisRow({ diagnosis }: { diagnosis: DiagnosisCatalog }) {
  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {diagnosis.code}
        </Badge>
      </TableCell>
      <TableCell>{diagnosis.name}</TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{diagnosis.chapter || '-'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{diagnosis.group_code || '-'}</span>
      </TableCell>
    </TableRow>
  );
}
