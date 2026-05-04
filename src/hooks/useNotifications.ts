import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "appointment_reminder";
  is_read: boolean;
  link: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await api
        .from<Notification>("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    // Poll every 30 seconds for new notifications (since we don't have real-time now)
    refetchInterval: 30000,
  });
}

export function useUnreadNotificationsCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter((n) => !n.is_read).length || 0;
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await api
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await api
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await api
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

// Helper function to create a notification (used by staff)
export async function createNotification(notification: {
  user_id: string;
  title: string;
  message: string;
  type?: Notification["type"];
  link?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  const { error } = await api.from("notifications").insert({
    user_id: notification.user_id,
    title: notification.title,
    message: notification.message,
    type: notification.type || "info",
    link: notification.link || null,
    metadata: notification.metadata ? JSON.parse(JSON.stringify(notification.metadata)) : null,
  });

  if (error) throw error;
}
