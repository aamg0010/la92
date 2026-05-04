/**
 * WasteHistoryTable.tsx
 * Tabla de historial de disposiciones de residuos
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Biohazard,
  Recycle,
  Loader2,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useWasteDisposals,
  useDeleteWasteDisposal,
  WASTE_TYPES,
  type WasteDisposal,
  type WasteType,
  type WasteFilters,
} from "@/hooks/useWasteManagement";

interface WasteHistoryTableProps {
  onEdit: (disposal: WasteDisposal) => void;
}

const WASTE_ICONS: Record<WasteType, React.ReactNode> = {
  red: <Biohazard className="w-4 h-4" />,
  black: <Trash2 className="w-4 h-4" />,
  white: <Recycle className="w-4 h-4" />,
};

export function WasteHistoryTable({ onEdit }: WasteHistoryTableProps) {
  const [filters, setFilters] = useState<WasteFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Apply search with debounce effect
  const activeFilters = useMemo(
    () => ({
      ...filters,
      searchTerm: searchTerm || undefined,
    }),
    [filters, searchTerm]
  );

  const { data: disposals, isLoading } = useWasteDisposals(activeFilters);
  const deleteDisposal = useDeleteWasteDisposal();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDisposal.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const hasActiveFilters =
    filters.wasteType || filters.startDate || filters.endDate || searchTerm;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial de Disposiciones
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter toggle */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t mt-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Tipo</label>
              <Select
                value={filters.wasteType || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    wasteType: value === "all" ? undefined : (value as WasteType),
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(WASTE_TYPES) as WasteType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        {WASTE_ICONS[type]}
                        {WASTE_TYPES[type].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value || undefined })
                }
                className="w-40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value || undefined })
                }
                className="w-40"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : disposals?.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">No hay registros</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {hasActiveFilters
                ? "No se encontraron registros con los filtros aplicados."
                : "Comienza registrando una disposicion de residuos."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Peso (kg)</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disposals?.map((disposal) => {
                  const config = WASTE_TYPES[disposal.waste_type];

                  return (
                    <TableRow key={disposal.id}>
                      <TableCell>
                        {new Date(disposal.disposal_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("gap-1", config.color)}
                        >
                          {WASTE_ICONS[disposal.waste_type]}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {disposal.weight_kg.toFixed(1)}
                      </TableCell>
                      <TableCell>{disposal.responsible_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {disposal.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(disposal)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(disposal.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary footer */}
        {disposals && disposals.length > 0 && (
          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <span>{disposals.length} registros encontrados</span>
            <span>
              Total:{" "}
              <span className="font-medium text-foreground">
                {disposals.reduce((sum, d) => sum + d.weight_kg, 0).toFixed(1)} kg
              </span>
            </span>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El registro de disposicion sera eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDisposal.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
