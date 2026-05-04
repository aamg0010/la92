import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "doctor" | "assistant" | "accountant" | "staff";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  doctor: "Odontólogo",
  assistant: "Auxiliar",
  accountant: "Contabilidad",
  staff: "Personal",
};

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: [
    "/dashboard", "/agenda", "/pacientes", "/tratamientos", "/presupuestos", "/inventario",
    "/laboratorios", "/finanzas", "/facturacion", "/cobros", "/egresos",
    "/rips", "/rh1", "/control-ambiental", "/fichaje",
    "/asistente-ia", "/mensajes", "/configuracion", "/administracion"
  ],
  doctor: [
    "/dashboard", "/agenda", "/pacientes", "/tratamientos", "/presupuestos", "/inventario",
    "/laboratorios", "/fichaje", "/asistente-ia", "/mensajes"
  ],
  assistant: [
    "/dashboard", "/agenda", "/pacientes", "/inventario", "/fichaje", "/mensajes"
  ],
  accountant: [
    "/dashboard", "/finanzas", "/facturacion", "/presupuestos", "/cobros", "/egresos", "/rips", "/fichaje", "/mensajes"
  ],
  staff: [
    "/dashboard", "/agenda", "/pacientes", "/fichaje"
  ],
};

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface Profile {
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

export function useUserRole() {
  const { user } = useAuth();
  const clinicId = localStorage.getItem('clinic_id');

  return useQuery({
    queryKey: ["user-role", user?.id, clinicId],
    queryFn: async () => {
      if (!user) return null;

      // Superadmin doesn't need a clinic role
      if (user.is_superadmin) {
        return "admin" as AppRole;
      }

      // Try clinic_users first (multi-tenant)
      if (clinicId) {
        const { data, error } = await api
          .from<{ role: AppRole }>("clinic_users")
          .select("role")
          .eq("user_id", user.id)
          .eq("clinic_id", clinicId)
          .maybeSingle();

        if (!error && data?.role) {
          return data.role;
        }
      }

      // Fallback to user_roles (legacy)
      const { data, error } = await api
        .from<UserRole>("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.role as AppRole | null;
    },
    enabled: !!user,
  });
}

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await api
        .from<Profile>("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function hasPermission(role: AppRole | null, path: string): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.some(p => path.startsWith(p));
}
