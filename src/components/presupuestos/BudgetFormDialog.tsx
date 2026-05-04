/**
 * BudgetFormDialog.tsx
 * Dialog para crear / editar un presupuesto con items editables inline.
 */

import { useEffect, useMemo, useState } from "react";
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
  Calendar as CalendarIcon,
  User,
  ChevronsUpDown,
  Check,
  Plus,
  Trash2,
  Loader2,
  Stethoscope,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from "@/hooks/usePatients";
import { useTreatments } from "@/hooks/useTreatments";
import {
  type Budget,
  type BudgetWithItems,
  type BudgetItemDraft,
  computeBudgetItemTotal,
  computeBudgetTotals,
  useCreateBudget,
  useUpdateBudget,
} from "@/hooks/useBudgets";
import { useCurrency } from "@/hooks/useCurrency";
import { format, addDays } from "date-fns";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: BudgetWithItems | null;
  /** Callback tras guardar exitosamente (p.ej. abrir dialogo de envio). */
  onSaved?: (budget: Budget, action: "draft" | "sent") => void;
}

function emptyItem(): BudgetItemDraft {
  return {
    description: "",
    tooth_number: "",
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax_rate: 0,
  };
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  onSaved,
}: BudgetFormDialogProps) {
  const { formatMoney } = useCurrency();
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const { data: treatments = [] } = useTreatments();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const isEdit = !!budget;

  const [patientId, setPatientId] = useState("");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [issueDate, setIssueDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [validUntil, setValidUntil] = useState(
    format(addDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BudgetItemDraft[]>([emptyItem()]);

  // Sincroniza estado cuando cambia el budget entrante (edicion).
  useEffect(() => {
    if (budget) {
      setPatientId(budget.patient_id);
      setIssueDate(budget.issue_date);
      setValidUntil(budget.valid_until ?? "");
      setGlobalDiscount(0); // Descuento global no se persiste aparte; se recalcula de items.
      setNotes(budget.notes ?? "");
      setItems(
        budget.items.length > 0
          ? budget.items.map((it) => ({
              id: it.id,
              treatment_id: it.treatment_id,
              description: it.description,
              tooth_number: it.tooth_number ?? "",
              quantity: it.quantity,
              unit_price: Number(it.unit_price),
              discount: Number(it.discount ?? 0),
              tax_rate: Number(it.tax_rate ?? 0),
              total: Number(it.total),
            }))
          : [emptyItem()],
      );
    } else if (open) {
      // Reset al abrir en modo creacion
      setPatientId("");
      setIssueDate(format(new Date(), "yyyy-MM-dd"));
      setValidUntil(format(addDays(new Date(), 30), "yyyy-MM-dd"));
      setGlobalDiscount(0);
      setNotes("");
      setItems([emptyItem()]);
    }
  }, [budget, open]);

  const selectedPatient = patients.find((p) => p.id === patientId);
  const totals = useMemo(
    () => computeBudgetTotals(items, globalDiscount),
    [items, globalDiscount],
  );

  const updateItem = (idx: number, patch: Partial<BudgetItemDraft>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const canSubmit =
    !!patientId &&
    items.length > 0 &&
    items.every((it) => it.description.trim().length > 0 && it.unit_price > 0);

  const handleSubmit = async (mode: "draft" | "sent") => {
    if (!canSubmit) return;

    const payload = {
      patient_id: patientId,
      issue_date: issueDate,
      valid_until: validUntil || null,
      notes: notes || null,
      discount: globalDiscount,
      status: mode === "sent" ? "sent" : "draft",
      items,
    };

    try {
      let saved: Budget;
      if (isEdit && budget) {
        saved = await updateBudget.mutateAsync({ id: budget.id, ...payload });
      } else {
        saved = await createBudget.mutateAsync(payload);
      }
      onOpenChange(false);
      onSaved?.(saved, mode);
    } catch {
      // Los toasts de error ya los gestiona el hook.
    }
  };

  const isSaving = createBudget.isPending || updateBudget.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isEdit ? "Editar presupuesto" : "Nuevo presupuesto"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Editando ${budget?.budget_number}`
              : "Crear un presupuesto detallado con los tratamientos propuestos."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Datos generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Paciente */}
            <div className="md:col-span-3 space-y-2">
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
                      !patientId && "text-muted-foreground",
                    )}
                  >
                    {selectedPatient
                      ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                      : "Buscar paciente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0" align="start">
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
                          patients.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.first_name} ${p.last_name} ${p.document_number}`}
                              onSelect={() => {
                                setPatientId(p.id);
                                setPatientSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  patientId === p.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span>
                                  {p.first_name} {p.last_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {p.document_number} | {p.phone || "Sin tel."}
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

            {/* Fecha emision */}
            <div className="space-y-2">
              <Label htmlFor="issueDate" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Fecha de emision
              </Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            {/* Valido hasta */}
            <div className="space-y-2">
              <Label htmlFor="validUntil" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Valido hasta
              </Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            {/* Descuento global */}
            <div className="space-y-2">
              <Label htmlFor="globalDiscount">Descuento global</Label>
              <MoneyInput
                id="globalDiscount"
                value={globalDiscount}
                onChange={setGlobalDiscount}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Items del presupuesto
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar item
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-2 w-[28%]">Descripcion</th>
                    <th className="text-left p-2 w-[12%]">Tratamiento</th>
                    <th className="text-left p-2 w-[8%]">Diente</th>
                    <th className="text-right p-2 w-[7%]">Cant.</th>
                    <th className="text-right p-2 w-[12%]">Precio</th>
                    <th className="text-right p-2 w-[10%]">Desc.</th>
                    <th className="text-right p-2 w-[8%]">IVA %</th>
                    <th className="text-right p-2 w-[12%]">Total</th>
                    <th className="w-[3%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineTotal = computeBudgetItemTotal(it);
                    const selectedTreatment = treatments.find(
                      (t) => t.id === it.treatment_id,
                    );
                    return (
                      <tr key={idx} className="border-t align-top">
                        <td className="p-2">
                          <Textarea
                            value={it.description}
                            onChange={(e) =>
                              updateItem(idx, { description: e.target.value })
                            }
                            placeholder="Descripcion del tratamiento"
                            rows={2}
                            className="min-h-[40px]"
                          />
                        </td>
                        <td className="p-2">
                          <TreatmentCombobox
                            value={it.treatment_id ?? null}
                            onSelect={(t) => {
                              updateItem(idx, {
                                treatment_id: t?.id ?? null,
                                description: t?.name ?? it.description,
                                unit_price:
                                  t?.base_price !== undefined
                                    ? Number(t.base_price)
                                    : it.unit_price,
                              });
                            }}
                            label={selectedTreatment?.code}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={it.tooth_number ?? ""}
                            onChange={(e) =>
                              updateItem(idx, { tooth_number: e.target.value })
                            }
                            placeholder="FDI"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) =>
                              updateItem(idx, {
                                quantity: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="text-right"
                          />
                        </td>
                        <td className="p-2">
                          <MoneyInput
                            value={it.unit_price}
                            onChange={(v) => updateItem(idx, { unit_price: v })}
                          />
                        </td>
                        <td className="p-2">
                          <MoneyInput
                            value={it.discount ?? 0}
                            onChange={(v) => updateItem(idx, { discount: v })}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={it.tax_rate ?? 0}
                            onChange={(e) =>
                              updateItem(idx, {
                                tax_rate: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="text-right"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatMoney(lineTotal)}
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notas y Totales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones, condiciones de pago, etc."
                rows={5}
              />
            </div>
            <div className="space-y-2 bg-muted/30 rounded-lg p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span className="font-medium text-destructive">
                  -{formatMoney(totals.discount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos</span>
                <span className="font-medium">{formatMoney(totals.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">
                  {formatMoney(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={!canSubmit || isSaving}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar borrador
          </Button>
          <Button
            onClick={() => handleSubmit("sent")}
            disabled={!canSubmit || isSaving}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar y enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Subcomponente: combobox de tratamientos ============

interface TreatmentComboboxProps {
  value: string | null;
  onSelect: (t: { id: string; name: string; base_price: number } | null) => void;
  label?: string;
}

function TreatmentCombobox({ value, onSelect, label }: TreatmentComboboxProps) {
  const [open, setOpen] = useState(false);
  const { data: treatments = [], isLoading } = useTreatments();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-between font-normal text-xs h-9",
            !value && "text-muted-foreground",
          )}
        >
          {label || (value ? "Seleccionado" : "Elegir...")}
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar tratamiento..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="text-muted-foreground">Sin tratamiento del catalogo</span>
              </CommandItem>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                treatments
                  .filter((t) => t.is_active !== false)
                  .map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`${t.code} ${t.name} ${t.category || ""}`}
                      onSelect={() => {
                        onSelect({
                          id: t.id,
                          name: t.name,
                          base_price: Number(t.base_price),
                        });
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === t.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {t.code} - {t.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.category || "Sin categoria"}
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
  );
}

export default BudgetFormDialog;
