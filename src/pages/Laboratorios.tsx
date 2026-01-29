import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Factory, 
  Upload, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck,
  Star,
  ExternalLink,
  Plus,
  Search,
  FileCode,
  Send,
  Eye,
  DollarSign,
  Timer,
  AlertCircle,
  Cog
} from "lucide-react";

// Mock data - en producción vendría de la base de datos
const mockLabs = [
  {
    id: "1",
    name: "Prisma Dental Lab",
    slug: "prisma-dental",
    website: "https://prismadentallab.amawebs.com",
    specialties: ["CAD/CAM", "Zirconia", "E.max", "Implantes"],
    supported_formats: ["STL", "3MF", "PLY"],
    average_turnaround_days: 4,
    rating: 4.8,
    total_orders: 127
  },
  {
    id: "2",
    name: "Rapinucleos",
    slug: "rapinucleos",
    website: "https://www.rapinucleos.com",
    specialties: ["Núcleos", "Postes", "Coronas", "CAD/CAM"],
    supported_formats: ["STL", "3MF", "STEP"],
    average_turnaround_days: 3,
    rating: 4.9,
    total_orders: 89
  },
  {
    id: "3",
    name: "Damildent",
    slug: "damildent",
    website: null,
    specialties: ["Prótesis fija", "Coronas", "Puentes", "Metal-cerámica"],
    supported_formats: ["STL", "3MF"],
    average_turnaround_days: 5,
    rating: 4.6,
    total_orders: 156
  },
  {
    id: "4",
    name: "LabDental Elite",
    slug: "labdental-elite",
    website: null,
    specialties: ["Ortodoncia", "Alineadores", "Retenedores"],
    supported_formats: ["STL", "3MF"],
    average_turnaround_days: 7,
    rating: 4.7,
    total_orders: 64
  },
  {
    id: "5",
    name: "Cerámicas Medellín",
    slug: "ceramicas-medellin",
    website: null,
    specialties: ["Carillas", "Inlays", "Onlays", "Estratificación"],
    supported_formats: ["STL"],
    average_turnaround_days: 6,
    rating: 4.5,
    total_orders: 92
  }
];

const mockOrders = [
  {
    id: "1",
    order_number: "ORD-2024-001",
    patient_name: "María García",
    work_type: "Corona",
    material: "Zirconia",
    status: "in_production",
    priority: "normal",
    created_at: "2024-01-28",
    estimated_delivery: "2024-02-02",
    selected_lab: "Prisma Dental Lab",
    quotes_count: 3
  },
  {
    id: "2",
    order_number: "ORD-2024-002",
    patient_name: "Carlos López",
    work_type: "Puente",
    material: "E.max",
    status: "pending_quotes",
    priority: "urgente",
    created_at: "2024-01-29",
    estimated_delivery: null,
    selected_lab: null,
    quotes_count: 2
  },
  {
    id: "3",
    order_number: "ORD-2024-003",
    patient_name: "Ana Martínez",
    work_type: "Carillas",
    material: "Porcelana",
    status: "quoted",
    priority: "normal",
    created_at: "2024-01-27",
    estimated_delivery: null,
    selected_lab: null,
    quotes_count: 3
  },
  {
    id: "4",
    order_number: "ORD-2024-004",
    patient_name: "Pedro Sánchez",
    work_type: "Implante",
    material: "Titanio",
    status: "completed",
    priority: "normal",
    created_at: "2024-01-20",
    estimated_delivery: "2024-01-25",
    selected_lab: "Rapinucleos",
    quotes_count: 3
  }
];

const workTypes = [
  "Corona",
  "Puente",
  "Carillas",
  "Implante",
  "Prótesis removible",
  "Núcleo",
  "Inlay/Onlay",
  "Alineadores"
];

const materials = [
  "Zirconia",
  "E.max",
  "Metal-cerámica",
  "Porcelana",
  "Titanio",
  "Resina",
  "Acrílico",
  "PEEK"
];

