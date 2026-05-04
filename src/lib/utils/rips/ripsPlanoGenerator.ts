/**
 * RIPS Plano Generator - Formato tradicional .txt
 * Genera archivos planos según especificación RIPS tradicional
 *
 * Archivos generados:
 * - US: Usuarios (datos del paciente)
 * - AC: Consultas
 * - AP: Procedimientos
 * - AM: Medicamentos (si aplica)
 * - AT: Otros servicios (si aplica)
 * - AF: Facturación
 * - CT: Control
 */

import { format } from 'date-fns';
import JSZip from 'jszip';
import {
  mapDocumentType,
  mapGender,
  calculateAge,
  cleanRipsString,
  DEFAULT_MUNICIPIO,
  FIELD_SEPARATOR,
  formatCurrency,
} from './ripsConstants';
import type { RipsInvoice } from './ripsValidator';

export interface ProviderConfig {
  nit: string;
  razon_social: string;
  codigo_habilitacion: string;
  municipio_codigo?: string;
  departamento_codigo?: string;
}

export interface RipsPlanoFiles {
  US: string; // Usuarios
  AC: string; // Consultas
  AP: string; // Procedimientos
  AM: string; // Medicamentos
  AT: string; // Otros servicios
  AF: string; // Facturación
  CT: string; // Control
}

const SEP = FIELD_SEPARATOR;

/**
 * Genera todos los archivos RIPS en formato plano
 */
export function generateRipsPlano(
  invoices: RipsInvoice[],
  provider: ProviderConfig,
  periodStart: Date,
  periodEnd: Date
): RipsPlanoFiles {
  const us: string[] = [];
  const ac: string[] = [];
  const ap: string[] = [];
  const am: string[] = [];
  const at: string[] = [];
  const af: string[] = [];

  // Procesar cada factura
  invoices.forEach((invoice) => {
    // Generar línea de usuario
    const userLine = generateUserLine(invoice, provider);
    us.push(userLine);

    // Generar línea de factura
    const invoiceLine = generateInvoiceLine(invoice, provider);
    af.push(invoiceLine);

    // Procesar items de la factura
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item) => {
        const serviceType = item.service_type || 'AP';

        switch (serviceType) {
          case 'AC':
            ac.push(generateConsultaLine(invoice, item, provider));
            break;
          case 'AP':
            ap.push(generateProcedimientoLine(invoice, item, provider));
            break;
          case 'AM':
            am.push(generateMedicamentoLine(invoice, item, provider));
            break;
          case 'AT':
            at.push(generateOtroServicioLine(invoice, item, provider));
            break;
        }
      });
    } else {
      // Si no hay items, generar una consulta genérica
      ac.push(generateConsultaLineGeneric(invoice, provider));
    }
  });

  // Generar archivo de control
  const ct = generateControlLine(
    provider,
    periodStart,
    periodEnd,
    us.length,
    ac.length,
    ap.length,
    am.length,
    at.length,
    af.length
  );

  return {
    US: us.join('\n'),
    AC: ac.join('\n'),
    AP: ap.join('\n'),
    AM: am.join('\n'),
    AT: at.join('\n'),
    AF: af.join('\n'),
    CT: ct,
  };
}

/**
 * Genera línea para archivo US (Usuarios)
 * Formato: TipoDoc|NumDoc|TipoUsuario|PrimerApellido|SegundoApellido|PrimerNombre|SegundoNombre|
 *          Edad|UnidadEdad|Sexo|CodMunicipio|ZonaResidencia
 */
function generateUserLine(invoice: RipsInvoice, provider: ProviderConfig): string {
  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const numDoc = invoice.patient_document_number || '0';
  const tipoUsuario = invoice.patient_tipo_usuario || '4'; // Particular
  const apellidos = splitName(invoice.patient_last_name || '');
  const nombres = splitName(invoice.patient_first_name || '');
  const age = calculateAge(invoice.patient_birth_date);
  const sexo = mapGender(invoice.patient_gender);
  const municipio = invoice.patient_municipio || DEFAULT_MUNICIPIO;
  const zona = invoice.patient_zona || 'U';

  return [
    tipoDoc,
    numDoc,
    '', // Código entidad administradora (vacío para particulares)
    tipoUsuario,
    cleanRipsString(apellidos.first),
    cleanRipsString(apellidos.second),
    cleanRipsString(nombres.first),
    cleanRipsString(nombres.second),
    age.value.toString(),
    age.unit,
    sexo,
    municipio,
    zona,
  ].join(SEP);
}

/**
 * Genera línea para archivo AC (Consultas)
 * Formato: NumFactura|CodPrestador|TipoDoc|NumDoc|FechaConsulta|NumAutorizacion|
 *          CodConsulta|FinalidadConsulta|CausaExterna|DiagPrincipal|DiagRelacionado1|
 *          DiagRelacionado2|DiagRelacionado3|TipoDiagPrincipal|ValorConsulta|ValorCuota|ValorNeto
 */
