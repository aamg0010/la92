-- =====================================================
-- MIGRATION 038: Compat layer para RPCs schema-aware
-- =====================================================
-- Tras 037 (consolidación a public+RLS), las RPCs antiguas usan
-- format('INSERT INTO %I.tabla', resolve_active_clinic_schema()) lo que
-- ahora apuntaria a clinic_X que ya no existe.
--
-- Solucion: resolve_active_clinic_schema() devuelve 'public' (las tablas
-- viven en public) y un trigger auto-rellena clinic_id en INSERTs si la
-- RPC no lo incluye explicitamente.
--
-- Beneficio: las 24+ RPCs schema-aware NO necesitan reescritura.
-- =====================================================

BEGIN;

-- ----------------------------------------------------
-- PASO 1: resolve_active_clinic_schema -> siempre 'public'
-- ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_active_clinic_schema()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    v_clinic_id UUID;
BEGIN
    BEGIN
        v_clinic_id := current_setting('app.current_clinic_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;

    IF v_clinic_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Despues de la consolidacion 037, todas las tablas estan en public.
    -- RLS filtra por current_clinic_id automaticamente.
    RETURN 'public';
END;
$$;

-- ----------------------------------------------------
-- PASO 2: Trigger auto-fill clinic_id en INSERTs
-- ----------------------------------------------------
-- Si un INSERT no incluye clinic_id, lo rellena con current_clinic_id().
-- Si lo incluye con valor distinto al de la sesion, RLS WITH CHECK lo bloqueara.

CREATE OR REPLACE FUNCTION public._auto_fill_clinic_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clinic_id IS NULL THEN
        NEW.clinic_id := public.current_clinic_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a TODAS las tablas con clinic_id
DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'ai_settings','appointments','clinic_documents','clinic_settings',
    'conversation_participants','conversations','daily_timesheets','dental_labs',
    'employee_schedules','financing_plans','inventory_categories','inventory_items',
    'inventory_movements','invoice_items','invoices','lab_order_tracking',
    'lab_orders','lab_quotes','message_templates','messages','notifications',
    'patient_health_history','payments','purchase_order_items','purchase_orders',
    'stock_alert_settings','stock_alerts','supplier_products','suppliers',
    'time_entries','treatment_materials','treatments',
    'budget_items','budgets','doctor_settlements','environmental_readings',
    'expense_categories','expenses','installments','rips_provider_settings',
    'rips_reports','settlement_items','waste_disposals','waste_schedules',
    'legal_acceptances','time_tracking_settings',
    'patients','patient_consents','signature_tokens'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS auto_fill_clinic_id ON public.%I', v_table);
    EXECUTE format($t$
      CREATE TRIGGER auto_fill_clinic_id
        BEFORE INSERT ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public._auto_fill_clinic_id()
    $t$, v_table);
  END LOOP;
END$$;

-- ----------------------------------------------------
-- PASO 3: Reload schema cache
-- ----------------------------------------------------

NOTIFY pgrst, 'reload schema';

COMMIT;
