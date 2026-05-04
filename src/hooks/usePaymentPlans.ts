import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addMonths, setDate, format } from "date-fns";

// ============ TYPES ============

export interface Installment {
  id: string;
  plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string | null;
  paid_amount: number;
  paid_date: string | null;
  payment_id: string | null;
  status: "pending" | "partial" | "paid" | "overdue";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentPlan {
  id: string;
  patient_id: string;
  invoice_id: string | null;
  total_amount: number;
  down_payment: number;
  remaining_amount: number;
  installments: number;
  installment_amount: number;
  interest_rate: number;
  start_date: string;
  status: "active" | "completed" | "defaulted" | "cancelled";
  payment_mode: "fixed_date" | "flexible";
  day_of_month: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  } | null;
  installment_list?: Installment[];
}

export interface CreatePaymentPlanInput {
  patient_id: string;
  invoice_id?: string | null;
  total_amount: number;
  down_payment: number;
  num_installments: number;
  payment_mode: "fixed_date" | "flexible";
  day_of_month?: number | null;
  interest_rate?: number;
  start_date?: string;
  notes?: string;
}

export interface PayInstallmentInput {
  installment_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
}

// ============ HOOKS ============

/**
 * Hook para obtener todos los planes de pago con sus cuotas
 */
export function usePaymentPlans(filters?: { status?: string; patientId?: string }) {
  return useQuery({
    queryKey: ["payment-plans", filters],
    queryFn: async () => {
      let query = api
        .from<PaymentPlan>("financing_plans")
        .select("*,patient:patients(id,first_name,last_name,phone,email)")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      const { data: plans, error } = await query;
      if (error) throw error;

      // Cargar cuotas para cada plan
      const plansWithInstallments = await Promise.all(
        (plans as PaymentPlan[]).map(async (plan) => {
          const { data: installments } = await api
            .from<Installment>("installments")
            .select("*")
            .eq("plan_id", plan.id)
            .order("installment_number");

          return {
            ...plan,
            installment_list: installments as Installment[] || [],
          };
        })
      );

      return plansWithInstallments;
    },
  });
}

/**
 * Hook para obtener un plan de pago especifico con sus cuotas
 */
export function usePaymentPlan(id: string | null) {
  return useQuery({
    queryKey: ["payment-plan", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: plan, error: planError } = await api
        .from<PaymentPlan>("financing_plans")
        .select("*,patient:patients(id,first_name,last_name,phone,email)")
        .eq("id", id)
        .single();

      if (planError) throw planError;

      const { data: installments, error: installmentsError } = await api
        .from<Installment>("installments")
        .select("*")
        .eq("plan_id", id)
        .order("installment_number");

      if (installmentsError) throw installmentsError;

      return {
        ...plan,
        installment_list: installments as Installment[],
      } as PaymentPlan;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obtener planes de pago de un paciente especifico
 */
export function usePatientPaymentPlans(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-payment-plans", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data: plans, error } = await api
        .from<PaymentPlan>("financing_plans")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Cargar cuotas para cada plan
      const plansWithInstallments = await Promise.all(
        (plans as PaymentPlan[]).map(async (plan) => {
          const { data: installments } = await api
            .from<Installment>("installments")
            .select("*")
            .eq("plan_id", plan.id)
            .order("installment_number");

          return {
            ...plan,
            installment_list: installments as Installment[] || [],
          };
        })
      );

      return plansWithInstallments;
    },
    enabled: !!patientId,
  });
}

/**
 * Hook para obtener cuotas vencidas
 */
export function useOverdueInstallments() {
  return useQuery({
    queryKey: ["overdue-installments"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      // Primero actualizar cuotas vencidas
      await api.rpc("update_overdue_installments");

      // Obtener cuotas vencidas con info del plan y paciente
      const { data: installments, error } = await api
        .from<Installment>("installments")
        .select("*")
        .eq("status", "overdue")
        .order("due_date");

      if (error) throw error;

      // Cargar info del plan y paciente para cada cuota
      const installmentsWithDetails = await Promise.all(
        (installments as Installment[]).map(async (inst) => {
          const { data: plan } = await api
            .from<PaymentPlan>("financing_plans")
            .select("*,patient:patients(id,first_name,last_name,phone,email)")
            .eq("id", inst.plan_id)
            .single();

          return {
            ...inst,
            plan: plan as PaymentPlan,
          };
        })
      );

      return installmentsWithDetails;
    },
  });
}

/**
 * Hook para obtener una cuota especifica
 */
