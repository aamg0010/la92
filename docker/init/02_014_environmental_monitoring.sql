-- =====================================================
-- MIGRATION 014: Control Ambiental - Temperatura y Humedad
-- =====================================================
-- Modulo para registro y monitoreo de condiciones ambientales
-- Cumplimiento normativo para clinicas dentales (Espana)
-- =====================================================

-- =====================================================
-- 1. TABLES FOR PUBLIC SCHEMA (Reference)
-- =====================================================

-- Tabla principal de lecturas ambientales
CREATE TABLE IF NOT EXISTS public.environmental_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id),
    reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reading_time TIME NOT NULL DEFAULT CURRENT_TIME,
    shift TEXT NOT NULL CHECK (shift IN ('AM', 'PM')),
    temperature DECIMAL(4,1) NOT NULL CHECK (temperature BETWEEN -10 AND 50),
    humidity DECIMAL(4,1) NOT NULL CHECK (humidity BETWEEN 0 AND 100),
    is_temperature_normal BOOLEAN GENERATED ALWAYS AS (temperature BETWEEN 18 AND 24) STORED,
    is_humidity_normal BOOLEAN GENERATED ALWAYS AS (humidity BETWEEN 40 AND 60) STORED,
    user_id UUID REFERENCES public.users(id),
    user_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Evitar duplicados: una lectura por turno por dia
    CONSTRAINT unique_reading_per_shift UNIQUE (clinic_id, reading_date, shift)
);

-- Configuracion de rangos normales (por si se quiere personalizar)
CREATE TABLE IF NOT EXISTS public.environmental_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id) UNIQUE,
    temp_min DECIMAL(4,1) NOT NULL DEFAULT 18.0,
    temp_max DECIMAL(4,1) NOT NULL DEFAULT 24.0,
    humidity_min DECIMAL(4,1) NOT NULL DEFAULT 40.0,
    humidity_max DECIMAL(4,1) NOT NULL DEFAULT 60.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para public schema
CREATE INDEX IF NOT EXISTS idx_environmental_readings_clinic ON public.environmental_readings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_environmental_readings_date ON public.environmental_readings(reading_date);
CREATE INDEX IF NOT EXISTS idx_environmental_readings_date_shift ON public.environmental_readings(reading_date, shift);
CREATE INDEX IF NOT EXISTS idx_environmental_readings_month ON public.environmental_readings(EXTRACT(YEAR FROM reading_date), EXTRACT(MONTH FROM reading_date));

-- Trigger updated_at
CREATE OR REPLACE TRIGGER update_environmental_readings_updated_at
    BEFORE UPDATE ON public.environmental_readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_environmental_config_updated_at
    BEFORE UPDATE ON public.environmental_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.environmental_readings TO la92_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.environmental_config TO la92_user;

