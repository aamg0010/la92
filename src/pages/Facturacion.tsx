import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Search,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileJson,
  Building2,
  Upload,
  RefreshCw,
  Eye,
  Printer,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  number: string;
  patientName: string;
  nit: string;
  date: string;
  amount: number;
  status: "draft" | "pending" | "sent" | "validated" | "rejected";
  ripsGenerated: boolean;
  cufe?: string;
}

const invoices: Invoice[] = [
  {
    id: "1",
    number: "FEV-001234",
    patientName: "Carlos Mendoza Pérez",
    nit: "1234567890",
    date: "2024-01-29",
    amount: 350000,
    status: "validated",
    ripsGenerated: true,
    cufe: "a1b2c3d4e5f6..."
  },
  {
    id: "2",
    number: "FEV-001235",
    patientName: "Ana Lucía Torres García",
    nit: "0987654321",
    date: "2024-01-28",
    amount: 520000,
    status: "sent",
    ripsGenerated: true,
  },
  {
    id: "3",
    number: "FEV-001236",
    patientName: "Roberto Jiménez Silva",
    nit: "1122334455",
    date: "2024-01-28",
    amount: 180000,
    status: "pending",
    ripsGenerated: false,
  },
  {
    id: "4",
    number: "FEV-001237",
    patientName: "María Fernanda Ruiz",
    nit: "5544332211",
    date: "2024-01-27",
    amount: 750000,
    status: "rejected",
    ripsGenerated: true,
  },
  {
    id: "5",
    number: "FEV-001238",
    patientName: "José García López",
    nit: "6677889900",
    date: "2024-01-29",
    amount: 420000,
    status: "draft",
    ripsGenerated: false,
  },
];

const statusConfig = {
  draft: { label: "Borrador", className: "bg-muted text-muted-foreground", icon: FileText },
  pending: { label: "Pendiente", className: "bg-warning/10 text-warning border border-warning/20", icon: Clock },
  sent: { label: "Enviada DIAN", className: "bg-primary/10 text-primary border border-primary/20", icon: Send },
  validated: { label: "Validada", className: "bg-success/10 text-success border border-success/20", icon: CheckCircle2 },
  rejected: { label: "Rechazada", className: "bg-destructive/10 text-destructive border border-destructive/20", icon: AlertCircle },
};

const Facturacion = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Facturación Electrónica
            </h1>
            <p className="text-muted-foreground mt-1">
              Resolución 2275/2023 · FEV-RIPS · Integración DIAN
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <FileJson className="w-4 h-4 mr-2" />
              Generar RIPS
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {/* Compliance Banner */}
        <div className="rounded-xl p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-success/10 border border-primary/20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Proveedor Tecnológico Autorizado DIAN</p>
                <p className="text-sm text-muted-foreground">Resolución de habilitación vigente</p>
              </div>
            </div>
            <div className="flex items-center gap-6 lg:ml-auto">
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-success">98%</p>
                <p className="text-xs text-muted-foreground">Tasa validación</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-primary">1,234</p>
                <p className="text-xs text-muted-foreground">Facturas este mes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-foreground">48</p>
                <p className="text-xs text-muted-foreground">RIPS generados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="invoices" className="gap-2">
                <FileText className="w-4 h-4" />
                Facturas
              </TabsTrigger>
              <TabsTrigger value="rips" className="gap-2">
                <FileJson className="w-4 h-4" />
                RIPS
              </TabsTrigger>
              <TabsTrigger value="dian" className="gap-2">
                <Building2 className="w-4 h-4" />
                Estado DIAN
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar factura..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="invoices" className="mt-6">
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Número</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Paciente</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">NIT/CC</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">RIPS</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => {
                      const StatusIcon = statusConfig[invoice.status].icon;
                      return (
                        <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-mono font-medium text-foreground">{invoice.number}</p>
                            {invoice.cufe && (
                              <p className="text-xs text-muted-foreground font-mono">CUFE: {invoice.cufe}</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">{invoice.patientName}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-mono text-muted-foreground">{invoice.nit}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-muted-foreground">
                              {new Date(invoice.date).toLocaleDateString('es-CO')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-semibold text-foreground">{formatCurrency(invoice.amount)}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {invoice.ripsGenerated ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Generado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                Pendiente
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className={cn("gap-1", statusConfig[invoice.status].className)}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[invoice.status].label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="w-8 h-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8">
                                <Printer className="w-4 h-4" />
                              </Button>
                              {invoice.status === "draft" && (
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-primary">
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rips" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RIPS Generator */}
              <div className="card-elevated p-6">
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                  Generador RIPS JSON
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Genera archivos RIPS en formato JSON según Resolución 2275/2023 para reporte al Ministerio de Salud.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">Período a reportar</span>
                      <span className="text-sm text-muted-foreground">Enero 2024</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">Atenciones</span>
                      <span className="text-sm text-foreground">127 registros</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Procedimientos</span>
                      <span className="text-sm text-foreground">185 registros</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                      <FileJson className="w-4 h-4 mr-2" />
                      Generar RIPS
                    </Button>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Subir a MinSalud
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent RIPS Files */}
              <div className="card-elevated p-6">
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                  Archivos RIPS Recientes
                </h3>
                <div className="space-y-3">
                  {[
                    { period: "Enero 2024", date: "2024-01-30", status: "Enviado", records: 312 },
                    { period: "Diciembre 2023", date: "2024-01-05", status: "Aceptado", records: 298 },
                    { period: "Noviembre 2023", date: "2023-12-05", status: "Aceptado", records: 275 },
                  ].map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileJson className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{file.period}</p>
                          <p className="text-xs text-muted-foreground">{file.records} registros · {file.date}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(
                        file.status === "Aceptado" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      )}>
                        {file.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dian" className="mt-6">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Estado de Conexión DIAN
                </h3>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar conexión
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
                  <p className="font-semibold text-success">Conectado</p>
                  <p className="text-sm text-muted-foreground">API DIAN</p>
                </div>
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
                  <p className="font-semibold text-success">Habilitado</p>
                  <p className="text-sm text-muted-foreground">Facturación electrónica</p>
                </div>
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
                  <p className="font-semibold text-success">Vigente</p>
                  <p className="text-sm text-muted-foreground">Certificado digital</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium text-foreground mb-3">Información del contribuyente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Razón Social</p>
                    <p className="font-medium text-foreground">Consultorio Odontológico La 92 S.A.S</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NIT</p>
                    <p className="font-medium text-foreground">901.234.567-8</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Resolución de facturación</p>
                    <p className="font-medium text-foreground">18764000001234</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rango autorizado</p>
                    <p className="font-medium text-foreground">FEV-001 a FEV-999999</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Facturacion;
