-- =====================================================
-- MIGRATION 013: RH1 - Gestion de Residuos Biologicos
-- =====================================================
-- Modulo para cumplimiento normativo de manejo de residuos
-- hospitalarios en clinicas dentales (Colombia/Espana)
-- =====================================================

-- =====================================================
-- 1. TABLES FOR PUBLIC SCHEMA (Reference)
-- =====================================================

-- Tabla principal de disposiciones de residuos
CREATE TABLE IF NOT EXISTS public.waste_disposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id),
    disposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    waste_type TEXT NOT NULL CHECK (waste_type IN ('red', 'black', 'white')),
    weight_kg DECIMAL(8,2) NOT NULL CHECK (weight_kg > 0),
    responsible_name TEXT NOT NULL,
    responsible_id UUID REFERENCES public.users(id),
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programacion de recogidas
CREATE TABLE IF NOT EXISTS public.waste_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id),
    waste_type TEXT NOT NULL CHECK (waste_type IN ('red', 'black', 'white')),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sabado
    frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    collector_company TEXT,
    contact_phone TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para public schema
CREATE INDEX IF NOT EXISTS idx_waste_disposals_clinic ON public.waste_disposals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_waste_disposals_date ON public.waste_disposals(disposal_date);
CREATE INDEX IF NOT EXISTS idx_waste_disposals_type ON public.waste_disposals(waste_type);
CREATE INDEX IF NOT EXISTS idx_waste_schedules_clinic ON public.waste_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_waste_schedules_type ON public.waste_schedules(waste_type);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER update_waste_disposals_updated_at
    BEFORE UPDATE ON public.waste_disposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_waste_schedules_updated_at
    BEFORE UPDATE ON public.waste_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waste_disposals TO la92_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waste_schedules TO la92_user;

