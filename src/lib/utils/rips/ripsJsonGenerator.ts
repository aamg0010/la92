/**
 * RIPS JSON Generator - Resolución 2275/2023
 * Genera archivo JSON según especificación del Ministerio de Salud
 */

import { format } from 'date-fns';
import {
  mapDocumentType,
  mapGender,
  calculateAge,
  cleanRipsString,
  DEFAULT_MUNICIPIO,
  DEFAULT_DEPARTAMENTO,
  RIPS_JSON_VERSION,
} from './ripsConstants';
import type { RipsInvoice, RipsInvoiceItem } from './ripsValidator';

// Interfaces para la estructura JSON de RIPS
export interface RipsJsonUsuario {
  tipoDocumentoIdentificacion: string;
  numDocumentoIdentificacion: string;
  tipoUsuario: string;
  fechaNacimiento: string;
  codSexo: string;
  codPaisResidencia: string;
  codMunicipioResidencia: string;
  codZonaTerritorialResidencia: string;
  incapacidad: string;
  consecutivo: number;
  codPaisOrigen: string;
  primerApellido: string;
  segundoApellido: string;
  primerNombre: string;
  segundoNombre: string;
}

export interface RipsJsonConsulta {
  codPrestador: string;
  fechaInicioAtencion: string;
  numAutorizacion: string;
  codConsulta: string;
  modalidadGrupoServicioTecSal: string;
  grupoServicios: string;
  codServicio: number;
  finalidadTecnologiaSalud: string;
  causaMotivoAtencion: string;
  codDiagnosticoPrincipal: string;
  codDiagnosticoRelacionado1: string;
  codDiagnosticoRelacionado2: string;
  codDiagnosticoRelacionado3: string;
  tipoDiagnosticoPrincipal: string;
  tipoDocumentoIdentificacion: string;
  numDocumentoIdentificacion: string;
  vrServicio: number;
  conceptoRecaudo: string;
  valorPagoModerador: number;
  numFEVPagoModerador: string;
  consecutivo: number;
}

export interface RipsJsonProcedimiento {
  codPrestador: string;
  fechaInicioAtencion: string;
  idMIPRES: string;
  numAutorizacion: string;
  codProcedimiento: string;
  viaIngresoServicioSalud: string;
  modalidadGrupoServicioTecSal: string;
  grupoServicios: string;
  codServicio: number;
  finalidadTecnologiaSalud: string;
  tipoDocumentoIdentificacion: string;
  numDocumentoIdentificacion: string;
  codDiagnosticoPrincipal: string;
  codDiagnosticoRelacionado: string;
  codComplicacion: string;
  vrServicio: number;
  conceptoRecaudo: string;
  valorPagoModerador: number;
  numFEVPagoModerador: string;
  consecutivo: number;
}

export interface RipsJsonMedicamento {
  codPrestador: string;
  numAutorizacion: string;
  idMIPRES: string;
  fechaDispensAdmon: string;
  codDiagnosticoPrincipal: string;
  codDiagnosticoRelacionado: string;
  tipoMedicamento: string;
  codTecnologiaSalud: string;
  nomTecnologiaSalud: string;
  concentracionMedicamento: string;
  unidadMedida: string;
  formaFarmaceutica: string;
  unidadMinDispensa: string;
  cantidadMedicamento: number;
  diasTratamiento: number;
  tipoDocumentoIdentificacion: string;
  numDocumentoIdentificacion: string;
  vrUnitMedicamento: number;
  vrServicio: number;
  conceptoRecaudo: string;
  valorPagoModerador: number;
  numFEVPagoModerador: string;
  consecutivo: number;
}

export interface RipsJsonOtroServicio {
  codPrestador: string;
  numAutorizacion: string;
  idMIPRES: string;
  fechaSuministroTecnologia: string;
  tipoOS: string;
  codTecnologiaSalud: string;
  nomTecnologiaSalud: string;
  cantidadOS: number;
  tipoDocumentoIdentificacion: string;
  numDocumentoIdentificacion: string;
  vrUnitOS: number;
  vrServicio: number;
  conceptoRecaudo: string;
  valorPagoModerador: number;
  numFEVPagoModerador: string;
  consecutivo: number;
}

