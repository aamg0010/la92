/**
 * RipsSettings Component
 * Configuracion del prestador para RIPS
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useRipsProviderSettings, useSaveRipsProviderSettings } from '@/hooks/useRips';
import {
  TIPO_DOCUMENTO_OPTIONS,
  DEPARTAMENTOS_OPTIONS,
  MUNICIPIOS_HUILA,
} from '@/lib/utils/rips';

// Validation schema
const providerSettingsSchema = z.object({
  nit: z.string().min(1, 'NIT es obligatorio'),
  razon_social: z.string().min(1, 'Razon social es obligatoria'),
  tipo_identificacion: z.string().default('31'),
  codigo_habilitacion: z.string().optional(),
  direccion: z.string().optional(),
  municipio_codigo: z.string().optional(),
  departamento_codigo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  prefijo_factura: z.string().default('FEV'),
  resolucion_facturacion: z.string().optional(),
  fecha_resolucion: z.string().optional(),
  rango_desde: z.number().optional().nullable(),
  rango_hasta: z.number().optional().nullable(),
  representante_nombre: z.string().optional(),
  representante_documento: z.string().optional(),
  representante_tipo_doc: z.string().default('CC'),
});

type ProviderSettingsForm = z.infer<typeof providerSettingsSchema>;

export function RipsSettings() {
  const { data: settings, isLoading } = useRipsProviderSettings();
  const saveSettings = useSaveRipsProviderSettings();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProviderSettingsForm>({
    resolver: zodResolver(providerSettingsSchema),
    defaultValues: {
      nit: '',
      razon_social: '',
      tipo_identificacion: '31',
      codigo_habilitacion: '',
      direccion: '',
      municipio_codigo: '',
      departamento_codigo: '41', // Huila
      telefono: '',
      email: '',
      prefijo_factura: 'FEV',
      resolucion_facturacion: '',
      fecha_resolucion: '',
      rango_desde: null,
      rango_hasta: null,
      representante_nombre: '',
      representante_documento: '',
      representante_tipo_doc: 'CC',
    },
  });

  // Load existing settings
  useEffect(() => {
    if (settings) {
      reset({
        nit: settings.nit || '',
        razon_social: settings.razon_social || '',
        tipo_identificacion: settings.tipo_identificacion || '31',
        codigo_habilitacion: settings.codigo_habilitacion || '',
        direccion: settings.direccion || '',
        municipio_codigo: settings.municipio_codigo || '',
        departamento_codigo: settings.departamento_codigo || '41',
        telefono: settings.telefono || '',
        email: settings.email || '',
        prefijo_factura: settings.prefijo_factura || 'FEV',
        resolucion_facturacion: settings.resolucion_facturacion || '',
        fecha_resolucion: settings.fecha_resolucion || '',
        rango_desde: settings.rango_desde,
        rango_hasta: settings.rango_hasta,
        representante_nombre: settings.representante_nombre || '',
        representante_documento: settings.representante_documento || '',
        representante_tipo_doc: settings.representante_tipo_doc || 'CC',
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: ProviderSettingsForm) => {
    await saveSettings.mutateAsync(data);
  };

  const departamento = watch('departamento_codigo');

  // Get municipalities for selected department
  const getMunicipios = () => {
    // For now, only Huila municipalities
    if (departamento === '41') {
      return Object.entries(MUNICIPIOS_HUILA).map(([code, name]) => ({
        value: code,
        label: `${code} - ${name}`,
      }));
    }
    return [];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Provider Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Datos del Prestador</CardTitle>
              <CardDescription>
                Informacion requerida para la generacion de RIPS
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nit">
                NIT <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nit"
                placeholder="900123456-7"
                {...register('nit')}
                className={errors.nit ? 'border-destructive' : ''}
              />
              {errors.nit && (
                <p className="text-xs text-destructive">{errors.nit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_identificacion">Tipo de Identificacion</Label>
              <Select
                value={watch('tipo_identificacion')}
                onValueChange={(v) => setValue('tipo_identificacion', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="31">NIT</SelectItem>
                  <SelectItem value="13">Cedula de ciudadania</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="razon_social">
                Razon Social <span className="text-destructive">*</span>
              </Label>
              <Input
                id="razon_social"
                placeholder="Clinica Dental La 92 S.A.S."
                {...register('razon_social')}
                className={errors.razon_social ? 'border-destructive' : ''}
              />
              {errors.razon_social && (
                <p className="text-xs text-destructive">{errors.razon_social.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_habilitacion">Codigo de Habilitacion</Label>
              <Input
                id="codigo_habilitacion"
                placeholder="41001xxxxxxx"
                {...register('codigo_habilitacion')}
              />
              <p className="text-xs text-muted-foreground">
                Codigo asignado por la Secretaria de Salud
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" placeholder="(608) 123 4567" {...register('telefono')} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Direccion</Label>
              <Input
                id="direccion"
                placeholder="Calle 1 # 2-34, Barrio Centro"
                {...register('direccion')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento_codigo">Departamento</Label>
              <Select
                value={watch('departamento_codigo')}
                onValueChange={(v) => setValue('departamento_codigo', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS_OPTIONS.map((dep) => (
                    <SelectItem key={dep.value} value={dep.value}>
                      {dep.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio_codigo">Municipio</Label>
              <Select
                value={watch('municipio_codigo')}
                onValueChange={(v) => setValue('municipio_codigo', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  {getMunicipios().map((mun) => (
                    <SelectItem key={mun.value} value={mun.value}>
                      {mun.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contacto@clinica.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Resolution */}
      <Card>
        <CardHeader>
          <CardTitle>Resolucion de Facturacion</CardTitle>
          <CardDescription>
            Datos de la resolucion de facturacion electronica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefijo_factura">Prefijo de Factura</Label>
              <Input
                id="prefijo_factura"
                placeholder="FEV"
                {...register('prefijo_factura')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolucion_facturacion">Numero de Resolucion</Label>
              <Input
                id="resolucion_facturacion"
                placeholder="18760000001234"
                {...register('resolucion_facturacion')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_resolucion">Fecha de Resolucion</Label>
              <Input
                id="fecha_resolucion"
                type="date"
                {...register('fecha_resolucion')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rango_desde">Rango Desde</Label>
                <Input
                  id="rango_desde"
                  type="number"
                  placeholder="1"
                  {...register('rango_desde', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rango_hasta">Rango Hasta</Label>
                <Input
                  id="rango_hasta"
                  type="number"
                  placeholder="5000"
                  {...register('rango_hasta', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Representative */}
      <Card>
        <CardHeader>
          <CardTitle>Representante Legal</CardTitle>
          <CardDescription>
            Datos del representante legal del prestador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="representante_nombre">Nombre Completo</Label>
              <Input
                id="representante_nombre"
                placeholder="Juan Carlos Perez Rodriguez"
                {...register('representante_nombre')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representante_tipo_doc">Tipo de Documento</Label>
              <Select
                value={watch('representante_tipo_doc')}
                onValueChange={(v) => setValue('representante_tipo_doc', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_DOCUMENTO_OPTIONS.filter(t => ['CC', 'CE', 'PA'].includes(t.value)).map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="representante_documento">Numero de Documento</Label>
              <Input
                id="representante_documento"
                placeholder="1234567890"
                {...register('representante_documento')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={saveSettings.isPending || !isDirty}
          className="min-w-[200px]"
        >
          {saveSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuracion
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
