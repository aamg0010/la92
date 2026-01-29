import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DentalLab = Tables<"dental_labs">;
export type LabOrder = Tables<"lab_orders">;
export type LabQuote = Tables<"lab_quotes">;
export type LabOrderTracking = Tables<"lab_order_tracking">;

// Fetch all active dental labs
export function useDentalLabs() {
  return useQuery({
    queryKey: ["dental-labs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dental_labs")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });
      
      if (error) throw error;
      return data as DentalLab[];
    },
  });
}

// Fetch all lab orders with related data
export function useLabOrders() {
  return useQuery({
    queryKey: ["lab-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_orders")
        .select(`
          *,
          patient:patients(first_name, last_name),
          selected_lab:dental_labs(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch quotes for a specific order
export function useLabQuotes(orderId: string | null) {
  return useQuery({
    queryKey: ["lab-quotes", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from("lab_quotes")
        .select(`
          *,
          lab:dental_labs(name, slug, rating)
        `)
        .eq("order_id", orderId)
        .order("price", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

// Fetch tracking for a specific order
export function useLabOrderTracking(orderId: string | null) {
  return useQuery({
    queryKey: ["lab-order-tracking", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from("lab_order_tracking")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LabOrderTracking[];
    },
    enabled: !!orderId,
  });
}

// Create new lab order
export function useCreateLabOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order: TablesInsert<"lab_orders">) => {
      const { data, error } = await supabase
        .from("lab_orders")
        .insert(order)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      toast({
        title: "Orden creada",
        description: "La orden ha sido enviada a los laboratorios para cotización.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la orden. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Update lab order (e.g., select a lab)
export function useUpdateLabOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<LabOrder>) => {
      const { data, error } = await supabase
        .from("lab_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      toast({
        title: "Orden actualizada",
        description: "Los cambios han sido guardados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la orden. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Upload design file
export function useUploadDesignFile() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, orderNumber }: { file: File; orderNumber: string }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${orderNumber}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("lab-designs")
        .upload(fileName, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("lab-designs")
        .getPublicUrl(fileName);
      
      return { path: data.path, url: urlData.publicUrl };
    },
    onSuccess: () => {
      toast({
        title: "Archivo subido",
        description: "El archivo de diseño ha sido cargado correctamente.",
      });
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

// Get lab order stats
export function useLabOrderStats() {
  return useQuery({
    queryKey: ["lab-order-stats"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("lab_orders")
        .select("status");
      
      if (error) throw error;

      const { count: labsCount, error: labsError } = await supabase
        .from("dental_labs")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      
      if (labsError) throw labsError;

      const stats = {
        active: orders?.filter(o => !["completed", "delivered"].includes(o.status || "")).length || 0,
        inProduction: orders?.filter(o => o.status === "in_production").length || 0,
        pending: orders?.filter(o => ["draft", "pending_quotes", "quoted"].includes(o.status || "")).length || 0,
        labsConnected: labsCount || 0,
      };

      return stats;
    },
  });
}

// Generate order number
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${year}-${random}`;
}
