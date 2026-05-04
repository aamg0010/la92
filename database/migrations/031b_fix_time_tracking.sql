-- Fix: Crear tablas de fichaje sin índice problemático

CREATE OR REPLACE FUNCTION public.create_time_tracking_tables(p_clinic_schema TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Tabla principal de registros de fichaje
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %I.time_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            entry_type TEXT NOT NULL CHECK (entry_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
            entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            latitude NUMERIC(10, 8),
            longitude NUMERIC(11, 8),
            ip_address INET,
            device_info TEXT,
            notes TEXT,
            is_manual BOOLEAN DEFAULT false,
            approved_by UUID,
            approved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON %I.time_entries(user_id)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_time_entries_entry_time ON %I.time_entries(entry_time)
    $sql$, p_clinic_schema);

    -- Tabla de resumen diario
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %I.daily_timesheets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            work_date DATE NOT NULL,
            first_clock_in TIMESTAMPTZ,
            last_clock_out TIMESTAMPTZ,
            total_work_minutes INTEGER DEFAULT 0,
            total_break_minutes INTEGER DEFAULT 0,
            net_work_minutes INTEGER DEFAULT 0,
            status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'approved', 'rejected')),
            was_late BOOLEAN DEFAULT false,
            late_minutes INTEGER DEFAULT 0,
            left_early BOOLEAN DEFAULT false,
            early_minutes INTEGER DEFAULT 0,
            has_overtime BOOLEAN DEFAULT false,
            overtime_minutes INTEGER DEFAULT 0,
            approved_by UUID,
            approved_at TIMESTAMPTZ,
            rejection_reason TEXT,
            employee_notes TEXT,
            manager_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, work_date)
        )
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_daily_timesheets_user_id ON %I.daily_timesheets(user_id)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_daily_timesheets_work_date ON %I.daily_timesheets(work_date)
    $sql$, p_clinic_schema);

    -- Tabla de horarios de empleados
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %I.employee_schedules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            break_minutes INTEGER DEFAULT 60,
            is_working_day BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, day_of_week)
        )
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_employee_schedules_user_id ON %I.employee_schedules(user_id)
    $sql$, p_clinic_schema);
END;
$$;

-- Crear tablas en cada schema de clínica
SELECT public.create_time_tracking_tables('clinic_la92');
SELECT public.create_time_tracking_tables('clinic_su_sonrisa');
SELECT public.create_time_tracking_tables('clinic_clinicatry_pruebas');

-- Agregar tablas a public también para PostgREST
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
    entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    ip_address INET,
    device_info TEXT,
    notes TEXT,
    is_manual BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    work_date DATE NOT NULL,
    first_clock_in TIMESTAMPTZ,
    last_clock_out TIMESTAMPTZ,
    total_work_minutes INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    net_work_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'approved', 'rejected')),
    was_late BOOLEAN DEFAULT false,
    late_minutes INTEGER DEFAULT 0,
    left_early BOOLEAN DEFAULT false,
    early_minutes INTEGER DEFAULT 0,
    has_overtime BOOLEAN DEFAULT false,
    overtime_minutes INTEGER DEFAULT 0,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    employee_notes TEXT,
    manager_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, work_date)
);

CREATE TABLE IF NOT EXISTS public.employee_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 60,
    is_working_day BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, day_of_week)
);
