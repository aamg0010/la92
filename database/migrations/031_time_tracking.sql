-- Migration: 031_time_tracking.sql
-- Description: Sistema de fichaje y control horario para empleados
-- Date: 2026-04-25

-- ============================================================================
-- SCHEMA PUBLIC: Configuración global de fichaje por clínica
-- ============================================================================

-- Configuración de fichaje por clínica
CREATE TABLE IF NOT EXISTS public.time_tracking_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

    -- Horario laboral estándar
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '18:00:00',
    break_duration_minutes INTEGER DEFAULT 60,

    -- Tolerancias
    late_tolerance_minutes INTEGER DEFAULT 10,
    early_leave_tolerance_minutes INTEGER DEFAULT 10,

    -- Configuración de fichaje
    require_geolocation BOOLEAN DEFAULT false,
    allowed_ip_addresses TEXT[], -- IPs desde las que se puede fichar
    allow_manual_entries BOOLEAN DEFAULT true,
    require_manager_approval BOOLEAN DEFAULT false,

    -- Horas extra
    overtime_threshold_daily_hours NUMERIC(4,2) DEFAULT 8.00,
    overtime_threshold_weekly_hours NUMERIC(5,2) DEFAULT 40.00,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(clinic_id)
);

-- Índice para búsqueda por clínica
CREATE INDEX IF NOT EXISTS idx_time_tracking_settings_clinic
ON public.time_tracking_settings(clinic_id);

-- ============================================================================
-- FUNCIÓN: Crear tablas de fichaje en schema de clínica
-- ============================================================================

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

            -- Tipo de registro
            entry_type TEXT NOT NULL CHECK (entry_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),

            -- Timestamp del fichaje
            entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            -- Ubicación (opcional)
            latitude NUMERIC(10, 8),
            longitude NUMERIC(11, 8),
            ip_address INET,

            -- Metadatos
            device_info TEXT,
            notes TEXT,

            -- Para entradas manuales o correcciones
            is_manual BOOLEAN DEFAULT false,
            approved_by UUID,
            approved_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    $sql$, p_clinic_schema);

    -- Índices para time_entries
    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_time_entries_user_id
        ON %I.time_entries(user_id)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_time_entries_entry_time
        ON %I.time_entries(entry_time)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_time_entries_user_date
        ON %I.time_entries(user_id, (entry_time::date))
    $sql$, p_clinic_schema);

    -- Tabla de resumen diario (calculado)
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %I.daily_timesheets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            work_date DATE NOT NULL,

            -- Tiempos calculados
            first_clock_in TIMESTAMPTZ,
            last_clock_out TIMESTAMPTZ,
            total_work_minutes INTEGER DEFAULT 0,
            total_break_minutes INTEGER DEFAULT 0,
            net_work_minutes INTEGER DEFAULT 0,

            -- Estado
            status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'approved', 'rejected')),

            -- Incidencias
            was_late BOOLEAN DEFAULT false,
            late_minutes INTEGER DEFAULT 0,
            left_early BOOLEAN DEFAULT false,
            early_minutes INTEGER DEFAULT 0,
            has_overtime BOOLEAN DEFAULT false,
            overtime_minutes INTEGER DEFAULT 0,

            -- Aprobación
            approved_by UUID,
            approved_at TIMESTAMPTZ,
            rejection_reason TEXT,

            -- Notas
            employee_notes TEXT,
            manager_notes TEXT,

            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),

            UNIQUE(user_id, work_date)
        )
    $sql$, p_clinic_schema);

    -- Índices para daily_timesheets
    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_daily_timesheets_user_id
        ON %I.daily_timesheets(user_id)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_daily_timesheets_work_date
        ON %I.daily_timesheets(work_date)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_daily_timesheets_status
        ON %I.daily_timesheets(status)
    $sql$, p_clinic_schema);

    -- Tabla de horarios de empleados (si tienen horario específico)
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %I.employee_schedules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,

            -- Día de la semana (0=domingo, 1=lunes, etc.)
            day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

            -- Horario
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            break_minutes INTEGER DEFAULT 60,

            -- Si trabaja ese día
            is_working_day BOOLEAN DEFAULT true,

            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),

            UNIQUE(user_id, day_of_week)
        )
    $sql$, p_clinic_schema);

    -- Índice para employee_schedules
    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_employee_schedules_user_id
        ON %I.employee_schedules(user_id)
    $sql$, p_clinic_schema);

