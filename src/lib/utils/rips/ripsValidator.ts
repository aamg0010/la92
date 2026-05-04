/**
 * RIPS Validator - Validación de datos antes de generar RIPS
 * Resolución 2275/2023
 */

import { mapDocumentType, mapGender } from './ripsConstants';

export interface RipsInvoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_document_type: string | null;
  patient_document_number: string | null;
  patient_birth_date: string | null;
  patient_gender: string | null;
  patient_municipio: string | null;
  patient_zona: string | null;
  patient_tipo_usuario: string | null;
  issue_date: string;
  total: number;
  finalidad_consulta: string | null;
  causa_externa: string | null;
  diagnostico_principal: string | null;
  diagnostico_relacionado: string | null;
  rips_status: string | null;
  items?: RipsInvoiceItem[];
}

export interface RipsInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  cups_code: string | null;
  service_type: string | null;
}

export interface ValidationError {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalInvoices: number;
    validInvoices: number;
    invalidInvoices: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Valida una factura individual para RIPS
 */
export function validateInvoice(invoice: RipsInvoice): ValidationError[] {
  const errors: ValidationError[] = [];
  const patientName = `${invoice.patient_first_name || ''} ${invoice.patient_last_name || ''}`.trim();

  // Validación de documento del paciente
  if (!invoice.patient_document_number || invoice.patient_document_number.trim() === '') {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'document_number',
      message: 'El paciente no tiene número de documento',
      severity: 'error',
    });
  }

  // Validación de tipo de documento
  const docType = mapDocumentType(invoice.patient_document_type);
  if (!docType) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'document_type',
      message: 'Tipo de documento no válido',
      severity: 'error',
    });
  }

  // Validación de nombre
  if (!invoice.patient_first_name || invoice.patient_first_name.trim() === '') {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'first_name',
      message: 'El paciente no tiene nombre',
      severity: 'error',
    });
  }

  if (!invoice.patient_last_name || invoice.patient_last_name.trim() === '') {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'last_name',
      message: 'El paciente no tiene apellido',
      severity: 'error',
    });
  }

  // Validación de fecha de nacimiento (warning si falta)
  if (!invoice.patient_birth_date) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'birth_date',
      message: 'El paciente no tiene fecha de nacimiento (se usará edad por defecto)',
      severity: 'warning',
    });
  }

  // Validación de género (warning si falta)
  const gender = mapGender(invoice.patient_gender);
  if (!invoice.patient_gender) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'gender',
      message: 'El paciente no tiene género definido (se usará Masculino por defecto)',
      severity: 'warning',
    });
  }

  // Validación de municipio (warning si falta)
  if (!invoice.patient_municipio) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'municipio',
      message: 'El paciente no tiene municipio de residencia (se usará Teruel por defecto)',
      severity: 'warning',
    });
  }

  // Validación de diagnóstico principal (warning si falta)
  if (!invoice.diagnostico_principal) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'diagnostico_principal',
      message: 'La factura no tiene diagnóstico principal (se usará Z012 - Examen odontológico)',
      severity: 'warning',
    });
  }

  // Validación de total
  if (!invoice.total || invoice.total <= 0) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'total',
      message: 'La factura tiene valor cero o negativo',
      severity: 'error',
    });
  }

  // Validación de fecha de emisión
  if (!invoice.issue_date) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'issue_date',
      message: 'La factura no tiene fecha de emisión',
      severity: 'error',
    });
  }

  // Validación de items
  if (!invoice.items || invoice.items.length === 0) {
    errors.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      patientName,
      field: 'items',
      message: 'La factura no tiene servicios/items detallados',
      severity: 'warning',
    });
  } else {
    // Validar items individuales
    invoice.items.forEach((item, index) => {
      if (!item.cups_code) {
        errors.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          patientName,
          field: `items[${index}].cups_code`,
          message: `El item "${item.description}" no tiene código CUPS (se generará código genérico)`,
          severity: 'warning',
        });
      }
    });
  }

  return errors;
}

/**
 * Valida un conjunto de facturas para RIPS
 */
export function validateInvoices(invoices: RipsInvoice[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  let validCount = 0;

  invoices.forEach((invoice) => {
    const validationErrors = validateInvoice(invoice);
    const errors = validationErrors.filter((e) => e.severity === 'error');
    const warnings = validationErrors.filter((e) => e.severity === 'warning');

    allErrors.push(...errors);
    allWarnings.push(...warnings);

    if (errors.length === 0) {
      validCount++;
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    summary: {
      totalInvoices: invoices.length,
      validInvoices: validCount,
      invalidInvoices: invoices.length - validCount,
      errorCount: allErrors.length,
      warningCount: allWarnings.length,
    },
  };
}

/**
 * Valida la configuración del prestador para RIPS
 */
export interface ProviderSettings {
  nit: string;
  razon_social: string;
  tipo_identificacion?: string;
  codigo_habilitacion?: string;
  direccion?: string;
  municipio_codigo?: string;
  departamento_codigo?: string;
  telefono?: string;
  email?: string;
}

export interface ProviderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProviderSettings(settings: ProviderSettings | null): ProviderValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings) {
    errors.push('No hay configuración del prestador. Configure los datos en la pestaña "Configuración".');
    return { isValid: false, errors, warnings };
  }

  if (!settings.nit || settings.nit.trim() === '') {
    errors.push('El NIT del prestador es obligatorio');
  }

  if (!settings.razon_social || settings.razon_social.trim() === '') {
    errors.push('La razón social del prestador es obligatoria');
  }

  if (!settings.codigo_habilitacion) {
    warnings.push('El código de habilitación no está configurado');
  }

  if (!settings.direccion) {
    warnings.push('La dirección del prestador no está configurada');
  }

  if (!settings.municipio_codigo) {
    warnings.push('El código de municipio no está configurado (se usará Teruel por defecto)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Agrupa errores por paciente para mostrar resumen
 */
export function groupErrorsByPatient(
  errors: ValidationError[]
): Map<string, { patientName: string; invoices: ValidationError[] }> {
  const grouped = new Map<string, { patientName: string; invoices: ValidationError[] }>();

  errors.forEach((error) => {
    const existing = grouped.get(error.invoiceId);
    if (existing) {
      existing.invoices.push(error);
    } else {
      grouped.set(error.invoiceId, {
        patientName: error.patientName,
        invoices: [error],
      });
    }
  });

  return grouped;
}

/**
 * Obtiene un resumen legible de los errores de validación
 */
export function getValidationSummaryText(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`Total de facturas: ${result.summary.totalInvoices}`);
  lines.push(`Facturas válidas: ${result.summary.validInvoices}`);
  lines.push(`Facturas con errores: ${result.summary.invalidInvoices}`);
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('ERRORES (deben corregirse):');
    const errorsByField = new Map<string, number>();
    result.errors.forEach((e) => {
      const count = errorsByField.get(e.field) || 0;
      errorsByField.set(e.field, count + 1);
    });
    errorsByField.forEach((count, field) => {
      lines.push(`  - ${field}: ${count} factura(s)`);
    });
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('ADVERTENCIAS (se usarán valores por defecto):');
    const warningsByField = new Map<string, number>();
    result.warnings.forEach((e) => {
      const count = warningsByField.get(e.field) || 0;
      warningsByField.set(e.field, count + 1);
    });
    warningsByField.forEach((count, field) => {
      lines.push(`  - ${field}: ${count} factura(s)`);
    });
  }

  return lines.join('\n');
}
