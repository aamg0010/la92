/**
 * useEnvironmentalMonitoring.ts
 * Hook para control ambiental (temperatura y humedad)
 * Cumplimiento normativo de monitoreo de condiciones ambientales en clinicas dentales
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ============ TYPES ============

export type Shift = "AM" | "PM";

export interface EnvironmentalReading {
  id: string;
  reading_date: string;
  reading_time: string;
  shift: Shift;
  temperature: number;
  humidity: number;
  is_temperature_normal: boolean;
  is_humidity_normal: boolean;
  user_id: string | null;
  user_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReadingData {
  reading_date: string;
  reading_time: string;
  shift: Shift;
  temperature: number;
  humidity: number;
  user_name: string;
  user_id?: string;
  notes?: string;
}

export interface ReadingFilters {
  startDate?: string;
  endDate?: string;
  shift?: Shift;
  onlyOutOfRange?: boolean;
}

export interface TodayReadings {
  date: string;
  readings: Array<{
    id: string;
    shift: Shift;
    time: string;
    temperature: number;
    humidity: number;
    isTemperatureNormal: boolean;
    isHumidityNormal: boolean;
    userName: string;
    notes: string | null;
  }>;
  amReading: {
    id: string;
    temperature: number;
    humidity: number;
    time: string;
    isTemperatureNormal: boolean;
    isHumidityNormal: boolean;
    userName: string;
  } | null;
  pmReading: {
    id: string;
    temperature: number;
    humidity: number;
    time: string;
    isTemperatureNormal: boolean;
    isHumidityNormal: boolean;
    userName: string;
  } | null;
}

export interface EnvironmentalStats {
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  totalReadings: number;
  avgTemperature: number;
  avgHumidity: number;
  minTemperature: number | null;
  maxTemperature: number | null;
  minHumidity: number | null;
  maxHumidity: number | null;
  daysWithReadings: number;
  totalDaysInMonth: number;
  outOfRangeCount: number;
  temperatureOutOfRange: number;
  humidityOutOfRange: number;
  normalRanges: {
    tempMin: number;
    tempMax: number;
    humidityMin: number;
    humidityMax: number;
  };
}

export interface WeeklyTrendDay {
  date: string;
  dayName: string;
  avgTemperature: number | null;
  avgHumidity: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  minHumidity: number | null;
  maxHumidity: number | null;
  readingCount: number;
  hasAlerts: boolean;
}

export interface MonthlyReport {
  reportPeriod: {
    year: number;
    month: number;
    monthName: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalReadings: number;
    daysWithReadings: number;
    totalDaysInMonth: number;
    completeDays: number;
    avgTemperature: number;
    avgHumidity: number;
    outOfRangeReadings: number;
    temperatureAlerts: number;
    humidityAlerts: number;
  };
  weeklyAverages: Array<{
    weekNumber: number;
    avgTemperature: number;
    avgHumidity: number;
    readings: number;
  }>;
  outOfRangeDetails: Array<{
    id: string;
    date: string;
    time: string;
    shift: Shift;
    temperature: number;
    humidity: number;
    tempOutOfRange: boolean;
    humidityOutOfRange: boolean;
    userName: string;
    notes: string | null;
  }>;
  allReadings: Array<{
    id: string;
    date: string;
    time: string;
    shift: Shift;
    temperature: number;
    humidity: number;
    isTemperatureNormal: boolean;
    isHumidityNormal: boolean;
    userName: string;
    notes: string | null;
  }>;
  generatedAt: string;
}

// ============ CONSTANTS ============

export const SHIFTS: Record<Shift, { label: string; timeRange: string }> = {
  AM: {
    label: "Manana",
    timeRange: "06:00 - 12:00",
  },
  PM: {
    label: "Tarde",
    timeRange: "12:00 - 20:00",
  },
};

export const NORMAL_RANGES = {
  temperature: { min: 18, max: 24, unit: "C" },
  humidity: { min: 40, max: 60, unit: "%" },
};

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// ============ HOOKS ============

/**
 * Get environmental readings with optional filters
 */
