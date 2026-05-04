/**
 * RipsGenerator Component
 * Formulario para generar archivos RIPS (JSON o Plano)
 */

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, FileJson, FileArchive, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import {
  useRipsInvoices,
  useRipsProviderSettings,
  useGenerateRipsJson,
  useGenerateRipsPlano,
} from '@/hooks/useRips';
import { useCurrency } from '@/hooks/useCurrency';
import { validateInvoices, validateProviderSettings } from '@/lib/utils/rips';

type RipsFormat = 'json' | 'plano';

export function RipsGenerator() {
  const [format_, setFormat] = useState<RipsFormat>('json');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const lastMonth = subMonths(new Date(), 1);
    return {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth),
    };
  });

  const { formatMoney } = useCurrency();

  // Data queries
  const { data: invoices = [], isLoading: loadingInvoices } = useRipsInvoices(
    format(dateRange.from, 'yyyy-MM-dd'),
    format(dateRange.to, 'yyyy-MM-dd')
  );
  const { data: providerSettings, isLoading: loadingProvider } = useRipsProviderSettings();

  // Mutations
  const generateJson = useGenerateRipsJson();
  const generatePlano = useGenerateRipsPlano();

  // Validation
  const invoiceValidation = validateInvoices(invoices);
  const providerValidation = validateProviderSettings(providerSettings);

  const isLoading = loadingInvoices || loadingProvider;
  const isGenerating = generateJson.isPending || generatePlano.isPending;
  const canGenerate =
    invoices.length > 0 &&
    providerValidation.isValid &&
    invoiceValidation.isValid;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  const handleGenerate = async () => {
    if (!providerSettings) return;

    const provider = {
      nit: providerSettings.nit,
      razon_social: providerSettings.razon_social,
      codigo_habilitacion: providerSettings.codigo_habilitacion,
      municipio_codigo: providerSettings.municipio_codigo,
      departamento_codigo: providerSettings.departamento_codigo,
    };

    if (format_ === 'json') {
      await generateJson.mutateAsync({
        invoices,
        provider,
        periodStart: dateRange.from,
        periodEnd: dateRange.to,
      });
    } else {
      await generatePlano.mutateAsync({
        invoices,
        provider,
        periodStart: dateRange.from,
        periodEnd: dateRange.to,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Periodo a Reportar</CardTitle>
          <CardDescription>
            Seleccione el rango de fechas para incluir en el reporte RIPS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      format(dateRange.from, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <Label className="mb-2 block">Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? (
                      format(dateRange.to, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick period buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lastMonth = subMonths(new Date(), 1);
                setDateRange({
                  from: startOfMonth(lastMonth),
                  to: endOfMonth(lastMonth),
                });
              }}
            >
              Mes anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateRange({
                  from: startOfMonth(new Date()),
                  to: endOfMonth(new Date()),
                });
              }}
            >
              Mes actual
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const threeMonthsAgo = subMonths(new Date(), 3);
                setDateRange({
                  from: startOfMonth(threeMonthsAgo),
                  to: endOfMonth(subMonths(new Date(), 1)),
                });
              }}
            >
              Ultimo trimestre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Periodo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Facturas</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Facturado</p>
                <p className="text-2xl font-bold">{formatMoney(totalInvoiced)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Pacientes</p>
                <p className="text-2xl font-bold">
                  {new Set(invoices.map((i) => i.patient_id)).size}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Estado</p>
                {invoiceValidation.isValid ? (
                  <Badge className="mt-1 bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Listo
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {invoiceValidation.summary.errorCount} errores
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Alerts */}
      {!providerValidation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuracion del Prestador Incompleta</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {providerValidation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {invoiceValidation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errores en Facturas ({invoiceValidation.summary.errorCount})</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              {invoiceValidation.summary.invalidInvoices} de{' '}
              {invoiceValidation.summary.totalInvoices} facturas tienen errores que deben
              corregirse.
            </p>
            <details className="cursor-pointer">
              <summary className="text-sm font-medium">Ver detalles</summary>
              <ul className="list-disc list-inside mt-2 max-h-40 overflow-y-auto text-sm">
                {invoiceValidation.errors.slice(0, 10).map((error, i) => (
                  <li key={i}>
                    {error.invoiceNumber} - {error.patientName}: {error.message}
                  </li>
                ))}
                {invoiceValidation.errors.length > 10 && (
                  <li className="text-muted-foreground">
                    ... y {invoiceValidation.errors.length - 10} errores mas
                  </li>
                )}
              </ul>
            </details>
          </AlertDescription>
        </Alert>
      )}

      {invoiceValidation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Advertencias ({invoiceValidation.summary.warningCount})</AlertTitle>
          <AlertDescription>
            <p className="text-sm">
              Algunos campos faltantes usaran valores por defecto. Revise los datos si es
              necesario.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Formato de Salida</CardTitle>
          <CardDescription>
            Seleccione el formato para generar los archivos RIPS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={format_}
            onValueChange={(v) => setFormat(v as RipsFormat)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Label
              htmlFor="json"
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                format_ === 'json' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
              )}
            >
              <RadioGroupItem value="json" id="json" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  <span className="font-semibold">RIPS JSON</span>
                  <Badge variant="secondary" className="text-xs">
                    Res. 2275/2023
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Formato JSON segun la nueva resolucion del Ministerio de Salud. Recomendado para
                  envio a plataformas actualizadas.
                </p>
              </div>
            </Label>

            <Label
              htmlFor="plano"
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                format_ === 'plano'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              <RadioGroupItem value="plano" id="plano" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileArchive className="h-5 w-5 text-success" />
                  <span className="font-semibold">RIPS Plano</span>
                  <Badge variant="outline" className="text-xs">
                    Tradicional
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Archivos de texto plano (.txt) empaquetados en ZIP. Compatible con sistemas
                  anteriores.
                </p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating || invoices.length === 0}
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              {format_ === 'json' ? (
                <FileJson className="mr-2 h-4 w-4" />
              ) : (
                <FileArchive className="mr-2 h-4 w-4" />
              )}
              Generar RIPS {format_ === 'json' ? 'JSON' : 'Plano'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
