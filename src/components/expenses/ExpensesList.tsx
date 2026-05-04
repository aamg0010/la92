/**
 * ExpensesList.tsx
 * Lista de egresos con filtros y acciones
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCcw,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useExpenses,
  useDeleteExpense,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type Expense,
  type ExpenseCategory,
  type PaymentMethod,
  type ExpenseFilters,
} from "@/hooks/useExpenses";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";

interface ExpensesListProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
  onEdit: (expense: Expense) => void;
  onView?: (expense: Expense) => void;
}

export function ExpensesList({
  filters,
  onFiltersChange,
  onEdit,
  onView,
}: ExpensesListProps) {
  const { data: expenses, isLoading, refetch } = useExpenses(filters);
  const deleteExpense = useDeleteExpense();
  const { formatMoney } = useCurrency();

  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || "");
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onFiltersChange({ ...filters, searchTerm });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    onFiltersChange({});
  };

  const handleDelete = async () => {
    if (expenseToDelete) {
      await deleteExpense.mutateAsync(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  const hasActiveFilters =
    filters.category ||
    filters.paymentMethod ||
    filters.searchTerm ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripcion, beneficiario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Buscar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                !
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select
              value={filters.category || "all"}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  category: v === "all" ? undefined : (v as ExpenseCategory),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Metodo de Pago</label>
            <Select
              value={filters.paymentMethod || "all"}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  paymentMethod: v === "all" ? undefined : (v as PaymentMethod),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los metodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los metodos</SelectItem>
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Desde</label>
            <Input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, startDate: e.target.value || undefined })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Hasta</label>
            <Input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, endDate: e.target.value || undefined })
              }
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="min-w-[200px]">Descripcion</TableHead>
              <TableHead>Beneficiario</TableHead>
              <TableHead>Metodo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="group">
                  <TableCell className="font-medium">
                    {format(new Date(expense.expense_date), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell>
                    <ExpenseCategoryBadge category={expense.category} />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="truncate font-medium">{expense.description}</p>
                      {expense.reference_number && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {expense.reference_number}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {expense.beneficiary_name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {PAYMENT_METHODS[expense.payment_method]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    -{formatMoney(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(expense)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setExpenseToDelete(expense)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium">No hay egresos registrados</p>
                    <p className="text-sm">
                      Registra tu primer egreso para comenzar a gestionar los gastos.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total */}
      {expenses && expenses.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-muted/50 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground mr-2">
              Total ({expenses.length} registros):
            </span>
            <span className="font-bold text-destructive">
              -{formatMoney(expenses.reduce((sum, e) => sum + Number(e.amount), 0))}
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={() => setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Egreso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente el
              registro de egreso:
              <br />
              <strong className="text-foreground">
                {expenseToDelete?.description}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpense.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
