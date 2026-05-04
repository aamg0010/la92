import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ClinicalAttachment {
  name: string;
  url: string;
  type: string;
}

export interface ClinicalHistoryEntry {
  id: string;
  patient_id: string;
  diagnosis: string;
  treatment: string | null;
  tooth_number: string | null;
  notes: string | null;
  attachments: ClinicalAttachment[];
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
  attachments?: ClinicalAttachment[];
  is_active?: boolean;
  archived_at?: string | null;
  archived_by?: string | null;
}

export interface ClinicalRecommendationInput {
  patient_id: string;
  diagnosis?: string;
  notes: string;
}

export interface ClinicalFormulaInput {
  patient_id: string;
  diagnosis?: string;
  treatment?: string | null;
  notes: string;
}

export interface ClinicalConsentInput {
  patient_id: string;
  diagnosis?: string;
  notes: string;
  signed_by?: string;
}

export interface CloseClinicalCaseInput {
  patient_id: string;
  diagnosis?: string;
  treatment?: string;
  notes: string;
  archive_active: boolean;
}

export interface OdontogramEventInput {
  patient_id: string;
  operation: "SELECCION_PIEZA" | "INICIO_CITA_ODONTOGRAMA" | "FIN_CITA_ODONTOGRAMA" | "LIMPIEZA_HISTORIAL_LOCAL_ODONTOGRAMA";
  tooth_number?: string | null;
  notes?: string;
  extra?: Record<string, unknown> | null;
}

export function useClinicalHistory(patientId: string | null) {
  return useQuery({
    queryKey: ["clinical-history", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await api
        .from<ClinicalHistoryEntry>("patient_health_history")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClinicalHistoryEntry[];
    },
    enabled: !!patientId,
  });
}

export function useRecentClinicalRecommendations(limit = 5) {
  return useQuery({
    queryKey: ["clinical-recommendations", "recent", limit],
    queryFn: async () => {
      const { data, error } = await api
        .from<ClinicalHistoryEntry>("patient_health_history")
        .select("id,patient_id,diagnosis,treatment,notes,attachments,created_at,created_by,is_active,archived_at,archived_by")
        .eq("diagnosis", "RECOMENDACION_ESPECIAL")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ClinicalHistoryEntry[];
    },
  });
}

export function useCreateClinicalHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: NewClinicalHistoryEntry) => {
      const { data, error } = await api
        .from("patient_health_history")
        .insert({
          ...entry,
          created_by: user?.id,
          attachments: entry.attachments || [],
          is_active: entry.is_active ?? true,
          archived_at: entry.archived_at ?? null,
          archived_by: entry.archived_by ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history", variables.patient_id] });
      queryClient.invalidateQueries({ queryKey: ["clinical-recommendations"] });
      toast({
        title: "Registro guardado",
        description: "La entrada de historia clinica se ha guardado correctamente.",
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
      const { data, error } = await api
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
      queryClient.invalidateQueries({ queryKey: ["clinical-recommendations"] });
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

export function useArchiveActiveClinicalHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const { data, error } = await api
        .from("patient_health_history")
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
        })
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .select();

      if (error) throw error;
      return { patientId, count: Array.isArray(data) ? data.length : 0 };
    },
    onSuccess: ({ patientId, count }) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history", patientId] });
      queryClient.invalidateQueries({ queryKey: ["clinical-recommendations"] });
      toast({
        title: "Historia actualizada",
        description: count > 0
          ? `Se archivaron ${count} registro(s) activos.`
          : "No habia registros activos para archivar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cerrar la historia activa. " + error.message,
        variant: "destructive",
      });
    },
  });
}

