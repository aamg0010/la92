/**
 * useRips Hook - Gestión de RIPS (Resolución 2275/2023)
 * Funciones para generar, validar y gestionar reportes RIPS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

import {
  validateInvoices,
  validateProviderSettings,
  type RipsInvoice,
  type RipsInvoiceItem,
  type ValidationResult,
  type ProviderValidationResult,
} from '@/lib/utils/rips/ripsValidator';

import {
  generateRipsJson,
  ripsJsonToString,
  calculateRipsStats,
  type RipsJsonRoot,
  type ProviderConfig,
} from '@/lib/utils/rips/ripsJsonGenerator';

import {
  generateRipsPlano,
  packRipsFiles,
  generateZipFileName,
  calculatePlanoStats,
  type RipsPlanoFiles,
} from '@/lib/utils/rips/ripsPlanoGenerator';

// Types
export interface RipsReport {
  id: string;
  report_number: string;
  period_start: string;
  period_end: string;
  format: 'json' | 'plano';
  status: 'generated' | 'submitted' | 'accepted' | 'rejected';
  file_name: string | null;
  records_count: number;
  total_invoiced: number;
  generated_by_name: string | null;
  created_at: string;
}

export interface RipsProviderSettings {
  id?: string;
  nit: string;
  razon_social: string;
  tipo_identificacion: string;
  codigo_habilitacion: string;
  direccion: string;
  municipio_codigo: string;
  departamento_codigo: string;
  telefono: string;
  email: string;
  prefijo_factura: string;
  resolucion_facturacion: string;
  fecha_resolucion: string | null;
  rango_desde: number | null;
  rango_hasta: number | null;
  representante_nombre: string;
  representante_documento: string;
  representante_tipo_doc: string;
}

export interface DiagnosisCatalog {
  id: string;
  code: string;
  name: string;
  chapter: string | null;
  group_code: string | null;
  is_active: boolean;
}

export interface ServicesCatalog {
  id: string;
  code: string;
  name: string;
  service_type: 'AC' | 'AP' | 'AM' | 'AT';
  specialty: string | null;
  is_active: boolean;
}

// =====================================================
// RIPS INVOICES (For generation)
// =====================================================

export function useRipsInvoices(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ['rips-invoices', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];

      const { data, error } = await api.rpc<RipsInvoice[]>('get_rips_invoices', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

      // Get items for each invoice
      const invoicesWithItems = await Promise.all(
        (data || []).map(async (invoice) => {
          const { data: items } = await api.rpc<RipsInvoiceItem[]>('get_rips_invoice_items', {
            p_invoice_id: invoice.id,
          });
          return { ...invoice, items: items || [] };
        })
      );

      return invoicesWithItems;
    },
    enabled: !!startDate && !!endDate,
  });
}

// =====================================================
// RIPS REPORTS (History)
// =====================================================

export function useRipsReports() {
  return useQuery({
    queryKey: ['rips-reports'],
    queryFn: async () => {
      const { data, error } = await api.rpc<RipsReport[]>('get_rips_reports');
      if (error) throw error;
      return data || [];
    },
  });
}

// =====================================================
// RIPS PROVIDER SETTINGS
// =====================================================

export function useRipsProviderSettings() {
  return useQuery({
    queryKey: ['rips-provider-settings'],
    queryFn: async () => {
      const { data, error } = await api.rpc<RipsProviderSettings[]>('get_rips_provider_settings');
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
  });
}

export function useSaveRipsProviderSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<RipsProviderSettings>) => {
      const { data, error } = await api.rpc<string>('save_rips_provider_settings', {
        p_nit: settings.nit || '',
        p_razon_social: settings.razon_social || '',
        p_tipo_identificacion: settings.tipo_identificacion || '31',
        p_codigo_habilitacion: settings.codigo_habilitacion || null,
        p_direccion: settings.direccion || null,
        p_municipio_codigo: settings.municipio_codigo || null,
        p_departamento_codigo: settings.departamento_codigo || null,
        p_telefono: settings.telefono || null,
        p_email: settings.email || null,
        p_prefijo_factura: settings.prefijo_factura || 'FEV',
        p_resolucion_facturacion: settings.resolucion_facturacion || null,
        p_fecha_resolucion: settings.fecha_resolucion || null,
        p_rango_desde: settings.rango_desde || null,
        p_rango_hasta: settings.rango_hasta || null,
        p_representante_nombre: settings.representante_nombre || null,
        p_representante_documento: settings.representante_documento || null,
        p_representante_tipo_doc: settings.representante_tipo_doc || 'CC',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rips-provider-settings'] });
      toast({
        title: 'Configuracion guardada',
        description: 'Los datos del prestador han sido actualizados.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// =====================================================
// CATALOGS
// =====================================================

export function useRipsDiagnosisCatalog(search?: string) {
  return useQuery({
    queryKey: ['rips-diagnosis-catalog', search],
    queryFn: async () => {
      let query = api
        .from<DiagnosisCatalog>('rips_diagnosis_catalog')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (search && search.length >= 2) {
        query = query.or([`code.ilike.%${search}%`, `name.ilike.%${search}%`]);
      }

      query = query.limit(50);

      const { data, error } = await query;
      if (error) throw error;
      return data as DiagnosisCatalog[];
    },
  });
}

export function useRipsServicesCatalog(serviceType?: string, search?: string) {
  return useQuery({
    queryKey: ['rips-services-catalog', serviceType, search],
    queryFn: async () => {
      let query = api
        .from<ServicesCatalog>('rips_services_catalog')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      if (search && search.length >= 2) {
        query = query.or([`code.ilike.%${search}%`, `name.ilike.%${search}%`]);
      }

      query = query.limit(50);

      const { data, error } = await query;
      if (error) throw error;
      return data as ServicesCatalog[];
    },
  });
}

// =====================================================
// VALIDATION
// =====================================================

export function useValidateRipsInvoices(invoices: RipsInvoice[]): ValidationResult {
  return validateInvoices(invoices);
}

export function useValidateProviderSettings(
  settings: RipsProviderSettings | null
): ProviderValidationResult {
  return validateProviderSettings(settings);
}

// =====================================================
// GENERATION
// =====================================================

export function useGenerateRipsJson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      invoices,
      provider,
      periodStart,
      periodEnd,
    }: {
      invoices: RipsInvoice[];
      provider: ProviderConfig;
      periodStart: Date;
      periodEnd: Date;
    }) => {
      // Generate report number
      const reportNumber = `RIPS-${format(new Date(), 'yyyyMMddHHmmss')}`;

      // Generate JSON
      const ripsJson = generateRipsJson(invoices, provider, reportNumber);
      const jsonString = ripsJsonToString(ripsJson);
      const stats = calculateRipsStats(ripsJson);

      // Calculate total
      const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      // Save report to database
      const { data: reportId, error } = await api.rpc<string>('save_rips_report', {
        p_report_number: reportNumber,
        p_period_start: format(periodStart, 'yyyy-MM-dd'),
        p_period_end: format(periodEnd, 'yyyy-MM-dd'),
        p_format: 'json',
        p_records_count: stats.totalFacturas,
        p_total_invoiced: totalInvoiced,
        p_json_data: ripsJson,
        p_file_name: `${reportNumber}.json`,
        p_user_id: user?.id || null,
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const fileName = `${reportNumber}.json`;
      saveAs(blob, fileName);

      return {
        reportId,
        reportNumber,
        fileName,
        stats,
        totalInvoiced,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rips-reports'] });
      toast({
        title: 'RIPS JSON generado',
        description: `Archivo ${data.fileName} descargado. ${data.stats.totalFacturas} facturas procesadas.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al generar RIPS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useGenerateRipsPlano() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      invoices,
      provider,
      periodStart,
      periodEnd,
    }: {
      invoices: RipsInvoice[];
      provider: ProviderConfig;
      periodStart: Date;
      periodEnd: Date;
    }) => {
      // Generate report number
      const reportNumber = `RIPS-${format(new Date(), 'yyyyMMddHHmmss')}`;

      // Generate plano files
      const files = generateRipsPlano(invoices, provider, periodStart, periodEnd);
      const stats = calculatePlanoStats(files);

      // Calculate total
      const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      // Pack into ZIP
      const zipBlob = await packRipsFiles(files, provider, periodStart, periodEnd);
      const fileName = generateZipFileName(provider, periodStart, periodEnd);

      // Save report to database
      const { data: reportId, error } = await api.rpc<string>('save_rips_report', {
        p_report_number: reportNumber,
        p_period_start: format(periodStart, 'yyyy-MM-dd'),
        p_period_end: format(periodEnd, 'yyyy-MM-dd'),
        p_format: 'plano',
        p_records_count: stats.totalRegistros,
        p_total_invoiced: totalInvoiced,
        p_json_data: null,
        p_file_name: fileName,
        p_user_id: user?.id || null,
      });

      if (error) throw error;

      // Download ZIP
      saveAs(zipBlob, fileName);

      return {
        reportId,
        reportNumber,
        fileName,
        stats,
        totalInvoiced,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rips-reports'] });
      toast({
        title: 'RIPS Plano generado',
        description: `Archivo ${data.fileName} descargado. ${data.stats.totalRegistros} registros procesados.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al generar RIPS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// =====================================================
// STATS
// =====================================================

export function useRipsStats(startDate: string | null, endDate: string | null) {
  const { data: invoices = [] } = useRipsInvoices(startDate, endDate);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPatients = new Set(invoices.map((inv) => inv.patient_id)).size;
  const pendingCount = invoices.filter((inv) => inv.rips_status === 'pending').length;
  const generatedCount = invoices.filter((inv) => inv.rips_status === 'generated').length;

  return {
    totalInvoices: invoices.length,
    totalInvoiced,
    totalPatients,
    pendingCount,
    generatedCount,
  };
}
