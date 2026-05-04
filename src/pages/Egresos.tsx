/**
 * Egresos.tsx
 * Pagina principal del modulo de egresos (gastos)
 */

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Download,
  TrendingDown,
  Users,
  FlaskConical,
  Building2,
  Loader2,
} from "lucide-react";
import {
  useExpenses,
  useExpenseStats,
  type Expense,
  type ExpenseFilters,
  type ExpenseCategory,
} from "@/hooks/useExpenses";
import {
  ExpenseStats,
  ExpensesList,
  CreateExpenseDialog,
} from "@/components/expenses";

const Egresos = () => {
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Filters state
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [activeTab, setActiveTab] = useState<string>("all");

  // Get current month date range for stats
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    return { startDate, endDate };
  }, []);

  // Fetch stats for current month
  const { data: stats, isLoading: loadingStats } = useExpenseStats(currentMonthRange);

  // Apply tab filter
  const tabFilters = useMemo((): ExpenseFilters => {
    const baseFilters = { ...filters, ...currentMonthRange };

    switch (activeTab) {
      case "payroll":
        return { ...baseFilters, category: "payroll" as ExpenseCategory };
      case "labs":
        return {
          ...baseFilters,
          category: "lab_payment" as ExpenseCategory,
        };
      case "operations":
        // Operational expenses: utilities, rent, maintenance, supplies
        return baseFilters; // We'll filter in the component
      default:
        return baseFilters;
    }
  }, [filters, activeTab, currentMonthRange]);

  // Filter for operational tab (multiple categories)
  const { data: allExpenses } = useExpenses(tabFilters);
  const displayExpenses = useMemo(() => {
    if (activeTab !== "operations" || !allExpenses) return allExpenses;

    const operationalCategories: ExpenseCategory[] = [
      "utilities",
      "rent",
      "maintenance",
      "supplies",
      "marketing",
      "taxes",
      "other",
    ];
    return allExpenses.filter((e) =>
      operationalCategories.includes(e.category)
    );
  }, [allExpenses, activeTab]);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setSelectedExpense(null);
    }
  };

  const handleExport = () => {
    // TODO: Implement export to Excel/CSV
    console.log("Exportar egresos");
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Egresos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion de gastos y pagos del consultorio
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Egreso
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <ExpenseStats stats={stats} isLoading={loadingStats} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">Todos</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Nomina</span>
            </TabsTrigger>
            <TabsTrigger value="labs" className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Labs</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Operativos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ExpensesList
              filters={tabFilters}
              onFiltersChange={setFilters}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="payroll" className="mt-4">
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Pagos de Nomina
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Registros de pagos a empleados, incluyendo salarios, bonos y prestaciones.
              </p>
            </div>
            <ExpensesList
              filters={tabFilters}
              onFiltersChange={setFilters}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="labs" className="mt-4">
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-medium text-purple-900 dark:text-purple-100">
                Pagos a Laboratorios
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Pagos por trabajos de laboratorio dental: protesis, ortodoncia, etc.
              </p>
            </div>
            <ExpensesList
              filters={tabFilters}
              onFiltersChange={setFilters}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="operations" className="mt-4">
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Gastos Operativos
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Servicios publicos, arriendo, mantenimiento, insumos y otros gastos de operacion.
              </p>
            </div>
            {/* Custom list for operations since we filter multiple categories */}
            <ExpensesList
              filters={{ ...tabFilters }}
              onFiltersChange={setFilters}
              onEdit={handleEdit}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Stats by Category (optional visualization) */}
        {stats && stats.totalAmount > 0 && (
          <div className="card-elevated p-6">
            <h3 className="font-display text-lg font-semibold mb-4">
              Distribucion por Categoria
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.byCategory)
                .filter(([, amount]) => amount > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage =
                    stats.totalAmount > 0
                      ? Math.round((amount / stats.totalAmount) * 100)
                      : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">
                          {category.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <CreateExpenseDialog
        open={createDialogOpen}
        onOpenChange={handleCloseDialog}
        expense={selectedExpense}
      />
    </MainLayout>
  );
};

export default Egresos;
