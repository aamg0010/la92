import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Patient = Tables<"patients">;

// Fetch all patients
export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Patient[];
    },
  });
}

// Fetch single patient by ID
export function usePatient(id: string | null) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Patient;
    },
    enabled: !!id,
  });
}

// Create new patient
export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (patient: TablesInsert<"patients">) => {
      const { data, error } = await supabase
        .from("patients")
        .insert(patient)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Paciente creado",
        description: "El paciente ha sido registrado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el paciente. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Update patient
export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"patients">) => {
      const { data, error } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Paciente actualizado",
        description: "Los datos han sido guardados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el paciente. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete patient
export function useDeletePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Paciente eliminado",
        description: "El paciente ha sido eliminado del sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el paciente. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Search patients
export function useSearchPatients(searchTerm: string) {
  return useQuery({
    queryKey: ["patients", "search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, document_number, phone")
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2,
  });
}
