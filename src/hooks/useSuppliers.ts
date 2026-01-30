import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean | null;
  rating: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  inventory_item_id: string | null;
  product_name: string;
  supplier_sku: string | null;
  unit_price: number;
  min_order_quantity: number | null;
  lead_time_days: number | null;
  is_preferred: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  inventory_item?: {
    id: string;
    name: string;
    unit: string;
  };
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  expected_delivery: string | null;
  actual_delivery: string | null;
  subtotal: number;
  tax_amount: number | null;
  shipping_cost: number | null;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  supplier_product_id: string | null;
  inventory_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  quantity_received: number | null;
  created_at: string;
}

export interface StockAlert {
  id: string;
  inventory_item_id: string;
  alert_type: string;
  current_quantity: number;
  min_stock: number;
  status: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
  inventory_item?: {
    id: string;
    name: string;
    unit: string;
    sku: string | null;
  };
}

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type SupplierUpdate = Partial<SupplierInsert>;

// Suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Supplier | null;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert(supplier)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Proveedor creado",
        description: "El proveedor se ha registrado exitosamente.",
      });
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

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...supplier }: SupplierUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("suppliers")
        .update(supplier)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] });
      toast({
        title: "Proveedor actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
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

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado.",
      });
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

// Supplier Products
export function useSupplierProducts(supplierId: string | null) {
  return useQuery({
    queryKey: ["supplier-products", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const { data, error } = await supabase
        .from("supplier_products")
        .select(`
          *,
          inventory_item:inventory_items(id, name, unit)
        `)
        .eq("supplier_id", supplierId);
      
      if (error) throw error;
      return data as SupplierProduct[];
    },
    enabled: !!supplierId,
  });
}

export function useAddSupplierProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<SupplierProduct, 'id' | 'created_at' | 'updated_at' | 'inventory_item'>) => {
      const { data, error } = await supabase
        .from("supplier_products")
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products", variables.supplier_id] });
      toast({
        title: "Producto agregado",
        description: "El producto se ha añadido al catálogo del proveedor.",
      });
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

export function useDeleteSupplierProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, supplierId }: { id: string; supplierId: string }) => {
      const { error } = await supabase
        .from("supplier_products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return supplierId;
    },
    onSuccess: (supplierId) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado del catálogo.",
      });
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

// Purchase Orders
export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          supplier:suppliers(id, name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: ["purchase-order", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          supplier:suppliers(*),
          items:purchase_order_items(*)
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as PurchaseOrder | null;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order: {
      supplier_id: string;
      expected_delivery?: string;
      notes?: string;
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        inventory_item_id?: string;
        supplier_product_id?: string;
      }>;
    }) => {
      // Generate order number
      const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      
      // Calculate totals
      const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const total = subtotal;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
          order_number: orderNumber,
          supplier_id: order.supplier_id,
          expected_delivery: order.expected_delivery,
          notes: order.notes,
          subtotal,
          total,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Create order items
      const itemsToInsert = order.items.map(item => ({
        purchase_order_id: orderData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        inventory_item_id: item.inventory_item_id,
        supplier_product_id: item.supplier_product_id,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Orden creada",
        description: "La orden de compra se ha generado exitosamente.",
      });
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

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", variables.id] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la orden se ha actualizado.",
      });
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

// Stock Alerts
export function useStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_alerts")
        .select(`
          *,
          inventory_item:inventory_items(id, name, unit, sku)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StockAlert[];
    },
  });
}

export function usePendingStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_alerts")
        .select(`
          *,
          inventory_item:inventory_items(id, name, unit, sku)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StockAlert[];
    },
  });
}

export function useAcknowledgeStockAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("stock_alerts")
        .update({
          status: "acknowledged",
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast({
        title: "Alerta reconocida",
        description: "La alerta ha sido marcada como atendida.",
      });
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

export function useResolveStockAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("stock_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          notes,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast({
        title: "Alerta resuelta",
        description: "La alerta ha sido marcada como resuelta.",
      });
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

export const PURCHASE_ORDER_STATUS = {
  draft: { label: "Borrador", color: "bg-muted text-muted-foreground" },
  sent: { label: "Enviada", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-800" },
  partial: { label: "Parcial", color: "bg-yellow-100 text-yellow-800" },
  received: { label: "Recibida", color: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelada", color: "bg-destructive/10 text-destructive" },
};

export const ALERT_STATUS = {
  pending: { label: "Pendiente", color: "bg-destructive/10 text-destructive" },
  acknowledged: { label: "Atendida", color: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "Resuelta", color: "bg-green-100 text-green-800" },
};

export const ALERT_TYPES = {
  low_stock: { label: "Stock bajo", icon: "AlertTriangle" },
  out_of_stock: { label: "Sin stock", icon: "XCircle" },
  expiring_soon: { label: "Por vencer", icon: "Clock" },
};