export interface RipsJsonServicios {
  consultas: RipsJsonConsulta[];
  procedimientos: RipsJsonProcedimiento[];
  medicamentos: RipsJsonMedicamento[];
  otrosServicios: RipsJsonOtroServicio[];
}

export interface RipsJsonDocument {
  numDocumentoIdObligado: string;
  numFactura: string;
  tipoNota: string | null;
  numNota: string | null;
  usuarios: RipsJsonUsuario[];
  servicios: RipsJsonServicios;
}

export interface RipsJsonRoot {
  version: string;
  fechaGeneracion: string;
  numRemision: string;
  codPrestador: string;
  facturas: RipsJsonDocument[];
}

export interface ProviderConfig {
  nit: string;
  razon_social: string;
  codigo_habilitacion: string;
  municipio_codigo?: string;
  departamento_codigo?: string;
}

/**
 * Genera la estructura JSON completa para RIPS
 */
export function generateRipsJson(
  invoices: RipsInvoice[],
  provider: ProviderConfig,
  reportNumber: string
): RipsJsonRoot {
  const now = new Date();
  const codPrestador = provider.codigo_habilitacion || provider.nit;

  const facturas: RipsJsonDocument[] = invoices.map((invoice) => {
    return generateInvoiceJson(invoice, provider, codPrestador);
  });

  return {
    version: RIPS_JSON_VERSION,
    fechaGeneracion: format(now, 'yyyy-MM-dd HH:mm:ss'),
    numRemision: reportNumber,
    codPrestador,
    facturas,
  };
}

/**
 * Genera JSON para una factura individual
 */
function generateInvoiceJson(
  invoice: RipsInvoice,
  provider: ProviderConfig,
  codPrestador: string
): RipsJsonDocument {
  const usuario = generateUsuarioJson(invoice);
  const servicios = generateServiciosJson(invoice, codPrestador);

  return {
    numDocumentoIdObligado: provider.nit,
    numFactura: invoice.invoice_number,
    tipoNota: null,
    numNota: null,
    usuarios: [usuario],
    servicios,
  };
}

/**
 * Genera datos del usuario (paciente)
 */
function generateUsuarioJson(invoice: RipsInvoice): RipsJsonUsuario {
  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const nombres = splitName(invoice.patient_first_name || '');
  const apellidos = splitName(invoice.patient_last_name || '');
  const age = calculateAge(invoice.patient_birth_date);

  return {
    tipoDocumentoIdentificacion: tipoDoc,
    numDocumentoIdentificacion: invoice.patient_document_number || '0',
    tipoUsuario: invoice.patient_tipo_usuario || '04', // Particular por defecto
    fechaNacimiento: invoice.patient_birth_date
      ? format(new Date(invoice.patient_birth_date), 'yyyy-MM-dd')
      : format(new Date(new Date().getFullYear() - 30, 0, 1), 'yyyy-MM-dd'), // Default 30 años
    codSexo: mapGender(invoice.patient_gender),
    codPaisResidencia: '170', // Colombia
    codMunicipioResidencia: invoice.patient_municipio || DEFAULT_MUNICIPIO,
    codZonaTerritorialResidencia: invoice.patient_zona || 'U',
    incapacidad: 'NO',
    consecutivo: 1,
    codPaisOrigen: '170', // Colombia
    primerApellido: cleanRipsString(apellidos.first),
    segundoApellido: cleanRipsString(apellidos.second),
    primerNombre: cleanRipsString(nombres.first),
    segundoNombre: cleanRipsString(nombres.second),
  };
}

/**
 * Genera servicios agrupados
 */
