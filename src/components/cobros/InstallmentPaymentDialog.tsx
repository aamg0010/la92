import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Building,
  Loader2,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { usePayInstallment, Installment, PaymentPlan, INSTALLMENT_STATUSES } from "@/hooks/usePaymentPlans";
import { PAYMENT_METHODS } from "@/hooks/usePayments";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InstallmentPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment: Installment;
  plan: PaymentPlan;
}

const paymentMethodIcons: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Building,
  check: DollarSign,
  other: DollarSign,
};

export function InstallmentPaymentDialog({
  open,
  onOpenChange,
  installment,
  plan,
}: InstallmentPaymentDialogProps) {
  const { formatMoney } = useCurrency();
  const payInstallment = usePayInstallment();

  const remaining = Number(installment.amount) - Number(installment.paid_amount);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) return;

    await payInstallment.mutateAsync({
      installment_id: installment.id,
      amount: payAmount,
      payment_method: paymentMethod,
      notes: notes || undefined,
    });

    // Reset and close
    setAmount(remaining.toFixed(2));
    setPaymentMethod("cash");
    setNotes("");
    onOpenChange(false);
  };

  const payAmount = parseFloat(amount) || 0;
  const newPaidAmount = Number(installment.paid_amount) + payAmount;
  const newRemaining = Number(installment.amount) - newPaidAmount;
  const willBeFullyPaid = newRemaining <= 0;

  const statusConfig = INSTALLMENT_STATUSES.find((s) => s.value === installment.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Registrar Pago de Cuota
          </DialogTitle>
          <DialogDescription>
            Cuota #{installment.installment_number} del plan de pago
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info del paciente y plan */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {plan.patient?.first_name} {plan.patient?.last_name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cuota</p>
                <p className="font-medium">
                  #{installment.installment_number} de {plan.installments}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <Badge variant="outline" className={cn("text-xs", statusConfig?.color)}>
                  {statusConfig?.label}
                </Badge>
              </div>
            </div>

            {installment.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Vencimiento:</span>
                <span
                  className={cn(
                    "font-medium",
                    new Date(installment.due_date) < new Date() && installment.status !== "paid"
                      ? "text-destructive"
                      : "text-foreground"
                  )}
                >
                  {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })}
                </span>
                {new Date(installment.due_date) < new Date() && installment.status !== "paid" && (
                  <Badge variant="destructive" className="text-xs">
                    Vencida
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Detalle de montos */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor de la cuota:</span>
              <span className="font-medium">{formatMoney(Number(installment.amount))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ya pagado:</span>
              <span className="font-medium text-green-600">
                {formatMoney(Number(installment.paid_amount))}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Pendiente:</span>
              <span className="text-orange-600">{formatMoney(remaining)}</span>
            </div>
          </div>

          <Separator />

          {/* Formulario de pago */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto a Pagar</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  max={remaining}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(remaining.toFixed(2))}
                >
                  Pago total
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((remaining / 2).toFixed(2))}
                >
                  50%
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Metodo de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = paymentMethodIcons[method.value] || DollarSign;
                    return (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {method.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Referencia de pago, observaciones..."
                rows={2}
              />
            </div>
          </div>

          {/* Preview resultado */}
          {payAmount > 0 && (
            <div
              className={cn(
                "rounded-lg p-4 border",
                willBeFullyPaid ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {willBeFullyPaid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    willBeFullyPaid ? "text-green-800" : "text-blue-800"
                  )}
                >
                  {willBeFullyPaid ? "Cuota quedara pagada" : "Pago parcial"}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={willBeFullyPaid ? "text-green-700" : "text-blue-700"}>
                    Total pagado despues:
                  </span>
                  <span className="font-medium">{formatMoney(newPaidAmount)}</span>
                </div>
                {!willBeFullyPaid && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Quedara pendiente:</span>
                    <span className="font-medium">{formatMoney(newRemaining)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={payInstallment.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={payAmount <= 0 || payInstallment.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {payInstallment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default InstallmentPaymentDialog;