-- =====================================================
-- 2. FUNCTION TO ADD TABLES TO CLINIC SCHEMAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_environmental_tables_to_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Environmental readings table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.environmental_readings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
            reading_time TIME NOT NULL DEFAULT CURRENT_TIME,
            shift TEXT NOT NULL CHECK (shift IN (''AM'', ''PM'')),
            temperature DECIMAL(4,1) NOT NULL CHECK (temperature BETWEEN -10 AND 50),
            humidity DECIMAL(4,1) NOT NULL CHECK (humidity BETWEEN 0 AND 100),
            is_temperature_normal BOOLEAN GENERATED ALWAYS AS (temperature BETWEEN 18 AND 24) STORED,
            is_humidity_normal BOOLEAN GENERATED ALWAYS AS (humidity BETWEEN 40 AND 60) STORED,
            user_id UUID REFERENCES public.users(id),
            user_name TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- Unique constraint per shift per day
    EXECUTE format('
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = ''%s_unique_reading_per_shift''
            ) THEN
                ALTER TABLE %I.environmental_readings
                ADD CONSTRAINT %s_unique_reading_per_shift
                UNIQUE (reading_date, shift);
            END IF;
        END $$;
    ', replace(p_schema_name, 'clinic_', ''), p_schema_name, replace(p_schema_name, 'clinic_', ''));

    -- Environmental config table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.environmental_config (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            temp_min DECIMAL(4,1) NOT NULL DEFAULT 18.0,
            temp_max DECIMAL(4,1) NOT NULL DEFAULT 24.0,
            humidity_min DECIMAL(4,1) NOT NULL DEFAULT 40.0,
            humidity_max DECIMAL(4,1) NOT NULL DEFAULT 60.0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- Indices
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_environmental_readings_date ON %I.environmental_readings(reading_date)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_environmental_readings_date_shift ON %I.environmental_readings(reading_date, shift)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_environmental_readings_month ON %I.environmental_readings(EXTRACT(YEAR FROM reading_date), EXTRACT(MONTH FROM reading_date))',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Triggers
    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_environmental_readings_updated_at
        BEFORE UPDATE ON %I.environmental_readings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_environmental_config_updated_at
        BEFORE UPDATE ON %I.environmental_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Permisos
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.environmental_readings TO la92_user', p_schema_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.environmental_config TO la92_user', p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a clinic_la92 si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.add_environmental_tables_to_schema('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- 3. RPC FUNCTIONS FOR ENVIRONMENTAL MONITORING
-- =====================================================

-- Obtener lecturas del dia actual
CREATE OR REPLACE FUNCTION public.get_environmental_today()
RETURNS JSON AS $$
DECLARE
    v_schema TEXT;
    v_result JSON;
BEGIN
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    EXECUTE format('
        SELECT json_build_object(
            ''date'', CURRENT_DATE,
            ''readings'', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        ''id'', id,
                        ''shift'', shift,
                        ''time'', reading_time,
                        ''temperature'', temperature,
                        ''humidity'', humidity,
                        ''isTemperatureNormal'', is_temperature_normal,
                        ''isHumidityNormal'', is_humidity_normal,
                        ''userName'', user_name,
                        ''notes'', notes
                    ) ORDER BY shift
                ), ''[]''::json)
                FROM %I.environmental_readings
                WHERE reading_date = CURRENT_DATE
            ),
            ''amReading'', (
                SELECT json_build_object(
                    ''id'', id,
                    ''temperature'', temperature,
                    ''humidity'', humidity,
                    ''time'', reading_time,
                    ''isTemperatureNormal'', is_temperature_normal,
                    ''isHumidityNormal'', is_humidity_normal,
                    ''userName'', user_name
                )
                FROM %I.environmental_readings
                WHERE reading_date = CURRENT_DATE AND shift = ''AM''
            ),
            ''pmReading'', (
                SELECT json_build_object(
                    ''id'', id,
                    ''temperature'', temperature,
                    ''humidity'', humidity,
                    ''time'', reading_time,
                    ''isTemperatureNormal'', is_temperature_normal,
                    ''isHumidityNormal'', is_humidity_normal,
                    ''userName'', user_name
                )
                FROM %I.environmental_readings
                WHERE reading_date = CURRENT_DATE AND shift = ''PM''
            )
        )
    ', v_schema, v_schema, v_schema) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_environmental_today() TO la92_user;

