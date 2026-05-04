/**
 * BudgetPDF.tsx
 * Genera un PDF del presupuesto usando jsPDF.
 * Export: generateBudgetPDF(budget, clinic) => jsPDF
 * El caller decide si hace .save() o .output('blob').
 */

import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BudgetWithItems } from "@/hooks/useBudgets";
import type { ClinicSettings } from "@/hooks/useSettings";
import { formatMoney, type CurrencyCode } from "@/lib/utils/currency";

type ClinicInfo = Partial<ClinicSettings> | null | undefined;

interface GenerateOptions {
  /** Moneda; si no se pasa, intenta usar la de clinic.currency o COP. */
  currency?: CurrencyCode;
}

/**
 * Genera un PDF del presupuesto. Devuelve la instancia jsPDF para que el
 * caller decida entre descargar, mostrar en iframe o enviar como blob.
 */
export function generateBudgetPDF(
  budget: BudgetWithItems,
  clinic: ClinicInfo,
  options: GenerateOptions = {},
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const currency: CurrencyCode =
    options.currency ?? ((clinic?.currency as CurrencyCode) || "COP");

  const primaryHex = clinic?.invoice_primary_color || "#3333CC";
  const secondaryHex = clinic?.invoice_secondary_color || "#64748b";
  const primary = hexToRgb(primaryHex);
  const dark: [number, number, number] = [30, 30, 30];
  const gray: [number, number, number] = [110, 110, 110];
  const lightGray: [number, number, number] = [200, 200, 200];

  function checkPageBreak(h = 20): void {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function setColor(rgb: [number, number, number]) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  function hr() {
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  }

  // ========== HEADER: clinic data ==========
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setColor(primary);
  doc.text(clinic?.clinic_name || "Clinica Dental", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor(gray);
  const clinicLines: string[] = [];
  if (clinic?.address) clinicLines.push(clinic.address);
  if (clinic?.city) clinicLines.push(clinic.city);
  if (clinic?.phone) clinicLines.push(`Tel: ${clinic.phone}`);
  if (clinic?.email) clinicLines.push(clinic.email);
  if (clinic?.tax_id || clinic?.cif) {
    const label = clinic.tax_country === "ES" ? "CIF" : "NIT";
    clinicLines.push(`${label}: ${clinic.cif || clinic.tax_id}`);
  }
  clinicLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 4;
  });

  // Titulo PRESUPUESTO (derecha)
  const titleY = margin;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  setColor(primary);
  doc.text("PRESUPUESTO", pageWidth - margin, titleY, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setColor(dark);
  doc.text(budget.budget_number, pageWidth - margin, titleY + 6, {
    align: "right",
  });
  setColor(gray);
  doc.text(
    `Emitido: ${format(new Date(budget.issue_date), "dd/MM/yyyy", { locale: es })}`,
    pageWidth - margin,
    titleY + 11,
    { align: "right" },
  );
  if (budget.valid_until) {
    doc.text(
      `Valido hasta: ${format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: es })}`,
      pageWidth - margin,
      titleY + 15,
      { align: "right" },
    );
  }

  y = Math.max(y, titleY + 20) + 4;
  hr();

  // ========== PATIENT ==========
  if (budget.patient) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setColor(gray);
    doc.text("PACIENTE", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setColor(dark);
    doc.text(
      `${budget.patient.first_name} ${budget.patient.last_name}`,
      margin,
      y,
    );
    y += 5;
    doc.setFontSize(9);
    setColor(gray);
    const patientLines: string[] = [];
    if (budget.patient.document_number)
      patientLines.push(`Doc: ${budget.patient.document_number}`);
    if (budget.patient.phone)
      patientLines.push(`Tel: ${budget.patient.phone}`);
    if (budget.patient.email) patientLines.push(budget.patient.email);
    doc.text(patientLines.join("  |  "), margin, y);
    y += 6;
    hr();
  }

  // ========== ITEMS TABLE ==========
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(dark);

  const col = {
    desc: margin,
    tooth: margin + 80,
    qty: margin + 100,
    price: margin + 115,
    total: pageWidth - margin,
  };

  // Header row
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(margin, y - 4, contentWidth, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Descripcion", col.desc + 1, y);
  doc.text("Diente", col.tooth, y);
  doc.text("Cant.", col.qty, y, { align: "right" });
  doc.text("Precio", col.price, y, { align: "right" });
  doc.text("Total", col.total, y, { align: "right" });
  y += 6;

  setColor(dark);
  doc.setFont("helvetica", "normal");

  budget.items.forEach((item) => {
    const descLines = doc.splitTextToSize(item.description, 75);
    const rowHeight = Math.max(6, descLines.length * 4 + 2);

    checkPageBreak(rowHeight + 4);

    doc.text(descLines, col.desc, y);
    doc.text(item.tooth_number || "-", col.tooth, y);
    doc.text(String(item.quantity), col.qty, y, { align: "right" });
    doc.text(formatMoney(Number(item.unit_price), currency), col.price, y, {
      align: "right",
    });
    doc.text(formatMoney(Number(item.total), currency), col.total, y, {
      align: "right",
    });

    y += rowHeight;
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.1);
    doc.line(margin, y - 1, pageWidth - margin, y - 1);
  });

  y += 4;

  // ========== TOTALS ==========
  const totalsX = pageWidth - margin - 60;
  const totalsRight = pageWidth - margin;

  checkPageBreak(30);
  doc.setFontSize(10);
  setColor(gray);
  doc.text("Subtotal", totalsX, y);
  setColor(dark);
  doc.text(formatMoney(Number(budget.subtotal), currency), totalsRight, y, {
    align: "right",
  });
  y += 5;

  if (Number(budget.discount) > 0) {
    setColor(gray);
    doc.text("Descuento", totalsX, y);
    setColor(dark);
    doc.text(
      `-${formatMoney(Number(budget.discount), currency)}`,
      totalsRight,
      y,
      { align: "right" },
    );
    y += 5;
  }

  if (Number(budget.tax_amount) > 0) {
    setColor(gray);
    doc.text("Impuestos", totalsX, y);
    setColor(dark);
    doc.text(formatMoney(Number(budget.tax_amount), currency), totalsRight, y, {
      align: "right",
    });
    y += 5;
  }

  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, totalsRight, y);
  y += 5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  setColor(primary);
  doc.text("TOTAL", totalsX, y);
  doc.text(formatMoney(Number(budget.total), currency), totalsRight, y, {
    align: "right",
  });
  y += 8;

  // ========== NOTES ==========
  if (budget.notes) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setColor(gray);
    doc.text("NOTAS", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(dark);
    const noteLines = doc.splitTextToSize(budget.notes, contentWidth);
    noteLines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin, y);
      y += 4;
    });
    y += 3;
  }

  // ========== FOOTER ==========
  const footerY = pageHeight - margin;
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFontSize(8);
  setColor(gray);
  const validText = budget.valid_until
    ? `Presupuesto valido hasta ${format(new Date(budget.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: es })}.`
    : "Presupuesto sin fecha de caducidad.";
  doc.text(validText, margin, footerY - 6);

  if (clinic?.invoice_footer_text) {
    setColor(hexToRgb(secondaryHex));
    doc.text(clinic.invoice_footer_text, margin, footerY - 2, {
      maxWidth: contentWidth,
    });
  }

  return doc;
}

/** Convierte color HEX (#RRGGBB) a tupla RGB. Fallback: negro. */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return [0, 0, 0];
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return [0, 0, 0];
  return [r, g, b];
}

export default generateBudgetPDF;
