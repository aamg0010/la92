/**
 * RegisterPaymentDialog.tsx
 * Diálogo para registrar un pago independiente (no de cuotas)
 */

import { useState, useEffect } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoneyInput } from "@/components/ui/money-input";
import {
  DollarSign,
  User,
  Loader2,
  CreditCard,
  Banknote,
  Building,
  ChevronsUpDown,
  Check,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from "@/hooks/usePatients";
import {
  useCreatePayment,
  usePatientPendingInvoices,
  PAYMENT_METHODS,
} from "@/hooks/usePayments";
import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";
import { PaymentReceiptDialog } from "./PaymentReceiptDialog";

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPatientId?: string;
}

const paymentMethodIcons: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Building,
  check: DollarSign,
  other: DollarSign,
};

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  initialPatientId,
}: RegisterPaymentDialogProps) {
  const { formatMoney } = useCurrency();
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const createPayment = useCreatePayment();

  const [patientId, setPatientId] = useState(initialPatientId || "");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Sync with initialPatientId when dialog opens
  useEffect(() => {
    if (open && initialPatientId) {
      setPatientId(initialPatientId);
    }
  }, [open, initialPatientId]);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Facturas pendientes del paciente seleccionado (para asociar el pago de
  // forma opcional). Si no hay paciente, el hook devuelve array vacío.
  const { data: pendingInvoices = [], isLoading: loadingInvoices } =
    usePatientPendingInvoices(patientId || null);
  const selectedInvoice = pendingInvoices.find((inv) => inv.id === invoiceId);

  // Receipt dialog state
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<{
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || amount <= 0) return;

    const paymentDate = format(new Date(), "yyyy-MM-dd");
    const paymentData = {
      patient_id: patientId,
      invoice_id: invoiceId || undefined,
      amount,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      reference_number: referenceNumber || undefined,
      notes: notes || undefined,
    };

    const result = await createPayment.mutateAsync(paymentData);

    // Store payment data for receipt
    setCreatedPayment({
      id: result.id,
      amount,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      reference_number: referenceNumber || undefined,
      notes: notes || undefined,
    });

    // Show receipt dialog
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCreatedPayment(null);
    // Reset form
    setPatientId("");
    setInvoiceId(null);
    setAmount(0);
    setPaymentMethod("cash");
    setReferenceNumber("");
    setNotes("");
    onOpenChange(false);
  };

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            Registrar un pago o abono de un paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paciente con búsqueda */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente
            </Label>
            <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !patientId && "text-muted-foreground"
                  )}
                >
                  {selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : "Buscar paciente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar por nombre o documento..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron pacientes</CommandEmpty>
                    <CommandGroup>
                      {loadingPatients ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        patients.map((patient) => (
                          <CommandItem
                            key={patient.id}
                            value={`${patient.first_name} ${patient.last_name} ${patient.document_number}`}
                            onSelect={() => {
                              // Al cambiar de paciente, reseteamos la factura
                              // asociada para evitar enviar una factura que
                              // pertenece a otro paciente.
                              if (patient.id !== patientId) {
                                setInvoiceId(null);
                              }
                              setPatientId(patient.id);
                              setPatientSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                patientId === patient.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{patient.first_name} {patient.last_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {patient.document_number} | {patient.phone || "Sin teléfono"}
                              </span>
                            </div>
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedPatient && (
              <p className="text-sm text-muted-foreground">
                Doc: {selectedPatient.document_number} | Tel: {selectedPatient.phone || "N/A"}
              </p>
            )}
          </div>

          {/* Asociar a factura (opcional) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Asociar a factura (opcional)
            </Label>
            <Popover open={invoiceSearchOpen} onOpenChange={setInvoiceSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={!patientId}
                  className={cn(
                    "w-full justify-between",
                    !invoiceId && "text-muted-foreground"
                  )}
                >
                  {!patientId
                    ? "Selecciona paciente primero"
                    : selectedInvoice
                    ? `${selectedInvoice.invoice_number} — ${formatMoney(Number(selectedInvoice.total))}`
                    : "Sin factura (pago a cuenta)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar factura..." />
                  <CommandList>
                    <CommandEmpty>
                      {loadingInvoices
                        ? "Cargando facturas..."
                        : "Sin facturas pendientes para este paciente"}
                    </CommandEmpty>
                    <CommandGroup>
                      {/* Primera opcion: sin factura (pago a cuenta) */}
                      <CommandItem
                        value="__no_invoice__"
                        onSelect={() => {
                          setInvoiceId(null);
                          setInvoiceSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            invoiceId === null ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>Sin factura (pago a cuenta)</span>
                          <span className="text-xs text-muted-foreground">
                            Abono no vinculado a una factura concreta
                          </span>
                        </div>
                      </CommandItem>
                      {loadingInvoices ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        pendingInvoices.map((inv) => (
                          <CommandItem
                            key={inv.id}
                            value={`${inv.invoice_number} ${inv.issue_date}`}
                            onSelect={() => {
                              setInvoiceId(inv.id);
                              setInvoiceSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                invoiceId === inv.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>
                                {inv.invoice_number} — {formatMoney(Number(inv.total))}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(inv.issue_date), "dd/MM/yyyy")}
                              </span>
                            </div>
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <MoneyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              currency="COP"
              required
            />
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
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

          {/* Referencia */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">No. Referencia (opcional)</Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="No. recibo, transferencia, etc."
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Concepto del pago, observaciones..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createPayment.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!patientId || !amount || createPayment.isPending}
            >
              {createPayment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Receipt Dialog */}
      <PaymentReceiptDialog
        open={showReceipt}
        onOpenChange={handleCloseReceipt}
        payment={createdPayment}
        patient={
          selectedPatient
            ? {
                first_name: selectedPatient.first_name,
                last_name: selectedPatient.last_name,
                document_number: selectedPatient.document_number,
                phone: selectedPatient.phone,
              }
            : null
        }
        invoice={
          selectedInvoice
            ? {
                invoice_number: selectedInvoice.invoice_number,
                total: Number(selectedInvoice.total),
                issue_date: selectedInvoice.issue_date,
              }
            : null
        }
      />
    </Dialog>
  );
}

export default RegisterPaymentDialog;
