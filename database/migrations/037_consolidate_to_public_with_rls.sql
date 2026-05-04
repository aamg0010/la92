-- =====================================================
-- MIGRATION 037: Consolidate multi-tenant to public + RLS
-- =====================================================
-- Objetivo: Eliminar leak multi-tenant (logos/config compartidos).
-- Estrategia: TODO vive en public con clinic_id NOT NULL.
-- RLS policies filtran por current_setting('app.current_clinic_id').
--
-- Origen del problema: PostgREST v12.2 con PGRST_DB_SCHEMA=public
-- solo expone tablas de public via REST. set_tenant cambiaba search_path
-- pero esto no tiene efecto cuando PostgREST usa el schema declarado.
-- Resultado: las 32 tablas duplicadas en public Y clinic_X siempre se
-- resolvian al public.<tabla> compartido entre tenants.
--
-- AUTORIZADO POR USUARIO: datos de prueba, operaciones destructivas OK.
-- BACKUP previo: /root/backups/la92_db_pre_tenant_refactor_20260504_205826.sql.gz
-- =====================================================

BEGIN;

-- ----------------------------------------------------
-- PASO 1: Wipe data en tablas duplicadas + solo-public sin clinic_id
-- (Datos imposibles de asignar a tenant correcto)
-- ----------------------------------------------------

-- 32 tablas duplicadas en public
TRUNCATE TABLE
  public.ai_settings,
  public.appointments,
  public.clinic_documents,
  public.clinic_settings,
  public.conversation_participants,
  public.conversations,
  public.daily_timesheets,
  public.dental_labs,
  public.employee_schedules,
  public.financing_plans,
  public.inventory_categories,
  public.inventory_items,
  public.inventory_movements,
  public.invoice_items,
  public.invoices,
  public.lab_order_tracking,
  public.lab_orders,
  public.lab_quotes,
  public.message_templates,
  public.messages,
  public.notifications,
  public.patient_health_history,
  public.payments,
  public.purchase_order_items,
  public.purchase_orders,
  public.stock_alert_settings,
  public.stock_alerts,
  public.supplier_products,
  public.suppliers,
  public.time_entries,
  public.treatment_materials,
  public.treatments
CASCADE;

-- 14 tablas solo-public (sin clinic_id, datos compartidos)
TRUNCATE TABLE
  public.budget_items,
  public.budgets,
  public.doctor_settlements,
  public.environmental_readings,
  public.expense_categories,
  public.expenses,
  public.installments,
  public.legal_acceptances,
  public.rips_provider_settings,
  public.rips_reports,
  public.settlement_items,
  public.time_tracking_settings,
  public.waste_disposals,
  public.waste_schedules
CASCADE;

-- ----------------------------------------------------
-- PASO 2: Añadir clinic_id NOT NULL a todas las tablas operativas
-- ----------------------------------------------------

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    -- 32 duplicadas
    'ai_settings','appointments','clinic_documents','clinic_settings',
    'conversation_participants','conversations','daily_timesheets','dental_labs',
    'employee_schedules','financing_plans','inventory_categories','inventory_items',
    'inventory_movements','invoice_items','invoices','lab_order_tracking',
    'lab_orders','lab_quotes','message_templates','messages','notifications',
    'patient_health_history','payments','purchase_order_items','purchase_orders',
    'stock_alert_settings','stock_alerts','supplier_products','suppliers',
    'time_entries','treatment_materials','treatments',
    -- 14 solo-public sin clinic_id
    'budget_items','budgets','doctor_settlements','environmental_readings',
    'expense_categories','expenses','installments','rips_provider_settings',
    'rips_reports','settlement_items','waste_disposals','waste_schedules'
    -- 'legal_acceptances' y 'time_tracking_settings' YA tienen clinic_id (no tocar)
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=v_table AND column_name='clinic_id'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE',
        v_table
      );
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%I_clinic_id ON public.%I(clinic_id)',
        v_table, v_table
      );
    END IF;
  END LOOP;
END$$;

-- ----------------------------------------------------
-- PASO 3: Mover patients y patient_consents desde clinic_X a public
-- (Estas son las únicas tablas con datos reales que deben preservarse)
-- ----------------------------------------------------

