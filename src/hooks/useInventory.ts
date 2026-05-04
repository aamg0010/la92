import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  sku: string | null;
  barcode: string | null;
  unit: string;
  quantity: number;
  min_stock: number;
  max_stock: number | null;
  unit_cost: number;
  sale_price: number | null;
  location: string | null;
  supplier_id: string | null;
  expiration_date: string | null;
  lot_number: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost: number | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  item?: { id: string; name: string; unit: string } | null;
}

export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'category' | 'created_at' | 'updated_at'>;
export type InventoryItemUpdate = Partial<InventoryItemInsert>;

// ============ INVENTORY ITEMS ============

export function useInventoryItems() {
  return useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await api
        .from<InventoryItem>("inventory_items")
        .select("*,category:inventory_categories(id,name)")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: ["inventory-item", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await api
        .from<InventoryItem>("inventory_items")
        .select("*,category:inventory_categories(id,name)")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as InventoryItem | null;
    },
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItemInsert, "created_by">) => {
      const { data, error } = await api
        .from<InventoryItem>("inventory_items")
        .insert({ ...item, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({
        title: "Artículo creado",
        description: "El artículo ha sido agregado al inventario.",
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

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & InventoryItemUpdate) => {
      const { data, error } = await api
        .from<InventoryItem>("inventory_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-item", variables.id] });
      toast({
        title: "Artículo actualizado",
        description: "Los cambios han sido guardados.",
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

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({
        title: "Artículo eliminado",
        description: "El artículo ha sido eliminado del inventario.",
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

// ============ INVENTORY CATEGORIES ============

export function useInventoryCategories() {
  return useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await api
        .from<InventoryCategory>("inventory_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as InventoryCategory[];
    },
  });
}

export function useCreateInventoryCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<InventoryCategory, 'id' | 'created_at' | 'is_default'>) => {
      const { data, error } = await api
        .from<InventoryCategory>("inventory_categories")
        .insert({ ...category, is_default: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido agregada.",
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

export function useUpdateInventoryCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<InventoryCategory, 'id' | 'created_at'>>) => {
      const { data, error } = await api
        .from<InventoryCategory>("inventory_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      toast({
        title: "Categoría actualizada",
        description: "Los cambios han sido guardados.",
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

export function useDeleteInventoryCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if category has items
      const { data: items, error: checkError } = await api
        .from<InventoryItem>("inventory_items")
        .select("id")
        .eq("category_id", id)
        .limit(1);

      if (checkError) throw checkError;
      if (items && items.length > 0) {
        throw new Error("No se puede eliminar una categoría que tiene artículos asociados. Mueva los artículos a otra categoría primero.");
      }

      const { error } = await api
        .from("inventory_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada.",
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

// ============ INVENTORY MOVEMENTS ============

export function useInventoryMovements(itemId?: string | null) {
  return useQuery({
    queryKey: ["inventory-movements", itemId],
    queryFn: async () => {
      let queryBuilder = api
        .from<InventoryMovement>("inventory_movements")
        .select("*,item:inventory_items(id,name,unit)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (itemId) {
        queryBuilder = queryBuilder.eq("item_id", itemId);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as InventoryMovement[];
    },
  });
}

export function useCreateInventoryMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movement: {
      item_id: string;
      movement_type: string;
      quantity: number;
      notes?: string;
      reference_id?: string;
      unit_cost?: number;
    }) => {
      // Obtener cantidad actual
      const { data: item, error: itemError } = await api
        .from<InventoryItem>("inventory_items")
        .select("quantity")
        .eq("id", movement.item_id)
        .single();

      if (itemError) throw itemError;
      if (!item) throw new Error("Item not found");

      const previousQuantity = Number(item.quantity);
      const newQuantity = previousQuantity + movement.quantity;

      // Crear movimiento
      const { data: movementData, error: movementError } = await api
        .from<InventoryMovement>("inventory_movements")
        .insert({
          ...movement,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          created_by: user?.id,
        })
        .select()
        .single();

      if (movementError) throw movementError;

      // Actualizar cantidad en inventario
      const { error: updateError } = await api
        .from("inventory_items")
        .update({ quantity: newQuantity })
        .eq("id", movement.item_id);

      if (updateError) throw updateError;

      return movementData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-item", variables.item_id] });
      toast({
        title: "Movimiento registrado",
        description: "El movimiento de inventario ha sido registrado.",
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

// ============ STOCK ALERTS ============

export function useStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts"],
    queryFn: async () => {
      const { data, error } = await api
        .from("stock_alerts")
        .select("*,item:inventory_items(id,name,unit,quantity,min_stock)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ["low-stock-items"],
    queryFn: async () => {
      const { data: allItems, error } = await api
        .from<InventoryItem>("inventory_items")
        .select("*,category:inventory_categories(id,name)")
        .eq("is_active", true);

      if (error) throw error;

      // Filtrar items con stock bajo en cliente
      return (allItems as InventoryItem[]).filter(
        (item) => Number(item.quantity) <= Number(item.min_stock || 0)
      );
    },
  });
}

// ============ STATS ============

export function useInventoryStats() {
  return useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const { data: items, error } = await api
        .from<InventoryItem>("inventory_items")
        .select("quantity, unit_cost, min_stock, expiration_date, is_active")
        .eq("is_active", true);

      if (error) throw error;
      if (!items) return { totalItems: 0, totalValue: 0, lowStockCount: 0, expiringCount: 0 };

      const totalItems = items.length;
      const totalValue = items.reduce(
        (acc, item) => acc + Number(item.quantity) * Number(item.unit_cost),
        0
      );
      const lowStockCount = items.filter(
        (item) => Number(item.quantity) <= Number(item.min_stock || 0)
      ).length;

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringCount = items.filter((item) => {
        if (!item.expiration_date) return false;
        const expDate = new Date(item.expiration_date);
        return expDate <= thirtyDaysFromNow && expDate >= today;
      }).length;

      return {
        totalItems,
        totalValue,
        lowStockCount,
        expiringCount,
      };
    },
  });
}

export const MOVEMENT_TYPES = [
  { value: "purchase", label: "Compra", sign: 1 },
  { value: "use", label: "Uso en tratamiento", sign: -1 },
  { value: "adjustment", label: "Ajuste de inventario", sign: 0 },
  { value: "return", label: "Devolución", sign: 1 },
  { value: "expired", label: "Vencido/Descartado", sign: -1 },
  { value: "transfer", label: "Transferencia", sign: 0 },
];
