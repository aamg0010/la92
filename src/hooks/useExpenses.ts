/**
 * useExpenses.ts
 * Hook para gestion de egresos (gastos)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ============ TYPES ============

export type ExpenseCategory =
  | "payroll"
  | "doctor_settlement"
  | "lab_payment"
  | "supplies"
  | "utilities"
  | "rent"
  | "maintenance"
  | "marketing"
  | "taxes"
  | "other";

export type PaymentMethod = "cash" | "transfer" | "card" | "check";

export type BeneficiaryType = "doctor" | "employee" | "lab" | "supplier" | "other";

export type RecurrencePeriod = "weekly" | "biweekly" | "monthly" | "yearly";

export interface Expense {
  id: string;
  expense_date: string;
  category: ExpenseCategory;
  subcategory: string | null;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  beneficiary_name: string | null;
  beneficiary_id: string | null;
  beneficiary_type: BeneficiaryType | null;
  settlement_id: string | null;
  is_recurring: boolean;
  recurrence_period: RecurrencePeriod | null;
  notes: string | null;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory_Custom {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parent_category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateExpenseData {
  expense_date: string;
  category: ExpenseCategory;
  subcategory?: string;
  description: string;
  amount: number;
  payment_method?: PaymentMethod;
  reference_number?: string;
  beneficiary_name?: string;
  beneficiary_id?: string;
  beneficiary_type?: BeneficiaryType;
  settlement_id?: string;
  is_recurring?: boolean;
  recurrence_period?: RecurrencePeriod;
  notes?: string;
  receipt_url?: string;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  beneficiaryType?: BeneficiaryType;
  paymentMethod?: PaymentMethod;
  searchTerm?: string;
}

export interface ExpenseStats {
  totalAmount: number;
  byCategory: Record<ExpenseCategory, number>;
  byPaymentMethod: Record<PaymentMethod, number>;
  count: number;
  previousPeriodTotal?: number;
  changePercentage?: number;
}

// ============ CONSTANTS ============

export const EXPENSE_CATEGORIES: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string }
> = {
  payroll: { label: "Nomina", icon: "Users", color: "blue" },
  doctor_settlement: { label: "Liquidacion Doctor", icon: "Stethoscope", color: "green" },
  lab_payment: { label: "Laboratorio", icon: "FlaskConical", color: "purple" },
  supplies: { label: "Insumos", icon: "Package", color: "orange" },
  utilities: { label: "Servicios", icon: "Zap", color: "yellow" },
  rent: { label: "Arriendo", icon: "Home", color: "slate" },
  maintenance: { label: "Mantenimiento", icon: "Wrench", color: "red" },
  marketing: { label: "Marketing", icon: "Megaphone", color: "pink" },
  taxes: { label: "Impuestos", icon: "Receipt", color: "gray" },
  other: { label: "Otros", icon: "MoreHorizontal", color: "neutral" },
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  check: "Cheque",
};

export const BENEFICIARY_TYPES: Record<BeneficiaryType, string> = {
  doctor: "Odontologo",
  employee: "Empleado",
  lab: "Laboratorio",
  supplier: "Proveedor",
  other: "Otro",
};

export const RECURRENCE_PERIODS: Record<RecurrencePeriod, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  yearly: "Anual",
};

// ============ HOOKS ============

/**
 * Get expenses with optional filters
 */
export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: async () => {
      let query = api
        .from<Expense>("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("expense_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("expense_date", filters.endDate);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.beneficiaryType) {
        query = query.eq("beneficiary_type", filters.beneficiaryType);
      }
      if (filters?.paymentMethod) {
        query = query.eq("payment_method", filters.paymentMethod);
      }
      if (filters?.searchTerm) {
        query = query.or([
          `description.ilike.%${filters.searchTerm}%`,
          `beneficiary_name.ilike.%${filters.searchTerm}%`,
          `reference_number.ilike.%${filters.searchTerm}%`,
        ]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Expense[]) || [];
    },
  });
}

/**
 * Get a single expense by ID
 */
export function useExpense(id: string | null) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await api
        .from<Expense>("expenses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Expense;
    },
    enabled: !!id,
  });
}

/**
 * Get expense statistics for a date range
 */