export function useInstallment(id: string | null) {
  return useQuery({
    queryKey: ["installment", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: installment, error } = await api
        .from<Installment>("installments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Cargar info del plan
      const { data: plan } = await api
        .from<PaymentPlan>("financing_plans")
        .select("*,patient:patients(id,first_name,last_name,phone,email)")
        .eq("id", (installment as Installment).plan_id)
        .single();

      return {
        ...installment,
        plan: plan as PaymentPlan,
      };
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear un plan de pago con generacion automatica de cuotas
 */
export function useCreatePaymentPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePaymentPlanInput) => {
      const {
        patient_id,
        invoice_id,
        total_amount,
        down_payment,
        num_installments,
        payment_mode,
        day_of_month,
        interest_rate = 0,
        start_date,
        notes,
      } = input;

      // Calcular montos
      const amountAfterDownPayment = total_amount - down_payment;
      const interestAmount = amountAfterDownPayment * (interest_rate / 100);
      const totalToFinance = amountAfterDownPayment + interestAmount;
      const installmentAmount = Math.ceil((totalToFinance / num_installments) * 100) / 100;

      // Crear el plan
      const { data: plan, error: planError } = await api
        .from<PaymentPlan>("financing_plans")
        .insert({
          patient_id,
          invoice_id: invoice_id || null,
          total_amount,
          down_payment,
          remaining_amount: totalToFinance,
          installments: num_installments,
          installment_amount: installmentAmount,
          interest_rate,
          start_date: start_date || format(new Date(), "yyyy-MM-dd"),
          status: "active",
          payment_mode,
          day_of_month: payment_mode === "fixed_date" ? day_of_month : null,
          notes: notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (planError) throw planError;
      if (!plan) throw new Error("No se pudo crear el plan");

      const createdPlan = plan as PaymentPlan;

      // Generar cuotas
      const installmentsToCreate: Partial<Installment>[] = [];
      const planStartDate = new Date(createdPlan.start_date);

      for (let i = 1; i <= num_installments; i++) {
        let dueDate: string | null = null;

        if (payment_mode === "fixed_date" && day_of_month) {
          // Calcular fecha basada en dia fijo del mes
          const monthDate = addMonths(planStartDate, i);
          const adjustedDate = setDate(monthDate, Math.min(day_of_month, 28));
          dueDate = format(adjustedDate, "yyyy-MM-dd");
        }
        // Para modo flexible, due_date es null

        // Ajustar ultima cuota si hay diferencia por redondeo
        let amount = installmentAmount;
        if (i === num_installments) {
          const previousTotal = installmentAmount * (num_installments - 1);
          amount = Math.round((totalToFinance - previousTotal) * 100) / 100;
        }

        installmentsToCreate.push({
          plan_id: createdPlan.id,
          installment_number: i,
          amount,
          due_date: dueDate,
          paid_amount: 0,
          status: "pending",
        });
      }

      // Insertar cuotas
      const { error: installmentsError } = await api
        .from("installments")
        .insert(installmentsToCreate);

      if (installmentsError) throw installmentsError;

      return createdPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-plans"] });
      queryClient.invalidateQueries({ queryKey: ["financing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["patient-payment-plans"] });
      queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
      toast({
        title: "Plan de pago creado",
        description: "El plan y sus cuotas han sido generados correctamente.",
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
 * Hook para registrar pago de una cuota
 */
export function usePayInstallment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: PayInstallmentInput) => {
      const { installment_id, amount, payment_method, notes } = input;

      // Obtener la cuota
      const { data: installment, error: fetchError } = await api
        .from<Installment>("installments")
        .select("*")
        .eq("id", installment_id)
        .single();

      if (fetchError) throw fetchError;
      if (!installment) throw new Error("Cuota no encontrada");

      const inst = installment as Installment;

      // Obtener el plan para info del paciente
      const { data: plan, error: planError } = await api
        .from<PaymentPlan>("financing_plans")
        .select("patient_id,invoice_id")
        .eq("id", inst.plan_id)
        .single();

      if (planError) throw planError;
      if (!plan) throw new Error("Plan no encontrado");

      const planData = plan as PaymentPlan;

      // Crear el pago
      const { data: payment, error: paymentError } = await api
        .from("payments")
        .insert({
          patient_id: planData.patient_id,
          invoice_id: planData.invoice_id,
          financing_plan_id: inst.plan_id,
          amount,
          payment_method,
          payment_date: format(new Date(), "yyyy-MM-dd"),
          notes: notes || `Pago cuota #${inst.installment_number}`,
          is_financing_payment: true,
          processed_by: user?.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      interface PaymentRecord {
        id: string;
      }

      const paymentRecord = payment as PaymentRecord;

      // Actualizar la cuota
      const newPaidAmount = Number(inst.paid_amount) + amount;
      const remaining = Number(inst.amount) - newPaidAmount;
      let newStatus: Installment["status"] = "partial";

      if (remaining <= 0) {
        newStatus = "paid";
      } else if (inst.due_date && new Date(inst.due_date) < new Date()) {
        newStatus = "overdue";
      }

      const { error: updateError } = await api
        .from("installments")
        .update({
          paid_amount: newPaidAmount,
          paid_date: newStatus === "paid" ? format(new Date(), "yyyy-MM-dd") : null,
          payment_id: paymentRecord.id,
          status: newStatus,
          notes: notes || inst.notes,
        })
        .eq("id", installment_id);

      if (updateError) throw updateError;

      // Actualizar el remaining_amount del plan de financiamiento
      const { data: currentPlan } = await api
        .from<PaymentPlan>("financing_plans")
        .select("remaining_amount,total_amount")
        .eq("id", inst.plan_id)
        .single();

      if (currentPlan) {
        const newRemainingAmount = Math.max(0, Number(currentPlan.remaining_amount) - amount);
        const planStatus = newRemainingAmount <= 0 ? "completed" : "active";

        await api
          .from("financing_plans")
          .update({
            remaining_amount: newRemainingAmount,
            status: planStatus,
          })
          .eq("id", inst.plan_id);
      }

      return { payment: paymentRecord, installment: inst };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-plans"] });
      queryClient.invalidateQueries({ queryKey: ["payment-plan"] });
      queryClient.invalidateQueries({ queryKey: ["patient-payment-plans"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["installment"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-installments"] });
      queryClient.invalidateQueries({ queryKey: ["financing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
      toast({
        title: "Pago registrado",
        description: "El pago de la cuota ha sido procesado.",
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
 * Hook para cancelar un plan de pago
 */
export function useCancelPaymentPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await api
        .from("financing_plans")
        .update({ status: "cancelled" })
        .eq("id", planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-plans"] });
      queryClient.invalidateQueries({ queryKey: ["financing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
      toast({
        title: "Plan cancelado",
        description: "El plan de pago ha sido cancelado.",
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

// ============ HELPERS ============

/**
 * Genera una preview de las cuotas antes de crear el plan
 */
export function generateInstallmentPreview(
  totalAmount: number,
  downPayment: number,
  numInstallments: number,
  paymentMode: "fixed_date" | "flexible",
  dayOfMonth: number | null,
  interestRate: number = 0,
  startDate: Date = new Date()
): Array<{ number: number; amount: number; dueDate: string | null }> {
  const amountAfterDownPayment = totalAmount - downPayment;
  const interestAmount = amountAfterDownPayment * (interestRate / 100);
  const totalToFinance = amountAfterDownPayment + interestAmount;
  const installmentAmount = Math.ceil((totalToFinance / numInstallments) * 100) / 100;

  const preview: Array<{ number: number; amount: number; dueDate: string | null }> = [];

  for (let i = 1; i <= numInstallments; i++) {
    let dueDate: string | null = null;

    if (paymentMode === "fixed_date" && dayOfMonth) {
      const monthDate = addMonths(startDate, i);
      const adjustedDate = setDate(monthDate, Math.min(dayOfMonth, 28));
      dueDate = format(adjustedDate, "yyyy-MM-dd");
    }

    // Ajustar ultima cuota
    let amount = installmentAmount;
    if (i === numInstallments) {
      const previousTotal = installmentAmount * (numInstallments - 1);
      amount = Math.round((totalToFinance - previousTotal) * 100) / 100;
    }

    preview.push({
      number: i,
      amount,
      dueDate,
    });
  }

  return preview;
}

export const INSTALLMENT_STATUSES = [
  { value: "pending", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "partial", label: "Parcial", color: "bg-blue-100 text-blue-800" },
  { value: "paid", label: "Pagada", color: "bg-green-100 text-green-800" },
  { value: "overdue", label: "Vencida", color: "bg-red-100 text-red-800" },
];

export const PAYMENT_MODES = [
  { value: "flexible", label: "Flexible (sin fecha fija)" },
  { value: "fixed_date", label: "Fecha fija mensual" },
];
