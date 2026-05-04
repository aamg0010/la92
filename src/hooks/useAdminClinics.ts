import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";

export interface ClinicLicense {
  id: string;
  plan: string;
  status: string;
  max_users: number;
  starts_at: string;
  expires_at: string;
  amount: number;
  is_expired: boolean;
  days_remaining: number;
  license_code: string | null;
  code_uses: number;
  code_max_uses: number;
  admin_email?: string;
  admin_name?: string;
}

export interface AdminClinic {
  id: string;
  name: string;
  slug: string;
  schema_name: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  user_count: number;
  license: ClinicLicense | null;
}

export function useAdminClinics() {
  return useQuery({
    queryKey: ["admin-clinics"],
    queryFn: async () => {
      const { data, error } = await api.rpc<AdminClinic[]>("get_all_clinics");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateClinic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      slug: string;
      admin_email: string;
      admin_name?: string;
      plan?: string;
      max_users?: number;
      months?: number;
    }) => {
      const { data, error } = await api.rpc("create_clinic_with_license", {
        p_name: params.name,
        p_slug: params.slug,
        p_admin_email: params.admin_email,
        p_admin_name: params.admin_name || null,
        p_plan: params.plan || "basic",
        p_max_users: params.max_users || 5,
        p_months: params.months || 12,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      toast({
        title: "Clinica creada",
        description: `Codigo de licencia: ${data?.license_code || "Generado"}. Se enviara email al administrador.`,
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

export function useUpdateLicense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      license_id: string;
      plan?: string;
      max_users?: number;
      months_extend?: number;
      expires_at?: string;
    }) => {
      const { data, error } = await api.rpc("update_license", {
        p_license_id: params.license_id,
        p_plan: params.plan || null,
        p_max_users: params.max_users || null,
        p_months_extend: params.months_extend || null,
        p_expires_at: params.expires_at || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      toast({
        title: "Licencia actualizada",
        description: "La licencia ha sido actualizada correctamente.",
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

export function useToggleClinicActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { clinic_id: string; is_active: boolean }) => {
      const { data, error } = await api.rpc("toggle_clinic_active", {
        p_clinic_id: params.clinic_id,
        p_is_active: params.is_active,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      toast({
        title: vars.is_active ? "Clinica activada" : "Clinica desactivada",
        description: vars.is_active
          ? "La clinica puede recibir usuarios nuevamente."
          : "Los usuarios de esta clinica ya no pueden acceder.",
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

export function useGenerateLicenseCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (licenseId: string) => {
      const { data, error } = await api.rpc<{
        license_id: string;
        clinic_id: string;
        clinic_name: string;
        license_code: string;
        code_uses: number;
        code_max_uses: number;
        plan: string;
        expires_at: string;
      }>("admin_generate_license_code", {
        p_license_id: licenseId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      toast({
        title: "Codigo generado",
        description: `Nuevo codigo: ${data?.license_code}`,
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
