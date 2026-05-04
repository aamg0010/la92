/**
 * useWasteManagement.ts
 * Hook para gestion de residuos biologicos (RH1)
 * Cumplimiento normativo de manejo de residuos hospitalarios
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ============ TYPES ============

export type WasteType = "red" | "black" | "white";

export type ScheduleFrequency = "weekly" | "biweekly" | "monthly";

export interface WasteDisposal {
  id: string;
  disposal_date: string;
  waste_type: WasteType;
  weight_kg: number;
  responsible_name: string;
  responsible_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WasteSchedule {
  id: string;
  waste_type: WasteType;
  day_of_week: number; // 0=Domingo, 6=Sabado
  frequency: ScheduleFrequency;
  collector_company: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWasteDisposalData {
  disposal_date: string;
  waste_type: WasteType;
  weight_kg: number;
  responsible_name: string;
  responsible_id?: string;
  notes?: string;
}

export interface CreateWasteScheduleData {
  waste_type: WasteType;
  day_of_week: number;
  frequency?: ScheduleFrequency;
  collector_company?: string;
  contact_phone?: string;
  notes?: string;
}

export interface WasteFilters {
  startDate?: string;
  endDate?: string;
  wasteType?: WasteType;
  searchTerm?: string;
}

export interface WasteStats {
  month: number;
  year: number;
  totalDisposals: number;
  totalWeightKg: number;
  byType: Record<WasteType, { count: number; weightKg: number }> | null;
  redWeightKg: number;
  blackWeightKg: number;
  whiteWeightKg: number;
  alertRedWeight: boolean;
}

export interface UpcomingPickup {
  id: string;
  wasteType: WasteType;
  dayOfWeek: number;
  frequency: ScheduleFrequency;
  collectorCompany: string | null;
  contactPhone: string | null;
  notes: string | null;
  nextPickupDate: string;
}

export interface WasteMonthlyReport {
  reportPeriod: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalDisposals: number;
    totalWeightKg: number;
  };
  byType: Array<{
    type: WasteType;
    disposalCount: number;
    totalWeightKg: number;
    avgWeightKg: number;
  }>;
  disposals: Array<{
    id: string;
    date: string;
    type: WasteType;
    weightKg: number;
    responsible: string;
    notes: string | null;
  }>;
  generatedAt: string;
}

// ============ CONSTANTS ============

export const WASTE_TYPES: Record<
  WasteType,
  { label: string; description: string; icon: string; color: string; bgColor: string; maxWeight?: number }
> = {
  red: {
    label: "Biosanitarios",
    description: "Residuos peligrosos: agujas, gasas con sangre, material cortopunzante",
    icon: "Biohazard",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-950/30",
    maxWeight: 25, // Max 25kg por bolsa
  },
  black: {
    label: "Ordinarios",
    description: "Residuos comunes: basura no reciclable, restos de comida",
    icon: "Trash2",
    color: "text-slate-800 dark:text-slate-200",
    bgColor: "bg-slate-100 dark:bg-slate-800/50",
  },
  white: {
    label: "Reciclables",
    description: "Residuos reciclables: papel, plastico, vidrio, carton",
    icon: "Recycle",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
  },
};

export const SCHEDULE_FREQUENCIES: Record<ScheduleFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

export const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

// ============ HOOKS ============

/**
 * Get waste disposals with optional filters
 */