-- Crear public.patients (DDL idéntico al de clinic_la92.patients)
CREATE TABLE IF NOT EXISTS public.patients (
  LIKE clinic_la92.patients INCLUDING ALL
);

-- Asegurar columna clinic_id (la versión clinic_X probablemente no la tiene)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='patients' AND column_name='clinic_id'
  ) THEN
    ALTER TABLE public.patients
      ADD COLUMN clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE
      DEFAULT '00000000-0000-0000-0000-000000000001';
    -- Quitar default después de poblar
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);

-- Insertar datos de cada tenant con su clinic_id
-- NOTA: el INSERT debe ocurrir ANTES de activar RLS en PASO 7.
-- Aquí RLS aún no está activa porque la migración corre toda en una transacción
-- y las policies se crean al final. El INSERT funciona sin policy aún aplicada.
INSERT INTO public.patients
SELECT p.*, '00000000-0000-0000-0000-000000000001'::uuid AS clinic_id
FROM clinic_la92.patients p
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.patients
SELECT p.*, '79fb6b78-8402-4cc7-b2b8-c237b913a645'::uuid AS clinic_id
FROM clinic_su_sonrisa.patients p
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.patients
SELECT p.*, '0898d19c-1a35-4015-9fa9-6cd136e3ee2a'::uuid AS clinic_id
FROM clinic_clinicatry_pruebas.patients p
ON CONFLICT (id) DO NOTHING;

-- Quitar default de clinic_id ahora que está poblado
ALTER TABLE public.patients ALTER COLUMN clinic_id DROP DEFAULT;

-- patient_consents: clonar desde clinic_la92 (solo tenant con datos)
CREATE TABLE IF NOT EXISTS public.patient_consents (
  LIKE clinic_la92.patient_consents INCLUDING ALL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='patient_consents' AND column_name='clinic_id'
  ) THEN
    ALTER TABLE public.patient_consents
      ADD COLUMN clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE
      DEFAULT '00000000-0000-0000-0000-000000000001';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_patient_consents_clinic_id ON public.patient_consents(clinic_id);

INSERT INTO public.patient_consents
SELECT pc.*, '00000000-0000-0000-0000-000000000001'::uuid
FROM clinic_la92.patient_consents pc
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.patient_consents ALTER COLUMN clinic_id DROP DEFAULT;

-- signature_tokens: clonar desde clinic_la92
CREATE TABLE IF NOT EXISTS public.signature_tokens (
  LIKE clinic_la92.signature_tokens INCLUDING ALL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='signature_tokens' AND column_name='clinic_id'
  ) THEN
    ALTER TABLE public.signature_tokens
      ADD COLUMN clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE
      DEFAULT '00000000-0000-0000-0000-000000000001';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_signature_tokens_clinic_id ON public.signature_tokens(clinic_id);

INSERT INTO public.signature_tokens
SELECT st.*, '00000000-0000-0000-0000-000000000001'::uuid
FROM clinic_la92.signature_tokens st
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.signature_tokens ALTER COLUMN clinic_id DROP DEFAULT;

-- ----------------------------------------------------
-- PASO 4: DROP schemas clinic_*  (datos ya migrados o vacíos)
-- ----------------------------------------------------

DROP SCHEMA IF EXISTS clinic_la92 CASCADE;
DROP SCHEMA IF EXISTS clinic_su_sonrisa CASCADE;
DROP SCHEMA IF EXISTS clinic_clinicatry_pruebas CASCADE;

-- ----------------------------------------------------
-- PASO 5: DROP tabla legacy archived (ya no necesaria)
-- ----------------------------------------------------

DROP TABLE IF EXISTS public.patients_legacy_archived_20260426 CASCADE;

-- ----------------------------------------------------
-- PASO 6: Helper function para RLS — leer current_clinic_id de session
-- ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_clinic_id()
RETURNS UUID AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := current_setting('app.current_clinic_id', true);
  IF v_id IS NULL OR v_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_id::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.current_clinic_id() TO la92_user, public;