function generateServiciosJson(invoice: RipsInvoice, codPrestador: string): RipsJsonServicios {
  const consultas: RipsJsonConsulta[] = [];
  const procedimientos: RipsJsonProcedimiento[] = [];
  const medicamentos: RipsJsonMedicamento[] = [];
  const otrosServicios: RipsJsonOtroServicio[] = [];

  const tipoDoc = mapDocumentType(invoice.patient_document_type);
  const numDoc = invoice.patient_document_number || '0';
  const fechaAtencion = format(new Date(invoice.issue_date), 'yyyy-MM-dd');
  const diagPrincipal = invoice.diagnostico_principal || 'Z012'; // Examen odontológico
  const diagRelacionado = invoice.diagnostico_relacionado || '';

  // Si no hay items, crear una consulta genérica
  if (!invoice.items || invoice.items.length === 0) {
    consultas.push({
      codPrestador,
      fechaInicioAtencion: fechaAtencion,
      numAutorizacion: '',
      codConsulta: '890201', // Consulta primera vez odontología
      modalidadGrupoServicioTecSal: '01', // Intramural
      grupoServicios: '01', // Consulta externa
      codServicio: 949, // Odontología general
      finalidadTecnologiaSalud: invoice.finalidad_consulta || '16', // No aplica
      causaMotivoAtencion: invoice.causa_externa || '13', // Enfermedad general
      codDiagnosticoPrincipal: diagPrincipal,
      codDiagnosticoRelacionado1: diagRelacionado,
      codDiagnosticoRelacionado2: '',
      codDiagnosticoRelacionado3: '',
      tipoDiagnosticoPrincipal: '1', // Impresión diagnóstica
      tipoDocumentoIdentificacion: tipoDoc,
      numDocumentoIdentificacion: numDoc,
      vrServicio: Number(invoice.total),
      conceptoRecaudo: '05', // Copago
      valorPagoModerador: 0,
      numFEVPagoModerador: '',
      consecutivo: 1,
    });

    return { consultas, procedimientos, medicamentos, otrosServicios };
  }

  // Procesar items
  let consultaConsec = 1;
  let procConsec = 1;
  let medConsec = 1;
  let otrosConsec = 1;

  invoice.items.forEach((item) => {
    const serviceType = item.service_type || 'AP';
    const cupsCode = item.cups_code || '890201';
    const vrServicio = Number(item.total);

    switch (serviceType) {
      case 'AC': // Consulta
        consultas.push({
          codPrestador,
          fechaInicioAtencion: fechaAtencion,
          numAutorizacion: '',
          codConsulta: cupsCode,
          modalidadGrupoServicioTecSal: '01',
          grupoServicios: '01',
          codServicio: 949,
          finalidadTecnologiaSalud: invoice.finalidad_consulta || '16',
          causaMotivoAtencion: invoice.causa_externa || '13',
          codDiagnosticoPrincipal: diagPrincipal,
          codDiagnosticoRelacionado1: diagRelacionado,
          codDiagnosticoRelacionado2: '',
          codDiagnosticoRelacionado3: '',
          tipoDiagnosticoPrincipal: '1',
          tipoDocumentoIdentificacion: tipoDoc,
          numDocumentoIdentificacion: numDoc,
          vrServicio,
          conceptoRecaudo: '05',
          valorPagoModerador: 0,
          numFEVPagoModerador: '',
          consecutivo: consultaConsec++,
        });
        break;

      case 'AP': // Procedimiento
        procedimientos.push({
          codPrestador,
          fechaInicioAtencion: fechaAtencion,
          idMIPRES: '',
          numAutorizacion: '',
          codProcedimiento: cupsCode,
          viaIngresoServicioSalud: '01', // Urgencias
          modalidadGrupoServicioTecSal: '01',
          grupoServicios: '01',
          codServicio: 949,
          finalidadTecnologiaSalud: '2', // Terapéutico
          tipoDocumentoIdentificacion: tipoDoc,
          numDocumentoIdentificacion: numDoc,
          codDiagnosticoPrincipal: diagPrincipal,
          codDiagnosticoRelacionado: diagRelacionado,
          codComplicacion: '',
          vrServicio,
          conceptoRecaudo: '05',
          valorPagoModerador: 0,
          numFEVPagoModerador: '',
          consecutivo: procConsec++,
        });
        break;

      case 'AM': // Medicamento
        medicamentos.push({
          codPrestador,
          numAutorizacion: '',
          idMIPRES: '',
          fechaDispensAdmon: fechaAtencion,
          codDiagnosticoPrincipal: diagPrincipal,
          codDiagnosticoRelacionado: diagRelacionado,
          tipoMedicamento: '01', // Medicamento POS
          codTecnologiaSalud: cupsCode,
          nomTecnologiaSalud: cleanRipsString(item.description),
          concentracionMedicamento: '',
          unidadMedida: 'Unidad',
          formaFarmaceutica: '',
          unidadMinDispensa: '1',
          cantidadMedicamento: item.quantity,
          diasTratamiento: 1,
          tipoDocumentoIdentificacion: tipoDoc,
          numDocumentoIdentificacion: numDoc,
          vrUnitMedicamento: Number(item.unit_price),
          vrServicio,
          conceptoRecaudo: '05',
          valorPagoModerador: 0,
          numFEVPagoModerador: '',
          consecutivo: medConsec++,
        });
        break;

      case 'AT': // Otro servicio
        otrosServicios.push({
          codPrestador,
          numAutorizacion: '',
          idMIPRES: '',
          fechaSuministroTecnologia: fechaAtencion,
          tipoOS: '01',
          codTecnologiaSalud: cupsCode,
          nomTecnologiaSalud: cleanRipsString(item.description),
          cantidadOS: item.quantity,
          tipoDocumentoIdentificacion: tipoDoc,
          numDocumentoIdentificacion: numDoc,
          vrUnitOS: Number(item.unit_price),
          vrServicio,
          conceptoRecaudo: '05',
          valorPagoModerador: 0,
          numFEVPagoModerador: '',
          consecutivo: otrosConsec++,
        });
        break;
    }
  });

  // Si no se generaron consultas, agregar una por defecto
  if (consultas.length === 0 && procedimientos.length > 0) {
    // No es necesario agregar consulta si hay procedimientos
  }

  return { consultas, procedimientos, medicamentos, otrosServicios };
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
 * Convierte el JSON a string formateado para descarga
 */
export function ripsJsonToString(data: RipsJsonRoot): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Calcula estadísticas del archivo RIPS generado
 */
export interface RipsStats {
  totalFacturas: number;
  totalUsuarios: number;
  totalConsultas: number;
  totalProcedimientos: number;
  totalMedicamentos: number;
  totalOtrosServicios: number;
  valorTotalFacturado: number;
}

export function calculateRipsStats(data: RipsJsonRoot): RipsStats {
  let totalUsuarios = 0;
  let totalConsultas = 0;
  let totalProcedimientos = 0;
  let totalMedicamentos = 0;
  let totalOtrosServicios = 0;
  let valorTotalFacturado = 0;

  data.facturas.forEach((factura) => {
    totalUsuarios += factura.usuarios.length;
    totalConsultas += factura.servicios.consultas.length;
    totalProcedimientos += factura.servicios.procedimientos.length;
    totalMedicamentos += factura.servicios.medicamentos.length;
    totalOtrosServicios += factura.servicios.otrosServicios.length;

    // Calcular valor total
    factura.servicios.consultas.forEach((c) => (valorTotalFacturado += c.vrServicio));
    factura.servicios.procedimientos.forEach((p) => (valorTotalFacturado += p.vrServicio));
    factura.servicios.medicamentos.forEach((m) => (valorTotalFacturado += m.vrServicio));
    factura.servicios.otrosServicios.forEach((o) => (valorTotalFacturado += o.vrServicio));
  });

  return {
    totalFacturas: data.facturas.length,
    totalUsuarios,
    totalConsultas,
    totalProcedimientos,
    totalMedicamentos,
    totalOtrosServicios,
    valorTotalFacturado,
  };
}