-- =====================================================
-- 2. FUNCTION TO ADD TABLES TO CLINIC SCHEMAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_waste_management_tables_to_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Waste disposals table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.waste_disposals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            disposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
            waste_type TEXT NOT NULL CHECK (waste_type IN (''red'', ''black'', ''white'')),
            weight_kg DECIMAL(8,2) NOT NULL CHECK (weight_kg > 0),
            responsible_name TEXT NOT NULL,
            responsible_id UUID REFERENCES public.users(id),
            notes TEXT,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- Waste schedules table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.waste_schedules (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            waste_type TEXT NOT NULL CHECK (waste_type IN (''red'', ''black'', ''white'')),
            day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
            frequency TEXT NOT NULL DEFAULT ''weekly'' CHECK (frequency IN (''weekly'', ''biweekly'', ''monthly'')),
            collector_company TEXT,
            contact_phone TEXT,
            notes TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- Indices
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_waste_disposals_date ON %I.waste_disposals(disposal_date)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_waste_disposals_type ON %I.waste_disposals(waste_type)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_waste_schedules_type ON %I.waste_schedules(waste_type)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Triggers
    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_waste_disposals_updated_at
        BEFORE UPDATE ON %I.waste_disposals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_waste_schedules_updated_at
        BEFORE UPDATE ON %I.waste_schedules
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Permisos
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.waste_disposals TO la92_user', p_schema_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.waste_schedules TO la92_user', p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a clinic_la92 si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.add_waste_management_tables_to_schema('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- 3. SEED DEFAULT SCHEDULES FOR CLINIC
-- =====================================================

CREATE OR REPLACE FUNCTION public.seed_waste_schedules(p_schema_name TEXT)
RETURNS VOID AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if schedules already exist
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.waste_schedules LIMIT 1)', p_schema_name) INTO v_exists;

    IF NOT v_exists THEN
        -- RED: Biosanitarios - cada 15 dias (asumimos dia 1 y 15 del mes aprox)
        EXECUTE format('
            INSERT INTO %I.waste_schedules (waste_type, day_of_week, frequency, collector_company, notes)
            VALUES
                (''red'', 1, ''biweekly'', NULL, ''Residuos biosanitarios - Max 25kg por bolsa'')
        ', p_schema_name);

        -- BLACK: Ordinarios - Lunes y Jueves
        EXECUTE format('
            INSERT INTO %I.waste_schedules (waste_type, day_of_week, frequency, collector_company, notes)
            VALUES
                (''black'', 1, ''weekly'', NULL, ''Residuos ordinarios - Recogida Lunes''),
                (''black'', 4, ''weekly'', NULL, ''Residuos ordinarios - Recogida Jueves'')
        ', p_schema_name);

        -- WHITE: Reciclables - Martes y Viernes
        EXECUTE format('
            INSERT INTO %I.waste_schedules (waste_type, day_of_week, frequency, collector_company, notes)
            VALUES
                (''white'', 2, ''weekly'', NULL, ''Residuos reciclables - Recogida Martes''),
                (''white'', 5, ''weekly'', NULL, ''Residuos reciclables - Recogida Viernes'')
        ', p_schema_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar seed a clinic_la92
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.seed_waste_schedules('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- 4. RPC FUNCTIONS FOR WASTE STATISTICS
-- =====================================================

-- Estadisticas mensuales de residuos
CREATE OR REPLACE FUNCTION public.get_waste_stats_monthly(
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_schema TEXT;
    v_result JSON;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Get current schema from session
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    -- Calculate date range
    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

    EXECUTE format('
        SELECT json_build_object(
            ''month'', %L,
            ''year'', %L,
            ''totalDisposals'', COUNT(*),
            ''totalWeightKg'', COALESCE(SUM(weight_kg), 0),
            ''byType'', (
                SELECT json_object_agg(
                    waste_type,
                    json_build_object(
                        ''count'', type_count,
                        ''weightKg'', type_weight
                    )
                )
                FROM (
                    SELECT
                        waste_type,
                        COUNT(*) as type_count,
                        COALESCE(SUM(weight_kg), 0) as type_weight
                    FROM %I.waste_disposals
                    WHERE disposal_date BETWEEN %L AND %L
                    GROUP BY waste_type
                ) type_stats
            ),
            ''redWeightKg'', COALESCE(SUM(CASE WHEN waste_type = ''red'' THEN weight_kg ELSE 0 END), 0),
            ''blackWeightKg'', COALESCE(SUM(CASE WHEN waste_type = ''black'' THEN weight_kg ELSE 0 END), 0),
            ''whiteWeightKg'', COALESCE(SUM(CASE WHEN waste_type = ''white'' THEN weight_kg ELSE 0 END), 0),
            ''alertRedWeight'', COALESCE(SUM(CASE WHEN waste_type = ''red'' THEN weight_kg ELSE 0 END), 0) > 20
        )
        FROM %I.waste_disposals
        WHERE disposal_date BETWEEN %L AND %L
    ', p_month, p_year, v_schema, v_start_date, v_end_date, v_schema, v_start_date, v_end_date) INTO v_result;

    -- Handle null result (no disposals)
    IF v_result IS NULL THEN
        v_result := json_build_object(
            'month', p_month,
            'year', p_year,
            'totalDisposals', 0,
            'totalWeightKg', 0,
            'byType', '{}'::json,
            'redWeightKg', 0,
            'blackWeightKg', 0,
            'whiteWeightKg', 0,
            'alertRedWeight', false
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_waste_stats_monthly(INTEGER, INTEGER) TO la92_user;

-- Proximas recogidas programadas
CREATE OR REPLACE FUNCTION public.get_upcoming_waste_pickups(p_days_ahead INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
    v_schema TEXT;
    v_result JSON;
BEGIN
    -- Get current schema from session
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    EXECUTE format('
        WITH upcoming AS (
            SELECT
                s.id,
                s.waste_type,
                s.day_of_week,
                s.frequency,
                s.collector_company,
                s.contact_phone,
                s.notes,
                -- Calculate next pickup date
                CASE
                    WHEN EXTRACT(DOW FROM CURRENT_DATE) <= s.day_of_week THEN
                        CURRENT_DATE + (s.day_of_week - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
                    ELSE
                        CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE) + s.day_of_week)::INTEGER
                END as next_pickup_date
            FROM %I.waste_schedules s
            WHERE s.is_active = TRUE
        )
        SELECT COALESCE(json_agg(
            json_build_object(
                ''id'', id,
                ''wasteType'', waste_type,
                ''dayOfWeek'', day_of_week,
                ''frequency'', frequency,
                ''collectorCompany'', collector_company,
                ''contactPhone'', contact_phone,
                ''notes'', notes,
                ''nextPickupDate'', next_pickup_date
            ) ORDER BY next_pickup_date
        ), ''[]''::json)
        FROM upcoming
        WHERE next_pickup_date <= CURRENT_DATE + %L::INTEGER
    ', v_schema, p_days_ahead) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_upcoming_waste_pickups(INTEGER) TO la92_user;

-- Reporte mensual para cumplimiento normativo
CREATE OR REPLACE FUNCTION public.get_waste_monthly_report(
    p_year INTEGER,
    p_month INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_schema TEXT;
    v_result JSON;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Get current schema from session
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    -- Calculate date range
    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

    EXECUTE format('
        SELECT json_build_object(
            ''reportPeriod'', json_build_object(
                ''year'', %L,
                ''month'', %L,
                ''startDate'', %L,
                ''endDate'', %L
            ),
            ''summary'', (
                SELECT json_build_object(
                    ''totalDisposals'', COUNT(*),
                    ''totalWeightKg'', COALESCE(SUM(weight_kg), 0)
                )
                FROM %I.waste_disposals
                WHERE disposal_date BETWEEN %L AND %L
            ),
            ''byType'', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        ''type'', waste_type,
                        ''disposalCount'', disposal_count,
                        ''totalWeightKg'', total_weight,
                        ''avgWeightKg'', avg_weight
                    )
                ), ''[]''::json)
                FROM (
                    SELECT
                        waste_type,
                        COUNT(*) as disposal_count,
                        SUM(weight_kg) as total_weight,
                        ROUND(AVG(weight_kg), 2) as avg_weight
                    FROM %I.waste_disposals
                    WHERE disposal_date BETWEEN %L AND %L
                    GROUP BY waste_type
                    ORDER BY waste_type
                ) t
            ),
            ''disposals'', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        ''id'', id,
                        ''date'', disposal_date,
                        ''type'', waste_type,
                        ''weightKg'', weight_kg,
                        ''responsible'', responsible_name,
                        ''notes'', notes
                    ) ORDER BY disposal_date DESC
                ), ''[]''::json)
                FROM %I.waste_disposals
                WHERE disposal_date BETWEEN %L AND %L
            ),
            ''generatedAt'', NOW()
        )
    ', p_year, p_month, v_start_date, v_end_date,
       v_schema, v_start_date, v_end_date,
       v_schema, v_start_date, v_end_date,
       v_schema, v_start_date, v_end_date) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_waste_monthly_report(INTEGER, INTEGER) TO la92_user;

-- =====================================================
-- FIN MIGRATION 013
-- =====================================================
