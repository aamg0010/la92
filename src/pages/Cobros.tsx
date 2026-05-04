import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Plus,
  Search,
  CreditCard,
  Wallet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Filter,
  Download,
  Send,
  Phone,
  Mail,
  ChevronRight,
  Banknote,
  PiggyBank,
  Receipt,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePatientDebt, usePayments, useFinancingPlans, usePaymentStats, useDebtStats } from "@/hooks/usePayments";
import { usePaymentPlans, useOverdueInstallments } from "@/hooks/usePaymentPlans";
import { PaymentPlansList, CreatePaymentPlanDialog, RegisterPaymentDialog } from "@/components/cobros";
import { PaymentReceipt } from "@/components/cobros/PaymentReceipt";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Payment } from "@/hooks/usePayments";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig = {
  current: { label: "Al día", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  overdue: { label: "Vencido", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
  plan: { label: "Plan de pago", className: "bg-primary/10 text-primary border-primary/20", icon: Calendar },
};

const Cobros = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("cartera");
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [showRegisterPaymentDialog, setShowRegisterPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientDebt, setSelectedPatientDebt] = useState<number>(0);

  const { data: patientDebts = [], isLoading: loadingCartera } = usePatientDebt();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: financingPlans = [] } = useFinancingPlans();
  const { data: paymentPlans = [] } = usePaymentPlans();
  const { data: overdueInstallments = [] } = useOverdueInstallments();
  const { data: stats } = usePaymentStats();
  const { data: debtStats } = useDebtStats();
  const { formatMoney } = useCurrency();

  // Alias for compatibility
  const formatCurrency = formatMoney;

  const totalDebt = debtStats?.totalDebt ?? 0;
  const overdueDebt = debtStats?.overdueDebt ?? 0;
  const inPlanDebt = debtStats?.inPlanDebt ?? 0;
  const todayPayments = stats?.todayTotal ?? 0;

  const filteredDebts = patientDebts.filter(d =>
    d.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentPayments = payments.slice(0, 5);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Gestión de Cobros
            </h1>
            <p className="text-muted-foreground mt-1">
              Cartera, financiamiento y planes de pago
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowRegisterPaymentDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pago
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cartera Total</p>
                <p className="mt-2 text-2xl font-display font-bold text-foreground">
                  {formatCurrency(totalDebt)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {patientDebts.filter(d => d.totalDebt > d.paidAmount).length} pacientes
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="stat-card before:!bg-destructive">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cartera Vencida</p>
                <p className="mt-2 text-2xl font-display font-bold text-destructive">
                  {formatCurrency(overdueDebt)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {patientDebts.filter(d => d.status === "overdue").length} pacientes
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </div>

          <div className="stat-card before:!bg-accent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Plan de Pago</p>
                <p className="mt-2 text-2xl font-display font-bold text-foreground">
                  {formatCurrency(inPlanDebt)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {paymentPlans.filter(p => p.status === "active").length} planes activos
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="stat-card before:!bg-success">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recaudado Hoy</p>
                <p className="mt-2 text-2xl font-display font-bold text-success">
                  {formatCurrency(todayPayments)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats?.todayCount ?? 0} pagos
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Cartera List */}
          <div className="xl:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="cartera">Cartera</TabsTrigger>
                  <TabsTrigger value="planes">Planes de Pago</TabsTrigger>
                  <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
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

              <TabsContent value="cartera" className="mt-0">
                {loadingCartera ? (
                  <div className="card-elevated flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="card-elevated divide-y divide-border">
                    {filteredDebts.length === 0 ? (
                      <p className="text-center py-12 text-muted-foreground">No hay deudas pendientes</p>
                    ) : (
                      filteredDebts.map((debt) => {
                        const isPaid = debt.totalDebt <= debt.paidAmount;
                        const status = isPaid ? "current" : debt.status;
                        const StatusIcon = statusConfig[status].icon;
                        const progress = ((debt.paidAmount / debt.totalDebt) * 100);
                        const remaining = debt.totalDebt - debt.paidAmount;

                        return (
                          <div key={debt.patientId} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-secondary text-secondary-foreground">
                                  {debt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-foreground">{debt.patientName}</p>
                                    <p className="text-sm text-muted-foreground">{debt.phone}</p>
                                  </div>
                                  <Badge variant="outline" className={cn("shrink-0", statusConfig[status].className)}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig[status].label}
                                  </Badge>
                                </div>

                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progreso de pago</span>
                                    <span className="font-medium text-foreground">
                                      {formatCurrency(debt.paidAmount)} / {formatCurrency(debt.totalDebt)}
                                    </span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                  
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {debt.dueDate ? `Vence: ${format(new Date(debt.dueDate), "dd/MM/yyyy", { locale: es })}` : "Sin vencimiento"}
                                    </span>
                                    <span className={cn(
                                      "font-semibold",
                                      remaining > 0 ? "text-destructive" : "text-success"
                                    )}>
                                      {remaining > 0 ? `Debe: ${formatCurrency(remaining)}` : "Pagado"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPatientId(debt.patientId);
                                      setShowRegisterPaymentDialog(true);
                                    }}
                                  >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Registrar Pago
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPatientId(debt.patientId);
                                      setSelectedPatientDebt(remaining);
                                      setShowCreatePlanDialog(true);
                                    }}
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Plan de Pago
                                  </Button>
                                  <Button variant="ghost" size="icon" className="ml-auto w-8 h-8">
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8">
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="planes" className="mt-0">
                <PaymentPlansList onCreatePlan={() => setShowCreatePlanDialog(true)} />
              </TabsContent>

              <TabsContent value="vencidos" className="mt-0">
                <div className="card-elevated divide-y divide-border">
                  {patientDebts.filter(d => d.status === "overdue").length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">No hay deudas vencidas</p>
                  ) : (
                    patientDebts.filter(d => d.status === "overdue").map((debt) => (
                      <div key={debt.patientId} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                              {debt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{debt.patientName}</p>
                            <p className="text-sm text-destructive">
                              Venció: {debt.dueDate ? format(new Date(debt.dueDate), "dd/MM/yyyy", { locale: es }) : "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-destructive">{formatCurrency(debt.totalDebt - debt.paidAmount)}</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                            <Send className="w-4 h-4 mr-2" />
                            Recordatorio
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-elevated p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4"
                  onClick={() => setActiveTab("cartera")}
                >
                  <Banknote className="w-5 h-5 mb-2 text-success" />
                  <span className="text-xs">Recibir Pago</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4"
                  onClick={() => setShowCreatePlanDialog(true)}
                >
                  <Calendar className="w-5 h-5 mb-2 text-primary" />
                  <span className="text-xs">Nuevo Plan</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4"
                  onClick={() => setActiveTab("vencidos")}
                >
                  <Send className="w-5 h-5 mb-2 text-accent" />
                  <span className="text-xs">Recordatorios</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4"
                  onClick={() => setActiveTab("cartera")}
                >
                  <Receipt className="w-5 h-5 mb-2 text-muted-foreground" />
                  <span className="text-xs">Ver Historial</span>
                </Button>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="card-elevated p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Pagos Recientes
              </h3>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay pagos recientes</p>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-success" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {payment.patient?.first_name} {payment.patient?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.payment_date), "dd MMM", { locale: es })} · {payment.payment_method}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground/70 truncate max-w-[150px]" title={payment.notes}>
                              {payment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-success">{formatCurrency(Number(payment.amount))}</span>
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Payment Plan Dialog */}
      <CreatePaymentPlanDialog
        open={showCreatePlanDialog}
        onOpenChange={(open) => {
          setShowCreatePlanDialog(open);
          if (!open) {
            setSelectedPatientId(null);
            setSelectedPatientDebt(0);
          }
        }}
        preselectedPatientId={selectedPatientId || undefined}
        preselectedAmount={selectedPatientDebt || undefined}
      />

      {/* Register Payment Dialog */}
      <RegisterPaymentDialog
        open={showRegisterPaymentDialog}
        onOpenChange={(open) => {
          setShowRegisterPaymentDialog(open);
          if (!open) setSelectedPatientId(null);
        }}
        initialPatientId={selectedPatientId || undefined}
      />

      {/* Payment Receipt Dialog - detalle al hacer click en pagos recientes.
          Muestra recibo completo, paciente, factura asociada y notas/concepto. */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Detalle del Pago
            </DialogTitle>
            <DialogDescription>
              Recibo, concepto y factura asociada
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <PaymentReceipt
                payment={{
                  id: selectedPayment.id,
                  amount: Number(selectedPayment.amount),
                  payment_method: selectedPayment.payment_method,
                  payment_date: selectedPayment.payment_date,
                  reference_number: selectedPayment.reference_number || undefined,
                  notes: selectedPayment.notes || undefined,
                }}
                patient={selectedPayment.patient ? {
                  first_name: selectedPayment.patient.first_name,
                  last_name: selectedPayment.patient.last_name,
                  document_number: "",
                  phone: selectedPayment.patient.phone,
                } : undefined}
                invoice={selectedPayment.invoice ? {
                  invoice_number: selectedPayment.invoice.invoice_number,
                  total: Number(selectedPayment.invoice.total),
                  // issue_date viene del embed (usePayments lo solicita).
                  // Si por alguna razon no llega, caemos a payment_date.
                  issue_date: selectedPayment.invoice.issue_date ?? selectedPayment.payment_date,
                } : undefined}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedPayment(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Cobros;
