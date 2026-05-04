-- =====================================================
-- MIGRATION 011: Expenses Module (Egresos)
-- =====================================================

-- =====================================================
-- TABLES FOR PUBLIC SCHEMA
-- =====================================================

-- Tabla principal de egresos
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN (
        'payroll',           -- Nomina
        'doctor_settlement', -- Liquidacion odontologo
        'lab_payment',       -- Pago a laboratorio
        'supplies',          -- Insumos/materiales
        'utilities',         -- Servicios (agua, luz, etc)
        'rent',              -- Arriendo
        'maintenance',       -- Mantenimiento
        'marketing',         -- Marketing/publicidad
        'taxes',             -- Impuestos
        'other'              -- Otros
    )),
    subcategory TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'card', 'check')),
    reference_number TEXT,
    beneficiary_name TEXT,
    beneficiary_id UUID,
    beneficiary_type TEXT CHECK (beneficiary_type IN ('doctor', 'employee', 'lab', 'supplier', 'other') OR beneficiary_type IS NULL),
    settlement_id UUID REFERENCES public.doctor_settlements(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_period TEXT CHECK (recurrence_period IN ('weekly', 'biweekly', 'monthly', 'yearly') OR recurrence_period IS NULL),
    notes TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias personalizables de gastos
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    parent_category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_expenses_clinic ON public.expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_beneficiary ON public.expenses(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_expenses_settlement ON public.expenses(settlement_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_clinic ON public.expense_categories(clinic_id);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO la92_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO la92_user;

-- =====================================================
-- ADD TO CLONE SCHEMA FUNCTION
-- =====================================================

-- Function to add expenses tables to existing clinic schemas
CREATE OR REPLACE FUNCTION public.add_expenses_tables_to_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Expenses table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.expenses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
            category TEXT NOT NULL CHECK (category IN (
                ''payroll'', ''doctor_settlement'', ''lab_payment'', ''supplies'',
                ''utilities'', ''rent'', ''maintenance'', ''marketing'', ''taxes'', ''other''
            )),
            subcategory TEXT,
            description TEXT NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            payment_method TEXT DEFAULT ''cash'' CHECK (payment_method IN (''cash'', ''transfer'', ''card'', ''check'')),
            reference_number TEXT,
            beneficiary_name TEXT,
            beneficiary_id UUID,
            beneficiary_type TEXT CHECK (beneficiary_type IN (''doctor'', ''employee'', ''lab'', ''supplier'', ''other'') OR beneficiary_type IS NULL),
            settlement_id UUID REFERENCES %I.doctor_settlements(id) ON DELETE SET NULL,
            is_recurring BOOLEAN DEFAULT FALSE,
            recurrence_period TEXT CHECK (recurrence_period IN (''weekly'', ''biweekly'', ''monthly'', ''yearly'') OR recurrence_period IS NULL),
            notes TEXT,
            receipt_url TEXT,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    -- Expense categories table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.expense_categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            icon TEXT,
            color TEXT,
            parent_category TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- Indices
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_expenses_date ON %I.expenses(expense_date)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_expenses_category ON %I.expenses(category)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_expenses_beneficiary ON %I.expenses(beneficiary_id)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_expenses_settlement ON %I.expenses(settlement_id)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Trigger
    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_expenses_updated_at
        BEFORE UPDATE ON %I.expenses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Permisos
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.expenses TO la92_user', p_schema_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.expense_categories TO la92_user', p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a clinic_la92 si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.add_expenses_tables_to_schema('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- FIN MIGRATION 011
-- =====================================================
