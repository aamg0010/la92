
-- Safely add tables to realtime publication (skip if already exists)
DO $$
DECLARE
  tables_to_add text[] := ARRAY[
    'patients', 'appointments', 'treatments', 'treatment_materials',
    'inventory_items', 'inventory_movements', 'inventory_categories',
    'invoices', 'invoice_items', 'payments', 'financing_plans',
    'patient_health_history', 'profiles', 'user_roles',
    'suppliers', 'supplier_products', 'purchase_orders', 'purchase_order_items',
    'stock_alerts', 'stock_alert_settings',
    'lab_orders', 'lab_order_tracking', 'lab_quotes', 'dental_labs',
    'clinic_settings', 'clinic_documents', 'ai_settings', 'message_templates',
    'messages', 'conversations', 'conversation_participants', 'notifications',
    'contact_messages', 'user_preferences', 'user_presence'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables_to_add LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      -- Already a member, skip
    END;
  END LOOP;
END;
$$;

-- Prevent deletion of clinical history records
CREATE OR REPLACE FUNCTION public.prevent_clinical_history_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'No se permite eliminar registros de historia clínica. Use el archivado en su lugar.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_clinical_history_delete') THEN
    CREATE TRIGGER prevent_clinical_history_delete
    BEFORE DELETE ON public.patient_health_history
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_clinical_history_deletion();
  END IF;
END;
$$;
