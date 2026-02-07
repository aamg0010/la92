import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
 * @param table - The table to subscribe to
 * @param queryKeys - Query keys to invalidate when changes occur
 */
export function useRealtimeSubscription(
  table: TableName,
  queryKeys: string[][]
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryClient, queryKeys]);
}

/**
 * Subscribe to multiple tables at once.
 */
export function useRealtimeMultiSubscription(
  subscriptions: { table: TableName; queryKeys: string[][] }[]
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = subscriptions.map(({ table, queryKeys }) => {
      return supabase
        .channel(`realtime-multi-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            queryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [subscriptions, queryClient]);
}
