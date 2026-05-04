/**
 * RipsHistory Component
 * Historial de reportes RIPS generados
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Loader2,
  FileJson,
  FileArchive,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useRipsReports, type RipsReport } from '@/hooks/useRips';
import { useCurrency } from '@/hooks/useCurrency';

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  generated: {
    label: 'Generado',
    icon: CheckCircle2,
    className: 'bg-success/10 text-success border-success/20',
  },
  submitted: {
    label: 'Enviado',
    icon: Send,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  accepted: {
    label: 'Aceptado',
    icon: CheckCircle2,
    className: 'bg-success/10 text-success border-success/20',
  },
  rejected: {
    label: 'Rechazado',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function RipsHistory() {
  const { data: reports = [], isLoading } = useRipsReports();
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            No hay reportes RIPS generados
          </p>
          <p className="text-sm text-muted-foreground">
            Genere su primer reporte desde la pestana "Generar RIPS"
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Total reportes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">
                {reports.filter((r) => r.status === 'accepted').length}
              </p>
              <p className="text-sm text-muted-foreground">Aceptados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {reports.filter((r) => r.format === 'json').length}
              </p>
              <p className="text-sm text-muted-foreground">Formato JSON</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {reports.reduce((sum, r) => sum + r.records_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total registros</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Reportes</CardTitle>
          <CardDescription>Reportes RIPS generados ordenados por fecha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Numero</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead className="text-center">Registros</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Generado por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <ReportRow key={report.id} report={report} formatMoney={formatMoney} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportRow({
  report,
  formatMoney,
}: {
  report: RipsReport;
  formatMoney: (value: number) => string;
}) {
  const status = statusConfig[report.status] || statusConfig.generated;
  const StatusIcon = status.icon;

  const handleDownload = () => {
    // TODO: Implement download from stored file
    console.log('Download report:', report.id);
  };

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell>
        <span className="font-mono text-sm">{report.report_number}</span>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p>
            {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: es })} -{' '}
            {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>
      </TableCell>
      <TableCell>
        {report.format === 'json' ? (
          <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
            <FileJson className="h-3 w-3" />
            JSON
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
            <FileArchive className="h-3 w-3" />
            Plano
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-center">
        <span className="font-mono">{report.records_count}</span>
      </TableCell>
      <TableCell className="text-right">
        <span className="font-semibold">{formatMoney(report.total_invoiced)}</span>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className={status.className}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {report.generated_by_name || 'Sistema'}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!report.file_name}>
          <Download className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
