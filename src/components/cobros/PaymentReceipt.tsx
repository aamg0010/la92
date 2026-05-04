/**
 * PaymentReceipt.tsx
 * Component to display and print a payment receipt
 * Configurable with tenant-specific logo, colors, and tax settings
 */

import { forwardRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useClinicSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { AlertTriangle } from "lucide-react";

interface PaymentReceiptProps {
  payment: {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  };
  patient: {
    first_name: string;
    last_name: string;
    document_number: string;
    phone?: string;
  };
  /**
   * Factura asociada al pago (opcional). Se muestra en el recibo para
   * facilitar la conciliación: número de factura, importe total y fecha de
   * emisión.
   */
  invoice?: {
    invoice_number: string;
    total: number;
    issue_date: string;
  };
  receiptNumber?: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  check: "Cheque",
  other: "Otro",
};

export const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ payment, patient, invoice, receiptNumber }, ref) => {
    const { data: settings } = useClinicSettings();
    const { formatMoney } = useCurrency();

    const primaryColor = settings?.invoice_primary_color || "#0ea5e9";
    const secondaryColor = settings?.invoice_secondary_color || "#64748b";
    const logoUrl = settings?.invoice_logo_url || settings?.logo_url;
    const taxRate = settings?.default_tax_rate || 0;
    const showTaxWarning = settings?.show_tax_warning ?? true;
    const taxCountry = settings?.tax_country || "CO";
    const irpfRate = settings?.irpf_rate || 0;

    // Country-specific labels
    const isSpain = taxCountry === "ES";
    const taxIdLabel = isSpain ? "CIF" : "NIT";
    const taxIdValue = isSpain ? settings?.cif : settings?.tax_id;

    // Calculate amounts
    const subtotal = taxRate > 0 ? payment.amount / (1 + taxRate / 100) : payment.amount;
    const taxAmount = payment.amount - subtotal;

    // Spain IRPF calculation (retention on professional services)
    const irpfAmount = isSpain && irpfRate > 0 ? (subtotal * irpfRate) / 100 : 0;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 max-w-[400px] mx-auto"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={settings?.clinic_name || "Logo"}
              className="h-16 mx-auto mb-3 object-contain"
            />
          ) : (
            <div
              className="text-2xl font-bold mb-2"
              style={{ color: primaryColor }}
            >
              {settings?.clinic_name || "Consultorio Odontologico"}
            </div>
          )}

          {settings?.invoice_header_text && (
            <p className="text-sm text-gray-600 mb-2">
              {settings.invoice_header_text}
            </p>
          )}

          <div className="text-xs text-gray-500 space-y-0.5">
            {settings?.address && <p>{settings.address}</p>}
            {settings?.city && <p>{settings.city}</p>}
            {settings?.phone && <p>Tel: {settings.phone}</p>}
            {settings?.show_tax_id_on_invoice && taxIdValue && (
              <p>{taxIdLabel}: {taxIdValue}</p>
            )}
            {isSpain && settings?.tax_regime && (
              <p className="text-gray-400">{settings.tax_regime}</p>
            )}
          </div>
        </div>

        {/* Receipt Title */}
        <div
          className="text-center py-2 mb-4"
          style={{ backgroundColor: primaryColor, color: "white" }}
        >
          <h2 className="text-lg font-bold">RECIBO DE PAGO</h2>
        </div>

        {/* Receipt Info */}
        <div className="flex justify-between text-sm mb-4 border-b pb-2">
          <div>
            <span className="text-gray-500">No. Recibo:</span>
            <span className="ml-2 font-medium">
              {receiptNumber || payment.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Fecha:</span>
            <span className="ml-2">
              {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: es })}
            </span>
          </div>
        </div>

        {/* Patient Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">PACIENTE</p>
          <p className="font-medium">
            {patient.first_name} {patient.last_name}
          </p>
          <p className="text-sm text-gray-600">Doc: {patient.document_number}</p>
          {patient.phone && (
            <p className="text-sm text-gray-600">Tel: {patient.phone}</p>
          )}
        </div>

        {/* Invoice Info (si el pago está asociado a una factura) */}
        {invoice && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 mb-1">FACTURA ASOCIADA</p>
            <div className="flex justify-between text-sm">
              <span className="font-medium">{invoice.invoice_number}</span>
              <span className="text-gray-600">
                {format(new Date(invoice.issue_date), "dd/MM/yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Total factura:</span>
              <span>{formatMoney(Number(invoice.total))}</span>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="border-t border-b py-3 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Metodo de pago:</span>
            <span className="font-medium">
              {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
            </span>
          </div>

          {payment.reference_number && (
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">No. Referencia:</span>
              <span>{payment.reference_number}</span>
            </div>
          )}

          {(taxRate > 0 || (isSpain && irpfRate > 0)) ? (
            <>
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-gray-600">Base imponible:</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600">IVA ({taxRate}%):</span>
                  <span>{formatMoney(taxAmount)}</span>
                </div>
              )}
              {isSpain && irpfRate > 0 && (
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600">IRPF (-{irpfRate}%):</span>
                  <span className="text-red-600">-{formatMoney(irpfAmount)}</span>
                </div>
              )}
            </>
          ) : null}

          <div
            className="flex justify-between text-lg font-bold mt-2 pt-2 border-t"
            style={{ color: primaryColor }}
          >
            <span>TOTAL:</span>
            <span>{formatMoney(payment.amount - irpfAmount)}</span>
          </div>
          {isSpain && irpfRate > 0 && (
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Total bruto:</span>
              <span>{formatMoney(payment.amount)}</span>
            </div>
          )}
        </div>

        {/* Tax Warning */}
        {taxRate === 0 && showTaxWarning && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700">
              {isSpain
                ? "Operacion exenta de IVA segun Art. 20.Uno.3 de la Ley 37/1992 (servicios sanitarios)."
                : "Este recibo no incluye IVA. Consulte con su contador para determinar si aplica impuesto para su actividad comercial."}
            </p>
          </div>
        )}

        {/* Notes */}
        {payment.notes && (
          <div className="mb-4 text-sm">
            <p className="text-gray-500 mb-1">Concepto:</p>
            <p className="text-gray-700">{payment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t">
          {settings?.invoice_footer_text && (
            <p className="text-sm mb-2" style={{ color: secondaryColor }}>
              {settings.invoice_footer_text}
            </p>
          )}
          {settings?.invoice_terms && (
            <p className="text-xs text-gray-400 mt-2">{settings.invoice_terms}</p>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Impreso: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </p>
        </div>
      </div>
    );
  }
);

PaymentReceipt.displayName = "PaymentReceipt";

export default PaymentReceipt;
