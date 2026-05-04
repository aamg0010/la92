/**
 * BudgetDetailDialog.tsx
 * Muestra el presupuesto completo en modo lectura con botonera de acciones.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Printer,
  Send,
  Edit,
  Trash2,
  Receipt,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  type BudgetWithItems,
  useBudget,
  useDeleteBudget,
  useConvertBudgetToInvoice,
  BUDGET_STATUSES,
} from "@/hooks/useBudgets";
import { useClinicSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { generateBudgetPDF } from "./BudgetPDF";
import { BudgetFormDialog } from "./BudgetFormDialog";
import { SendBudgetDialog } from "./SendBudgetDialog";

interface BudgetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary border border-primary/20",
  accepted: "bg-success/10 text-success border border-success/20",
  rejected: "bg-destructive/10 text-destructive border border-destructive/20",
  expired: "bg-warning/10 text-warning border border-warning/20",
  converted: "bg-accent/10 text-accent border border-accent/20",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: FileText,
  sent: Send,
  accepted: CheckCircle2,
  rejected: XCircle,
  expired: Clock,
  converted: Receipt,
};

export function BudgetDetailDialog({
  open,
  onOpenChange,
  budgetId,
}: BudgetDetailDialogProps) {
  const { data: budget, isLoading } = useBudget(budgetId);
  const { data: clinic } = useClinicSettings();
  const { formatMoney, currency } = useCurrency();
  const deleteBudget = useDeleteBudget();
  const convertToInvoice = useConvertBudgetToInvoice();

  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmConvertOpen, setConfirmConvertOpen] = useState(false);

  const statusInfo = budget
    ? BUDGET_STATUSES.find((s) => s.value === budget.status)
    : null;
  const StatusIcon = budget ? STATUS_ICONS[budget.status] || FileText : FileText;

  const handlePrint = () => {
    if (!budget) return;
    const pdf = generateBudgetPDF(budget as BudgetWithItems, clinic, {
      currency,
    });
    pdf.save(`${budget.budget_number}.pdf`);
  };

  const handleDelete = async () => {
    if (!budget) return;
    await deleteBudget.mutateAsync(budget.id);
    setConfirmDeleteOpen(false);
    onOpenChange(false);
  };

  const handleConvert = async () => {
    if (!budget) return;
    await convertToInvoice.mutateAsync(budget.id);
    setConfirmConvertOpen(false);
  };

  const isConverted = budget?.status === "converted";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {budget?.budget_number ?? "Presupuesto"}
              {statusInfo && (
                <Badge
                  variant="outline"
                  className={cn("gap-1 ml-2", STATUS_STYLES[budget!.status])}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {budget?.issue_date &&
                `Emitido el ${format(new Date(budget.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: es })}`}
              {budget?.valid_until && (
                <>
                  {" · "}
                  Valido hasta{" "}
                  {format(new Date(budget.valid_until), "dd/MM/yyyy")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !budget ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Paciente */}
              {budget.patient && (
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    Paciente
                  </p>
                  <p className="font-semibold text-base">
                    {budget.patient.first_name} {budget.patient.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Doc: {budget.patient.document_number}
                    {budget.patient.phone && ` · Tel: ${budget.patient.phone}`}
                    {budget.patient.email && ` · ${budget.patient.email}`}
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Descripcion</th>
                      <th className="text-left p-3 w-[80px]">Diente</th>
                      <th className="text-right p-3 w-[60px]">Cant.</th>
                      <th className="text-right p-3 w-[110px]">Precio</th>
                      <th className="text-right p-3 w-[80px]">Desc.</th>
                      <th className="text-right p-3 w-[70px]">IVA %</th>
                      <th className="text-right p-3 w-[120px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Este presupuesto no tiene items
                        </td>
                      </tr>
                    ) : (
                      budget.items.map((it) => (
                        <tr key={it.id} className="border-t align-top">
                          <td className="p-3">
                            <p className="whitespace-pre-wrap">{it.description}</p>
                            {it.treatment && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {it.treatment.code} - {it.treatment.name}
                              </p>
                            )}
                          </td>
                          <td className="p-3">{it.tooth_number || "-"}</td>
                          <td className="p-3 text-right">{it.quantity}</td>
                          <td className="p-3 text-right">
                            {formatMoney(Number(it.unit_price))}
                          </td>
                          <td className="p-3 text-right">
                            {formatMoney(Number(it.discount ?? 0))}
                          </td>
                          <td className="p-3 text-right">
                            {Number(it.tax_rate ?? 0)}%
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatMoney(Number(it.total))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatMoney(Number(budget.subtotal))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className="font-medium text-destructive">
                      -{formatMoney(Number(budget.discount ?? 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impuestos</span>
                    <span className="font-medium">
                      {formatMoney(Number(budget.tax_amount ?? 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">
                      {formatMoney(Number(budget.total))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {budget.notes && (
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    Notas
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{budget.notes}</p>
                </div>
              )}

              {/* Link a factura convertida */}
              {isConverted && budget.converted_invoice_id && (
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Presupuesto convertido en factura
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Factura vinculada: {budget.converted_invoice_id.slice(0, 8)}...
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // La pagina de Facturacion no soporta deep-link por id hoy,
                      // pero dejamos la navegacion lista para cuando exista.
                      window.location.href = `/facturacion?invoice=${budget.converted_invoice_id}`;
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver factura
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!budget || isLoading}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / Descargar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setSendOpen(true)}
              disabled={!budget || isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              disabled={!budget || isLoading || isConverted}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            {!isConverted && (
              <Button
                onClick={() => setConfirmConvertOpen(true)}
                disabled={!budget || isLoading || convertToInvoice.isPending}
              >
                {convertToInvoice.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Convertir a factura
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={!budget || isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      {budget && (
        <BudgetFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          budget={budget as BudgetWithItems}
        />
      )}

      {/* Send */}
      {budget && (
        <SendBudgetDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          budget={budget as BudgetWithItems}
        />
      )}

      {/* Confirm delete */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar presupuesto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El presupuesto y todos sus items
              seran eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBudget.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBudget.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm convert */}
      <AlertDialog
        open={confirmConvertOpen}
        onOpenChange={setConfirmConvertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir a factura</AlertDialogTitle>
            <AlertDialogDescription>
              Se creara una factura nueva con los mismos items y totales del
              presupuesto. El presupuesto pasara a estado Convertido y no podra
              editarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={convertToInvoice.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvert}
              disabled={convertToInvoice.isPending}
            >
              {convertToInvoice.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Convertir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BudgetDetailDialog;
