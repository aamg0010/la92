import { useState, useRef } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
  Cog,
  File
} from "lucide-react";
import { 
  useDentalLabs, 
  useLabOrders, 
  useLabOrderStats,
  useCreateLabOrder,
  useUploadDesignFile,
  generateOrderNumber,
  type DentalLab 
} from "@/hooks/useDentalLabs";
import { useSearchPatients } from "@/hooks/usePatients";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const getStatusBadge = (status: string | null) => {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
    draft: { label: "Borrador", variant: "outline", icon: <FileCode className="w-3 h-3" /> },
    pending_quotes: { label: "Esperando cotizaciones", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    quoted: { label: "Cotizado", variant: "default", icon: <DollarSign className="w-3 h-3" /> },
    in_production: { label: "En producción", variant: "default", icon: <Cog className="w-3 h-3 animate-spin" /> },
    completed: { label: "Completado", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
    delivered: { label: "Entregado", variant: "secondary", icon: <Truck className="w-3 h-3" /> }
  };

  const config = statusConfig[status || "draft"] || statusConfig.draft;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const getPriorityBadge = (priority: string | null) => {
  if (priority === "urgente") {
    return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Urgente</Badge>;
  }
  return null;
};

export default function Laboratorios() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    work_type: "",
    material: "",
    shade: "",
    priority: "normal",
    tooth_numbers: "",
    notes: "",
    patient_id: "",
  });

  // Data hooks
  const { data: labs, isLoading: labsLoading } = useDentalLabs();
  const { data: orders, isLoading: ordersLoading } = useLabOrders();
  const { data: stats, isLoading: statsLoading } = useLabOrderStats();
  const { data: patientResults } = useSearchPatients(patientSearch);
  
  // Mutations
  const createOrder = useCreateLabOrder();
  const uploadFile = useUploadDesignFile();

  const filteredOrders = orders?.filter(order => 
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.first_name + " " + order.patient?.last_name).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.stl', '.3mf', '.ply'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast({
          title: "Formato no soportado",
          description: "Solo se permiten archivos STL, 3MF y PLY.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 52428800) {
        toast({
          title: "Archivo muy grande",
          description: "El tamaño máximo permitido es 50MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitOrder = async () => {
    if (!formData.work_type || !formData.material) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona tipo de trabajo y material.",
        variant: "destructive",
      });
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "No autenticado",
        description: "Debes iniciar sesión para crear órdenes.",
        variant: "destructive",
      });
      return;
    }

    const orderNumber = generateOrderNumber();
    let designFileUrl = null;
    let designFileFormat = null;

    // Upload file if selected
    if (selectedFile) {
      const result = await uploadFile.mutateAsync({
        file: selectedFile,
        orderNumber,
      });
      designFileUrl = result.path;
      designFileFormat = selectedFile.name.split('.').pop()?.toUpperCase();
    }

    // Create order
    await createOrder.mutateAsync({
      order_number: orderNumber,
      doctor_id: user.id,
      work_type: formData.work_type,
      material: formData.material,
      shade: formData.shade || null,
      priority: formData.priority,
      tooth_numbers: formData.tooth_numbers ? formData.tooth_numbers.split(',').map(t => t.trim()) : null,
      notes: formData.notes || null,
      patient_id: formData.patient_id || null,
      design_file_url: designFileUrl,
      design_file_format: designFileFormat,
      status: "pending_quotes",
    });

    // Reset form
    setFormData({
      work_type: "",
      material: "",
      shade: "",
      priority: "normal",
      tooth_numbers: "",
      notes: "",
      patient_id: "",
    });
    setSelectedFile(null);
    setIsNewOrderOpen(false);
  };

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
                {/* Patient search */}
                <div className="space-y-2">
                  <Label>Paciente (opcional)</Label>
                  <Input 
                    placeholder="Buscar paciente..." 
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                  {patientResults && patientResults.length > 0 && (
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {patientResults.map(p => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, patient_id: p.id }));
                            setPatientSearch(`${p.first_name} ${p.last_name}`);
                          }}
                        >
                          {p.first_name} {p.last_name} - {p.document_number}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de trabajo *</Label>
                    <Select 
                      value={formData.work_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, work_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Material *</Label>
                    <Select
                      value={formData.material}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, material: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(mat => (
                          <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color/Tono</Label>
                    <Select
                      value={formData.shade}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, shade: v }))}
                    >
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
                    <Select 
                      value={formData.priority}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                    >
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
                  <Input 
                    placeholder="Ej: 11, 12, 21" 
                    value={formData.tooth_numbers}
                    onChange={(e) => setFormData(prev => ({ ...prev, tooth_numbers: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Archivo de diseño (STL/3MF/PLY)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".stl,.3mf,.ply"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <File className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Arrastra tu archivo aquí o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formatos soportados: STL, 3MF, PLY (máx. 50MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas adicionales</Label>
                  <Textarea 
                    placeholder="Instrucciones especiales, preferencias de color, observaciones..."
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="gap-2"
                    onClick={handleSubmitOrder}
                    disabled={createOrder.isPending || uploadFile.isPending}
                  >
                    <Send className="w-4 h-4" />
                    {createOrder.isPending ? "Enviando..." : "Solicitar Cotizaciones"}
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
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.active || 0}</p>
                  )}
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
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.inProduction || 0}</p>
                  )}
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
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.pending || 0}</p>
                  )}
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
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.labsConnected || 0}</p>
                  )}
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
              {ordersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay órdenes de laboratorio.</p>
                    <Button className="mt-4" onClick={() => setIsNewOrderOpen(true)}>
                      Crear primera orden
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map(order => (
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
                            <span className="text-foreground font-medium">
                              {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : "Sin paciente asignado"}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{order.work_type} - {order.material}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            {order.selected_lab && (
                              <span className="flex items-center gap-1">
                                <Factory className="w-3 h-3" />
                                {order.selected_lab.name}
                              </span>
                            )}
                            {order.estimated_delivery && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                Entrega: {order.estimated_delivery}
                              </span>
                            )}
                            {order.design_file_url && (
                              <Badge variant="outline" className="gap-1">
                                <File className="w-3 h-3" />
                                {order.design_file_format}
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
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="labs" className="space-y-4">
            {labsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-40 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labs?.map((lab: DentalLab) => (
                  <Card key={lab.id} className="hover:shadow-lg transition-all hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{lab.name}</CardTitle>
                          <CardDescription>{lab.city}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 bg-warning/10 px-2 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          <span className="text-sm font-medium text-warning">{Number(lab.rating).toFixed(1)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-1">
                        {lab.specialties?.slice(0, 4).map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{lab.average_turnaround_days} días prom.</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="w-4 h-4" />
                          <span>{lab.total_orders} órdenes</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {lab.supported_formats?.map((format, i) => (
                          <Badge key={i} variant="outline" className="text-xs gap-1">
                            <FileCode className="w-3 h-3" />
                            {format}
                          </Badge>
                        ))}
                      </div>

                      {lab.website && (
                        <a 
                          href={lab.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Visitar sitio web
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