export function useWasteDisposals(filters?: WasteFilters) {
  return useQuery({
    queryKey: ["waste-disposals", filters],
    queryFn: async () => {
      let query = api
        .from<WasteDisposal>("waste_disposals")
        .select("*")
        .order("disposal_date", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("disposal_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("disposal_date", filters.endDate);
      }
      if (filters?.wasteType) {
        query = query.eq("waste_type", filters.wasteType);
      }
      if (filters?.searchTerm) {
        query = query.or([
          `responsible_name.ilike.%${filters.searchTerm}%`,
          `notes.ilike.%${filters.searchTerm}%`,
        ]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as WasteDisposal[]) || [];
    },
  });
}

/**
 * Get a single waste disposal by ID
 */
export function useWasteDisposal(id: string | null) {
  return useQuery({
    queryKey: ["waste-disposal", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await api
        .from<WasteDisposal>("waste_disposals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as WasteDisposal;
    },
    enabled: !!id,
  });
}

/**
 * Get waste schedules
 */
export function useWasteSchedules() {
  return useQuery({
    queryKey: ["waste-schedules"],
    queryFn: async () => {
      const { data, error } = await api
        .from<WasteSchedule>("waste_schedules")
        .select("*")
        .order("waste_type")
        .order("day_of_week");

      if (error) throw error;
      return (data as WasteSchedule[]) || [];
    },
  });
}

/**
 * Get monthly waste statistics via RPC
 */
export function useWasteStats(year?: number, month?: number) {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  return useQuery({
    queryKey: ["waste-stats", targetYear, targetMonth],
    queryFn: async () => {
      const { data, error } = await api.rpc<WasteStats>("get_waste_stats_monthly", {
        p_year: targetYear,
        p_month: targetMonth,
      });

      if (error) throw error;
      return data as WasteStats;
    },
  });
}

/**
 * Get upcoming waste pickups via RPC
 */
export function useUpcomingPickups(daysAhead: number = 7) {
  return useQuery({
    queryKey: ["upcoming-pickups", daysAhead],
    queryFn: async () => {
      const { data, error } = await api.rpc<UpcomingPickup[]>("get_upcoming_waste_pickups", {
        p_days_ahead: daysAhead,
      });

      if (error) throw error;
      return (data as UpcomingPickup[]) || [];
    },
  });
}

/**
 * Get monthly report for compliance
 */
export function useWasteMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: ["waste-monthly-report", year, month],
    queryFn: async () => {
      const { data, error } = await api.rpc<WasteMonthlyReport>("get_waste_monthly_report", {
        p_year: year,
        p_month: month,
      });

      if (error) throw error;
      return data as WasteMonthlyReport;
    },
    enabled: !!year && !!month,
  });
}

/**
 * Create a new waste disposal
 */
export function useCreateWasteDisposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateWasteDisposalData) => {
      const { data: disposal, error } = await api
        .from("waste_disposals")
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!disposal) throw new Error("No se pudo registrar la disposición de residuos");
      return disposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-disposals"] });
      queryClient.invalidateQueries({ queryKey: ["waste-stats"] });
      queryClient.invalidateQueries({ queryKey: ["waste-monthly-report"] });
      toast({
        title: "Disposicion registrada",
        description: "El registro de residuos ha sido guardado correctamente.",
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
 * Update a waste disposal
 */
export function useUpdateWasteDisposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateWasteDisposalData> }) => {
      const { data: disposal, error } = await api
        .from("waste_disposals")
        .update(data)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!disposal) throw new Error("No se encontró el registro a actualizar");
      return disposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-disposals"] });
      queryClient.invalidateQueries({ queryKey: ["waste-disposal"] });
      queryClient.invalidateQueries({ queryKey: ["waste-stats"] });
      queryClient.invalidateQueries({ queryKey: ["waste-monthly-report"] });
      toast({
        title: "Registro actualizado",
        description: "El registro de residuos ha sido actualizado.",
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
 * Delete a waste disposal
 */
export function useDeleteWasteDisposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("waste_disposals").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-disposals"] });
      queryClient.invalidateQueries({ queryKey: ["waste-stats"] });
      queryClient.invalidateQueries({ queryKey: ["waste-monthly-report"] });
      toast({
        title: "Registro eliminado",
        description: "El registro de residuos ha sido eliminado.",
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
 * Create a waste schedule
 */
export function useCreateWasteSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateWasteScheduleData) => {
      const { data: schedule, error } = await api
        .from("waste_schedules")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-pickups"] });
      toast({
        title: "Programacion creada",
        description: "La recogida ha sido programada correctamente.",
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
 * Update a waste schedule
 */
export function useUpdateWasteSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateWasteScheduleData & { is_active: boolean }> }) => {
      const { data: schedule, error } = await api
        .from("waste_schedules")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-pickups"] });
      toast({
        title: "Programacion actualizada",
        description: "La programacion ha sido actualizada.",
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
 * Delete a waste schedule
 */
export function useDeleteWasteSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("waste_schedules").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-pickups"] });
      toast({
        title: "Programacion eliminada",
        description: "La programacion de recogida ha sido eliminada.",
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
 * Helper function to calculate next pickup date
 */
export function getNextPickupDate(dayOfWeek: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilPickup = dayOfWeek - currentDay;

  if (daysUntilPickup <= 0) {
    daysUntilPickup += 7;
  }

  const nextPickup = new Date(today);
  nextPickup.setDate(today.getDate() + daysUntilPickup);
  return nextPickup;
}

/**
 * Helper function to format date for display
 */
export function formatPickupDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hoy";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Manana";
  }

  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
