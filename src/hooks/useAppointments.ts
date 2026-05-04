import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";

export interface Appointment {
  id: string;
  patient_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  treatment_type: string | null;
  status: string;
  notes: string | null;
  reminder_sent: boolean;
  assigned_doctor_id: string | null;
  attendance_status: 'pending' | 'attended' | 'no_show' | 'cancelled' | 'rescheduled' | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined patient data
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
  // Joined doctor data
  assigned_doctor?: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
}

export interface Doctor {
  user_id: string;
  full_name: string;
  specialty: string | null;
  email: string;
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'patient' | 'created_at' | 'updated_at'>;
export type AppointmentUpdate = Partial<AppointmentInsert>;

// Fetch appointments for a date range
export function useAppointments(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["appointments", startDate, endDate],
    queryFn: async () => {
      // PostgREST supports embedded resources with foreign keys.
      // Usamos !left para left-join explícito: las urgencias pueden tener patient_id NULL
      // y un join interno haría desaparecer esas citas del listado.
      let queryBuilder = api
        .from<Appointment>("appointments")
        .select("*,patient:patients!left(id,first_name,last_name,phone)")
        .order("appointment_date", { ascending: true });

      if (startDate) {
        queryBuilder = queryBuilder.gte("appointment_date", startDate);
      }
      if (endDate) {
        queryBuilder = queryBuilder.lte("appointment_date", endDate);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data as Appointment[];
    },
  });
}

// Fetch appointments for a specific date
export function useAppointmentsByDate(date: string) {
  return useQuery({
    queryKey: ["appointments", "date", date],
    queryFn: async () => {
      const { data, error } = await api
        .from<Appointment>("appointments")
        .select("*,patient:patients!left(id,first_name,last_name,phone)")
        .eq("appointment_date", date)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!date,
  });
}

// Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (appointment: AppointmentInsert) => {
      // Importante: NO usamos .single() con embed de paciente porque las urgencias
      // pueden insertarse con patient_id NULL y el embed dispararía error.
      // En su lugar, insertamos pidiendo array y nos quedamos con la primera fila.
      const { data, error } = await api
        .from<Appointment>("appointments")
        .insert(appointment)
        .select("*,patient:patients!left(id,first_name,last_name,phone)");

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Cita creada",
        description: "La cita ha sido agendada correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la cita. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Update appointment
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & AppointmentUpdate) => {
      const { data, error } = await api
        .from<Appointment>("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Cita actualizada",
        description: "Los cambios han sido guardados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete appointment
export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Today's appointments count
export function useTodayAppointmentsCount() {
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["appointments", "count", today],
    queryFn: async () => {
      const { data, error } = await api
        .from<Appointment>("appointments")
        .select("id")
        .eq("appointment_date", today);

      if (error) throw error;
      return data?.length ?? 0;
    },
  });
}

// Get clinic doctors for appointment assignment
export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profilesError } = await api
        .from("profiles")
        .select("user_id,full_name,specialty,email");

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

      // Filter to only doctors and admins
      const doctors: Doctor[] = (
        profiles as {
          user_id: string;
          full_name: string;
          specialty: string | null;
          email: string;
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
          email: p.email,
        }));

      return doctors || [];
    },
  });
}

// Update appointment attendance status
export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const ATTENDANCE_LABELS: Record<string, string> = {
    attended: "Asistió",
    no_show: "No asistió",
    cancelled: "Cancelada",
    rescheduled: "Reprogramada",
  };

  return useMutation({
    mutationFn: async ({
      id,
      attendance_status,
    }: {
      id: string;
      attendance_status: Appointment["attendance_status"];
    }) => {
      const { data, error } = await api
        .from<Appointment>("appointments")
        .update({ attendance_status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Estado actualizado",
        description: `La cita ha sido marcada como "${ATTENDANCE_LABELS[variables.attendance_status || ''] || variables.attendance_status}".`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado. " + error.message,
        variant: "destructive",
      });
    },
  });
}