function generateConsultaLine(
  invoice: RipsInvoice,
  item: { cups_code: string | null; total: number },
  provider: ProviderConfig
): string {
  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const numDoc = invoice.patient_document_number || '0';
  const fechaConsulta = format(new Date(invoice.issue_date), 'dd/MM/yyyy');
  const codConsulta = item.cups_code || '890201';
  const diagPrincipal = invoice.diagnostico_principal || 'Z012';
  const diagRelacionado = invoice.diagnostico_relacionado || '';

  return [
    invoice.invoice_number,
    provider.codigo_habilitacion || provider.nit,
    tipoDoc,
    numDoc,
    fechaConsulta,
    '', // Número autorización
    codConsulta,
    invoice.finalidad_consulta || '10', // No aplica
    invoice.causa_externa || '13', // Enfermedad general
    diagPrincipal,
    diagRelacionado,
    '', // Diag relacionado 2
    '', // Diag relacionado 3
    '1', // Tipo diagnóstico (impresión)
    formatCurrency(item.total),
    '0', // Valor cuota moderadora
    formatCurrency(item.total),
  ].join(SEP);
}

/**
 * Genera línea de consulta genérica cuando no hay items
 */
function generateConsultaLineGeneric(invoice: RipsInvoice, provider: ProviderConfig): string {
  return generateConsultaLine(
    invoice,
    { cups_code: '890201', total: Number(invoice.total) },
    provider
  );
}

/**
 * Genera línea para archivo AP (Procedimientos)
 * Formato: NumFactura|CodPrestador|TipoDoc|NumDoc|FechaProcedimiento|NumAutorizacion|
 *          CodProcedimiento|Ambito|Finalidad|PersonalAtiende|DiagPrincipal|DiagRelacionado|
 *          Complicacion|FormaRealizacion|ValorProcedimiento
 */
function generateProcedimientoLine(
  invoice: RipsInvoice,
  item: { cups_code: string | null; total: number; description: string },
  provider: ProviderConfig
): string {
  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const numDoc = invoice.patient_document_number || '0';
  const fechaProc = format(new Date(invoice.issue_date), 'dd/MM/yyyy');
  const codProc = item.cups_code || '997310'; // Profilaxis por defecto
  const diagPrincipal = invoice.diagnostico_principal || 'Z012';
  const diagRelacionado = invoice.diagnostico_relacionado || '';

  return [
    invoice.invoice_number,
    provider.codigo_habilitacion || provider.nit,
    tipoDoc,
    numDoc,
    fechaProc,
    '', // Número autorización
    codProc,
    '1', // Ámbito: Ambulatorio
    '2', // Finalidad: Terapéutico
    '1', // Personal: Médico especialista
    diagPrincipal,
    diagRelacionado,
    '', // Complicación
    '1', // Forma realización: Única
    formatCurrency(item.total),
  ].join(SEP);
}

/**
 * Genera línea para archivo AM (Medicamentos)
 * Formato: NumFactura|CodPrestador|TipoDoc|NumDoc|NumAutorizacion|CodMedicamento|
 *          TipoMedicamento|NombreGenerico|FormaFarmaceutica|Concentracion|UnidadMedida|
 *          NumeroUnidades|ValorUnitario|ValorTotal|DiagPrincipal|DiagRelacionado
 */
function generateMedicamentoLine(
  invoice: RipsInvoice,
  item: { cups_code: string | null; total: number; description: string; quantity: number; unit_price: number },
  provider: ProviderConfig
): string {
  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const numDoc = invoice.patient_document_number || '0';
  const codMed = item.cups_code || 'J01CA04'; // Código ATC genérico
  const diagPrincipal = invoice.diagnostico_principal || 'Z012';
  const diagRelacionado = invoice.diagnostico_relacionado || '';

  return [
    invoice.invoice_number,
    provider.codigo_habilitacion || provider.nit,
    tipoDoc,
    numDoc,
    '', // Número autorización
    codMed,
    '1', // Tipo: POS
    cleanRipsString(item.description),
    '', // Forma farmacéutica
    '', // Concentración
    'UN', // Unidad medida
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.total),
  ].join(SEP);
}

/**
 * Genera línea para archivo AT (Otros servicios)
 * Formato: NumFactura|CodPrestador|TipoDoc|NumDoc|NumAutorizacion|TipoServicio|
 *          CodServicio|NombreServicio|Cantidad|ValorUnitario|ValorTotal
 */
function generateOtroServicioLine(
  invoice: RipsInvoice,
  item: { cups_code: string | null; total: number; description: string; quantity: number; unit_price: number },
  provider: ProviderConfig
): string {
  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const numDoc = invoice.patient_document_number || '0';

  return [
    invoice.invoice_number,
    provider.codigo_habilitacion || provider.nit,
    tipoDoc,
    numDoc,
    '', // Número autorización
    '1', // Tipo servicio
    item.cups_code || '000000',
    cleanRipsString(item.description),
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.total),
  ].join(SEP);
}