const shades = [
  "A1", "A2", "A3", "A3.5", "A4",
  "B1", "B2", "B3", "B4",
  "C1", "C2", "C3", "C4",
  "D2", "D3", "D4"
];

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
    draft: { label: "Borrador", variant: "outline", icon: <FileCode className="w-3 h-3" /> },
    pending_quotes: { label: "Esperando cotizaciones", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    quoted: { label: "Cotizado", variant: "default", icon: <DollarSign className="w-3 h-3" /> },
    in_production: { label: "En producción", variant: "default", icon: <Cog className="w-3 h-3 animate-spin" /> },
    completed: { label: "Completado", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
    delivered: { label: "Entregado", variant: "secondary", icon: <Truck className="w-3 h-3" /> }
  };

  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const getPriorityBadge = (priority: string) => {
  if (priority === "urgente") {
    return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Urgente</Badge>;
  }
  return null;
};

export default function Laboratorios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const filteredOrders = mockOrders.filter(order => 
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laboratorios Dentales</h1>
            <p className="text-muted-foreground mt-1">
              Sistema de cotización y tracking con laboratorios digitales
            </p>
          </div>
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Orden de Trabajo</DialogTitle>
                <DialogDescription>
                  Sube tu diseño y solicita cotizaciones a múltiples laboratorios.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de trabajo *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map(type => (
                          <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Material *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(mat => (
                          <SelectItem key={mat} value={mat.toLowerCase()}>{mat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color/Tono</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tono..." />
                      </SelectTrigger>
                      <SelectContent>
                        {shades.map(shade => (
                          <SelectItem key={shade} value={shade}>{shade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flexible">Flexible (7+ días)</SelectItem>
                        <SelectItem value="normal">Normal (5 días)</SelectItem>
                        <SelectItem value="urgente">Urgente (3 días)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dientes afectados</Label>
                  <Input placeholder="Ej: 11, 12, 21" />
                </div>

                <div className="space-y-2">
                  <Label>Archivo de diseño (STL/3MF)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos soportados: STL, 3MF, PLY (máx. 50MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas adicionales</Label>
                  <Textarea 
                    placeholder="Instrucciones especiales, preferencias de color, observaciones..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                    Cancelar
                  </Button>
                  <Button className="gap-2">
                    <Send className="w-4 h-4" />
                    Solicitar Cotizaciones
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Órdenes Activas</p>
                  <p className="text-2xl font-bold text-foreground">8</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Producción</p>
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
                <Cog className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-foreground">5</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Labs Conectados</p>
                  <p className="text-2xl font-bold text-foreground">5</p>
                </div>
                <Factory className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Órdenes
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-2">
              <Factory className="w-4 h-4" />
              Laboratorios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por orden o paciente..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm font-medium text-primary">
                            {order.order_number}
                          </span>
                          {getStatusBadge(order.status)}
                          {getPriorityBadge(order.priority)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="text-foreground font-medium">{order.patient_name}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{order.work_type} - {order.material}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {order.created_at}
                          </span>
                          {order.selected_lab && (
                            <span className="flex items-center gap-1">
                              <Factory className="w-3 h-3" />
                              {order.selected_lab}
                            </span>
                          )}
                          {order.estimated_delivery && (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Entrega: {order.estimated_delivery}
                            </span>
                          )}
                          {order.quotes_count > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <DollarSign className="w-3 h-3" />
                              {order.quotes_count} cotizaciones
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          Ver Detalle
                        </Button>
                        {order.status === "quoted" && (
                          <Button size="sm" className="gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Seleccionar Lab
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="labs" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockLabs.map(lab => (
                <Card key={lab.id} className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{lab.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Star className="w-4 h-4 text-warning fill-warning" />
                          {lab.rating} · {lab.total_orders} órdenes
                        </CardDescription>
                      </div>
                      {lab.website && (
                        <a href={lab.website} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {lab.specialties.map(spec => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {lab.average_turnaround_days} días promedio
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <FileCode className="w-4 h-4" />
                        {lab.supported_formats.join(", ")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
