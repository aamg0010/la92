import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Payment {
  id: string;
  patient_id: string;
  invoice_id: string | null;
  financing_plan_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  processed_by: string | null;
  created_at: string;
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
    issue_date?: string;
  } | null;
}

export interface FinancingPlan {
  id: string;
  patient_id: string;
  invoice_id: string | null;
  total_amount: number;
  down_payment: number | null;
  remaining_amount: number;
  installments: number;
  installment_amount: number;
  interest_rate: number | null;
  start_date: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
}

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
      let query = api
        .from<Payment>("payments")
        .select(
          "*,patient:patients(id,first_name,last_name,phone),invoice:invoices(id,invoice_number,total,issue_date)",
        )
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
    mutationFn: async (payment: Partial<Payment>) => {
      const { data, error } = await api
        .from("payments")
        .insert({
          ...payment,
          processed_by: user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("No se pudo registrar el pago");

      // Si hay plan de financiamiento, actualizar el monto restante
      if (payment.financing_plan_id) {
        const { data: plan } = await api
          .from<FinancingPlan>("financing_plans")
          .select("remaining_amount")
          .eq("id", payment.financing_plan_id)
          .maybeSingle();

        if (plan) {
          const newRemaining = Number(plan.remaining_amount) - Number(payment.amount);
          await api
            .from("financing_plans")
            .update({
              remaining_amount: Math.max(0, newRemaining),
              status: newRemaining <= 0 ? "completed" : "active",
            })
            .eq("id", payment.financing_plan_id);
        }
      }

      // Si el pago está asociado a una factura, comprobar si queda saldada
      // y, en ese caso, marcarla como 'paid'. Se suman TODOS los pagos de la
      // factura (incluido el recién insertado) para evitar depender de un
      // trigger de BD.
      if (payment.invoice_id) {
        const { data: invoice } = await api
          .from<{ id: string; total: number; status: string }>("invoices")
          .select("id,total,status")
          .eq("id", payment.invoice_id)
          .maybeSingle();

        if (invoice && invoice.status !== "paid") {
          const { data: invoicePayments } = await api
            .from<{ amount: number }>("payments")
            .select("amount")
            .eq("invoice_id", payment.invoice_id);

          const totalPaid = (invoicePayments as { amount: number }[] | null)?.reduce(
            (acc, p) => acc + Number(p.amount),
            0,
          ) ?? 0;

          if (totalPaid >= Number(invoice.total)) {
            await api
              .from("invoices")
              .update({ status: "paid" })
              .eq("id", payment.invoice_id);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["financing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["patient-pending-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["patient-debt"] });
      queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
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

// ============ PATIENT PENDING INVOICES ============

/**
 * Devuelve las facturas pendientes (no pagadas ni anuladas) del paciente.
 * Se usa en el diálogo de registro de pago para permitir asociar, de forma
 * opcional, un pago a una factura concreta. Si `patientId` es null, no se
 * ejecuta la query y se devuelve array vacío.
 */
export interface PendingInvoice {
  id: string;
  invoice_number: string;
  total: number;
  issue_date: string;
  status: string;
}

export function usePatientPendingInvoices(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-pending-invoices", patientId],
    queryFn: async () => {
      if (!patientId) return [] as PendingInvoice[];

      const { data, error } = await api
        .from<PendingInvoice>("invoices")
        .select("id,invoice_number,total,issue_date,status")
        .eq("patient_id", patientId)
        .in("status", ["pending", "sent", "validated"])
        .order("issue_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PendingInvoice[];
    },
    enabled: !!patientId,
  });
}

// ============ FINANCING PLANS ============

export function useFinancingPlans(filters?: { status?: string; patientId?: string }) {
  return useQuery({
    queryKey: ["financing-plans", filters],
    queryFn: async () => {
      let query = api
        .from<FinancingPlan>("financing_plans")
        .select("*,patient:patients(id,first_name,last_name,phone,email),invoice:invoices(id,invoice_number,total)")
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

      const { data: plan, error: planError } = await api
        .from<FinancingPlan>("financing_plans")
        .select("*,patient:patients(id,first_name,last_name,phone,email),invoice:invoices(id,invoice_number,total)")
        .eq("id", id)
        .single();

      if (planError) throw planError;

      const { data: payments, error: paymentsError } = await api
        .from<Payment>("payments")
        .select("*")
        .eq("financing_plan_id", id)
        .order("payment_date");

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
    mutationFn: async (plan: Partial<FinancingPlan>) => {
      const { data, error } = await api
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
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<FinancingPlan>) => {
      const { data, error } = await api
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
      const { data: invoices, error: invoicesError } = await api
        .from("invoices")
        .select("id,patient_id,total,due_date,status,patient:patients(id,first_name,last_name,phone,email)")
        .in("status", ["pending", "sent", "validated"])
        .order("due_date");

      if (invoicesError) throw invoicesError;

      const { data: payments, error: paymentsError } = await api
        .from<Payment>("payments")
        .select("invoice_id,amount");

      if (paymentsError) throw paymentsError;

      // Calcular deuda por paciente
      const paymentsByInvoice: Record<string, number> = {};
      (payments as { invoice_id: string; amount: number }[])?.forEach((p) => {
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

      interface InvoiceData {
        id: string;
        patient_id: string;
        total: number;
        due_date: string | null;
        status: string;
        patient: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string | null;
        } | null;
      }

      (invoices as InvoiceData[])?.forEach((inv) => {
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
      let query = api.from<Payment>("payments").select("amount,payment_method,payment_date");

      if (period?.startDate) {
        query = query.gte("payment_date", period.startDate);
      }
      if (period?.endDate) {
        query = query.lte("payment_date", period.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const payments = data as Payment[];
      const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const paymentCount = payments.length;

      const byMethod: Record<string, number> = {};
      payments.forEach((p) => {
        byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + Number(p.amount);
      });

      // Recaudo de hoy
      const today = new Date().toISOString().split("T")[0];
      const todayPayments = payments.filter((p) => p.payment_date.startsWith(today));
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
      const { data: invoices } = await api
        .from("invoices")
        .select("id,total,due_date,status")
        .in("status", ["pending", "sent", "validated"]);

      const { data: payments } = await api
        .from<Payment>("payments")
        .select("invoice_id,amount");

      const { data: plans } = await api
        .from<FinancingPlan>("financing_plans")
        .select("remaining_amount,status")
        .eq("status", "active");

      const paymentsByInvoice: Record<string, number> = {};
      (payments as { invoice_id: string; amount: number }[])?.forEach((p) => {
        paymentsByInvoice[p.invoice_id] = (paymentsByInvoice[p.invoice_id] || 0) + Number(p.amount);
      });

      const today = new Date().toISOString().split("T")[0];
      let totalDebt = 0;
      let overdueDebt = 0;

      interface InvoiceStats {
        id: string;
        total: number;
        due_date: string | null;
        status: string;
      }

      (invoices as InvoiceStats[])?.forEach((inv) => {
        const paid = paymentsByInvoice[inv.id] || 0;
        const remaining = Number(inv.total) - paid;
        if (remaining > 0) {
          totalDebt += remaining;
          if (inv.due_date && inv.due_date < today) {
            overdueDebt += remaining;
          }
        }
      });

      const inPlanDebt = (plans as FinancingPlan[])?.reduce((acc, p) => acc + Number(p.remaining_amount), 0) || 0;

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