/**
 * Genera línea para archivo AF (Facturación)
 * Formato: CodPrestador|RazonSocial|TipoDoc|NumDoc|NumFactura|FechaExpedicion|
 *          FechaInicioPeriodo|FechaFinPeriodo|CodEntidadAdm|PlanBeneficios|
 *          NumContrato|NumPoliza|ValorCopago|ValorComision|ValorDescuento|ValorNeto
 */
function generateInvoiceLine(invoice: RipsInvoice, provider: ProviderConfig): string {
  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const numDoc = invoice.patient_document_number || '0';
  const fechaExpedicion = format(new Date(invoice.issue_date), 'dd/MM/yyyy');
  const total = Number(invoice.total);

  return [
    provider.codigo_habilitacion || provider.nit,
    cleanRipsString(provider.razon_social),
    tipoDoc,
    numDoc,
    invoice.invoice_number,
    fechaExpedicion,
    fechaExpedicion, // Fecha inicio período
    fechaExpedicion, // Fecha fin período
    '', // Código entidad administradora
    '', // Plan beneficios
    '', // Número contrato
    '', // Número póliza
    '0', // Valor copago
    '0', // Valor comisión
    '0', // Valor descuento
    formatCurrency(total),
  ].join(SEP);
}

/**
 * Genera archivo CT (Control)
 * Formato: CodPrestador|FechaRemision|CodArchivo|TotalRegistros
 */
function generateControlLine(
  provider: ProviderConfig,
  periodStart: Date,
  periodEnd: Date,
  usCount: number,
  acCount: number,
  apCount: number,
  amCount: number,
  atCount: number,
  afCount: number
): string {
  const fechaRemision = format(new Date(), 'dd/MM/yyyy');
  const codPrestador = provider.codigo_habilitacion || provider.nit;

  const lines: string[] = [];

  // Línea por cada archivo generado con registros
  if (usCount > 0) {
    lines.push([codPrestador, fechaRemision, 'US', usCount.toString()].join(SEP));
  }
  if (acCount > 0) {
    lines.push([codPrestador, fechaRemision, 'AC', acCount.toString()].join(SEP));
  }
  if (apCount > 0) {
    lines.push([codPrestador, fechaRemision, 'AP', apCount.toString()].join(SEP));
  }
  if (amCount > 0) {
    lines.push([codPrestador, fechaRemision, 'AM', amCount.toString()].join(SEP));
  }
  if (atCount > 0) {
    lines.push([codPrestador, fechaRemision, 'AT', atCount.toString()].join(SEP));
  }
  if (afCount > 0) {
    lines.push([codPrestador, fechaRemision, 'AF', afCount.toString()].join(SEP));
  }

  return lines.join('\n');
}

/**
 * Divide un nombre en primer y segundo nombre/apellido
 */
function splitName(fullName: string): { first: string; second: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] || '',
    second: parts.slice(1).join(' ') || '',
  };
}

/**
 * Genera el nombre del archivo ZIP
 */
export function generateZipFileName(provider: ProviderConfig, periodStart: Date, periodEnd: Date): string {
  const nit = provider.nit.replace(/[^0-9]/g, '');
  const startStr = format(periodStart, 'yyyyMM');
  const endStr = format(periodEnd, 'yyyyMM');
  return `RIPS_${nit}_${startStr}_${endStr}.zip`;
}

/**
 * Empaqueta los archivos RIPS en un ZIP
 */
export async function packRipsFiles(
  files: RipsPlanoFiles,
  provider: ProviderConfig,
  periodStart: Date,
  periodEnd: Date
): Promise<Blob> {
  const zip = new JSZip();
  const nit = provider.nit.replace(/[^0-9]/g, '');

  // Solo agregar archivos con contenido
  if (files.US.trim()) {
    zip.file(`US${nit}.txt`, files.US);
  }
  if (files.AC.trim()) {
    zip.file(`AC${nit}.txt`, files.AC);
  }
  if (files.AP.trim()) {
    zip.file(`AP${nit}.txt`, files.AP);
  }
  if (files.AM.trim()) {
    zip.file(`AM${nit}.txt`, files.AM);
  }
  if (files.AT.trim()) {
    zip.file(`AT${nit}.txt`, files.AT);
  }
  if (files.AF.trim()) {
    zip.file(`AF${nit}.txt`, files.AF);
  }
  if (files.CT.trim()) {
    zip.file(`CT${nit}.txt`, files.CT);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Calcula estadísticas de los archivos planos
 */
export interface RipsPlanoStats {
  usCount: number;
  acCount: number;
  apCount: number;
  amCount: number;
  atCount: number;
  afCount: number;
  totalRegistros: number;
}

export function calculatePlanoStats(files: RipsPlanoFiles): RipsPlanoStats {
  const countLines = (content: string) => content.trim() ? content.trim().split('\n').length : 0;

  const usCount = countLines(files.US);
  const acCount = countLines(files.AC);
  const apCount = countLines(files.AP);
  const amCount = countLines(files.AM);
  const atCount = countLines(files.AT);
  const afCount = countLines(files.AF);

  return {
    usCount,
    acCount,
    apCount,
    amCount,
    atCount,
    afCount,
    totalRegistros: usCount + acCount + apCount + amCount + atCount + afCount,
  };
}
