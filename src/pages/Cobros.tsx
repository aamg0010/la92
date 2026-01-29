import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
  Clock,
  TrendingUp,
  Filter,
  Download,
  Send,
  Phone,
  Mail,
  ChevronRight,
  Banknote,
  PiggyBank,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PatientDebt {
  id: string;
  patientName: string;
  patientAvatar?: string;
  phone: string;
  totalDebt: number;
  paidAmount: number;
  dueDate: string;
  status: "current" | "overdue" | "plan";
  installments?: number;
  nextPayment?: number;
}

const patientDebts: PatientDebt[] = [
  {
    id: "1",
    patientName: "Carlos Mendoza Pérez",
    patientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    phone: "+57 300 123 4567",
    totalDebt: 1500000,
    paidAmount: 500000,
    dueDate: "2024-02-15",
    status: "plan",
    installments: 3,
    nextPayment: 333333,
  },
  {
    id: "2",
    patientName: "Ana Lucía Torres García",
    patientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    phone: "+57 301 234 5678",
    totalDebt: 750000,
    paidAmount: 0,
    dueDate: "2024-02-01",
    status: "overdue",
  },
  {
    id: "3",
    patientName: "Roberto Jiménez Silva",
    patientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    phone: "+57 302 345 6789",
    totalDebt: 420000,
    paidAmount: 420000,
    dueDate: "2024-01-28",
    status: "current",
  },
  {
    id: "4",
    patientName: "María Fernanda Ruiz López",
    phone: "+57 303 456 7890",
    totalDebt: 2100000,
    paidAmount: 700000,
    dueDate: "2024-03-01",
    status: "plan",
    installments: 6,
    nextPayment: 233333,
  },
  {
    id: "5",
    patientName: "José García López",
    patientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    phone: "+57 304 567 8901",
    totalDebt: 350000,
    paidAmount: 0,
    dueDate: "2024-01-20",
    status: "overdue",
  },
];

const recentPayments = [
  { patient: "Carlos Mendoza", amount: 333333, date: "2024-01-29", method: "Transferencia" },
  { patient: "Laura Martínez", amount: 180000, date: "2024-01-29", method: "Efectivo" },
  { patient: "Roberto Jiménez", amount: 420000, date: "2024-01-28", method: "Tarjeta" },
  { patient: "Andrea López", amount: 250000, date: "2024-01-28", method: "Transferencia" },
];

const statusConfig = {
  current: { label: "Al día", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  overdue: { label: "Vencido", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
  plan: { label: "Plan de pago", className: "bg-primary/10 text-primary border-primary/20", icon: Calendar },
};

const Cobros = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("cartera");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalDebt = patientDebts.reduce((acc, p) => acc + (p.totalDebt - p.paidAmount), 0);
  const overdueDebt = patientDebts.filter(p => p.status === "overdue").reduce((acc, p) => acc + (p.totalDebt - p.paidAmount), 0);
  const inPlanDebt = patientDebts.filter(p => p.status === "plan").reduce((acc, p) => acc + (p.totalDebt - p.paidAmount), 0);

  const filteredDebts = patientDebts.filter(p =>
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Button className="bg-primary hover:bg-primary/90">
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
                  {patientDebts.filter(p => p.totalDebt > p.paidAmount).length} pacientes
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
                  {patientDebts.filter(p => p.status === "overdue").length} pacientes
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
                  {patientDebts.filter(p => p.status === "plan").length} pacientes
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
                  {formatCurrency(513333)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  2 pagos recibidos
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
                <div className="card-elevated divide-y divide-border">
                  {filteredDebts.map((debt) => {
                    const StatusIcon = statusConfig[debt.status].icon;
                    const progress = (debt.paidAmount / debt.totalDebt) * 100;
                    const remaining = debt.totalDebt - debt.paidAmount;

                    return (
                      <div key={debt.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={debt.patientAvatar} alt={debt.patientName} />
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
                              <Badge variant="outline" className={cn("shrink-0", statusConfig[debt.status].className)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[debt.status].label}
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
                                  {debt.status === "plan" 
                                    ? `${debt.installments} cuotas · Próxima: ${formatCurrency(debt.nextPayment || 0)}`
                                    : `Vence: ${new Date(debt.dueDate).toLocaleDateString('es-CO')}`
                                  }
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
                              <Button variant="outline" size="sm">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Registrar Pago
                              </Button>
                              <Button variant="ghost" size="sm">
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
                  })}
                </div>
              </TabsContent>

              <TabsContent value="planes" className="mt-0">
                <div className="card-elevated divide-y divide-border">
                  {filteredDebts.filter(d => d.status === "plan").map((debt) => (
                    <div key={debt.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={debt.patientAvatar} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                            {debt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{debt.patientName}</p>
                          <p className="text-sm text-muted-foreground">{debt.installments} cuotas de {formatCurrency(debt.nextPayment || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(debt.totalDebt - debt.paidAmount)}</p>
                          <p className="text-xs text-muted-foreground">restante</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="vencidos" className="mt-0">
                <div className="card-elevated divide-y divide-border">
                  {filteredDebts.filter(d => d.status === "overdue").map((debt) => (
                    <div key={debt.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={debt.patientAvatar} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                            {debt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{debt.patientName}</p>
                          <p className="text-sm text-destructive">
                            Venció: {new Date(debt.dueDate).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-destructive">{formatCurrency(debt.totalDebt)}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                          <Send className="w-4 h-4 mr-2" />
                          Recordatorio
                        </Button>
                      </div>
                    </div>
                  ))}
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
                <Button variant="outline" className="flex-col h-auto py-4">
                  <Banknote className="w-5 h-5 mb-2 text-success" />
                  <span className="text-xs">Recibir Pago</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-4">
                  <Calendar className="w-5 h-5 mb-2 text-primary" />
                  <span className="text-xs">Crear Plan</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-4">
                  <Send className="w-5 h-5 mb-2 text-accent" />
                  <span className="text-xs">Recordatorios</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-4">
                  <Receipt className="w-5 h-5 mb-2 text-muted-foreground" />
                  <span className="text-xs">Recibos</span>
                </Button>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="card-elevated p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Pagos Recientes
              </h3>
              <div className="space-y-3">
                {recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-foreground text-sm">{payment.patient}</p>
                      <p className="text-xs text-muted-foreground">{payment.method} · {payment.date}</p>
                    </div>
                    <span className="font-semibold text-success text-sm">
                      +{formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reminders */}
            <div className="card-elevated p-6 bg-gradient-to-br from-accent/5 to-transparent">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Recordatorios Automáticos
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Envía recordatorios por WhatsApp o SMS a pacientes con pagos pendientes.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>3 días antes del vencimiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>El día del vencimiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>3 días después (si no paga)</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Configurar recordatorios
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Cobros;
