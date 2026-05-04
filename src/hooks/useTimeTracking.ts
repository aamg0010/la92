import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/apiClient';

// Types
export type ClockAction = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';

export type ClockStatus = 'not_started' | 'working' | 'on_break' | 'finished';

export interface TimeEntry {
  id: string;
  entry_type: ClockAction;
  entry_time: string;
  notes: string | null;
  is_manual: boolean;
}

export interface TodaySummary {
  total_work_minutes: number;
  total_break_minutes: number;
  net_work_minutes: number;
  first_clock_in: string | null;
  last_clock_out: string | null;
}

export interface ClockStatusResponse {
  success: boolean;
  status: ClockStatus;
  last_action: ClockAction | null;
  last_action_time: string | null;
  today: TodaySummary;
  error?: string;
}

export interface Timesheet {
  id: string;
  user_id: string;
  user_name: string;
  work_date: string;
  first_clock_in: string | null;
  last_clock_out: string | null;
  total_work_minutes: number;
  total_break_minutes: number;
  net_work_minutes: number;
  status: 'incomplete' | 'complete' | 'approved' | 'rejected';
  was_late: boolean;
  late_minutes: number;
  left_early: boolean;
  early_minutes: number;
  has_overtime: boolean;
  overtime_minutes: number;
}

export interface TimeTrackingSettings {
  id?: string;
  work_start_time: string;
  work_end_time: string;
  break_duration_minutes: number;
  late_tolerance_minutes: number;
  early_leave_tolerance_minutes: number;
  require_geolocation: boolean;
  allowed_ip_addresses?: string[];
  allow_manual_entries: boolean;
  require_manager_approval: boolean;
  overtime_threshold_daily_hours: number;
  overtime_threshold_weekly_hours: number;
}

interface ClockActionParams {
  action: ClockAction;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface GetTimesheetsParams {
  startDate: string;
  endDate: string;
  userId?: string;
}

// Helper para formatear minutos a horas:minutos
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper para calcular tiempo trabajado en tiempo real
export function calculateCurrentWorkTime(
  firstClockIn: string | null,
  totalWorkMinutes: number,
  status: ClockStatus
): number {
  if (!firstClockIn || status === 'not_started' || status === 'finished') {
    return totalWorkMinutes;
  }

  // Si esta trabajando, calcular tiempo adicional desde ultimo registro
  // Nota: esto es una aproximacion, el calculo exacto lo hace el servidor
  return totalWorkMinutes;
}

// Hook principal
export function useTimeTracking() {
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();

  // Query para obtener estado actual del fichaje
  const clockStatusQuery = useQuery({
    queryKey: ['clock-status'],
    queryFn: async (): Promise<ClockStatusResponse> => {
      const response = await api.rpc('get_clock_status', {
        p_session_token: sessionToken
      });
      return response as ClockStatusResponse;
    },
    enabled: !!sessionToken,
    refetchInterval: 60000, // Refrescar cada minuto
    staleTime: 30000
  });

  // Query para obtener entradas del dia
  const todayEntriesQuery = useQuery({
    queryKey: ['time-entries', 'today'],
    queryFn: async () => {
      const response = await api.rpc('get_time_entries', {
        p_session_token: sessionToken,
        p_date: new Date().toISOString().split('T')[0]
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al obtener entradas');
      }

      return response.entries as TimeEntry[];
    },
    enabled: !!sessionToken,
    staleTime: 30000
  });

  // Mutation para fichar
  const clockMutation = useMutation({
    mutationFn: async (params: ClockActionParams) => {
      const response = await api.rpc('clock_action', {
        p_session_token: sessionToken,
        p_action: params.action,
        p_latitude: params.latitude,
        p_longitude: params.longitude,
        p_notes: params.notes
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al fichar');
      }

      return response;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clock-status'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    }
  });

  // Funciones de conveniencia para cada accion
  const clockIn = (notes?: string) => {
    return clockMutation.mutateAsync({ action: 'clock_in', notes });
  };

  const clockOut = (notes?: string) => {
    return clockMutation.mutateAsync({ action: 'clock_out', notes });
  };

  const startBreak = (notes?: string) => {
    return clockMutation.mutateAsync({ action: 'break_start', notes });
  };

  const endBreak = (notes?: string) => {
    return clockMutation.mutateAsync({ action: 'break_end', notes });
  };

  return {
    // Estado
    status: clockStatusQuery.data?.status ?? 'not_started',
    lastAction: clockStatusQuery.data?.last_action ?? null,
    lastActionTime: clockStatusQuery.data?.last_action_time ?? null,
    todaySummary: clockStatusQuery.data?.today ?? {
      total_work_minutes: 0,
      total_break_minutes: 0,
      net_work_minutes: 0,
      first_clock_in: null,
      last_clock_out: null
    },
    todayEntries: todayEntriesQuery.data ?? [],

    // Loading states
    isLoading: clockStatusQuery.isLoading,
    isClocking: clockMutation.isPending,

    // Errors
    error: clockStatusQuery.error || clockMutation.error,

    // Actions
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    clock: clockMutation.mutateAsync,

    // Refetch
    refresh: () => {
      clockStatusQuery.refetch();
      todayEntriesQuery.refetch();
    }
  };
}

// Hook para obtener timesheets (para managers/admin)
export function useTimesheets(params: GetTimesheetsParams) {
  const { sessionToken } = useAuth();

  return useQuery({
    queryKey: ['timesheets', params.startDate, params.endDate, params.userId],
    queryFn: async () => {
      const response = await api.rpc('get_timesheets_summary', {
        p_session_token: sessionToken,
        p_start_date: params.startDate,
        p_end_date: params.endDate,
        p_user_id: params.userId
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al obtener timesheets');
      }

      return response.timesheets as Timesheet[];
    },
    enabled: !!sessionToken && !!params.startDate && !!params.endDate
  });
}

// Hook para obtener entradas de un dia especifico
export function useTimeEntries(date: string, userId?: string) {
  const { sessionToken } = useAuth();

  return useQuery({
    queryKey: ['time-entries', date, userId],
    queryFn: async () => {
      const response = await api.rpc('get_time_entries', {
        p_session_token: sessionToken,
        p_user_id: userId,
        p_date: date
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al obtener entradas');
      }

      return response.entries as TimeEntry[];
    },
    enabled: !!sessionToken && !!date
  });
}

// Hook para configuracion de fichaje
export function useTimeTrackingSettings() {
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['time-tracking-settings'],
    queryFn: async () => {
      const response = await api.rpc('get_time_tracking_settings', {
        p_session_token: sessionToken
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al obtener configuracion');
      }

      return response.settings as TimeTrackingSettings;
    },
    enabled: !!sessionToken
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<TimeTrackingSettings>) => {
      const response = await api.rpc('update_time_tracking_settings', {
        p_session_token: sessionToken,
        p_settings: settings
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar configuracion');
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking-settings'] });
    }
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending
  };
}
