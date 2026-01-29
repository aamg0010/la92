import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AppRole } from "@/hooks/useUserRole";

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  created_at: string;
  avatar_url: string | null;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (rolesError) throw rolesError;

      // Create a map of user_id to role
      const roleMap = new Map<string, AppRole>();
      roles?.forEach(r => roleMap.set(r.user_id, r.role as AppRole));

      // Combine data
      const users: AdminUser[] = profiles?.map(p => ({
        user_id: p.user_id,
        email: "", // We'll need to get this from the context or auth table
        full_name: p.full_name,
        role: roleMap.get(p.user_id) || null,
        created_at: p.created_at,
        avatar_url: p.avatar_url,
      })) || [];

      return users;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        
        if (error) throw error;
      }
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

export function useDeleteUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Rol eliminado",
        description: "El rol del usuario ha sido eliminado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol. " + error.message,
        variant: "destructive",
      });
    },
  });
}
