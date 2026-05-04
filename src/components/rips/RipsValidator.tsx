/**
 * RipsValidator Component
 * Valida datos antes de generar RIPS y muestra errores/advertencias
 */

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  User,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { useRipsInvoices, useRipsProviderSettings } from '@/hooks/useRips';
import { validateInvoices, validateProviderSettings, groupErrorsByPatient } from '@/lib/utils/rips';

export function RipsValidator() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const lastMonth = subMonths(new Date(), 1);
    return {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth),
    };
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Data queries
  const { data: invoices = [], isLoading: loadingInvoices } = useRipsInvoices(
    format(dateRange.from, 'yyyy-MM-dd'),
    format(dateRange.to, 'yyyy-MM-dd')
  );
  const { data: providerSettings, isLoading: loadingProvider } = useRipsProviderSettings();

  // Validation
  const invoiceValidation = validateInvoices(invoices);
  const providerValidation = validateProviderSettings(providerSettings);

  const isLoading = loadingInvoices || loadingProvider;

  // Filter errors by search term
  const filteredErrors = searchTerm
    ? invoiceValidation.errors.filter(
        (e) =>
          e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoiceValidation.errors;

  const filteredWarnings = searchTerm
    ? invoiceValidation.warnings.filter(
        (e) =>
          e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoiceValidation.warnings;

  // Group errors by invoice
  const errorsByInvoice = groupErrorsByPatient(filteredErrors);
  const warningsByInvoice = groupErrorsByPatient(filteredWarnings);

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Validar Datos RIPS</CardTitle>
          <CardDescription>
            Verifique que los datos de pacientes y facturas esten completos antes de generar el
            reporte
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
        </CardContent>
      </Card>

      {/* Provider Validation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datos del Prestador</CardTitle>
            {loadingProvider ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : providerValidation.isValid ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completo
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Incompleto
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingProvider ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {providerSettings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">NIT:</span>{' '}
                    <span className="font-medium">{providerSettings.nit || 'No configurado'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Razon Social:</span>{' '}
                    <span className="font-medium">
                      {providerSettings.razon_social || 'No configurado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Codigo Habilitacion:</span>{' '}
                    <span className="font-medium">
                      {providerSettings.codigo_habilitacion || 'No configurado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Municipio:</span>{' '}
                    <span className="font-medium">
                      {providerSettings.municipio_codigo || 'No configurado'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay configuracion del prestador. Configure los datos en la pestana
                  "Configuracion".
                </p>
              )}

              {providerValidation.errors.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Errores que deben corregirse:
                  </p>
                  <ul className="mt-2 list-disc list-inside text-sm text-destructive/80">
                    {providerValidation.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {providerValidation.warnings.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="font-medium text-warning flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Advertencias:
                  </p>
                  <ul className="mt-2 list-disc list-inside text-sm text-warning/80">
                    {providerValidation.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Validation Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Validacion de Facturas</CardTitle>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : invoiceValidation.isValid ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {invoiceValidation.summary.totalInvoices} facturas listas
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                {invoiceValidation.summary.invalidInvoices} con errores
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                No hay facturas en el periodo seleccionado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{invoiceValidation.summary.totalInvoices}</p>
                  <p className="text-xs text-muted-foreground">Total facturas</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 text-center">
                  <p className="text-2xl font-bold text-success">
                    {invoiceValidation.summary.validInvoices}
                  </p>
                  <p className="text-xs text-muted-foreground">Validas</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {invoiceValidation.summary.errorCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Errores</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 text-center">
                  <p className="text-2xl font-bold text-warning">
                    {invoiceValidation.summary.warningCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Advertencias</p>
                </div>
              </div>

              {/* Search */}
              {(invoiceValidation.errors.length > 0 || invoiceValidation.warnings.length > 0) && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente o numero de factura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Errors and Warnings Tabs */}
              {(filteredErrors.length > 0 || filteredWarnings.length > 0) && (
                <Tabs defaultValue="errors" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="errors" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Errores ({filteredErrors.length})
                    </TabsTrigger>
                    <TabsTrigger value="warnings" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Advertencias ({filteredWarnings.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="errors" className="mt-4">
                    {filteredErrors.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                        <p className="mt-2 text-muted-foreground">
                          No hay errores criticos que corregir
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Accordion type="multiple" className="space-y-2">
                          {Array.from(errorsByInvoice.entries()).map(([invoiceId, data]) => (
                            <AccordionItem
                              key={invoiceId}
                              value={invoiceId}
                              className="border rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{data.patientName}</span>
                                  <Badge variant="destructive" className="text-xs">
                                    {data.invoices.length} errores
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-2 pl-7">
                                  {data.invoices.map((error, i) => (
                                    <li
                                      key={i}
                                      className="text-sm flex items-start gap-2 text-destructive/80"
                                    >
                                      <XCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                                      <span>
                                        <strong>{error.invoiceNumber}</strong>: {error.message}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  <TabsContent value="warnings" className="mt-4">
                    {filteredWarnings.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                        <p className="mt-2 text-muted-foreground">No hay advertencias</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Accordion type="multiple" className="space-y-2">
                          {Array.from(warningsByInvoice.entries()).map(([invoiceId, data]) => (
                            <AccordionItem
                              key={invoiceId}
                              value={invoiceId}
                              className="border rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{data.patientName}</span>
                                  <Badge variant="outline" className="text-xs text-warning border-warning/20">
                                    {data.invoices.length} advertencias
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-2 pl-7">
                                  {data.invoices.map((warning, i) => (
                                    <li
                                      key={i}
                                      className="text-sm flex items-start gap-2 text-warning/80"
                                    >
                                      <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />
                                      <span>
                                        <strong>{warning.invoiceNumber}</strong>: {warning.message}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              {invoiceValidation.isValid && invoices.length > 0 && (
                <div className="flex items-center justify-center py-8 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle2 className="h-8 w-8 text-success mr-3" />
                  <div>
                    <p className="font-medium text-success">Validacion exitosa</p>
                    <p className="text-sm text-success/80">
                      Todas las facturas estan listas para generar RIPS
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
