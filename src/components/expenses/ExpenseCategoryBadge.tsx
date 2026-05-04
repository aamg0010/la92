/**
 * ExpenseCategoryBadge.tsx
 * Badge con icono y color segun categoria de gasto
 */

import { Badge } from "@/components/ui/badge";
import {
  Users,
  Stethoscope,
  FlaskConical,
  Package,
  Zap,
  Home,
  Wrench,
  Megaphone,
  Receipt,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ExpenseCategory, EXPENSE_CATEGORIES } from "@/hooks/useExpenses";

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  payroll: Users,
  doctor_settlement: Stethoscope,
  lab_payment: FlaskConical,
  supplies: Package,
  utilities: Zap,
  rent: Home,
  maintenance: Wrench,
  marketing: Megaphone,
  taxes: Receipt,
  other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  payroll: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  doctor_settlement: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  lab_payment: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  supplies: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  utilities: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  rent: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800",
  maintenance: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  marketing: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  taxes: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
  other: "bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-400 dark:border-neutral-800",
};

interface ExpenseCategoryBadgeProps {
  category: ExpenseCategory;
  showIcon?: boolean;
  className?: string;
}

export function ExpenseCategoryBadge({
  category,
  showIcon = true,
  className,
}: ExpenseCategoryBadgeProps) {
  const Icon = CATEGORY_ICONS[category];
  const categoryInfo = EXPENSE_CATEGORIES[category];
  const colorClasses = CATEGORY_COLORS[category];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium inline-flex items-center gap-1.5",
        colorClasses,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{categoryInfo.label}</span>
    </Badge>
  );
}

export { CATEGORY_ICONS, CATEGORY_COLORS };
