import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Payment = Tables<"payments"> & {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
  invoice?: {
    id: string;
    invoice_number: string;
    total: number;
  } | null;
};

export type FinancingPlan = Tables<"financing_plans"> & {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
  } | null;
  invoice?: {
    id: string;
    invoice_number: string;
    total: number;
  } | null;
  payments?: Payment[];
};

// ============ PAYMENTS ============

export function usePayments(filters?: {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  invoiceId?: string;
}) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone),
          invoice:invoices(id, invoice_number, total)
        `)
        .order("payment_date", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("payment_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("payment_date", filters.endDate);
      }
      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }
      if (filters?.invoiceId) {
        query = query.eq("invoice_id", filters.invoiceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payment: Omit<TablesInsert<"payments">, "processed_by">) => {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          ...payment,
          processed_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Si hay plan de financiamiento, actualizar el monto restante
      if (payment.financing_plan_id) {
        const { data: plan } = await supabase
          .from("financing_plans")
          .select("remaining_amount")
          .eq("id", payment.financing_plan_id)
          .single();

        if (plan) {
          const newRemaining = Number(plan.remaining_amount) - Number(payment.amount);
          await supabase
            .from("financing_plans")
            .update({
              remaining_amount: Math.max(0, newRemaining),
              status: newRemaining <= 0 ? "completed" : "active",
            })
            .eq("id", payment.financing_plan_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["financing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado correctamente.",
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

// ============ FINANCING PLANS ============

export function useFinancingPlans(filters?: { status?: string; patientId?: string }) {
  return useQuery({
    queryKey: ["financing-plans", filters],
    queryFn: async () => {
      let query = supabase
        .from("financing_plans")
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone, email),
          invoice:invoices(id, invoice_number, total)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancingPlan[];
    },
  });
}

export function useFinancingPlan(id: string | null) {
  return useQuery({
    queryKey: ["financing-plan", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: plan, error: planError } = await supabase
        .from("financing_plans")
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone, email),
          invoice:invoices(id, invoice_number, total)
        `)
        .eq("id", id)
        .single();

      if (planError) throw planError;

      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("financing_plan_id", id)
        .order("payment_date", { ascending: true });

      if (paymentsError) throw paymentsError;

      return { ...plan, payments } as FinancingPlan;
    },
    enabled: !!id,
  });
}

export function useCreateFinancingPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plan: Omit<TablesInsert<"financing_plans">, "created_by">) => {
      const { data, error } = await supabase
        .from("financing_plans")
        .insert({
          ...plan,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-plans"] });
      toast({
        title: "Plan de pago creado",
        description: "El plan de financiamiento ha sido registrado.",
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

export function useUpdateFinancingPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"financing_plans">) => {
      const { data, error } = await supabase
        .from("financing_plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["financing-plan", variables.id] });
      toast({
        title: "Plan actualizado",
        description: "Los cambios han sido guardados.",
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

// ============ PATIENT DEBT (CARTERA) ============

export function usePatientDebt() {
  return useQuery({
    queryKey: ["patient-debt"],
    queryFn: async () => {
      // Obtener facturas con pagos
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          id,
          patient_id,
          total,
          due_date,
          status,
          patient:patients(id, first_name, last_name, phone, email)
        `)
        .in("status", ["pending", "sent", "validated"])
        .order("due_date", { ascending: true });

      if (invoicesError) throw invoicesError;

      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("invoice_id, amount");

      if (paymentsError) throw paymentsError;

      // Calcular deuda por paciente
      const paymentsByInvoice: Record<string, number> = {};
      payments?.forEach((p) => {
        paymentsByInvoice[p.invoice_id] = (paymentsByInvoice[p.invoice_id] || 0) + Number(p.amount);
      });

      const debtByPatient: Record<string, {
        patientId: string;
        patientName: string;
        phone: string;
        email: string | null;
        totalDebt: number;
        paidAmount: number;
        dueDate: string | null;
        status: "current" | "overdue" | "plan";
      }> = {};

      const today = new Date().toISOString().split("T")[0];

      invoices?.forEach((inv) => {
        if (!inv.patient) return;

        const paid = paymentsByInvoice[inv.id] || 0;
        const remaining = Number(inv.total) - paid;

        if (remaining <= 0) return;

        const patientId = inv.patient_id;
        if (!debtByPatient[patientId]) {
          debtByPatient[patientId] = {
            patientId,
            patientName: `${inv.patient.first_name} ${inv.patient.last_name}`,
            phone: inv.patient.phone,
            email: inv.patient.email,
            totalDebt: 0,
            paidAmount: 0,
            dueDate: inv.due_date,
            status: "current",
          };
        }

        debtByPatient[patientId].totalDebt += Number(inv.total);
        debtByPatient[patientId].paidAmount += paid;

        if (inv.due_date && inv.due_date < today) {
          debtByPatient[patientId].status = "overdue";
        }
      });

      return Object.values(debtByPatient);
    },
  });
}

// ============ STATS ============

export function usePaymentStats(period?: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["payment-stats", period],
    queryFn: async () => {
      let query = supabase.from("payments").select("amount, payment_method, payment_date");

      if (period?.startDate) {
        query = query.gte("payment_date", period.startDate);
      }
      if (period?.endDate) {
        query = query.lte("payment_date", period.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalCollected = data.reduce((acc, p) => acc + Number(p.amount), 0);
      const paymentCount = data.length;

      const byMethod: Record<string, number> = {};
      data.forEach((p) => {
        byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + Number(p.amount);
      });

      // Recaudo de hoy
      const today = new Date().toISOString().split("T")[0];
      const todayPayments = data.filter((p) => p.payment_date.startsWith(today));
      const todayTotal = todayPayments.reduce((acc, p) => acc + Number(p.amount), 0);

      return {
        totalCollected,
        paymentCount,
        byMethod,
        todayTotal,
        todayCount: todayPayments.length,
      };
    },
  });
}

export function useDebtStats() {
  return useQuery({
    queryKey: ["debt-stats"],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, total, due_date, status")
        .in("status", ["pending", "sent", "validated"]);

      const { data: payments } = await supabase
        .from("payments")
        .select("invoice_id, amount");

      const { data: plans } = await supabase
        .from("financing_plans")
        .select("remaining_amount, status")
        .eq("status", "active");

      const paymentsByInvoice: Record<string, number> = {};
      payments?.forEach((p) => {
        paymentsByInvoice[p.invoice_id] = (paymentsByInvoice[p.invoice_id] || 0) + Number(p.amount);
      });

      const today = new Date().toISOString().split("T")[0];
      let totalDebt = 0;
      let overdueDebt = 0;

      invoices?.forEach((inv) => {
        const paid = paymentsByInvoice[inv.id] || 0;
        const remaining = Number(inv.total) - paid;
        if (remaining > 0) {
          totalDebt += remaining;
          if (inv.due_date && inv.due_date < today) {
            overdueDebt += remaining;
          }
        }
      });

      const inPlanDebt = plans?.reduce((acc, p) => acc + Number(p.remaining_amount), 0) || 0;

      return {
        totalDebt,
        overdueDebt,
        inPlanDebt,
        currentDebt: totalDebt - overdueDebt - inPlanDebt,
      };
    },
  });
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "check", label: "Cheque" },
  { value: "other", label: "Otro" },
];

export const FINANCING_STATUSES = [
  { value: "active", label: "Activo" },
  { value: "completed", label: "Completado" },
  { value: "defaulted", label: "En mora" },
  { value: "cancelled", label: "Cancelado" },
];