export function useExpenseStats(dateRange?: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["expense-stats", dateRange],
    queryFn: async (): Promise<ExpenseStats> => {
      let query = api.from<Expense>("expenses").select("*");

      if (dateRange?.startDate) {
        query = query.gte("expense_date", dateRange.startDate);
      }
      if (dateRange?.endDate) {
        query = query.lte("expense_date", dateRange.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const expenses = (data as Expense[]) || [];

      // Calculate totals
      const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      // By category
      const byCategory: Record<ExpenseCategory, number> = {
        payroll: 0,
        doctor_settlement: 0,
        lab_payment: 0,
        supplies: 0,
        utilities: 0,
        rent: 0,
        maintenance: 0,
        marketing: 0,
        taxes: 0,
        other: 0,
      };

      expenses.forEach((e) => {
        byCategory[e.category] += Number(e.amount);
      });

      // By payment method
      const byPaymentMethod: Record<PaymentMethod, number> = {
        cash: 0,
        transfer: 0,
        card: 0,
        check: 0,
      };

      expenses.forEach((e) => {
        byPaymentMethod[e.payment_method] += Number(e.amount);
      });

      // Calculate previous period for comparison
      let previousPeriodTotal: number | undefined;
      let changePercentage: number | undefined;

      if (dateRange?.startDate && dateRange?.endDate) {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const daysDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

        const { data: prevData } = await api
          .from<Expense>("expenses")
          .select("amount")
          .gte("expense_date", prevStartDate.toISOString().split("T")[0])
          .lte("expense_date", prevEndDate.toISOString().split("T")[0]);

        if (prevData) {
          previousPeriodTotal = (prevData as { amount: number }[]).reduce(
            (sum, e) => sum + Number(e.amount),
            0
          );
          if (previousPeriodTotal > 0) {
            changePercentage = Math.round(
              ((totalAmount - previousPeriodTotal) / previousPeriodTotal) * 100
            );
          }
        }
      }

      return {
        totalAmount,
        byCategory,
        byPaymentMethod,
        count: expenses.length,
        previousPeriodTotal,
        changePercentage,
      };
    },
  });
}

/**
 * Get monthly expense report
 */
export function useMonthlyExpenseReport(month: number, year: number) {
  return useQuery({
    queryKey: ["monthly-expense-report", month, year],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // Last day of month

      const { data, error } = await api
        .from<Expense>("expenses")
        .select("*")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate)
        .order("expense_date", { ascending: false });

      if (error) throw error;

      const expenses = (data as Expense[]) || [];

      // Group by date
      const byDate: Record<string, { total: number; count: number }> = {};
      expenses.forEach((e) => {
        if (!byDate[e.expense_date]) {
          byDate[e.expense_date] = { total: 0, count: 0 };
        }
        byDate[e.expense_date].total += Number(e.amount);
        byDate[e.expense_date].count += 1;
      });

      // Group by category
      const byCategory: Record<ExpenseCategory, { total: number; count: number }> = {
        payroll: { total: 0, count: 0 },
        doctor_settlement: { total: 0, count: 0 },
        lab_payment: { total: 0, count: 0 },
        supplies: { total: 0, count: 0 },
        utilities: { total: 0, count: 0 },
        rent: { total: 0, count: 0 },
        maintenance: { total: 0, count: 0 },
        marketing: { total: 0, count: 0 },
        taxes: { total: 0, count: 0 },
        other: { total: 0, count: 0 },
      };

      expenses.forEach((e) => {
        byCategory[e.category].total += Number(e.amount);
        byCategory[e.category].count += 1;
      });

      const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        expenses,
        totalAmount,
        count: expenses.length,
        byDate,
        byCategory,
        month,
        year,
      };
    },
  });
}

/**
 * Create a new expense
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const { data: expense, error } = await api
        .from("expenses")
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!expense) throw new Error("No se pudo crear el egreso");
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-expense-report"] });
      toast({
        title: "Egreso registrado",
        description: "El egreso ha sido guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update an expense
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateExpenseData> }) => {
      const { data: expense, error } = await api
        .from("expenses")
        .update(data)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!expense) throw new Error("No se encontró el egreso a actualizar");
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-expense-report"] });
      toast({
        title: "Egreso actualizado",
        description: "El egreso ha sido actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete an expense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("expenses").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-expense-report"] });
      toast({
        title: "Egreso eliminado",
        description: "El egreso ha sido eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Get custom expense categories
 */
export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories-custom"],
    queryFn: async () => {
      const { data, error } = await api
        .from<ExpenseCategory_Custom>("expense_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return (data as ExpenseCategory_Custom[]) || [];
    },
  });
}

/**
 * Create custom expense category
 */
export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      icon?: string;
      color?: string;
      parent_category?: string;
    }) => {
      const { data: category, error } = await api
        .from("expense_categories")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories-custom"] });
      toast({
        title: "Categoria creada",
        description: "La categoria de gasto ha sido creada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Create expense from doctor settlement
 */
export function useCreateExpenseFromSettlement() {
  const createExpense = useCreateExpense();

  return useMutation({
    mutationFn: async ({
      settlementId,
      doctorName,
      amount,
      date,
    }: {
      settlementId: string;
      doctorName: string;
      amount: number;
      date: string;
    }) => {
      return createExpense.mutateAsync({
        expense_date: date,
        category: "doctor_settlement",
        description: `Liquidacion de ${doctorName}`,
        amount,
        payment_method: "transfer",
        beneficiary_name: doctorName,
        beneficiary_type: "doctor",
        settlement_id: settlementId,
      });
    },
  });
}
