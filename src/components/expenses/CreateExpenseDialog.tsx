/**
 * CreateExpenseDialog.tsx
 * Formulario para crear/editar egresos
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useCreateExpense,
  useUpdateExpense,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  BENEFICIARY_TYPES,
  RECURRENCE_PERIODS,
  type Expense,
  type ExpenseCategory,
  type PaymentMethod,
  type BeneficiaryType,
  type RecurrencePeriod,
  type CreateExpenseData,
} from "@/hooks/useExpenses";
import { useDoctorsForSettlement } from "@/hooks/useSettlements";

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  expense,
}: CreateExpenseDialogProps) {
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { data: doctors = [] } = useDoctorsForSettlement();
  const isEditing = !!expense;

  // Form state
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [subcategory, setSubcategory] = useState("");
  const [beneficiarySelection, setBeneficiarySelection] = useState<string>(""); // "consultorio", "doctor:id", "otro"
  const [customBeneficiary, setCustomBeneficiary] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType | "">("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<RecurrencePeriod | "">("");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens/closes or expense changes
  useEffect(() => {
    if (open) {
      if (expense) {
        setExpenseDate(new Date(expense.expense_date));
        setCategory(expense.category);
        setSubcategory(expense.subcategory || "");
        setDescription(expense.description);
        setAmount(expense.amount);
        setPaymentMethod(expense.payment_method);
        setReferenceNumber(expense.reference_number || "");
        setBeneficiaryName(expense.beneficiary_name || "");
        setBeneficiaryType(expense.beneficiary_type || "");
        setIsRecurring(expense.is_recurring);
        setRecurrencePeriod(expense.recurrence_period || "");
        setNotes(expense.notes || "");
      } else {
        resetForm();
      }
    }
  }, [open, expense]);

  const resetForm = () => {
    setExpenseDate(new Date());
    setCategory("other");
    setSubcategory("");
    setDescription("");
    setAmount(0);
    setPaymentMethod("cash");
    setReferenceNumber("");
    setBeneficiaryName("");
    setBeneficiaryType("");
    setBeneficiarySelection("");
    setCustomBeneficiary("");
    setIsRecurring(false);
    setRecurrencePeriod("");
    setNotes("");
  };

  // Get actual beneficiary name based on selection
  const getActualBeneficiaryName = () => {
    if (beneficiarySelection === "consultorio") {
      return "Consultorio La 92";
    }
    if (beneficiarySelection.startsWith("doctor:")) {
      const doctorId = beneficiarySelection.replace("doctor:", "");
      const doctor = doctors.find(d => d.user_id === doctorId);
      return doctor?.full_name || "";
    }
    if (beneficiarySelection === "otro") {
      return customBeneficiary;
    }
    return beneficiaryName; // fallback to old field
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || amount <= 0) {
      return;
    }

    const actualBeneficiaryName = getActualBeneficiaryName();

    const data: CreateExpenseData = {
      expense_date: format(expenseDate, "yyyy-MM-dd"),
      category,
      description: description.trim(),
      amount,
      payment_method: paymentMethod,
      ...(subcategory && { subcategory }),
      ...(referenceNumber && { reference_number: referenceNumber }),
      ...(actualBeneficiaryName && { beneficiary_name: actualBeneficiaryName }),
      ...(beneficiaryType && beneficiaryType !== "none" && { beneficiary_type: beneficiaryType as BeneficiaryType }),
      is_recurring: isRecurring,
      ...(isRecurring && recurrencePeriod && { recurrence_period: recurrencePeriod as RecurrencePeriod }),
      ...(notes && { notes }),
    };

    try {
      if (isEditing && expense) {
        await updateExpense.mutateAsync({ id: expense.id, data });
      } else {
        await createExpense.mutateAsync(data);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isLoading = createExpense.isPending || updateExpense.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Egreso" : "Nuevo Egreso"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Fecha y Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expenseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expenseDate ? (
                      format(expenseDate, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expenseDate}
                    onSelect={(date) => date && setExpenseDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Descripcion */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Pago de energia electrica marzo 2024"
              required
            />
          </div>

          {/* Row 3: Monto y Metodo de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <MoneyInput
                id="amount"
                value={amount}
                onChange={setAmount}
                currency="COP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Metodo de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar metodo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Beneficiario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Beneficiario</Label>
              <Select
                value={beneficiarySelection}
                onValueChange={(v) => {
                  setBeneficiarySelection(v);
                  // Auto-set beneficiary type based on selection
                  if (v === "consultorio") {
                    setBeneficiaryType("clinic");
                  } else if (v.startsWith("doctor:")) {
                    setBeneficiaryType("doctor");
                  } else if (v === "otro") {
                    setBeneficiaryType("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar beneficiario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultorio">Consultorio La 92</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.user_id} value={`doctor:${doctor.user_id}`}>
                      Dr. {doctor.full_name}
                    </SelectItem>
                  ))}
                  <SelectItem value="otro">Otro...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {beneficiarySelection === "otro" && (
              <div className="space-y-2">
                <Label htmlFor="customBeneficiary">Nombre del Beneficiario</Label>
                <Input
                  id="customBeneficiary"
                  value={customBeneficiary}
                  onChange={(e) => setCustomBeneficiary(e.target.value)}
                  placeholder="Nombre del beneficiario"
                />
              </div>
            )}

            {beneficiarySelection !== "otro" && (
              <div className="space-y-2">
                <Label>Tipo de Beneficiario</Label>
                <Select
                  value={beneficiaryType}
                  onValueChange={(v) => setBeneficiaryType(v as BeneficiaryType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    {Object.entries(BENEFICIARY_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Row 5: Referencia y Subcategoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">No. Factura/Recibo</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Numero de referencia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria</Label>
              <Input
                id="subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Subcategoria opcional"
              />
            </div>
          </div>

          {/* Row 6: Recurrente */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="isRecurring">Gasto recurrente</Label>
            </div>

            {isRecurring && (
              <div className="space-y-2 pl-6">
                <Label>Periodo de recurrencia</Label>
                <Select
                  value={recurrencePeriod}
                  onValueChange={(v) => setRecurrencePeriod(v as RecurrencePeriod)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRENCE_PERIODS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Row 7: Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones o detalles adicionales..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Registrar Egreso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