function useClinicalActionMutation<TInput>(
  buildEntry: (input: TInput, userId: string | null | undefined) => NewClinicalHistoryEntry,
  messages: { title: string; description: string },
  options?: { silent?: boolean }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: TInput) => {
      const entry = buildEntry(input, user?.id);
      const { data, error } = await api
        .from("patient_health_history")
        .insert({
          ...entry,
          created_by: user?.id,
          attachments: entry.attachments || [],
          is_active: entry.is_active ?? true,
          archived_at: entry.archived_at ?? null,
          archived_by: entry.archived_by ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, patientId: entry.patient_id };
    },
    onSuccess: ({ patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history", patientId] });
      queryClient.invalidateQueries({ queryKey: ["clinical-recommendations"] });
      if (!options?.silent) {
        toast(messages);
      }
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

export function useCreateClinicalRecommendation() {
  return useClinicalActionMutation<ClinicalRecommendationInput>(
    (input) => ({
      patient_id: input.patient_id,
      diagnosis: input.diagnosis || "RECOMENDACION_ESPECIAL",
      treatment: "RECOMENDACION",
      notes: [input.notes.trim(), "Origen: panel clinico rapido"].filter(Boolean).join("\n\n"),
    }),
    {
      title: "Recomendacion guardada",
      description: "La recomendacion clinica se registro correctamente.",
    }
  );
}

export function useCreateClinicalFormula() {
  return useClinicalActionMutation<ClinicalFormulaInput>(
    (input) => ({
      patient_id: input.patient_id,
      diagnosis: input.diagnosis || "FORMULA_MEDICA",
      treatment: input.treatment || null,
      notes: [input.notes.trim(), "Origen: panel clinico rapido"].filter(Boolean).join("\n\n"),
    }),
    {
      title: "Formula guardada",
      description: "La formula o indicacion clinica se registro correctamente.",
    }
  );
}

export function useCreateClinicalConsent() {
  return useClinicalActionMutation<ClinicalConsentInput>(
    (input) => ({
      patient_id: input.patient_id,
      diagnosis: input.diagnosis || "CONSENTIMIENTO_INFORMADO",
      treatment: "CONSENTIMIENTO",
      notes: [
        input.notes.trim(),
        input.signed_by?.trim() ? `Firmado por: ${input.signed_by.trim()}` : "",
        "Origen: panel clinico rapido",
      ].filter(Boolean).join("\n\n"),
    }),
    {
      title: "Consentimiento guardado",
      description: "El consentimiento informado se registro correctamente.",
    }
  );
}

export function useCreateOdontogramEvent() {
  return useClinicalActionMutation<OdontogramEventInput>(
    (input) => ({
      patient_id: input.patient_id,
      diagnosis: "ODONTOGRAMA_EVENTO",
      treatment: input.operation,
      tooth_number: input.tooth_number || null,
      notes: input.notes || `Evento de odontograma: ${input.operation}`,
      attachments: [],
    }),
    {
      title: "Evento registrado",
      description: "El evento del odontograma se registro correctamente.",
    },
    { silent: true }
  );
}

export function useCloseClinicalCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CloseClinicalCaseInput) => {
      let archivedCount = 0;

      if (input.archive_active) {
        const archiveResult = await api
          .from("patient_health_history")
          .update({
            is_active: false,
            archived_at: new Date().toISOString(),
            archived_by: user?.id,
          })
          .eq("patient_id", input.patient_id)
          .eq("is_active", true)
          .select();

        if (archiveResult.error) throw archiveResult.error;
        archivedCount = Array.isArray(archiveResult.data) ? archiveResult.data.length : 0;
      }

      const closureEntry: NewClinicalHistoryEntry = {
        patient_id: input.patient_id,
        diagnosis: input.diagnosis || "CIERRE_CITA_MANUAL",
        treatment: input.treatment || "CIERRE_CLINICO",
        notes: [
          input.notes.trim(),
          input.archive_active
            ? "Historia activa archivada desde panel clinico rapido."
            : "Cierre parcial sin archivar historia activa.",
        ].filter(Boolean).join("\n\n"),
        is_active: !input.archive_active,
        archived_at: input.archive_active ? new Date().toISOString() : null,
        archived_by: input.archive_active ? user?.id : null,
      };

      const { data, error } = await api
        .from("patient_health_history")
        .insert({
          ...closureEntry,
          created_by: user?.id,
          attachments: [],
        })
        .select()
        .single();

      if (error) throw error;
      return { data, patientId: input.patient_id, archivedCount };
    },
    onSuccess: ({ patientId, archivedCount }) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history", patientId] });
      queryClient.invalidateQueries({ queryKey: ["clinical-recommendations"] });
      toast({
        title: "Cierre clinico guardado",
        description: archivedCount > 0
          ? `Se registro el cierre y se archivaron ${archivedCount} registro(s) activos.`
          : "Se registro el cierre clinico correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo completar el cierre clinico. " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadClinicalAttachment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, patientId }: { file: File; patientId: string }) => {
      const path = `clinical/${patientId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;

      const uploadResult = await api.storage.from("clinical-files").upload(path, file, { upsert: false });
      if (uploadResult.error || !uploadResult.data) {
        throw uploadResult.error || new Error("Upload failed");
      }

      const publicUrl = api.storage.from("clinical-files").getPublicUrl(uploadResult.data.path).data.publicUrl;
      return {
        name: file.name,
        url: publicUrl,
        type: file.type || "application/octet-stream",
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
