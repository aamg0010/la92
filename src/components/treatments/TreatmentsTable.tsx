import { useState } from "react";
import { Edit2, Trash2, MoreHorizontal, Package, Clock, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Treatment, useDeleteTreatment } from "@/hooks/useTreatments";
import { useCurrency } from "@/hooks/useCurrency";

interface TreatmentsTableProps {
  treatments: Treatment[];
  onEdit: (treatment: Treatment) => void;
}

export function TreatmentsTable({ treatments, onEdit }: TreatmentsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteTreatment();
  const { formatMoney } = useCurrency();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Group treatments by category
  const groupedTreatments = treatments.reduce((acc, treatment) => {
    const category = treatment.category || "Sin categoría";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(treatment);
    return acc;
  }, {} as Record<string, Treatment[]>);

  const categories = Object.keys(groupedTreatments).sort();

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center">Duración</TableHead>
              <TableHead className="text-center">Extras</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) =>
              groupedTreatments[category].map((treatment) => (
                <TableRow key={treatment.id}>
                  <TableCell className="font-mono text-sm">
                    {treatment.code}
                  </TableCell>
                  <TableCell className="font-medium">{treatment.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{treatment.category || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(treatment.base_price)}
                  </TableCell>
                  <TableCell className="text-center">
                    {treatment.duration_minutes ? (
                      <span className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {treatment.duration_minutes} min
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {treatment.pre_instructions && (
                        <span title="Instrucciones pre-tratamiento">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </span>
                      )}
                      {treatment.consent_required && (
                        <span title="Requiere consentimiento">
                          <Package className="h-4 w-4 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={treatment.is_active ? "default" : "secondary"}
                    >
                      {treatment.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(treatment)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(treatment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {treatments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay tratamientos registrados
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tratamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tratamiento será eliminado
              permanentemente.
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
    </>
  );
}
