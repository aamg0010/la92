import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Treatment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  base_price: number;
  duration_minutes: number | null;
  is_active: boolean | null;
  pre_instructions: string | null;
  post_instructions: string | null;
  consent_required: boolean | null;
  consent_template_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TreatmentMaterial {
  id: string;
  treatment_id: string;
  inventory_item_id: string;
  quantity_required: number;
  is_optional: boolean | null;
  notes: string | null;
  created_at: string;
  inventory_item?: {
    id: string;
    name: string;
    unit: string;
    unit_cost: number;
  };
}

export type TreatmentInsert = Omit<Treatment, 'id' | 'created_at' | 'updated_at'>;
export type TreatmentUpdate = Partial<TreatmentInsert>;

export function useTreatments() {
  return useQuery({
    queryKey: ["treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Treatment[];
    },
  });
}

export function useTreatment(id: string | null) {
  return useQuery({
    queryKey: ["treatment", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Treatment | null;
    },
    enabled: !!id,
  });
}

export function useTreatmentMaterials(treatmentId: string | null) {
  return useQuery({
    queryKey: ["treatment-materials", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      const { data, error } = await supabase
        .from("treatment_materials")
        .select(`
          *,
          inventory_item:inventory_items(id, name, unit, unit_cost)
        `)
        .eq("treatment_id", treatmentId);
      
      if (error) throw error;
      return data as TreatmentMaterial[];
    },
    enabled: !!treatmentId,
  });
}

export function useCreateTreatment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (treatment: TreatmentInsert) => {
      const { data, error } = await supabase
        .from("treatments")
        .insert(treatment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      toast({
        title: "Tratamiento creado",
        description: "El tratamiento se ha registrado exitosamente.",
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

export function useUpdateTreatment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...treatment }: TreatmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("treatments")
        .update(treatment)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment", variables.id] });
      toast({
        title: "Tratamiento actualizado",
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

export function useDeleteTreatment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treatments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      toast({
        title: "Tratamiento eliminado",
        description: "El tratamiento ha sido eliminado.",
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

export function useAddTreatmentMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (material: {
      treatment_id: string;
      inventory_item_id: string;
      quantity_required: number;
      is_optional?: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("treatment_materials")
        .insert(material)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-materials", variables.treatment_id] });
      toast({
        title: "Material agregado",
        description: "El material se ha vinculado al tratamiento.",
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

export function useRemoveTreatmentMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, treatmentId }: { id: string; treatmentId: string }) => {
      const { error } = await supabase
        .from("treatment_materials")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return treatmentId;
    },
    onSuccess: (treatmentId) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-materials", treatmentId] });
      toast({
        title: "Material eliminado",
        description: "El material se ha desvinculado del tratamiento.",
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

export const TREATMENT_CATEGORIES = [
  "Diagnóstico",
  "Prevención",
  "Restauración",
  "Endodoncia",
  "Periodoncia",
  "Cirugía Oral",
  "Ortodoncia",
  "Prótesis",
  "Estética",
  "Odontopediatría",
  "Implantología",
  "Otro",
];