-- Estadisticas mensuales de control ambiental
CREATE OR REPLACE FUNCTION public.get_environmental_stats_monthly(
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
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

    EXECUTE format('
        SELECT json_build_object(
            ''month'', %L,
            ''year'', %L,
            ''startDate'', %L,
            ''endDate'', %L,
            ''totalReadings'', COUNT(*),
            ''avgTemperature'', ROUND(COALESCE(AVG(temperature), 0), 1),
            ''avgHumidity'', ROUND(COALESCE(AVG(humidity), 0), 1),
            ''minTemperature'', MIN(temperature),
            ''maxTemperature'', MAX(temperature),
            ''minHumidity'', MIN(humidity),
            ''maxHumidity'', MAX(humidity),
            ''daysWithReadings'', COUNT(DISTINCT reading_date),
            ''totalDaysInMonth'', %L::DATE - %L::DATE + 1,
            ''outOfRangeCount'', SUM(CASE WHEN NOT is_temperature_normal OR NOT is_humidity_normal THEN 1 ELSE 0 END),
            ''temperatureOutOfRange'', SUM(CASE WHEN NOT is_temperature_normal THEN 1 ELSE 0 END),
            ''humidityOutOfRange'', SUM(CASE WHEN NOT is_humidity_normal THEN 1 ELSE 0 END),
            ''normalRanges'', json_build_object(
                ''tempMin'', 18,
                ''tempMax'', 24,
                ''humidityMin'', 40,
                ''humidityMax'', 60
            )
        )
        FROM %I.environmental_readings
        WHERE reading_date BETWEEN %L AND %L
    ', p_month, p_year, v_start_date, v_end_date, v_end_date, v_start_date, v_schema, v_start_date, v_end_date) INTO v_result;

    IF v_result IS NULL THEN
        v_result := json_build_object(
            'month', p_month,
            'year', p_year,
            'startDate', v_start_date,
            'endDate', v_end_date,
            'totalReadings', 0,
            'avgTemperature', 0,
            'avgHumidity', 0,
            'minTemperature', NULL,
            'maxTemperature', NULL,
            'minHumidity', NULL,
            'maxHumidity', NULL,
            'daysWithReadings', 0,
            'totalDaysInMonth', v_end_date - v_start_date + 1,
            'outOfRangeCount', 0,
            'temperatureOutOfRange', 0,
            'humidityOutOfRange', 0,
            'normalRanges', json_build_object(
                'tempMin', 18,
                'tempMax', 24,
                'humidityMin', 40,
                'humidityMax', 60
            )
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_environmental_stats_monthly(INTEGER, INTEGER) TO la92_user;

-- Obtener tendencia semanal (ultimos 7 dias)
CREATE OR REPLACE FUNCTION public.get_environmental_weekly_trend(p_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
    v_schema TEXT;
    v_result JSON;
BEGIN
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    EXECUTE format('
        WITH date_series AS (
            SELECT generate_series(
                CURRENT_DATE - %L::INTEGER + 1,
                CURRENT_DATE,
                ''1 day''::INTERVAL
            )::DATE as date
        ),
        daily_data AS (
            SELECT
                reading_date,
                ROUND(AVG(temperature), 1) as avg_temp,
                ROUND(AVG(humidity), 1) as avg_humidity,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                MIN(humidity) as min_humidity,
                MAX(humidity) as max_humidity,
                COUNT(*) as reading_count,
                SUM(CASE WHEN NOT is_temperature_normal THEN 1 ELSE 0 END) as temp_alerts,
                SUM(CASE WHEN NOT is_humidity_normal THEN 1 ELSE 0 END) as humidity_alerts
            FROM %I.environmental_readings
            WHERE reading_date >= CURRENT_DATE - %L::INTEGER + 1
            GROUP BY reading_date
        )
        SELECT COALESCE(json_agg(
            json_build_object(
                ''date'', ds.date,
                ''dayName'', to_char(ds.date, ''Dy''),
                ''avgTemperature'', COALESCE(dd.avg_temp, NULL),
                ''avgHumidity'', COALESCE(dd.avg_humidity, NULL),
                ''minTemperature'', dd.min_temp,
                ''maxTemperature'', dd.max_temp,
                ''minHumidity'', dd.min_humidity,
                ''maxHumidity'', dd.max_humidity,
                ''readingCount'', COALESCE(dd.reading_count, 0),
                ''hasAlerts'', COALESCE(dd.temp_alerts > 0 OR dd.humidity_alerts > 0, false)
            ) ORDER BY ds.date
        ), ''[]''::json)
        FROM date_series ds
        LEFT JOIN daily_data dd ON ds.date = dd.reading_date
    ', p_days, v_schema, p_days) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_environmental_weekly_trend(INTEGER) TO la92_user;

-- Reporte mensual para auditoria/cumplimiento
CREATE OR REPLACE FUNCTION public.get_environmental_monthly_report(
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
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

    EXECUTE format('
        SELECT json_build_object(
            ''reportPeriod'', json_build_object(
                ''year'', %L,
                ''month'', %L,
                ''monthName'', to_char(%L::DATE, ''TMMonth''),
                ''startDate'', %L,
                ''endDate'', %L
            ),
            ''summary'', (
                SELECT json_build_object(
                    ''totalReadings'', COUNT(*),
                    ''daysWithReadings'', COUNT(DISTINCT reading_date),
                    ''totalDaysInMonth'', %L::DATE - %L::DATE + 1,
                    ''completeDays'', (
                        SELECT COUNT(*)
                        FROM (
                            SELECT reading_date
                            FROM %I.environmental_readings
                            WHERE reading_date BETWEEN %L AND %L
                            GROUP BY reading_date
                            HAVING COUNT(DISTINCT shift) = 2
                        ) complete
                    ),
                    ''avgTemperature'', ROUND(AVG(temperature), 1),
                    ''avgHumidity'', ROUND(AVG(humidity), 1),
                    ''outOfRangeReadings'', SUM(CASE WHEN NOT is_temperature_normal OR NOT is_humidity_normal THEN 1 ELSE 0 END),
                    ''temperatureAlerts'', SUM(CASE WHEN NOT is_temperature_normal THEN 1 ELSE 0 END),
                    ''humidityAlerts'', SUM(CASE WHEN NOT is_humidity_normal THEN 1 ELSE 0 END)
                )
                FROM %I.environmental_readings
                WHERE reading_date BETWEEN %L AND %L
            ),
            ''weeklyAverages'', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        ''weekNumber'', week_num,
                        ''avgTemperature'', avg_temp,
                        ''avgHumidity'', avg_humidity,
                        ''readings'', reading_count
                    ) ORDER BY week_num
                ), ''[]''::json)
                FROM (
                    SELECT
                        EXTRACT(WEEK FROM reading_date) as week_num,
                        ROUND(AVG(temperature), 1) as avg_temp,
                        ROUND(AVG(humidity), 1) as avg_humidity,
                        COUNT(*) as reading_count
                    FROM %I.environmental_readings
                    WHERE reading_date BETWEEN %L AND %L
                    GROUP BY EXTRACT(WEEK FROM reading_date)
                ) weekly
            ),
            ''outOfRangeDetails'', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        ''id'', id,
                        ''date'', reading_date,
                        ''time'', reading_time,
                        ''shift'', shift,
                        ''temperature'', temperature,
                        ''humidity'', humidity,
                        ''tempOutOfRange'', NOT is_temperature_normal,
                        ''humidityOutOfRange'', NOT is_humidity_normal,
                        ''userName'', user_name,
                        ''notes'', notes
                    ) ORDER BY reading_date, shift
                ), ''[]''::json)
                FROM %I.environmental_readings
                WHERE reading_date BETWEEN %L AND %L
                  AND (NOT is_temperature_normal OR NOT is_humidity_normal)
            ),
            ''allReadings'', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        ''id'', id,
                        ''date'', reading_date,
                        ''time'', reading_time,
                        ''shift'', shift,
                        ''temperature'', temperature,
                        ''humidity'', humidity,
                        ''isTemperatureNormal'', is_temperature_normal,
                        ''isHumidityNormal'', is_humidity_normal,
                        ''userName'', user_name,
                        ''notes'', notes
                    ) ORDER BY reading_date DESC, shift DESC
                ), ''[]''::json)
                FROM %I.environmental_readings
                WHERE reading_date BETWEEN %L AND %L
            ),
            ''generatedAt'', NOW()
        )
    ', p_year, p_month, v_start_date, v_start_date, v_end_date,
       v_end_date, v_start_date,
       v_schema, v_start_date, v_end_date,
       v_schema, v_start_date, v_end_date,
       v_schema, v_start_date, v_end_date,
       v_schema, v_start_date, v_end_date,
       v_schema, v_start_date, v_end_date) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_environmental_monthly_report(INTEGER, INTEGER) TO la92_user;

-- =====================================================
-- FIN MIGRATION 014
-- =====================================================
