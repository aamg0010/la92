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
  RefreshCw,
  Eye,
  Printer,
  Filter,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoices, useInvoiceStats } from "@/hooks/useInvoices";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft: { label: "Borrador", className: "bg-muted text-muted-foreground", icon: FileText },
  pending: { label: "Pendiente", className: "bg-warning/10 text-warning border border-warning/20", icon: Clock },
  sent: { label: "Enviada DIAN", className: "bg-primary/10 text-primary border border-primary/20", icon: Send },
  validated: { label: "Validada", className: "bg-success/10 text-success border border-success/20", icon: CheckCircle2 },
  paid: { label: "Pagada", className: "bg-success/10 text-success border border-success/20", icon: CheckCircle2 },
  rejected: { label: "Rechazada", className: "bg-destructive/10 text-destructive border border-destructive/20", icon: AlertCircle },
  cancelled: { label: "Anulada", className: "bg-destructive/10 text-destructive border border-destructive/20", icon: AlertCircle },
};

const Facturacion = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");

  const { data: invoices = [], isLoading } = useInvoices();
  const { data: stats } = useInvoiceStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.patient?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.patient?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
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
                <p className="text-2xl font-display font-bold text-success">
                  {stats?.validationRate ?? 0}%
                </p>
                <p className="text-xs text-muted-foreground">Tasa validación</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-primary">
                  {stats?.totalCount ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Facturas este mes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {stats?.validatedCount ?? 0}
                </p>
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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
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
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-muted-foreground">
                            No hay facturas registradas
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => {
                          const status = statusConfig[invoice.status] || statusConfig.draft;
                          const StatusIcon = status.icon;
                          return (
                            <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-4">
                                <p className="font-mono font-medium text-foreground">{invoice.invoice_number}</p>
                                {invoice.cufe && (
                                  <p className="text-xs text-muted-foreground font-mono">CUFE: {invoice.cufe.slice(0, 12)}...</p>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-medium text-foreground">
                                  {invoice.patient?.first_name} {invoice.patient?.last_name}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-mono text-muted-foreground">
                                  {invoice.patient?.document_number || "-"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-muted-foreground">
                                  {format(new Date(invoice.issue_date), "dd/MM/yyyy", { locale: es })}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-semibold text-foreground">{formatCurrency(Number(invoice.total))}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                {invoice.rips_data ? (
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
                                <Badge variant="outline" className={cn("gap-1", status.className)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(), "MMMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">Facturas</span>
                      <span className="text-sm text-foreground">{stats?.totalCount ?? 0} registros</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                      <FileJson className="w-4 h-4 mr-2" />
                      Generar RIPS
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent RIPS Files */}
              <div className="card-elevated p-6">
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                  Archivos RIPS Recientes
                </h3>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay archivos RIPS generados aún
                </p>
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
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold text-muted-foreground">Pendiente</p>
                  <p className="text-sm text-muted-foreground">API DIAN</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold text-muted-foreground">Pendiente</p>
                  <p className="text-sm text-muted-foreground">Facturación electrónica</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold text-muted-foreground">Pendiente</p>
                  <p className="text-sm text-muted-foreground">Certificado digital</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium text-foreground mb-3">Información del contribuyente</h4>
                <p className="text-sm text-muted-foreground">
                  Configure los datos de la clínica en Configuración → Clínica para habilitar la facturación electrónica.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Facturacion;
