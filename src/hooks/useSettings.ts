import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Clinic Settings
export interface ClinicSettings {
  id: string;
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
  // Invoice settings
  invoice_logo_url: string | null;
  invoice_primary_color: string;
  invoice_secondary_color: string;
  default_tax_rate: number;
  show_tax_warning: boolean;
  invoice_header_text: string | null;
  invoice_footer_text: string | null;
  invoice_terms: string | null;
  show_tax_id_on_invoice: boolean;
  // Country-specific tax settings
  tax_country: "ES" | "CO" | null;
  cif: string | null; // Spain: CIF
  irpf_rate: number | null; // Spain: IRPF retention rate
  tax_regime: string | null; // Tax regime description
  created_at: string;
  updated_at: string;
}

export function useClinicSettings() {
  return useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const { data, error } = await api
        .from<ClinicSettings>("clinic_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      // Return default settings if none exist
      if (!data) {
        return {
          id: "",
          clinic_name: "Mi Clínica",
          logo_url: null,
          address: null,
          city: null,
          phone: null,
          email: null,
          website: null,
          tax_id: null,
          opening_time: "08:00",
          closing_time: "18:00",
          working_days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
          timezone: "America/Bogota",
          currency: "COP",
          date_format: "DD/MM/YYYY",
          invoice_logo_url: null,
          invoice_primary_color: "#0ea5e9",
          invoice_secondary_color: "#64748b",
          default_tax_rate: 19,
          show_tax_warning: true,
          invoice_header_text: null,
          invoice_footer_text: null,
          invoice_terms: null,
          show_tax_id_on_invoice: true,
          tax_country: null,
          cif: null,
          irpf_rate: null,
          tax_regime: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ClinicSettings;
      }

      return data;
    },
  });
}

export function useUpdateClinicSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<ClinicSettings>) => {
      // Try to get existing settings
      const { data: existing } = await api
        .from<ClinicSettings>("clinic_settings")
        .select("id")
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await api
          .from<ClinicSettings>("clinic_settings")
          .update(settings)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new settings record
        const { data, error } = await api
          .from<ClinicSettings>("clinic_settings")
          .insert({
            clinic_name: settings.clinic_name || "Mi Clínica",
            opening_time: settings.opening_time || "08:00",
            closing_time: settings.closing_time || "18:00",
            working_days: settings.working_days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
            timezone: settings.timezone || "America/Bogota",
            currency: settings.currency || "COP",
            date_format: settings.date_format || "DD/MM/YYYY",
            invoice_primary_color: settings.invoice_primary_color || "#0ea5e9",
            invoice_secondary_color: settings.invoice_secondary_color || "#64748b",
            default_tax_rate: settings.default_tax_rate || 19,
            show_tax_warning: settings.show_tax_warning ?? true,
            show_tax_id_on_invoice: settings.show_tax_id_on_invoice ?? true,
            ...settings,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
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
export interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sound_enabled: boolean;
  compact_mode: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await api
        .from<UserPreferences>("user_preferences")
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
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!user) throw new Error("No user logged in");

      // Try to update first
      const { data: existing } = await api
        .from<UserPreferences>("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await api
          .from<UserPreferences>("user_preferences")
          .update(preferences)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new preferences
        const { data, error } = await api
          .from<UserPreferences>("user_preferences")
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
export interface MessageTemplate {
  id: string;
  type: string;
  name: string;
  subject: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMessageTemplates() {
  return useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await api
        .from<MessageTemplate>("message_templates")
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
      const { data, error } = await api
        .from<MessageTemplate>("message_templates")
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
export interface AISettings {
  id: string;
  ai_enabled: boolean;
  default_model: string;
  auto_suggestions: boolean;
  diagnosis_assistance: boolean;
  treatment_recommendations: boolean;
  max_tokens: number;
  temperature: number;
  created_at: string;
  updated_at: string;
}

export function useAISettings() {
  return useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const { data, error } = await api
        .from<AISettings>("ai_settings")
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
    mutationFn: async (settings: Partial<AISettings>) => {
      const { data: existing } = await api
        .from<AISettings>("ai_settings")
        .select("id")
        .single();

      if (!existing) throw new Error("No AI settings found");

      const { data, error } = await api
        .from<AISettings>("ai_settings")
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

// User Profile
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  specialty: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profile: Partial<UserProfile>) => {
      if (!user) throw new Error("No user logged in");

      const { data, error } = await api
        .from<UserProfile>("profiles")
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
