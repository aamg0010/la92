import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "doctor" | "assistant" | "accountant";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  doctor: "Odontólogo",
  assistant: "Auxiliar",
  accountant: "Contabilidad",
};

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: [
    "/dashboard", "/agenda", "/pacientes", "/tratamientos", "/inventario",
    "/laboratorios", "/finanzas", "/facturacion", "/cobros", "/asistente-ia",
    "/mensajes", "/configuracion", "/administracion"
  ],
  doctor: [
    "/dashboard", "/agenda", "/pacientes", "/tratamientos", "/inventario",
    "/laboratorios", "/asistente-ia", "/mensajes"
  ],
  assistant: [
    "/dashboard", "/agenda", "/pacientes", "/inventario", "/mensajes"
  ],
  accountant: [
    "/dashboard", "/finanzas", "/facturacion", "/cobros", "/mensajes"
  ],
};

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
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
      
      const { data, error } = await supabase
        .from("profiles")
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
