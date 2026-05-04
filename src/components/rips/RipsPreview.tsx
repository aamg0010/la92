/**
 * RipsPreview Component
 * Vista previa de datos a incluir en el reporte RIPS
 */

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Loader2,
  User,
  FileText,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { useRipsInvoices, type RipsInvoice } from '@/hooks/useRips';
import { useCurrency } from '@/hooks/useCurrency';
import { mapDocumentType, mapGender, TIPO_SERVICIO } from '@/lib/utils/rips';

export function RipsPreview() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const lastMonth = subMonths(new Date(), 1);
    return {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth),
    };
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { formatMoney } = useCurrency();

  // Data query
  const { data: invoices = [], isLoading } = useRipsInvoices(
    format(dateRange.from, 'yyyy-MM-dd'),
    format(dateRange.to, 'yyyy-MM-dd')
  );

  // Filter invoices by search term
  const filteredInvoices = searchTerm
    ? invoices.filter(
        (inv) =>
          `${inv.patient_first_name} ${inv.patient_last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.patient_document_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoices;

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa de Datos</CardTitle>
          <CardDescription>
            Revise los datos que se incluiran en el reporte RIPS antes de generarlo
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

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Facturas del Periodo</CardTitle>
              <CardDescription>
                {filteredInvoices.length} facturas - Total: {formatMoney(totalInvoiced)}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                No hay facturas en el periodo seleccionado
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Diagnostico</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        formatMoney={formatMoney}
                        isExpanded={expandedRows.has(invoice.id)}
                        onToggle={() => toggleRow(invoice.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceRow({
  invoice,
  formatMoney,
  isExpanded,
  onToggle,
}: {
  invoice: RipsInvoice;
  formatMoney: (value: number) => string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasItems = invoice.items && invoice.items.length > 0;

  return (
    <>
      <TableRow className="hover:bg-muted/30">
        <TableCell>
          {hasItems && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell>
          <span className="font-mono text-sm">{invoice.invoice_number}</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {invoice.patient_first_name} {invoice.patient_last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {mapGender(invoice.patient_gender) === 'M' ? 'Masculino' : 'Femenino'}
                {invoice.patient_birth_date && (
                  <> - {format(new Date(invoice.patient_birth_date), 'dd/MM/yyyy')}</>
                )}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <Badge variant="outline" className="font-mono text-xs">
              {mapDocumentType(invoice.patient_document_type)}
            </Badge>
            <span className="ml-2 font-mono text-sm">
              {invoice.patient_document_number || 'Sin documento'}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm">
            {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: es })}
          </span>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">
            {invoice.diagnostico_principal || 'Z012'}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-semibold">{formatMoney(Number(invoice.total))}</span>
        </TableCell>
      </TableRow>

      {/* Expanded Items */}
      {isExpanded && hasItems && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="p-0">
            <div className="p-4 pl-12">
              <p className="text-sm font-medium mb-2">Servicios/Items:</p>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tipo</TableHead>
                      <TableHead>Codigo CUPS</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TIPO_SERVICIO[item.service_type as keyof typeof TIPO_SERVICIO] ||
                              'Procedimiento'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {item.cups_code || 'Sin codigo'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(Number(item.unit_price))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(Number(item.total))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
