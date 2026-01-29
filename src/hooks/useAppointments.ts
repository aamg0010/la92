import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Appointment = Tables<"appointments"> & {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
};

// Fetch appointments for a date range
export function useAppointments(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["appointments", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone)
        `)
        .order("appointment_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (startDate) {
        query = query.gte("appointment_date", startDate);
      }
      if (endDate) {
        query = query.lte("appointment_date", endDate);
      }

      const { data, error } = await query;
      
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
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone)
        `)
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
    mutationFn: async (appointment: TablesInsert<"appointments">) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointment)
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone)
        `)
        .single();
      
      if (error) throw error;
      return data;
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
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"appointments">) => {
      const { data, error } = await supabase
        .from("appointments")
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
      const { error } = await supabase
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
      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("appointment_date", today);
      
      if (error) throw error;
      return count ?? 0;
    },
  });
}
