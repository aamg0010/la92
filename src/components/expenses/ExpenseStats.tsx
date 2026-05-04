/**
 * ExpenseStats.tsx
 * Cards de estadisticas de egresos
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { type ExpenseStats as ExpenseStatsType, EXPENSE_CATEGORIES, type ExpenseCategory } from "@/hooks/useExpenses";

interface ExpenseStatsProps {
  stats: ExpenseStatsType | undefined;
  isLoading?: boolean;
}

export function ExpenseStats({ stats, isLoading }: ExpenseStatsProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Get top 3 categories by amount
  const topCategories = Object.entries(stats.byCategory)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const changeIsNegative = (stats.changePercentage ?? 0) < 0;
  const changeIsPositive = (stats.changePercentage ?? 0) > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total del periodo */}
      <Card className="stat-card">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Egresos</p>
              <p className="mt-2 text-3xl font-display font-bold text-foreground">
                {formatMoney(stats.totalAmount)}
              </p>
              {stats.changePercentage !== undefined && (
                <div
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 text-sm font-medium",
                    changeIsNegative
                      ? "text-success"
                      : changeIsPositive
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {changeIsNegative ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : changeIsPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : null}
                  <span>
                    {stats.changePercentage > 0 ? "+" : ""}
                    {stats.changePercentage}%
                  </span>
                  <span className="text-muted-foreground font-normal">vs anterior</span>
                </div>
              )}
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                changeIsNegative
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cantidad de registros */}
      <Card className="stat-card">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Registros</p>
              <p className="mt-2 text-3xl font-display font-bold text-foreground">
                {stats.count}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Promedio: {stats.count > 0 ? formatMoney(stats.totalAmount / stats.count) : "$0"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Periodo anterior */}
      <Card className="stat-card">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Periodo Anterior</p>
              <p className="mt-2 text-3xl font-display font-bold text-foreground">
                {formatMoney(stats.previousPeriodTotal ?? 0)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {changeIsNegative
                  ? "Reduccion en gastos"
                  : changeIsPositive
                  ? "Aumento en gastos"
                  : "Sin cambios"}
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                changeIsNegative
                  ? "bg-success/10 text-success"
                  : changeIsPositive
                  ? "bg-warning/10 text-warning"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {changeIsNegative ? (
                <TrendingDown className="w-6 h-6" />
              ) : (
                <TrendingUp className="w-6 h-6" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top categorias */}
      <Card className="stat-card">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">Top Categorias</p>
          {topCategories.length > 0 ? (
            <div className="space-y-2">
              {topCategories.map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    {EXPENSE_CATEGORIES[category as ExpenseCategory].label}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatMoney(amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
