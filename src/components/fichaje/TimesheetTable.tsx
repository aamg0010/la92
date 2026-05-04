import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Download
} from 'lucide-react';
import { useTimesheets, useTimeEntries, Timesheet, formatMinutesToTime, TimeEntry } from '@/hooks/useTimeTracking';
import { cn } from '@/lib/utils';

interface TimesheetTableProps {
  userId?: string;
  showUserColumn?: boolean;
  className?: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  incomplete: { label: 'Incompleto', variant: 'secondary' },
  complete: { label: 'Completo', variant: 'default' },
  approved: { label: 'Aprobado', variant: 'outline' },
  rejected: { label: 'Rechazado', variant: 'destructive' }
};

export function TimesheetTable({ userId, showUserColumn = false, className }: TimesheetTableProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  // Calcular rango de fechas de la semana
  const weekStart = new Date(selectedWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const { data: timesheets, isLoading, error } = useTimesheets({
    startDate: weekStart.toISOString().split('T')[0],
    endDate: weekEnd.toISOString().split('T')[0],
    userId
  });

  // Query para detalle del dia seleccionado
  const { data: dayEntries, isLoading: isLoadingEntries } = useTimeEntries(
    selectedDate || '',
    selectedUserId
  );

  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(current.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTimesheets = timesheets?.filter(ts =>
    statusFilter === 'all' || ts.status === statusFilter
  ) || [];

  // Calcular totales de la semana
  const weekTotals = filteredTimesheets.reduce((acc, ts) => ({
    workMinutes: acc.workMinutes + ts.net_work_minutes,
    overtimeMinutes: acc.overtimeMinutes + ts.overtime_minutes,
    lateCount: acc.lateCount + (ts.was_late ? 1 : 0)
  }), { workMinutes: 0, overtimeMinutes: 0, lateCount: 0 });

  const openDayDetail = (date: string, userId?: string) => {
    setSelectedDate(date);
    setSelectedUserId(userId);
  };

  const exportToCSV = () => {
    if (!filteredTimesheets.length) return;

    const headers = ['Fecha', 'Empleado', 'Entrada', 'Salida', 'Trabajo Bruto', 'Pausas', 'Trabajo Neto', 'Horas Extra', 'Estado'];
    const rows = filteredTimesheets.map(ts => [
      formatDate(ts.work_date),
      ts.user_name,
      formatTime(ts.first_clock_in),
      formatTime(ts.last_clock_out),
      formatMinutesToTime(ts.total_work_minutes),
      formatMinutesToTime(ts.total_break_minutes),
      formatMinutesToTime(ts.net_work_minutes),
      ts.overtime_minutes > 0 ? formatMinutesToTime(ts.overtime_minutes) : '-',
      STATUS_BADGES[ts.status]?.label || ts.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fichajes_${weekStart.toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error instanceof Error ? error.message : 'Error al cargar datos'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registro de Fichajes
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="incomplete">Incompleto</SelectItem>
                  <SelectItem value="complete">Completo</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Resumen semanal */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total semana</span>
              </div>
              <div className="text-2xl font-bold">
                {formatMinutesToTime(weekTotals.workMinutes)}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Horas extra</span>
              </div>
              <div className={cn(
                'text-2xl font-bold',
                weekTotals.overtimeMinutes > 0 && 'text-amber-600'
              )}>
                {formatMinutesToTime(weekTotals.overtimeMinutes)}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Retrasos</span>
              </div>
              <div className={cn(
                'text-2xl font-bold',
                weekTotals.lateCount > 0 && 'text-red-600'
              )}>
                {weekTotals.lateCount}
              </div>
            </div>
          </div>

          {/* Tabla de registros */}
          {filteredTimesheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros para el periodo seleccionado
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    {showUserColumn && <TableHead>Empleado</TableHead>}
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead className="text-right">Trabajo</TableHead>
                    <TableHead className="text-right">Pausas</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Incidencias</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets.map((ts) => (
                    <TableRow key={ts.id}>
                      <TableCell className="font-medium">
                        {formatDate(ts.work_date)}
                      </TableCell>
                      {showUserColumn && (
                        <TableCell>{ts.user_name}</TableCell>
                      )}
                      <TableCell>{formatTime(ts.first_clock_in)}</TableCell>
                      <TableCell>{formatTime(ts.last_clock_out)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMinutesToTime(ts.total_work_minutes)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMinutesToTime(ts.total_break_minutes)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatMinutesToTime(ts.net_work_minutes)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ts.was_late && (
                            <Badge variant="destructive" className="text-xs">
                              Tarde +{ts.late_minutes}m
                            </Badge>
                          )}
                          {ts.left_early && (
                            <Badge variant="secondary" className="text-xs">
                              Salida -{ts.early_minutes}m
                            </Badge>
                          )}
                          {ts.has_overtime && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                              Extra +{formatMinutesToTime(ts.overtime_minutes)}
                            </Badge>
                          )}
                          {!ts.was_late && !ts.left_early && !ts.has_overtime && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGES[ts.status]?.variant || 'outline'}>
                          {STATUS_BADGES[ts.status]?.label || ts.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDayDetail(ts.work_date, ts.user_id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalle del dia */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detalle de fichajes - {selectedDate && formatDate(selectedDate)}
            </DialogTitle>
          </DialogHeader>

          {isLoadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !dayEntries?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros para este dia
            </div>
          ) : (
            <div className="space-y-2">
              {dayEntries.map((entry: TimeEntry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      entry.entry_type === 'clock_in' ? 'default' :
                      entry.entry_type === 'clock_out' ? 'secondary' :
                      'outline'
                    }>
                      {entry.entry_type === 'clock_in' && 'Entrada'}
                      {entry.entry_type === 'clock_out' && 'Salida'}
                      {entry.entry_type === 'break_start' && 'Inicio pausa'}
                      {entry.entry_type === 'break_end' && 'Fin pausa'}
                    </Badge>
                    {entry.is_manual && (
                      <Badge variant="outline" className="text-xs">
                        Manual
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {new Date(entry.entry_time).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    {entry.notes && (
                      <div className="text-sm text-muted-foreground">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