-- ----------------------------------------------------
-- PASO 7: Activar RLS + policies en TODAS las tablas con clinic_id
-- ----------------------------------------------------

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    -- 32 ex-duplicadas (ahora con clinic_id)
    'ai_settings','appointments','clinic_documents','clinic_settings',
    'conversation_participants','conversations','daily_timesheets','dental_labs',
    'employee_schedules','financing_plans','inventory_categories','inventory_items',
    'inventory_movements','invoice_items','invoices','lab_order_tracking',
    'lab_orders','lab_quotes','message_templates','messages','notifications',
    'patient_health_history','payments','purchase_order_items','purchase_orders',
    'stock_alert_settings','stock_alerts','supplier_products','suppliers',
    'time_entries','treatment_materials','treatments',
    -- 14 ex-solo-public con clinic_id ya añadido
    'budget_items','budgets','doctor_settlements','environmental_readings',
    'expense_categories','expenses','installments','rips_provider_settings',
    'rips_reports','settlement_items','waste_disposals','waste_schedules',
    -- las que ya tenían clinic_id
    'legal_acceptances','time_tracking_settings',
    -- las migradas desde clinic_X
    'patients','patient_consents','signature_tokens'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_table);

    -- DROP policies anteriores si existen (idempotente)
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', v_table);

    -- Una policy única que aplica a SELECT/INSERT/UPDATE/DELETE
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation ON public.%I
        USING (clinic_id = public.current_clinic_id())
        WITH CHECK (clinic_id = public.current_clinic_id())
    $pol$, v_table);
  END LOOP;
END$$;

-- ----------------------------------------------------
-- PASO 8: Modificar set_tenant — ya no toca search_path operativo,
-- solo setea app.current_clinic_id que las RLS leen
-- ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_tenant()
RETURNS VOID AS $$
DECLARE
    v_token TEXT;
    v_clinic_id UUID;
    v_user_id UUID;
    v_headers JSONB;
BEGIN
    BEGIN
        v_headers := current_setting('request.headers', true)::jsonb;
    EXCEPTION WHEN OTHERS THEN
        v_headers := '{}'::jsonb;
    END;

    v_token := v_headers->>'x-session-token';
    IF v_token IS NULL OR v_token = '' THEN
        v_token := v_headers->>'authorization';
        IF v_token IS NOT NULL AND v_token LIKE 'Bearer %' THEN
            v_token := substring(v_token from 8);
        END IF;
    END IF;

    -- Sin token: limpiar context (login, landing, register no requieren clinic)
    IF v_token IS NULL OR v_token = '' THEN
        PERFORM set_config('app.current_clinic_id', '', true);
        PERFORM set_config('app.current_user_id', '', true);
        RETURN;
    END IF;

    SELECT s.user_id, s.clinic_id
    INTO v_user_id, v_clinic_id
    FROM public.sessions s
    WHERE s.token = v_token AND s.expires_at > NOW();

    IF v_user_id IS NOT NULL AND v_clinic_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_id', v_user_id::text, true);
        PERFORM set_config('app.current_clinic_id', v_clinic_id::text, true);
    ELSIF v_user_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_id', v_user_id::text, true);
        PERFORM set_config('app.current_clinic_id', '', true);
    ELSE
        PERFORM set_config('app.current_clinic_id', '', true);
        PERFORM set_config('app.current_user_id', '', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------
-- PASO 9: BYPASS RLS para owner (la92_user) en RPCs SECURITY DEFINER
-- las RPCs siguen funcionando porque son SECURITY DEFINER y owner es la92_user
-- pero las tablas con FORCE RLS bloquean incluso al owner.
-- Solución: dar BYPASSRLS al rol o usar una role aparte.
-- Decisión: la92_user OWNER de tablas + FORCE RLS, pero las RPCs hacen
-- SET LOCAL row_security = off cuando necesiten acceso global.
-- En cambio, para flujo normal: queries van con role la92_user que
-- aplica la policy clinic_id = current_clinic_id().
-- ----------------------------------------------------

-- ----------------------------------------------------
-- PASO 10: NOTIFY PostgREST para reload schema cache
-- ----------------------------------------------------

NOTIFY pgrst, 'reload schema';

COMMIT;