END;
$$;

-- ============================================================================
-- FUNCIONES RPC PARA FICHAJE
-- ============================================================================

-- Función para fichar (entrada/salida/pausa)
CREATE OR REPLACE FUNCTION public.clock_action(
    p_session_token TEXT,
    p_action TEXT, -- 'clock_in', 'clock_out', 'break_start', 'break_end'
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_clinic_schema TEXT;
    v_entry_id UUID;
    v_client_ip INET;
    v_last_entry RECORD;
BEGIN
    -- Validar sesión
    SELECT s.*, u.id as user_id, c.schema_name
    INTO v_session
    FROM public.sessions s
    JOIN public.users u ON s.user_id = u.id
    JOIN public.clinics c ON s.clinic_id = c.id
    WHERE s.token = p_session_token
      AND s.expires_at > NOW()
      AND s.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Sesión inválida o expirada');
    END IF;

    v_clinic_schema := v_session.schema_name;

    -- Validar acción
    IF p_action NOT IN ('clock_in', 'clock_out', 'break_start', 'break_end') THEN
        RETURN json_build_object('success', false, 'error', 'Acción no válida');
    END IF;

    -- Obtener IP del cliente
    v_client_ip := inet_client_addr();

    -- Verificar última entrada del usuario hoy para validar secuencia lógica
    EXECUTE format($sql$
        SELECT entry_type, entry_time
        FROM %I.time_entries
        WHERE user_id = $1
          AND entry_time::date = CURRENT_DATE
        ORDER BY entry_time DESC
        LIMIT 1
    $sql$, v_clinic_schema)
    INTO v_last_entry
    USING v_session.user_id;

    -- Validar secuencia lógica de fichajes
    IF v_last_entry IS NOT NULL THEN
        -- No puede hacer clock_in si ya fichó entrada y no salió
        IF p_action = 'clock_in' AND v_last_entry.entry_type IN ('clock_in', 'break_end') THEN
            RETURN json_build_object('success', false, 'error', 'Ya tienes una entrada activa. Debes fichar salida primero.');
        END IF;

        -- No puede hacer clock_out si no ha fichado entrada
        IF p_action = 'clock_out' AND v_last_entry.entry_type IN ('clock_out', 'break_start') THEN
            RETURN json_build_object('success', false, 'error', 'No tienes entrada activa o estás en pausa.');
        END IF;

        -- No puede iniciar pausa si no está trabajando
        IF p_action = 'break_start' AND v_last_entry.entry_type NOT IN ('clock_in', 'break_end') THEN
            RETURN json_build_object('success', false, 'error', 'Debes fichar entrada antes de iniciar una pausa.');
        END IF;

        -- No puede terminar pausa si no está en pausa
        IF p_action = 'break_end' AND v_last_entry.entry_type != 'break_start' THEN
            RETURN json_build_object('success', false, 'error', 'No tienes una pausa activa.');
        END IF;
    ELSE
        -- Primera entrada del día debe ser clock_in
        IF p_action != 'clock_in' THEN
            RETURN json_build_object('success', false, 'error', 'Debes fichar entrada primero.');
        END IF;
    END IF;

    -- Insertar registro de fichaje
    v_entry_id := gen_random_uuid();

    EXECUTE format($sql$
        INSERT INTO %I.time_entries (
            id, user_id, entry_type, entry_time,
            latitude, longitude, ip_address, notes,
            is_manual
        ) VALUES (
            $1, $2, $3, NOW(),
            $4, $5, $6, $7,
            false
        )
    $sql$, v_clinic_schema)
    USING v_entry_id, v_session.user_id, p_action,
          p_latitude, p_longitude, v_client_ip, p_notes;

    -- Actualizar o crear resumen diario
    PERFORM public.update_daily_timesheet(p_session_token, CURRENT_DATE);

    RETURN json_build_object(
        'success', true,
        'entry_id', v_entry_id,
        'action', p_action,
        'timestamp', NOW()
    );
END;
$$;

-- Función para actualizar resumen diario
CREATE OR REPLACE FUNCTION public.update_daily_timesheet(
    p_session_token TEXT,
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_clinic_schema TEXT;
    v_settings RECORD;
    v_entries RECORD;
    v_first_in TIMESTAMPTZ;
    v_last_out TIMESTAMPTZ;
    v_total_work INTEGER := 0;
    v_total_break INTEGER := 0;
    v_was_late BOOLEAN := false;
    v_late_mins INTEGER := 0;
    v_left_early BOOLEAN := false;
    v_early_mins INTEGER := 0;
    v_has_overtime BOOLEAN := false;
    v_overtime_mins INTEGER := 0;
    v_expected_start TIME;
    v_expected_end TIME;
BEGIN
    -- Validar sesión
    SELECT s.*, c.schema_name
    INTO v_session
    FROM public.sessions s
    JOIN public.clinics c ON s.clinic_id = c.id
    WHERE s.token = p_session_token
      AND s.expires_at > NOW()
      AND s.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Sesión inválida');
    END IF;

    v_clinic_schema := v_session.schema_name;

    -- Obtener configuración de fichaje
    SELECT * INTO v_settings
    FROM public.time_tracking_settings
    WHERE clinic_id = v_session.clinic_id;

    IF NOT FOUND THEN
        v_expected_start := '09:00:00'::TIME;
        v_expected_end := '18:00:00'::TIME;
    ELSE
        v_expected_start := v_settings.work_start_time;
        v_expected_end := v_settings.work_end_time;
    END IF;

    -- Calcular tiempos del día
    EXECUTE format($sql$
        WITH entries AS (
            SELECT entry_type, entry_time
            FROM %I.time_entries
            WHERE user_id = $1 AND entry_time::date = $2
            ORDER BY entry_time
        ),
        pairs AS (
            SELECT
                entry_type,
                entry_time,
                LEAD(entry_time) OVER (ORDER BY entry_time) as next_time,
                LEAD(entry_type) OVER (ORDER BY entry_time) as next_type
            FROM entries
        )
        SELECT
            MIN(CASE WHEN entry_type = 'clock_in' THEN entry_time END) as first_in,
            MAX(CASE WHEN entry_type = 'clock_out' THEN entry_time END) as last_out,
            COALESCE(SUM(
                CASE WHEN entry_type IN ('clock_in', 'break_end') AND next_type IN ('clock_out', 'break_start')
                THEN EXTRACT(EPOCH FROM (next_time - entry_time)) / 60
                END
            ), 0)::INTEGER as work_minutes,
            COALESCE(SUM(
                CASE WHEN entry_type = 'break_start' AND next_type = 'break_end'
                THEN EXTRACT(EPOCH FROM (next_time - entry_time)) / 60
                END
            ), 0)::INTEGER as break_minutes
        FROM pairs
    $sql$, v_clinic_schema)
    INTO v_entries
    USING v_session.user_id, p_date;

    v_first_in := v_entries.first_in;
    v_last_out := v_entries.last_out;
    v_total_work := v_entries.work_minutes;
    v_total_break := v_entries.break_minutes;

    -- Calcular llegada tarde
    IF v_first_in IS NOT NULL THEN
        IF (v_first_in::TIME) > (v_expected_start + (COALESCE(v_settings.late_tolerance_minutes, 10) || ' minutes')::INTERVAL) THEN
            v_was_late := true;
            v_late_mins := EXTRACT(EPOCH FROM ((v_first_in::TIME) - v_expected_start)) / 60;
        END IF;
    END IF;

    -- Calcular salida anticipada
    IF v_last_out IS NOT NULL THEN
        IF (v_last_out::TIME) < (v_expected_end - (COALESCE(v_settings.early_leave_tolerance_minutes, 10) || ' minutes')::INTERVAL) THEN
            v_left_early := true;
            v_early_mins := EXTRACT(EPOCH FROM (v_expected_end - (v_last_out::TIME))) / 60;
        END IF;
    END IF;

    -- Calcular horas extra
    IF v_total_work > (COALESCE(v_settings.overtime_threshold_daily_hours, 8) * 60) THEN
        v_has_overtime := true;
        v_overtime_mins := v_total_work - (COALESCE(v_settings.overtime_threshold_daily_hours, 8) * 60);
    END IF;

    -- Insertar o actualizar resumen diario
    EXECUTE format($sql$
        INSERT INTO %I.daily_timesheets (
            user_id, work_date, first_clock_in, last_clock_out,
            total_work_minutes, total_break_minutes, net_work_minutes,
            status, was_late, late_minutes, left_early, early_minutes,
            has_overtime, overtime_minutes, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            CASE WHEN $4 IS NOT NULL THEN 'complete' ELSE 'incomplete' END,
            $8, $9, $10, $11, $12, $13, NOW()
        )
        ON CONFLICT (user_id, work_date) DO UPDATE SET
            first_clock_in = EXCLUDED.first_clock_in,
            last_clock_out = EXCLUDED.last_clock_out,
            total_work_minutes = EXCLUDED.total_work_minutes,
            total_break_minutes = EXCLUDED.total_break_minutes,
            net_work_minutes = EXCLUDED.net_work_minutes,
            status = EXCLUDED.status,
            was_late = EXCLUDED.was_late,
            late_minutes = EXCLUDED.late_minutes,
            left_early = EXCLUDED.left_early,
            early_minutes = EXCLUDED.early_minutes,
            has_overtime = EXCLUDED.has_overtime,
            overtime_minutes = EXCLUDED.overtime_minutes,
            updated_at = NOW()
    $sql$, v_clinic_schema)
    USING v_session.user_id, p_date, v_first_in, v_last_out,
          v_total_work, v_total_break, v_total_work - v_total_break,
          v_was_late, v_late_mins, v_left_early, v_early_mins,
          v_has_overtime, v_overtime_mins;

    RETURN json_build_object('success', true);
END;
$$;

-- Función para obtener estado actual del fichaje
CREATE OR REPLACE FUNCTION public.get_clock_status(p_session_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_clinic_schema TEXT;
    v_last_entry RECORD;
    v_today_summary RECORD;
    v_status TEXT;
BEGIN
    -- Validar sesión
    SELECT s.*, c.schema_name
    INTO v_session
    FROM public.sessions s
    JOIN public.clinics c ON s.clinic_id = c.id
    WHERE s.token = p_session_token
      AND s.expires_at > NOW()
      AND s.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Sesión inválida');
    END IF;

    v_clinic_schema := v_session.schema_name;

    -- Obtener última entrada de hoy
    EXECUTE format($sql$
        SELECT entry_type, entry_time
        FROM %I.time_entries
        WHERE user_id = $1 AND entry_time::date = CURRENT_DATE
        ORDER BY entry_time DESC
        LIMIT 1
    $sql$, v_clinic_schema)
    INTO v_last_entry
    USING v_session.user_id;

    -- Determinar estado
    IF v_last_entry IS NULL THEN
        v_status := 'not_started';
    ELSIF v_last_entry.entry_type = 'clock_in' THEN
        v_status := 'working';
    ELSIF v_last_entry.entry_type = 'clock_out' THEN
        v_status := 'finished';
    ELSIF v_last_entry.entry_type = 'break_start' THEN
        v_status := 'on_break';
    ELSIF v_last_entry.entry_type = 'break_end' THEN
        v_status := 'working';
    END IF;

    -- Obtener resumen de hoy
    EXECUTE format($sql$
        SELECT total_work_minutes, total_break_minutes, net_work_minutes,
               first_clock_in, last_clock_out
        FROM %I.daily_timesheets
        WHERE user_id = $1 AND work_date = CURRENT_DATE
    $sql$, v_clinic_schema)
    INTO v_today_summary
    USING v_session.user_id;

    RETURN json_build_object(
        'success', true,
        'status', v_status,
        'last_action', v_last_entry.entry_type,
        'last_action_time', v_last_entry.entry_time,
        'today', json_build_object(
            'total_work_minutes', COALESCE(v_today_summary.total_work_minutes, 0),
            'total_break_minutes', COALESCE(v_today_summary.total_break_minutes, 0),
            'net_work_minutes', COALESCE(v_today_summary.net_work_minutes, 0),
            'first_clock_in', v_today_summary.first_clock_in,
            'last_clock_out', v_today_summary.last_clock_out
        )
    );
END;
$$;

-- Función para obtener entradas del día
CREATE OR REPLACE FUNCTION public.get_time_entries(
    p_session_token TEXT,
    p_user_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_clinic_schema TEXT;
    v_target_user UUID;
    v_entries JSON;
BEGIN
    -- Validar sesión
    SELECT s.*, u.role, c.schema_name
    INTO v_session
    FROM public.sessions s
    JOIN public.users u ON s.user_id = u.id
    JOIN public.clinics c ON s.clinic_id = c.id
    WHERE s.token = p_session_token
      AND s.expires_at > NOW()
      AND s.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Sesión inválida');
    END IF;

    v_clinic_schema := v_session.schema_name;

    -- Si no se especifica usuario, usar el de la sesión
    -- Si se especifica otro usuario, verificar permisos
    IF p_user_id IS NULL THEN
        v_target_user := v_session.user_id;
    ELSIF p_user_id = v_session.user_id THEN
        v_target_user := p_user_id;
    ELSIF v_session.role IN ('admin', 'manager') THEN
        v_target_user := p_user_id;
    ELSE
        RETURN json_build_object('success', false, 'error', 'No tienes permisos para ver fichajes de otros usuarios');
    END IF;

    -- Obtener entradas
    EXECUTE format($sql$
        SELECT json_agg(
            json_build_object(
                'id', id,
                'entry_type', entry_type,
                'entry_time', entry_time,
                'notes', notes,
                'is_manual', is_manual
            ) ORDER BY entry_time
        )
        FROM %I.time_entries
        WHERE user_id = $1 AND entry_time::date = $2
    $sql$, v_clinic_schema)
    INTO v_entries
    USING v_target_user, p_date;

    RETURN json_build_object(
        'success', true,
        'entries', COALESCE(v_entries, '[]'::JSON)
    );
END;
$$;

-- Función para obtener resumen de fichajes (para managers)
CREATE OR REPLACE FUNCTION public.get_timesheets_summary(
    p_session_token TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_clinic_schema TEXT;
    v_timesheets JSON;
BEGIN
    -- Validar sesión
    SELECT s.*, u.role, c.schema_name
    INTO v_session
    FROM public.sessions s
    JOIN public.users u ON s.user_id = u.id
    JOIN public.clinics c ON s.clinic_id = c.id
    WHERE s.token = p_session_token
      AND s.expires_at > NOW()
      AND s.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Sesión inválida');
    END IF;

    v_clinic_schema := v_session.schema_name;

    -- Si no es admin/manager, solo puede ver sus propios datos
    IF v_session.role NOT IN ('admin', 'manager') AND (p_user_id IS NULL OR p_user_id != v_session.user_id) THEN
        p_user_id := v_session.user_id;
    END IF;

    -- Obtener timesheets
    EXECUTE format($sql$
        SELECT json_agg(
            json_build_object(
                'id', dt.id,
                'user_id', dt.user_id,
                'user_name', u.full_name,
                'work_date', dt.work_date,
                'first_clock_in', dt.first_clock_in,
                'last_clock_out', dt.last_clock_out,
                'total_work_minutes', dt.total_work_minutes,
                'total_break_minutes', dt.total_break_minutes,
                'net_work_minutes', dt.net_work_minutes,
                'status', dt.status,
                'was_late', dt.was_late,
                'late_minutes', dt.late_minutes,
                'left_early', dt.left_early,
                'early_minutes', dt.early_minutes,
                'has_overtime', dt.has_overtime,
                'overtime_minutes', dt.overtime_minutes
            ) ORDER BY dt.work_date DESC, u.full_name
        )
        FROM %I.daily_timesheets dt
        JOIN public.users u ON dt.user_id = u.id
        WHERE dt.work_date BETWEEN $1 AND $2
          AND ($3::UUID IS NULL OR dt.user_id = $3)
    $sql$, v_clinic_schema)
    INTO v_timesheets
    USING p_start_date, p_end_date, p_user_id;

    RETURN json_build_object(
        'success', true,
        'timesheets', COALESCE(v_timesheets, '[]'::JSON)
    );
END;
$$;

-- Función para obtener configuración de fichaje
CREATE OR REPLACE FUNCTION public.get_time_tracking_settings(p_session_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_settings RECORD;
BEGIN
    -- Validar sesión
    SELECT s.*, c.schema_name
    INTO v_session
    FROM public.sessions s
    JOIN public.clinics c ON s.clinic_id = c.id
    WHERE s.token = p_session_token
      AND s.expires_at > NOW()
      AND s.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Sesión inválida');
    END IF;

    -- Obtener configuración
    SELECT * INTO v_settings
    FROM public.time_tracking_settings
    WHERE clinic_id = v_session.clinic_id;

    IF NOT FOUND THEN
        -- Devolver valores por defecto
        RETURN json_build_object(
            'success', true,
            'settings', json_build_object(
                'work_start_time', '09:00:00',
                'work_end_time', '18:00:00',
                'break_duration_minutes', 60,
                'late_tolerance_minutes', 10,
                'early_leave_tolerance_minutes', 10,
                'require_geolocation', false,
                'allow_manual_entries', true,
                'require_manager_approval', false,
                'overtime_threshold_daily_hours', 8,
                'overtime_threshold_weekly_hours', 40
            )
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'settings', json_build_object(
            'id', v_settings.id,
            'work_start_time', v_settings.work_start_time,
            'work_end_time', v_settings.work_end_time,
            'break_duration_minutes', v_settings.break_duration_minutes,
            'late_tolerance_minutes', v_settings.late_tolerance_minutes,
            'early_leave_tolerance_minutes', v_settings.early_leave_tolerance_minutes,
            'require_geolocation', v_settings.require_geolocation,
            'allowed_ip_addresses', v_settings.allowed_ip_addresses,
            'allow_manual_entries', v_settings.allow_manual_entries,
            'require_manager_approval', v_settings.require_manager_approval,
            'overtime_threshold_daily_hours', v_settings.overtime_threshold_daily_hours,
            'overtime_threshold_weekly_hours', v_settings.overtime_threshold_weekly_hours
        )
    );
END;
$$;

-- Función para actualizar configuración de fichaje (solo admin)
CREATE OR REPLACE FUNCTION public.update_time_tracking_settings(
    p_session_token TEXT,
    p_settings JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Validar sesión y permisos
    SELECT s.*, u.role
    INTO v_session
    FROM public.sessions s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.token = p_session_token
      AND s.expires_at > NOW()
      AND s.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Sesión inválida');
    END IF;

    IF v_session.role != 'admin' THEN
        RETURN json_build_object('success', false, 'error', 'Solo administradores pueden modificar la configuración');
    END IF;

    -- Insertar o actualizar configuración
    INSERT INTO public.time_tracking_settings (
        clinic_id,
        work_start_time,
        work_end_time,
        break_duration_minutes,
        late_tolerance_minutes,
        early_leave_tolerance_minutes,
        require_geolocation,
        allow_manual_entries,
        require_manager_approval,
        overtime_threshold_daily_hours,
        overtime_threshold_weekly_hours,
        updated_at
    ) VALUES (
        v_session.clinic_id,
        (p_settings->>'work_start_time')::TIME,
        (p_settings->>'work_end_time')::TIME,
        (p_settings->>'break_duration_minutes')::INTEGER,
        (p_settings->>'late_tolerance_minutes')::INTEGER,
        (p_settings->>'early_leave_tolerance_minutes')::INTEGER,
        (p_settings->>'require_geolocation')::BOOLEAN,
        (p_settings->>'allow_manual_entries')::BOOLEAN,
        (p_settings->>'require_manager_approval')::BOOLEAN,
        (p_settings->>'overtime_threshold_daily_hours')::NUMERIC,
        (p_settings->>'overtime_threshold_weekly_hours')::NUMERIC,
        NOW()
    )
    ON CONFLICT (clinic_id) DO UPDATE SET
        work_start_time = EXCLUDED.work_start_time,
        work_end_time = EXCLUDED.work_end_time,
        break_duration_minutes = EXCLUDED.break_duration_minutes,
        late_tolerance_minutes = EXCLUDED.late_tolerance_minutes,
        early_leave_tolerance_minutes = EXCLUDED.early_leave_tolerance_minutes,
        require_geolocation = EXCLUDED.require_geolocation,
        allow_manual_entries = EXCLUDED.allow_manual_entries,
        require_manager_approval = EXCLUDED.require_manager_approval,
        overtime_threshold_daily_hours = EXCLUDED.overtime_threshold_daily_hours,
        overtime_threshold_weekly_hours = EXCLUDED.overtime_threshold_weekly_hours,
        updated_at = NOW();

    RETURN json_build_object('success', true);
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.clock_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_timesheet TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clock_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_time_entries TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_timesheets_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_time_tracking_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_time_tracking_settings TO authenticated;
