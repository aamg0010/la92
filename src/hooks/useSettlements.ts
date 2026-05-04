/**
 * useSettlements.ts
 * Hook para liquidacion de odontologos
 *
 * Formula: Liquidacion = (Ingresos - Costos Laboratorio) x Porcentaje
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ============ TYPES ============

export interface DoctorSettlement {
  id: string;
  doctor_id: string;
  settlement_date: string;
  gross_income: number;
  lab_costs: number;
  net_income: number;
  settlement_percentage: number;
  settlement_amount: number;
  status: "pending" | "paid" | "cancelled";
  paid_date: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  doctor?: {
    full_name: string;
    specialty: string | null;
    settlement_percentage: number | null;
  };
}

export interface SettlementItem {
  id: string;
  settlement_id: string;
  item_type: "income" | "lab_cost";
  description: string | null;
  amount: number;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface SettlementCalculation {
  doctorId: string;
  doctorName: string;
  settlementDate: string;
  settlementPercentage: number;
  incomeItems: {
    id: string;
    description: string;
    amount: number;
    patientName: string;
    paymentMethod: string;
    referenceType: "payment";
  }[];
  labCostItems: {
    id: string;
    description: string;
    amount: number;
    patientName: string;
    labName: string;
    referenceType: "lab_order";
  }[];
  grossIncome: number;
  labCosts: number;
  netIncome: number;
  settlementAmount: number;
}

export interface DoctorWithPercentage {
  user_id: string;
  full_name: string;
  specialty: string | null;
  settlement_percentage: number;
  role: string | null;
}

// ============ HOOKS ============

/**
 * Get all doctors with their settlement percentage
 */
export function useDoctorsForSettlement() {
  return useQuery({
    queryKey: ["doctors-for-settlement"],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profilesError } = await api
        .from("profiles")
        .select("user_id,full_name,specialty,settlement_percentage");

      if (profilesError) throw profilesError;

      // Get roles to filter only doctors
      const { data: roles, error: rolesError } = await api
        .from("user_roles")
        .select("user_id,role");

      if (rolesError) throw rolesError;

      const roleMap = new Map<string, string>();
      (roles as { user_id: string; role: string }[])?.forEach((r) =>
        roleMap.set(r.user_id, r.role)
      );

      // Filter to only doctors and admins who can have settlements
      const doctors: DoctorWithPercentage[] = (
        profiles as {
          user_id: string;
          full_name: string;
          specialty: string | null;
          settlement_percentage: number | null;
        }[]
      )
        ?.filter((p) => {
          const role = roleMap.get(p.user_id);
          return role === "doctor" || role === "admin";
        })
        .map((p) => ({
          user_id: p.user_id,
          full_name: p.full_name,
          specialty: p.specialty,
          settlement_percentage: p.settlement_percentage ?? 45,
          role: roleMap.get(p.user_id) || null,
        }));

      return doctors || [];
    },
  });
}

/**
 * Update doctor's settlement percentage
 */
