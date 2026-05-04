import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import type { AppRole } from "@/hooks/useUserRole";

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  specialty?: string;
  role: AppRole | null;
  created_at: string;
  is_active: boolean;
  is_superadmin: boolean;
  clinic_id?: string;
  clinic_name?: string;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Use get_clinic_users for clinic admins (get_all_users requires superadmin)
      const { data, error } = await api.rpc<AdminUser[]>("get_clinic_users");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Use RPC function that works for clinic admins
      const { data, error } = await api.rpc("update_clinic_user_role", {
        p_user_id: userId,
        p_new_role: newRole,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol. " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      // Use RPC function that works for clinic admins
      const { data, error } = await api.rpc("toggle_clinic_user_active", {
        p_user_id: userId,
        p_is_active: isActive,
      });

      if (error) throw error;
      return isActive;
    },
    onSuccess: (isActive) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: isActive ? "Usuario habilitado" : "Usuario deshabilitado",
        description: isActive
          ? "El usuario puede acceder al sistema nuevamente."
          : "El usuario ya no puede acceder al sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario. " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Función para crear nuevo usuario para la clínica del admin actual
export function useCreateClinicUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
      role,
      specialty
    }: {
      email: string;
      password: string;
      fullName: string;
      role: AppRole;
      specialty?: string;
    }) => {
      // Use create_user_for_my_clinic which gets clinic from JWT (no superadmin needed)
      const { data, error } = await api.rpc("create_user_for_my_clinic", {
        p_email: email,
        p_password: password,
        p_full_name: fullName,
        p_role: role,
        p_specialty: specialty || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      toast({
        title: "Usuario creado",
        description: "El nuevo usuario ha sido creado y asignado a la clínica.",
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
