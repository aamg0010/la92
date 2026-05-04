-- =====================================================
-- MIGRATION 009: Payment Plans with Installments
-- Sistema de cuotas individuales para planes de financiamiento
-- Aplica a todos los schemas de clinica existentes
-- =====================================================

-- Funcion para aplicar migracion a un schema especifico
CREATE OR REPLACE FUNCTION public.migrate_009_installments(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Tabla de cuotas individuales
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.installments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plan_id UUID NOT NULL REFERENCES %I.financing_plans(id) ON DELETE CASCADE,
            installment_number INTEGER NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            due_date DATE,
            paid_amount DECIMAL(12,2) DEFAULT 0,
            paid_date DATE,
            payment_id UUID REFERENCES %I.payments(id),
            status TEXT DEFAULT ''pending'' CHECK (status IN (''pending'', ''partial'', ''paid'', ''overdue'')),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    -- Agregar columnas a financing_plans si no existen
    BEGIN
        EXECUTE format('ALTER TABLE %I.financing_plans ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT ''flexible'' CHECK (payment_mode IN (''fixed_date'', ''flexible''))', p_schema_name);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        EXECUTE format('ALTER TABLE %I.financing_plans ADD COLUMN IF NOT EXISTS day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28)', p_schema_name);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Indices para rendimiento
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_installments_plan_id ON %I.installments(plan_id)', p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_installments_status ON %I.installments(status)', p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_installments_due_date ON %I.installments(due_date)', p_schema_name);

    -- Permisos
    EXECUTE format('GRANT ALL ON %I.installments TO la92_user', p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Aplicar migracion al schema clinic_la92 (schema principal)
SELECT public.migrate_009_installments('clinic_la92');

-- Aplicar a todos los schemas de clinica existentes
DO $$
DECLARE
    v_clinic RECORD;
BEGIN
    FOR v_clinic IN SELECT schema_name FROM public.clinics WHERE schema_name IS NOT NULL AND schema_name != 'clinic_la92'
    LOOP
        PERFORM public.migrate_009_installments(v_clinic.schema_name);
    END LOOP;
END;
$$;

-- Funcion publica para actualizar estado de cuotas vencidas
-- Se ejecuta desde la aplicacion o via cron job
-- Necesita el schema como parametro ya que es multi-tenant
CREATE OR REPLACE FUNCTION public.update_overdue_installments()
RETURNS INTEGER AS $$
DECLARE
  v_clinic RECORD;
  v_updated_total INTEGER := 0;
  v_updated_count INTEGER;
BEGIN
  -- Iterar sobre todos los schemas de clinica
  FOR v_clinic IN SELECT schema_name FROM public.clinics WHERE schema_name IS NOT NULL
  LOOP
    EXECUTE format('
      UPDATE %I.installments
      SET status = ''overdue''
      WHERE status = ''pending''
        AND due_date IS NOT NULL
        AND due_date < CURRENT_DATE
    ', v_clinic.schema_name);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    v_updated_total := v_updated_total + v_updated_count;
  END LOOP;

  RETURN v_updated_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comentarios para documentacion (aplicar a clinic_la92)
-- =====================================================
COMMENT ON TABLE clinic_la92.installments IS 'Cuotas individuales de planes de financiamiento';
COMMENT ON COLUMN clinic_la92.installments.plan_id IS 'Plan de financiamiento al que pertenece';
COMMENT ON COLUMN clinic_la92.installments.installment_number IS 'Numero de cuota (1, 2, 3...)';
COMMENT ON COLUMN clinic_la92.installments.amount IS 'Monto total de la cuota';
COMMENT ON COLUMN clinic_la92.installments.due_date IS 'Fecha de vencimiento (NULL para planes flexibles)';
COMMENT ON COLUMN clinic_la92.installments.paid_amount IS 'Monto pagado de esta cuota';
COMMENT ON COLUMN clinic_la92.installments.paid_date IS 'Fecha en que se pago completamente';
COMMENT ON COLUMN clinic_la92.installments.payment_id IS 'Referencia al ultimo pago asociado';
COMMENT ON COLUMN clinic_la92.installments.status IS 'Estado: pending, partial, paid, overdue';

COMMENT ON COLUMN clinic_la92.financing_plans.payment_mode IS 'Modo: fixed_date (fecha fija mensual) o flexible';
COMMENT ON COLUMN clinic_la92.financing_plans.day_of_month IS 'Dia del mes para vencimiento (solo para fixed_date)';
