import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ClinicalHistoryEntry {
  id: string;
  patient_id: string;
  diagnosis: string;
  treatment: string | null;
  tooth_number: string | null;
  notes: string | null;
  attachments: { name: string; url: string; type: string }[];
  created_at: string;
  created_by: string | null;
  is_active: boolean;
  archived_at: string | null;
  archived_by: string | null;
}

export interface NewClinicalHistoryEntry {
  patient_id: string;
  diagnosis: string;
  treatment?: string | null;
  tooth_number?: string | null;
  notes?: string | null;
  attachments?: { name: string; url: string; type: string }[];
}

export function useClinicalHistory(patientId: string | null) {
  return useQuery({
    queryKey: ["clinical-history", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from("patient_health_history")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ClinicalHistoryEntry[];
    },
    enabled: !!patientId,
  });
}

export function useCreateClinicalHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: NewClinicalHistoryEntry) => {
      const { data, error } = await supabase
        .from("patient_health_history")
        .insert({
          ...entry,
          created_by: user?.id,
          attachments: entry.attachments || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history", variables.patient_id] });
      toast({
        title: "Registro guardado",
        description: "La entrada de historia clínica se ha guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo guardar el registro. " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleClinicalHistoryStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ entryId, isActive, patientId }: { entryId: string; isActive: boolean; patientId: string }) => {
      const { data, error } = await supabase
        .from("patient_health_history")
        .update({
          is_active: isActive,
          archived_at: isActive ? null : new Date().toISOString(),
          archived_by: isActive ? null : user?.id,
        })
        .eq("id", entryId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, patientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history", result.patientId] });
      toast({
        title: result.data.is_active ? "Registro activado" : "Registro archivado",
        description: result.data.is_active 
          ? "El registro ha sido activado nuevamente."
          : "El registro ha sido archivado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del registro. " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadClinicalAttachment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, patientId }: { file: File; patientId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("clinical-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("clinical-attachments")
        .getPublicUrl(fileName);

      return {
        name: file.name,
        url: publicUrl,
        type: file.type,
      };
    },
    onError: (error) => {
      toast({
        title: "Error al subir archivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
