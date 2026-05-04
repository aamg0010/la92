import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  Play,
  Square,
  Coffee,
  LogIn,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTimeTracking, formatMinutesToTime, ClockStatus, ClockAction } from '@/hooks/useTimeTracking';
import { cn } from '@/lib/utils';

interface ClockWidgetProps {
  className?: string;
  compact?: boolean;
}

const STATUS_CONFIG: Record<ClockStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  not_started: {
    label: 'Sin fichar',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  working: {
    label: 'Trabajando',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  on_break: {
    label: 'En pausa',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  },
  finished: {
    label: 'Jornada finalizada',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  }
};

const ACTION_CONFIG: Record<ClockAction, {
  label: string;
  icon: typeof Clock;
}> = {
  clock_in: { label: 'Entrada', icon: LogIn },
  clock_out: { label: 'Salida', icon: LogOut },
  break_start: { label: 'Inicio pausa', icon: Coffee },
  break_end: { label: 'Fin pausa', icon: Play }
};

export function ClockWidget({ className, compact = false }: ClockWidgetProps) {
  const {
    status,
    todaySummary,
    isLoading,
    isClocking,
    error,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    refresh
  } = useTimeTracking();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<ClockAction | null>(null);
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = STATUS_CONFIG[status];

  const handleAction = async (action: ClockAction, withNotes = false) => {
    if (withNotes) {
      setPendingAction(action);
      setShowNotesDialog(true);
      return;
    }

    setActionError(null);
    try {
      switch (action) {
        case 'clock_in':
          await clockIn();
          break;
        case 'clock_out':
          await clockOut();
          break;
        case 'break_start':
          await startBreak();
          break;
        case 'break_end':
          await endBreak();
          break;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al fichar');
    }
  };

  const handleConfirmWithNotes = async () => {
    if (!pendingAction) return;

    setActionError(null);
    try {
      switch (pendingAction) {
        case 'clock_in':
          await clockIn(notes);
          break;
        case 'clock_out':
          await clockOut(notes);
          break;
        case 'break_start':
          await startBreak(notes);
          break;
        case 'break_end':
          await endBreak(notes);
          break;
      }
      setShowNotesDialog(false);
      setNotes('');
      setPendingAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al fichar');
    }
  };

  const renderActions = () => {
    if (isClocking) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Registrando...</span>
        </div>
      );
    }

    switch (status) {
      case 'not_started':
        return (
          <Button
            onClick={() => handleAction('clock_in')}
            className="w-full"
            size={compact ? 'default' : 'lg'}
          >
            <LogIn className="mr-2 h-5 w-5" />
            Fichar Entrada
          </Button>
        );

      case 'working':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleAction('break_start')}
              variant="outline"
              className="flex-1"
            >
              <Coffee className="mr-2 h-4 w-4" />
              Pausa
            </Button>
            <Button
              onClick={() => handleAction('clock_out')}
              variant="destructive"
              className="flex-1"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Salida
            </Button>
          </div>
        );

      case 'on_break':
        return (
          <Button
            onClick={() => handleAction('break_end')}
            className="w-full"
            variant="secondary"
          >
            <Play className="mr-2 h-5 w-5" />
            Reanudar Trabajo
          </Button>
        );

      case 'finished':
        return (
          <div className="text-center text-muted-foreground py-2">
            <Square className="h-5 w-5 mx-auto mb-1" />
            Jornada completada
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-mono font-bold">
                {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'border-0')}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            Tiempo trabajado: <span className="font-medium text-foreground">
              {formatMinutesToTime(todaySummary.net_work_minutes)}
            </span>
          </div>

          {actionError && (
            <div className="flex items-center gap-2 text-sm text-destructive mb-3">
              <AlertCircle className="h-4 w-4" />
              {actionError}
            </div>
          )}

          {renderActions()}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Control de Fichaje
            </span>
            <Button variant="ghost" size="sm" onClick={refresh}>
              Actualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Reloj principal */}
          <div className="text-center mb-6">
            <div className="text-5xl font-mono font-bold tracking-tight">
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-muted-foreground mt-1">
              {currentTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </div>

          {/* Estado actual */}
          <div className="flex justify-center mb-6">
            <Badge
              className={cn(
                'text-sm px-4 py-1',
                statusConfig.bgColor,
                statusConfig.color,
                'border-0'
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Resumen del dia */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {formatMinutesToTime(todaySummary.total_work_minutes)}
              </div>
              <div className="text-xs text-muted-foreground">Tiempo bruto</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {formatMinutesToTime(todaySummary.total_break_minutes)}
              </div>
              <div className="text-xs text-muted-foreground">Pausas</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatMinutesToTime(todaySummary.net_work_minutes)}
              </div>
              <div className="text-xs text-muted-foreground">Tiempo neto</div>
            </div>
          </div>

          {/* Hora de entrada */}
          {todaySummary.first_clock_in && (
            <div className="text-center text-sm text-muted-foreground mb-4">
              Entrada: {new Date(todaySummary.first_clock_in).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {todaySummary.last_clock_out && (
                <> | Salida: {new Date(todaySummary.last_clock_out).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</>
              )}
            </div>
          )}

          {/* Error */}
          {(error || actionError) && (
            <div className="flex items-center gap-2 text-sm text-destructive mb-4 justify-center">
              <AlertCircle className="h-4 w-4" />
              {actionError || (error instanceof Error ? error.message : 'Error')}
            </div>
          )}

          {/* Acciones */}
          {renderActions()}
        </CardContent>
      </Card>

      {/* Dialog para notas */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction && ACTION_CONFIG[pendingAction]?.label}
            </DialogTitle>
            <DialogDescription>
              Puedes agregar una nota opcional a este registro de fichaje.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmWithNotes} disabled={isClocking}>
              {isClocking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
