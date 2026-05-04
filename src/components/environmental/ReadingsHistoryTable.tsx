/**
 * ReadingsHistoryTable.tsx
 * Tabla de historial de lecturas ambientales con filtros
 */

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  Thermometer,
  Droplets,
  Filter,
  X,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEnvironmentalReadings,
  useDeleteReading,
  type EnvironmentalReading,
  type Shift,
  type ReadingFilters,
  SHIFTS,
  formatTime,
} from "@/hooks/useEnvironmentalMonitoring";

interface ReadingsHistoryTableProps {
  onEdit: (reading: EnvironmentalReading) => void;
}

export function ReadingsHistoryTable({ onEdit }: ReadingsHistoryTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReadingFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Calculate default date range (last 30 days)
  const defaultEndDate = new Date().toISOString().split("T")[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: readings, isLoading } = useEnvironmentalReadings({
    startDate: filters.startDate || defaultStartDate,
    endDate: filters.endDate || defaultEndDate,
    shift: filters.shift,
    onlyOutOfRange: filters.onlyOutOfRange,
  });

  const deleteReading = useDeleteReading();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReading.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = filters.shift || filters.onlyOutOfRange;

  // Group readings by date
  const groupedReadings = useMemo(() => {
    if (!readings) return [];

    const grouped = readings.reduce((acc, reading) => {
      const date = reading.reading_date;
      if (!acc[date]) {
        acc[date] = { date, am: null, pm: null };
      }
      if (reading.shift === "AM") {
        acc[date].am = reading;
      } else {
        acc[date].pm = reading;
      }
      return acc;
    }, {} as Record<string, { date: string; am: EnvironmentalReading | null; pm: EnvironmentalReading | null }>);

    return Object.values(grouped).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [readings]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const renderReadingCell = (reading: EnvironmentalReading | null, onEditClick: () => void) => {
    if (!reading) {
      return (
        <div className="text-center text-muted-foreground text-sm">
          <span className="opacity-50">--</span>
        </div>
      );
    }

    const isNormal = reading.is_temperature_normal && reading.is_humidity_normal;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Thermometer
                className={cn(
                  "w-4 h-4",
                  reading.is_temperature_normal ? "text-green-500" : "text-red-500"
                )}
              />
              <span className="font-medium">{reading.temperature} C</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets
                className={cn(
                  "w-4 h-4",
                  reading.is_humidity_normal ? "text-blue-500" : "text-red-500"
                )}
              />
              <span className="font-medium">{reading.humidity}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isNormal ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditClick}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteId(reading.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(reading.reading_time)} - {reading.user_name}
        </div>
        {reading.notes && (
          <div className="text-xs text-muted-foreground italic truncate max-w-[200px]">
            {reading.notes}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Historial de Lecturas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Desde</label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hasta</label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Turno</label>
                <Select
                  value={filters.shift || "all"}
                  onValueChange={(v) =>
                    setFilters({ ...filters, shift: v === "all" ? undefined : (v as Shift) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los turnos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los turnos</SelectItem>
                    <SelectItem value="AM">AM - Manana</SelectItem>
                    <SelectItem value="PM">PM - Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={filters.onlyOutOfRange ? "alerts" : "all"}
                  onValueChange={(v) =>
                    setFilters({ ...filters, onlyOutOfRange: v === "alerts" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las lecturas</SelectItem>
                    <SelectItem value="alerts">Solo fuera de rango</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {groupedReadings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay lecturas registradas</p>
            <p className="text-sm">
              {hasActiveFilters
                ? "Intenta cambiar los filtros"
                : "Las lecturas apareceran aqui"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Fecha</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      AM (Manana)
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      PM (Tarde)
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedReadings.map((group) => {
                  const date = new Date(group.date);
                  const formattedDate = date.toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  });
                  const isToday = group.date === new Date().toISOString().split("T")[0];

                  return (
                    <TableRow key={group.date}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{formattedDate}</p>
                            {isToday && (
                              <Badge variant="secondary" className="text-xs">
                                Hoy
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        {renderReadingCell(group.am, () => group.am && onEdit(group.am))}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        {renderReadingCell(group.pm, () => group.pm && onEdit(group.pm))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground text-center">
          Mostrando {groupedReadings.length} dia(s) con lecturas
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar lectura</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La lectura ambiental sera eliminada permanentemente
              del registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
