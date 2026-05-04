/**
 * PaymentReceiptDialog.tsx
 * Dialog to display and print a payment receipt after successful payment
 */

import { useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { PaymentReceipt } from "./PaymentReceipt";

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  } | null;
  patient: {
    first_name: string;
    last_name: string;
    document_number: string;
    phone?: string;
  } | null;
  /**
   * Factura asociada al pago (opcional). Si se proporciona, se muestra en
   * la cabecera del recibo para que el paciente pueda cruzarlo con su
   * factura pendiente.
   */
  invoice?: {
    invoice_number: string;
    total: number;
    issue_date: string;
  } | null;
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  payment,
  patient,
  invoice,
}: PaymentReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!receiptRef.current) return;

    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=450,height=600");

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Recibo de Pago</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }, []);

  if (!payment || !patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Recibo de Pago
          </DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden">
          <PaymentReceipt
            ref={receiptRef}
            payment={payment}
            patient={patient}
            invoice={invoice ?? undefined}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentReceiptDialog;