export function useEnvironmentalReadings(filters?: ReadingFilters) {
  return useQuery({
    queryKey: ["environmental-readings", filters],
    queryFn: async () => {
      let query = api
        .from<EnvironmentalReading>("environmental_readings")
        .select("*")
        .order("reading_date", { ascending: false })
        .order("shift", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("reading_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("reading_date", filters.endDate);
      }
      if (filters?.shift) {
        query = query.eq("shift", filters.shift);
      }

      const { data, error } = await query;
      if (error) throw error;

      let readings = (data as EnvironmentalReading[]) || [];

      // Filter out of range if requested
      if (filters?.onlyOutOfRange) {
        readings = readings.filter(
          (r) => !r.is_temperature_normal || !r.is_humidity_normal
        );
      }

      return readings;
    },
  });
}

/**
 * Get a single reading by ID
 */
export function useEnvironmentalReading(id: string | null) {
  return useQuery({
    queryKey: ["environmental-reading", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await api
        .from<EnvironmentalReading>("environmental_readings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as EnvironmentalReading;
    },
    enabled: !!id,
  });
}

/**
 * Get today's readings via RPC
 */
export function useTodayReadings() {
  return useQuery({
    queryKey: ["environmental-today"],
    queryFn: async () => {
      const { data, error } = await api.rpc<TodayReadings>("get_environmental_today", {});

      if (error) throw error;
      return data as TodayReadings;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Get monthly statistics via RPC
 */
export function useEnvironmentalStats(year?: number, month?: number) {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  return useQuery({
    queryKey: ["environmental-stats", targetYear, targetMonth],
    queryFn: async () => {
      const { data, error } = await api.rpc<EnvironmentalStats>("get_environmental_stats_monthly", {
        p_year: targetYear,
        p_month: targetMonth,
      });

      if (error) throw error;
      return data as EnvironmentalStats;
    },
  });
}

/**
 * Get weekly trend data via RPC
 */
export function useWeeklyTrend(days: number = 7) {
  return useQuery({
    queryKey: ["environmental-weekly-trend", days],
    queryFn: async () => {
      const { data, error } = await api.rpc<WeeklyTrendDay[]>("get_environmental_weekly_trend", {
        p_days: days,
      });

      if (error) throw error;
      return (data as WeeklyTrendDay[]) || [];
    },
  });
}

/**
 * Get monthly report for compliance/audit
 */
export function useEnvironmentalMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: ["environmental-monthly-report", year, month],
    queryFn: async () => {
      const { data, error } = await api.rpc<MonthlyReport>("get_environmental_monthly_report", {
        p_year: year,
        p_month: month,
      });

      if (error) throw error;
      return data as MonthlyReport;
    },
    enabled: !!year && !!month,
  });
}

/**
 * Create a new environmental reading
 */
export function useCreateReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateReadingData) => {
      const { data: reading, error } = await api
        .from("environmental_readings")
        .insert({
          ...data,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return reading;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environmental-readings"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-today"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-stats"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-weekly-trend"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-monthly-report"] });
      toast({
        title: "Lectura registrada",
        description: "La lectura ambiental ha sido guardada correctamente.",
      });
    },
    onError: (error) => {
      // Check for duplicate entry
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        toast({
          title: "Lectura duplicada",
          description: "Ya existe una lectura para este turno en la fecha seleccionada.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
}

/**
 * Update an environmental reading
 */
export function useUpdateReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateReadingData> }) => {
      const { data: reading, error } = await api
        .from("environmental_readings")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return reading;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environmental-readings"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-reading"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-today"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-stats"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-weekly-trend"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-monthly-report"] });
      toast({
        title: "Lectura actualizada",
        description: "La lectura ambiental ha sido actualizada.",
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
 * Delete an environmental reading
 */
export function useDeleteReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("environmental_readings").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environmental-readings"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-today"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-stats"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-weekly-trend"] });
      queryClient.invalidateQueries({ queryKey: ["environmental-monthly-report"] });
      toast({
        title: "Lectura eliminada",
        description: "La lectura ambiental ha sido eliminada.",
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

// ============ HELPER FUNCTIONS ============

/**
 * Check if a value is within normal range
 */
export function isTemperatureNormal(temp: number): boolean {
  return temp >= NORMAL_RANGES.temperature.min && temp <= NORMAL_RANGES.temperature.max;
}

export function isHumidityNormal(humidity: number): boolean {
  return humidity >= NORMAL_RANGES.humidity.min && humidity <= NORMAL_RANGES.humidity.max;
}

/**
 * Get current shift based on time
 */
export function getCurrentShift(): Shift {
  const hour = new Date().getHours();
  return hour < 12 ? "AM" : "PM";
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
}

/**
 * Get status label for reading
 */
export function getReadingStatus(
  isTemperatureNormal: boolean,
  isHumidityNormal: boolean
): { label: string; variant: "default" | "destructive" | "warning" } {
  if (isTemperatureNormal && isHumidityNormal) {
    return { label: "Normal", variant: "default" };
  }
  if (!isTemperatureNormal && !isHumidityNormal) {
    return { label: "Fuera de rango", variant: "destructive" };
  }
  return { label: "Parcialmente fuera de rango", variant: "warning" };
}

/**
 * Calculate completion percentage for the month
 */
export function calculateCompletionPercentage(
  daysWithReadings: number,
  totalDaysInMonth: number,
  completeDays?: number
): number {
  if (totalDaysInMonth === 0) return 0;
  // If we have completeDays (both AM and PM), use that for stricter compliance
  const effectiveDays = completeDays !== undefined ? completeDays : daysWithReadings;
  return Math.round((effectiveDays / totalDaysInMonth) * 100);
}