export function useUpdateSettlementPercentage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      percentage,
    }: {
      userId: string;
      percentage: number;
    }) => {
      const { error } = await api
        .from("profiles")
        .update({ settlement_percentage: percentage })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors-for-settlement"] });
      toast({
        title: "Porcentaje actualizado",
        description: "El porcentaje de liquidacion ha sido guardado.",
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
 * Calculate settlement for a doctor on a specific date
 * This fetches payments and lab orders to compute the settlement
 */
export function useCalculateSettlement(doctorId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["calculate-settlement", doctorId, date],
    queryFn: async (): Promise<SettlementCalculation | null> => {
      if (!doctorId || !date) return null;

      // 1. Get doctor info
      const { data: profile, error: profileError } = await api
        .from("profiles")
        .select("user_id,full_name,specialty,settlement_percentage")
        .eq("user_id", doctorId)
        .single();

      if (profileError) throw profileError;

      const doctorProfile = profile as {
        user_id: string;
        full_name: string;
        specialty: string | null;
        settlement_percentage: number | null;
      };

      const settlementPercentage = doctorProfile.settlement_percentage ?? 45;

      // 2. Get payments for the date where doctor attended the patient
      // We need to join appointments to get payments by doctor
      const { data: payments, error: paymentsError } = await api
        .from("payments")
        .select(
          "id,amount,payment_method,payment_date,notes,patient:patients(id,first_name,last_name),invoice:invoices(id,invoice_number)"
        )
        .eq("payment_date", date);

      if (paymentsError) throw paymentsError;

      // 3. Get appointments for the date by doctor to filter payments
      const { data: appointments, error: apptError } = await api
        .from("appointments")
        .select("id,patient_id,treatment_type")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", date);

      if (apptError) throw apptError;

      // Create set of patient IDs that this doctor saw today
      const doctorPatientIds = new Set(
        (appointments as { patient_id: string }[])?.map((a) => a.patient_id) || []
      );

      // Filter payments to only those from patients the doctor saw
      interface PaymentData {
        id: string;
        amount: number;
        payment_method: string;
        payment_date: string;
        notes: string | null;
        patient: { id: string; first_name: string; last_name: string } | null;
        invoice: { id: string; invoice_number: string } | null;
      }

      const doctorPayments = (payments as PaymentData[])?.filter(
        (p) => p.patient && doctorPatientIds.has(p.patient.id)
      ) || [];

      // 4. Get lab orders completed on this date by this doctor
      const { data: labOrders, error: labError } = await api
        .from("lab_orders")
        .select(
          "id,order_number,work_type,final_price,patient:patients(first_name,last_name),selected_lab:dental_labs(name)"
        )
        .eq("doctor_id", doctorId)
        .in("status", ["delivered", "completed"])
        .gte("updated_at", `${date}T00:00:00`)
        .lte("updated_at", `${date}T23:59:59`);

      if (labError) throw labError;

      // 5. Build income items
      const incomeItems = doctorPayments.map((p) => ({
        id: p.id,
        description: `Pago ${p.invoice?.invoice_number || "directo"} - ${p.payment_method}`,
        amount: Number(p.amount),
        patientName: p.patient
          ? `${p.patient.first_name} ${p.patient.last_name}`
          : "N/A",
        paymentMethod: p.payment_method,
        referenceType: "payment" as const,
      }));

      // 6. Build lab cost items
      interface LabOrderData {
        id: string;
        order_number: string;
        work_type: string;
        final_price: number | null;
        patient: { first_name: string; last_name: string } | null;
        selected_lab: { name: string } | null;
      }

      const labCostItems = ((labOrders as LabOrderData[]) || [])
        .filter((lo) => lo.final_price && lo.final_price > 0)
        .map((lo) => ({
          id: lo.id,
          description: `${lo.work_type} - ${lo.order_number}`,
          amount: Number(lo.final_price),
          patientName: lo.patient
            ? `${lo.patient.first_name} ${lo.patient.last_name}`
            : "N/A",
          labName: lo.selected_lab?.name || "N/A",
          referenceType: "lab_order" as const,
        }));

      // 7. Calculate totals
      const grossIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
      const labCosts = labCostItems.reduce((sum, item) => sum + item.amount, 0);
      const netIncome = grossIncome - labCosts;
      const settlementAmount = netIncome * (settlementPercentage / 100);

      return {
        doctorId,
        doctorName: doctorProfile.full_name,
        settlementDate: date,
        settlementPercentage,
        incomeItems,
        labCostItems,
        grossIncome,
        labCosts,
        netIncome,
        settlementAmount: Math.max(0, settlementAmount),
      };
    },
    enabled: !!doctorId && !!date,
  });
}

/**
 * Get settlements for a doctor
 */
export function useDoctorSettlements(
  doctorId?: string,
  filters?: { status?: string; startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: ["doctor-settlements", doctorId, filters],
    queryFn: async () => {
      let query = api
        .from<DoctorSettlement>("doctor_settlements")
        .select("*")
        .order("settlement_date", { ascending: false });

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.startDate) {
        query = query.gte("settlement_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("settlement_date", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get doctor profiles for names
      const doctorIds = [...new Set((data as DoctorSettlement[])?.map((s) => s.doctor_id) || [])];

      if (doctorIds.length > 0) {
        const { data: profiles } = await api
          .from("profiles")
          .select("user_id,full_name,specialty,settlement_percentage")
          .in("user_id", doctorIds);

        const profileMap = new Map(
          (profiles as { user_id: string; full_name: string; specialty: string | null; settlement_percentage: number | null }[])?.map((p) => [
            p.user_id,
            { full_name: p.full_name, specialty: p.specialty, settlement_percentage: p.settlement_percentage },
          ])
        );

        return (data as DoctorSettlement[])?.map((s) => ({
          ...s,
          doctor: profileMap.get(s.doctor_id),
        })) || [];
      }

      return data as DoctorSettlement[];
    },
  });
}

/**
 * Get pending settlements (not yet paid)
 */
export function usePendingSettlements() {
  return useDoctorSettlements(undefined, { status: "pending" });
}

/**
 * Get settlement items (details)
 */
export function useSettlementItems(settlementId: string | null) {
  return useQuery({
    queryKey: ["settlement-items", settlementId],
    queryFn: async () => {
      if (!settlementId) return [];

      const { data, error } = await api
        .from<SettlementItem>("settlement_items")
        .select("*")
        .eq("settlement_id", settlementId)
        .order("item_type")
        .order("created_at");

      if (error) throw error;
      return data as SettlementItem[];
    },
    enabled: !!settlementId,
  });
}

/**
 * Create (save) a settlement
 */
export function useCreateSettlement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (calculation: SettlementCalculation) => {
      // 1. Create the settlement record
      const { data: settlement, error: settlementError } = await api
        .from("doctor_settlements")
        .insert({
          doctor_id: calculation.doctorId,
          settlement_date: calculation.settlementDate,
          gross_income: calculation.grossIncome,
          lab_costs: calculation.labCosts,
          net_income: calculation.netIncome,
          settlement_percentage: calculation.settlementPercentage,
          settlement_amount: calculation.settlementAmount,
          status: "pending",
        })
        .select()
        .single();

      if (settlementError) throw settlementError;

      const settlementId = (settlement as { id: string }).id;

      // 2. Create settlement items for income
      const incomeItems = calculation.incomeItems.map((item) => ({
        settlement_id: settlementId,
        item_type: "income",
        description: item.description,
        amount: item.amount,
        reference_id: item.id,
        reference_type: item.referenceType,
      }));

      // 3. Create settlement items for lab costs
      const labCostItems = calculation.labCostItems.map((item) => ({
        settlement_id: settlementId,
        item_type: "lab_cost",
        description: item.description,
        amount: item.amount,
        reference_id: item.id,
        reference_type: item.referenceType,
      }));

      if (incomeItems.length > 0 || labCostItems.length > 0) {
        const { error: itemsError } = await api
          .from("settlement_items")
          .insert([...incomeItems, ...labCostItems]);

        if (itemsError) throw itemsError;
      }

      return settlement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-settlements"] });
      queryClient.invalidateQueries({ queryKey: ["calculate-settlement"] });
      toast({
        title: "Liquidacion guardada",
        description: "La liquidacion ha sido registrada correctamente.",
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
 * Mark settlement as paid
 */
export function useMarkSettlementPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ settlementId, notes }: { settlementId: string; notes?: string }) => {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await api
        .from("doctor_settlements")
        .update({
          status: "paid",
          paid_date: today,
          paid_by: user?.id,
          notes: notes || null,
        })
        .eq("id", settlementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-settlements"] });
      toast({
        title: "Liquidacion pagada",
        description: "La liquidacion ha sido marcada como pagada.",
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
 * Cancel a settlement
 */
export function useCancelSettlement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ settlementId, reason }: { settlementId: string; reason?: string }) => {
      const { error } = await api
        .from("doctor_settlements")
        .update({
          status: "cancelled",
          notes: reason || null,
        })
        .eq("id", settlementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-settlements"] });
      toast({
        title: "Liquidacion cancelada",
        description: "La liquidacion ha sido cancelada.",
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
 * Settlement stats
 */
export function useSettlementStats(period?: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["settlement-stats", period],
    queryFn: async () => {
      let query = api
        .from<DoctorSettlement>("doctor_settlements")
        .select("status,settlement_amount");

      if (period?.startDate) {
        query = query.gte("settlement_date", period.startDate);
      }
      if (period?.endDate) {
        query = query.lte("settlement_date", period.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const settlements = data as DoctorSettlement[];

      const totalPending = settlements
        .filter((s) => s.status === "pending")
        .reduce((sum, s) => sum + Number(s.settlement_amount), 0);

      const totalPaid = settlements
        .filter((s) => s.status === "paid")
        .reduce((sum, s) => sum + Number(s.settlement_amount), 0);

      const pendingCount = settlements.filter((s) => s.status === "pending").length;
      const paidCount = settlements.filter((s) => s.status === "paid").length;

      return {
        totalPending,
        totalPaid,
        pendingCount,
        paidCount,
        total: totalPending + totalPaid,
      };
    },
  });
}

// ============ CONSTANTS ============

export const SETTLEMENT_STATUSES = [
  { value: "pending", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: "Pagada", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelada", color: "bg-red-100 text-red-800" },
];

export const getStatusBadge = (status: string) => {
  return SETTLEMENT_STATUSES.find((s) => s.value === status) || SETTLEMENT_STATUSES[0];
};
