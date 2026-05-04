import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

type TableName =
  | "patients" | "appointments" | "treatments" | "treatment_materials"
  | "inventory_items" | "inventory_movements" | "inventory_categories"
  | "invoices" | "invoice_items" | "payments" | "financing_plans"
  | "patient_health_history" | "profiles" | "user_roles"
  | "suppliers" | "supplier_products" | "purchase_orders" | "purchase_order_items"
  | "stock_alerts" | "stock_alert_settings"
  | "lab_orders" | "lab_order_tracking" | "lab_quotes" | "dental_labs"
  | "clinic_settings" | "clinic_documents" | "ai_settings" | "message_templates"
  | "messages" | "conversations" | "conversation_participants" | "notifications"
  | "contact_messages" | "user_preferences" | "user_presence";

/**
 * Subscribe to realtime changes on a table and auto-invalidate related queries.
 * NOTE: Realtime is not available with PostgREST. Using polling instead.
 * @param table - The table to subscribe to
 * @param queryKeys - Query keys to invalidate when changes occur
 * @param pollingInterval - Optional polling interval in ms (default: 30000)
 */
export function useRealtimeSubscription(
  table: TableName,
  queryKeys: string[][],
  pollingInterval: number = 30000
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Polling fallback since PostgREST doesn't support realtime
    const interval = setInterval(() => {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }, pollingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [table, queryClient, queryKeys, pollingInterval]);
}

/**
 * Subscribe to multiple tables at once.
 * NOTE: Using polling instead of realtime subscriptions.
 */
export function useRealtimeMultiSubscription(
  subscriptions: { table: TableName; queryKeys: string[][] }[],
  pollingInterval: number = 30000
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      subscriptions.forEach(({ queryKeys }) => {
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      });
    }, pollingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [subscriptions, queryClient, pollingInterval]);
}
