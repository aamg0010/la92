import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";

export interface DentalLab {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  specialties: string[] | null;
  rating: number | null;
  avg_delivery_days: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  selected_lab_id: string | null;
  work_type: string;
  description: string | null;
  tooth_numbers: string[] | null;
  shade: string | null;
  material: string | null;
  priority: string | null;
  status: string | null;
  design_file_url: string | null;
  final_price: number | null;
  due_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: { first_name: string; last_name: string };
  selected_lab?: { name: string };
}

export interface LabQuote {
  id: string;
  order_id: string;
  lab_id: string;
  price: number;
  estimated_days: number | null;
  notes: string | null;
  status: string | null;
  created_at: string;
  lab?: { name: string; slug: string; rating: number | null };
}

export interface LabOrderTracking {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Fetch all active dental labs
export function useDentalLabs() {
  return useQuery({
    queryKey: ["dental-labs"],
    queryFn: async () => {
      const { data, error } = await api
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
      const { data, error } = await api
        .from("lab_orders")
        .select("*,patient:patients(first_name,last_name),selected_lab:dental_labs(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LabOrder[];
    },
  });
}

// Fetch quotes for a specific order
export function useLabQuotes(orderId: string | null) {
  return useQuery({
    queryKey: ["lab-quotes", orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await api
        .from("lab_quotes")
        .select("*,lab:dental_labs(name,slug,rating)")
        .eq("order_id", orderId)
        .order("price");

      if (error) throw error;
      return data as LabQuote[];
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

      const { data, error } = await api
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
    mutationFn: async (order: Partial<LabOrder>) => {
      const { data, error } = await api
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
      const { data, error } = await api
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

// Upload design file - simplified without Supabase storage
export function useUploadDesignFile() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, orderNumber }: { file: File; orderNumber: string }) => {
      // TODO: Implement file upload endpoint
      // For now, return a placeholder
      toast({
        title: "Funcionalidad pendiente",
        description: "La subida de archivos requiere configuración adicional.",
        variant: "destructive",
      });
      throw new Error("File upload not implemented");
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
      const { data: orders, error } = await api
        .from("lab_orders")
        .select("status");

      if (error) throw error;

      const { data: labs, error: labsError } = await api
        .from("dental_labs")
        .select("id")
        .eq("is_active", true);

      if (labsError) throw labsError;

      const orderList = orders as { status: string }[];
      const stats = {
        active: orderList?.filter(o => !["completed", "delivered"].includes(o.status || "")).length || 0,
        inProduction: orderList?.filter(o => o.status === "in_production").length || 0,
        pending: orderList?.filter(o => ["draft", "pending_quotes", "quoted"].includes(o.status || "")).length || 0,
        labsConnected: (labs as { id: string }[])?.length || 0,
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
