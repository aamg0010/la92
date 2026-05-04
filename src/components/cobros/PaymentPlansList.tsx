import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign,
  Filter,
  Loader2,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { usePaymentPlans, PaymentPlan, Installment, INSTALLMENT_STATUSES, useCancelPaymentPlan } from "@/hooks/usePaymentPlans";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InstallmentPaymentDialog } from "./InstallmentPaymentDialog";

interface PaymentPlansListProps {
  onCreatePlan?: () => void;
}

const planStatusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  active: {
    label: "Activo",
    icon: Clock,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  completed: {
    label: "Completado",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  defaulted: {
    label: "En Mora",
    icon: AlertCircle,
    className: "bg-red-100 text-red-800 border-red-200",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

export function PaymentPlansList({ onCreatePlan }: PaymentPlansListProps) {
  const { formatMoney } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [payingInstallment, setPayingInstallment] = useState<Installment | null>(null);
  const [payingPlan, setPayingPlan] = useState<PaymentPlan | null>(null);

  const { data: plans = [], isLoading } = usePaymentPlans(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const cancelPlan = useCancelPaymentPlan();

  // Filter plans by search
  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const patientName = `${plan.patient?.first_name || ""} ${plan.patient?.last_name || ""}`.toLowerCase();
    return patientName.includes(search);
  });

  const handlePayInstallment = (installment: Installment, plan: PaymentPlan) => {
    setPayingInstallment(installment);
    setPayingPlan(plan);
  };

  const getInstallmentStatusBadge = (status: Installment["status"]) => {
    const config = INSTALLMENT_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={cn("text-xs", config?.color)}>
        {config?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="card-elevated flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="defaulted">En Mora</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        {onCreatePlan && (
          <Button onClick={onCreatePlan} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Plan
          </Button>
        )}
      </div>

      {/* Plans List */}
      <div className="card-elevated divide-y divide-border">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No se encontraron planes con los filtros aplicados"
                : "No hay planes de pago registrados"}
            </p>
            {onCreatePlan && (
              <Button variant="outline" className="mt-4" onClick={onCreatePlan}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer plan
              </Button>
            )}
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const StatusIcon = planStatusConfig[plan.status]?.icon || Clock;
            const paidInstallments = plan.installment_list?.filter((i) => i.status === "paid").length || 0;
            const totalInstallments = plan.installment_list?.length || plan.installments;
            const progress = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;
            const isExpanded = expandedPlanId === plan.id;

            return (
              <Collapsible
                key={plan.id}
                open={isExpanded}
                onOpenChange={(open) => setExpandedPlanId(open ? plan.id : null)}
              >
                <div className="p-4">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {plan.patient?.first_name?.[0]}
                          {plan.patient?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">
                              {plan.patient?.first_name} {plan.patient?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {plan.installments} cuotas de {formatMoney(Number(plan.installment_amount))}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("shrink-0", planStatusConfig[plan.status]?.className)}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {planStatusConfig[plan.status]?.label}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progreso: {paidInstallments} / {totalInstallments} cuotas
                            </span>
                            <span className="font-medium text-foreground">
                              {formatMoney(Number(plan.total_amount) - Number(plan.remaining_amount))} /{" "}
                              {formatMoney(Number(plan.total_amount))}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Inicio: {format(new Date(plan.start_date), "dd/MM/yyyy", { locale: es })}
                            </span>
                            <span
                              className={cn(
                                "font-semibold",
                                Number(plan.remaining_amount) > 0 ? "text-orange-600" : "text-green-600"
                              )}
                            >
                              Pendiente: {formatMoney(Number(plan.remaining_amount))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <Separator className="my-4" />

                    {/* Plan Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Original</p>
                          <p className="font-medium">{formatMoney(Number(plan.total_amount))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Enganche</p>
                          <p className="font-medium">{formatMoney(Number(plan.down_payment || 0))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interes</p>
                          <p className="font-medium">{plan.interest_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Modo</p>
                          <p className="font-medium">
                            {plan.payment_mode === "fixed_date"
                              ? `Dia ${plan.day_of_month}`
                              : "Flexible"}
                          </p>
                        </div>
                      </div>

                      {/* Installments Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 text-sm font-medium grid grid-cols-12 gap-2">
                          <span className="col-span-1">#</span>
                          <span className="col-span-2">Monto</span>
                          <span className="col-span-3">Vencimiento</span>
                          <span className="col-span-2">Pagado</span>
                          <span className="col-span-2">Estado</span>
                          <span className="col-span-2 text-right">Accion</span>
                        </div>
                        <div className="divide-y max-h-64 overflow-y-auto">
                          {plan.installment_list?.map((installment) => {
                            const remaining = Number(installment.amount) - Number(installment.paid_amount);
                            const canPay = installment.status !== "paid" && plan.status === "active";

                            return (
                              <div
                                key={installment.id}
                                className={cn(
                                  "px-4 py-3 grid grid-cols-12 gap-2 items-center text-sm",
                                  installment.status === "paid" && "bg-green-50/50",
                                  installment.status === "overdue" && "bg-red-50/50"
                                )}
                              >
                                <span className="col-span-1 font-medium">
                                  {installment.installment_number}
                                </span>
                                <span className="col-span-2">{formatMoney(Number(installment.amount))}</span>
                                <span className="col-span-3 text-muted-foreground">
                                  {installment.due_date
                                    ? format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })
                                    : "Sin fecha"}
                                </span>
                                <span className="col-span-2">
                                  {Number(installment.paid_amount) > 0 ? (
                                    <span className="text-green-600 font-medium">
                                      {formatMoney(Number(installment.paid_amount))}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </span>
                                <span className="col-span-2">{getInstallmentStatusBadge(installment.status)}</span>
                                <span className="col-span-2 text-right">
                                  {canPay && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePayInstallment(installment, plan);
                                      }}
                                    >
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      Pagar
                                    </Button>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Plan Actions */}
                      {plan.status === "active" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Cancelar este plan de pago? Esta accion no se puede deshacer.")) {
                                cancelPlan.mutate(plan.id);
                              }
                            }}
                            disabled={cancelPlan.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar Plan
                          </Button>
                        </div>
                      )}

                      {/* Notes */}
                      {plan.notes && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Notas:</p>
                          <p className="text-foreground">{plan.notes}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Payment Dialog */}
      {payingInstallment && payingPlan && (
        <InstallmentPaymentDialog
          open={!!payingInstallment}
          onOpenChange={(open) => {
            if (!open) {
              setPayingInstallment(null);
              setPayingPlan(null);
            }
          }}
          installment={payingInstallment}
          plan={payingPlan}
        />
      )}
    </div>
  );
}

export default PaymentPlansList;
