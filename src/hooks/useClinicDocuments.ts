import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      let query = supabase
        .from("clinic_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If we have documents with user_ids, fetch their names
      const userIds = data?.filter(d => d.user_id).map(d => d.user_id) || [];
      let userNameMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        
        profiles?.forEach(p => {
          userNameMap[p.user_id] = p.full_name;
        });
      }

      return data?.map((doc) => ({
        ...doc,
        user_name: doc.user_id ? userNameMap[doc.user_id] || null : null,
      })) as ClinicDocument[];
    },
  });
}

export function useUploadClinicDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${category}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("clinic-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Create document record
      const { data, error } = await supabase
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-documents"] });
      toast({
        title: "Documento subido",
        description: "El documento se ha subido correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo subir el documento. " + error.message,
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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("clinic-documents")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
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
      const { data, error } = await supabase.storage
        .from("clinic-documents")
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.name + (document.file_type ? `.${document.file_type.split("/")[1]}` : "");
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
