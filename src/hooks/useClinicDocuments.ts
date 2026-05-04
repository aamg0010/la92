import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type DocumentCategory = "legal" | "cv" | "other";

export interface ClinicDocument {
  id: string;
  name: string;
  description: string | null;
  category: DocumentCategory;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  user_id: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
}

export function useClinicDocuments(category?: DocumentCategory) {
  return useQuery({
    queryKey: ["clinic-documents", category],
    queryFn: async () => {
      let query = api
        .from<ClinicDocument>("clinic_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If we have documents with user_ids, fetch their names
      const docs = data as ClinicDocument[];
      const userIds = docs?.filter(d => d.user_id).map(d => d.user_id) || [];
      let userNameMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await api
          .from("profiles")
          .select("user_id,full_name")
          .in("user_id", userIds as string[]);

        (profiles as { user_id: string; full_name: string }[])?.forEach(p => {
          userNameMap[p.user_id] = p.full_name;
        });
      }

      return docs?.map((doc) => ({
        ...doc,
        user_name: doc.user_id ? userNameMap[doc.user_id] || null : null,
      })) as ClinicDocument[];
    },
  });
}

export function useUploadClinicDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      name,
      description,
      category,
      userId,
    }: {
      file: File;
      name: string;
      description?: string;
      category: DocumentCategory;
      userId?: string;
    }) => {
      // TODO: Implement file upload endpoint for PostgREST
      // For now, create a placeholder record
      if (!user) throw new Error("No authenticated user");

      const filePath = `${category}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split(".").pop()}`;

      const { data, error } = await api
        .from("clinic_documents")
        .insert({
          name,
          description,
          category,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          user_id: userId || null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Nota",
        description: "El registro se creó pero la subida de archivos requiere configuración adicional.",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-documents"] });
      toast({
        title: "Documento registrado",
        description: "El documento se ha registrado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el documento. " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteClinicDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (document: ClinicDocument) => {
      // Delete record (file deletion would require separate storage handling)
      const { error } = await api
        .from("clinic_documents")
        .delete()
        .eq("id", document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-documents"] });
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento. " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDownloadClinicDocument() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (document: ClinicDocument) => {
      // TODO: Implement file download for PostgREST storage
      toast({
        title: "Funcionalidad pendiente",
        description: "La descarga de archivos requiere configuración adicional.",
        variant: "destructive",
      });
      throw new Error("File download not implemented");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo descargar el documento. " + error.message,
        variant: "destructive",
      });
    },
  });
}
