-- =====================================================
-- MIGRATION 010: Doctor Settlements (Liquidacion de Odontologos)
-- =====================================================

-- Agregar porcentaje de liquidacion a profiles (public)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settlement_percentage DECIMAL(5,2) DEFAULT 45.00;

-- =====================================================
-- TABLES FOR PUBLIC SCHEMA (backwards compat)
-- =====================================================

-- Liquidaciones de doctores (resumen diario)
CREATE TABLE IF NOT EXISTS public.doctor_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.users(id),
    clinic_id UUID REFERENCES public.clinics(id),
    settlement_date DATE NOT NULL,
    gross_income DECIMAL(12,2) NOT NULL DEFAULT 0,
    lab_costs DECIMAL(12,2) DEFAULT 0,
    net_income DECIMAL(12,2) NOT NULL DEFAULT 0,
    settlement_percentage DECIMAL(5,2) NOT NULL,
    settlement_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_date DATE,
    paid_by UUID REFERENCES public.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, settlement_date, clinic_id)
);

-- Items detallados de cada liquidacion
CREATE TABLE IF NOT EXISTS public.settlement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES public.doctor_settlements(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('income', 'lab_cost')),
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_doctor_settlements_doctor ON public.doctor_settlements(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_settlements_date ON public.doctor_settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_doctor_settlements_status ON public.doctor_settlements(status);
CREATE INDEX IF NOT EXISTS idx_doctor_settlements_clinic ON public.doctor_settlements(clinic_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement ON public.settlement_items(settlement_id);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER update_doctor_settlements_updated_at
    BEFORE UPDATE ON public.doctor_settlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_settlements TO la92_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settlement_items TO la92_user;

-- =====================================================
-- ADD TO CLONE SCHEMA FUNCTION
-- =====================================================

-- Function to add doctor_settlements tables to existing clinic schemas
CREATE OR REPLACE FUNCTION public.add_settlements_tables_to_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Doctor settlements table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.doctor_settlements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            doctor_id UUID NOT NULL REFERENCES public.users(id),
            settlement_date DATE NOT NULL,
            gross_income DECIMAL(12,2) NOT NULL DEFAULT 0,
            lab_costs DECIMAL(12,2) DEFAULT 0,
            net_income DECIMAL(12,2) NOT NULL DEFAULT 0,
            settlement_percentage DECIMAL(5,2) NOT NULL,
            settlement_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            status TEXT DEFAULT ''pending'' CHECK (status IN (''pending'', ''paid'', ''cancelled'')),
            paid_date DATE,
            paid_by UUID REFERENCES public.users(id),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(doctor_id, settlement_date)
        )', p_schema_name);

    -- Settlement items table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.settlement_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            settlement_id UUID NOT NULL REFERENCES %I.doctor_settlements(id) ON DELETE CASCADE,
            item_type TEXT NOT NULL CHECK (item_type IN (''income'', ''lab_cost'')),
            description TEXT,
            amount DECIMAL(12,2) NOT NULL,
            reference_id UUID,
            reference_type TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    -- Indices
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_settlements_doctor ON %I.doctor_settlements(doctor_id)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_settlements_date ON %I.doctor_settlements(settlement_date)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_settlements_status ON %I.doctor_settlements(status)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_settlement_items ON %I.settlement_items(settlement_id)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Trigger
    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_settlements_updated_at
        BEFORE UPDATE ON %I.doctor_settlements
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Permisos
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.doctor_settlements TO la92_user', p_schema_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.settlement_items TO la92_user', p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a clinic_la92 si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.add_settlements_tables_to_schema('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- FIN MIGRATION 010
-- =====================================================
