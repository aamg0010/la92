import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Clinic Settings
export function useClinicSettings() {
  return useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateClinicSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<{
      clinic_name: string;
      logo_url: string | null;
      address: string | null;
      city: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      tax_id: string | null;
      opening_time: string;
      closing_time: string;
      working_days: string[];
      timezone: string;
      currency: string;
      date_format: string;
    }>) => {
      const { data: existing } = await supabase
        .from("clinic_settings")
        .select("id")
        .single();

      if (!existing) throw new Error("No clinic settings found");

      const { data, error } = await supabase
        .from("clinic_settings")
        .update(settings)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
      toast({
        title: "Configuración guardada",
        description: "Los datos del consultorio se han actualizado correctamente.",
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

// User Preferences
export function useUserPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: Partial<{
      theme: string;
      language: string;
      notifications_enabled: boolean;
      email_notifications: boolean;
      sound_enabled: boolean;
      compact_mode: boolean;
    }>) => {
      if (!user) throw new Error("No user logged in");

      // Try to update first
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("user_preferences")
          .update(preferences)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new preferences
        const { data, error } = await supabase
          .from("user_preferences")
          .insert({ user_id: user.id, ...preferences })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences", user?.id] });
      toast({
        title: "Preferencias guardadas",
        description: "Tus preferencias se han actualizado correctamente.",
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

// Message Templates
export function useMessageTemplates() {
  return useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("type", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateMessageTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      subject?: string | null;
      content?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("message_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({
        title: "Plantilla actualizada",
        description: "La plantilla de mensaje se ha guardado correctamente.",
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

// AI Settings
export function useAISettings() {
  return useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<{
      ai_enabled: boolean;
      default_model: string;
      auto_suggestions: boolean;
      diagnosis_assistance: boolean;
      treatment_recommendations: boolean;
      max_tokens: number;
      temperature: number;
    }>) => {
      const { data: existing } = await supabase
        .from("ai_settings")
        .select("id")
        .single();

      if (!existing) throw new Error("No AI settings found");

      const { data, error } = await supabase
        .from("ai_settings")
        .update(settings)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      toast({
        title: "Configuración de IA guardada",
        description: "Los ajustes de inteligencia artificial se han actualizado.",
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

// Update Profile
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profile: Partial<{
      full_name: string;
      phone: string | null;
      specialty: string | null;
      avatar_url: string | null;
    }>) => {
      if (!user) throw new Error("No user logged in");

      const { data, error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      toast({
        title: "Perfil actualizado",
        description: "Tu información de perfil se ha guardado correctamente.",
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
