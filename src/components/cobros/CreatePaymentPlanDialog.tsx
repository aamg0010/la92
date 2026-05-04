import { useState, useMemo, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Hash,
  Loader2,
  User,
  CalendarDays,
  Info,
} from "lucide-react";
import { usePatients, Patient } from "@/hooks/usePatients";
import { useCreatePaymentPlan, generateInstallmentPreview, PAYMENT_MODES } from "@/hooks/usePaymentPlans";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CreatePaymentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
  preselectedAmount?: number;
}

export function CreatePaymentPlanDialog({
  open,
  onOpenChange,
  preselectedPatientId,
  preselectedAmount,
}: CreatePaymentPlanDialogProps) {
  const { formatMoney } = useCurrency();
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const createPlan = useCreatePaymentPlan();

  // Form state
  const [patientId, setPatientId] = useState(preselectedPatientId || "");
  const [totalAmount, setTotalAmount] = useState(preselectedAmount?.toString() || "");

  // Sync with preselected values when dialog opens
  useEffect(() => {
    if (open) {
      if (preselectedPatientId) setPatientId(preselectedPatientId);
      if (preselectedAmount) setTotalAmount(preselectedAmount.toString());
    }
  }, [open, preselectedPatientId, preselectedAmount]);
  const [downPayment, setDownPayment] = useState("0");
  const [numInstallments, setNumInstallments] = useState("3");
  const [paymentMode, setPaymentMode] = useState<"fixed_date" | "flexible">("flexible");
  const [dayOfMonth, setDayOfMonth] = useState("15");
  const [interestRate, setInterestRate] = useState("0");
  const [notes, setNotes] = useState("");

  // Calculate preview
  const preview = useMemo(() => {
    const total = parseFloat(totalAmount) || 0;
    const down = parseFloat(downPayment) || 0;
    const installments = parseInt(numInstallments) || 1;
    const interest = parseFloat(interestRate) || 0;
    const day = parseInt(dayOfMonth) || 15;

    if (total <= 0 || down >= total || installments < 1) {
      return null;
    }

    return generateInstallmentPreview(
      total,
      down,
      installments,
      paymentMode,
      paymentMode === "fixed_date" ? day : null,
      interest
    );
  }, [totalAmount, downPayment, numInstallments, paymentMode, dayOfMonth, interestRate]);

  // Calculated values
  const total = parseFloat(totalAmount) || 0;
  const down = parseFloat(downPayment) || 0;
  const interest = parseFloat(interestRate) || 0;
  const amountToFinance = total - down;
  const interestAmount = amountToFinance * (interest / 100);
  const totalWithInterest = amountToFinance + interestAmount;

  const selectedPatient = patients.find((p) => p.id === patientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || total <= 0) return;

    await createPlan.mutateAsync({
      patient_id: patientId,
      total_amount: total,
      down_payment: down,
      num_installments: parseInt(numInstallments) || 1,
      payment_mode: paymentMode,
      day_of_month: paymentMode === "fixed_date" ? parseInt(dayOfMonth) : null,
      interest_rate: interest,
      notes: notes || undefined,
    });

    // Reset form
    setPatientId(preselectedPatientId || "");
    setTotalAmount(preselectedAmount?.toString() || "");
    setDownPayment("0");
    setNumInstallments("3");
    setPaymentMode("flexible");
    setDayOfMonth("15");
    setInterestRate("0");
    setNotes("");

    onOpenChange(false);
  };

  const isValid = patientId && total > 0 && down < total && parseInt(numInstallments) >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Crear Plan de Pago
          </DialogTitle>
          <DialogDescription>
            Configure un plan de financiamiento con cuotas para el paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Paciente */}
              <div className="space-y-2">
                <Label htmlFor="patient" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Paciente
                </Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Seleccionar paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPatients ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name} - {patient.document_number}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedPatient && (
                  <p className="text-sm text-muted-foreground">
                    Tel: {selectedPatient.phone || "N/A"} | Email: {selectedPatient.email || "N/A"}
                  </p>
                )}
              </div>

              <Separator />

              {/* Montos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor Total
                  </Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="downPayment" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Enganche / Inicial
                  </Label>
                  <Input
                    id="downPayment"
                    type="number"
                    min="0"
                    step="0.01"
                    max={total}
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numInstallments" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Numero de Cuotas
                  </Label>
                  <Select value={numInstallments} onValueChange={setNumInstallments}>
                    <SelectTrigger id="numInstallments">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {n === 1 ? "cuota" : "cuotas"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate" className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Interes (%)
                  </Label>
                  <Input
                    id="interestRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <Separator />

              {/* Modo de pago */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMode" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Modo de Pago
                  </Label>
                  <Select
                    value={paymentMode}
                    onValueChange={(v) => setPaymentMode(v as "fixed_date" | "flexible")}
                  >
                    <SelectTrigger id="paymentMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {paymentMode === "fixed_date" && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfMonth" className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Dia del Mes para Vencimiento
                    </Label>
                    <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                      <SelectTrigger id="dayOfMonth">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Se limita a dia 28 para evitar problemas con meses cortos
                    </p>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones del plan de pago..."
                  rows={2}
                />
              </div>

              <Separator />

              {/* Resumen y Preview */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Resumen del Plan
                </h4>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor total:</span>
                    <span className="font-medium">{formatMoney(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enganche:</span>
                    <span className="font-medium text-green-600">- {formatMoney(down)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">A financiar:</span>
                    <span className="font-medium">{formatMoney(amountToFinance)}</span>
                  </div>
                  {interest > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interes ({interest}%):</span>
                      <span className="font-medium text-orange-600">+ {formatMoney(interestAmount)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total a pagar en cuotas:</span>
                    <span className="text-primary">{formatMoney(totalWithInterest)}</span>
                  </div>
                </div>

                {/* Preview de cuotas */}
                {preview && preview.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">
                      Preview de Cuotas ({preview.length})
                    </h5>
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {preview.map((inst) => (
                        <div
                          key={inst.number}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 justify-center">
                              {inst.number}
                            </Badge>
                            <span className="font-medium">{formatMoney(inst.amount)}</span>
                          </div>
                          {inst.dueDate ? (
                            <span className="text-muted-foreground">
                              {format(new Date(inst.dueDate), "dd MMM yyyy", { locale: es })}
                            </span>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Sin fecha
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createPlan.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || createPlan.isPending}>
              {createPlan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Plan de Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePaymentPlanDialog;
