-- =====================================================
-- MIGRATION 006: Admin RPC functions for clinic/license management
-- =====================================================

-- Helper: validate current user is superadmin
CREATE OR REPLACE FUNCTION public._require_superadmin()
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_is_super BOOLEAN;
BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    SELECT is_superadmin INTO v_is_super
    FROM public.users WHERE id = v_user_id;

    IF NOT COALESCE(v_is_super, false) THEN
        RAISE EXCEPTION 'Acceso denegado: se requiere superadmin';
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== CREATE CLINIC =====
CREATE OR REPLACE FUNCTION public.create_clinic(
    p_name TEXT,
    p_slug TEXT,
    p_admin_user_id UUID,
    p_plan TEXT DEFAULT 'basic',
    p_max_users INTEGER DEFAULT 5,
    p_months INTEGER DEFAULT 12
)
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
    v_clinic_id UUID;
    v_license_id UUID;
    v_schema_name TEXT;
BEGIN
    -- Verify superadmin
    v_caller := public._require_superadmin();

    -- Sanitize slug for schema name (only lowercase alphanumeric and underscore)
    v_schema_name := 'clinic_' || regexp_replace(lower(trim(p_slug)), '[^a-z0-9]', '_', 'g');

    -- Validate slug uniqueness
    IF EXISTS (SELECT 1 FROM public.clinics WHERE slug = lower(trim(p_slug))) THEN
        RAISE EXCEPTION 'Ya existe una clinica con el slug "%"', p_slug;
    END IF;

    IF EXISTS (SELECT 1 FROM public.clinics WHERE schema_name = v_schema_name) THEN
        RAISE EXCEPTION 'Ya existe un schema con el nombre "%"', v_schema_name;
    END IF;

    -- Validate admin user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_admin_user_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'El usuario administrador no existe o esta inactivo';
    END IF;

    -- 1. Create clinic record
    INSERT INTO public.clinics (name, slug, schema_name, is_active)
    VALUES (trim(p_name), lower(trim(p_slug)), v_schema_name, TRUE)
    RETURNING id INTO v_clinic_id;

    -- 2. Create license
    INSERT INTO public.licenses (clinic_id, plan, status, max_users, starts_at, expires_at, amount)
    VALUES (
        v_clinic_id,
        p_plan,
        'active',
        p_max_users,
        CURRENT_DATE,
        CURRENT_DATE + (p_months || ' months')::INTERVAL,
        0
    )
    RETURNING id INTO v_license_id;

    -- 3. Create clinic schema with all tables
    PERFORM public.create_clinic_schema(v_schema_name);

    -- 4. Assign admin user to clinic
    INSERT INTO public.clinic_users (clinic_id, user_id, role, is_active)
    VALUES (v_clinic_id, p_admin_user_id, 'admin', TRUE)
    ON CONFLICT (clinic_id, user_id) DO NOTHING;

    -- 5. Notify PostgREST to reload schema cache
    NOTIFY pgrst, 'reload schema';

    RETURN jsonb_build_object(
        'clinic_id', v_clinic_id,
        'schema_name', v_schema_name,
        'license_id', v_license_id,
        'name', trim(p_name),
        'slug', lower(trim(p_slug))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== GET ALL CLINICS =====
CREATE OR REPLACE FUNCTION public.get_all_clinics()
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
    v_result JSONB;
BEGIN
    v_caller := public._require_superadmin();

    SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'created_at' DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'schema_name', c.schema_name,
            'logo_url', c.logo_url,
            'is_active', c.is_active,
            'created_at', c.created_at,
            'user_count', (
                SELECT count(*) FROM public.clinic_users cu
                WHERE cu.clinic_id = c.id AND cu.is_active = TRUE
            ),
            'license', (
                SELECT jsonb_build_object(
                    'id', l.id,
                    'plan', l.plan,
                    'status', l.status,
                    'max_users', l.max_users,
                    'starts_at', l.starts_at,
                    'expires_at', l.expires_at,
                    'amount', l.amount,
                    'is_expired', l.expires_at < CURRENT_DATE,
                    'days_remaining', (l.expires_at - CURRENT_DATE)
                )
                FROM public.licenses l
                WHERE l.clinic_id = c.id
                ORDER BY l.created_at DESC
                LIMIT 1
            )
        ) as row_data
        FROM public.clinics c
    ) sub;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== UPDATE LICENSE =====
CREATE OR REPLACE FUNCTION public.update_license(
    p_license_id UUID,
    p_plan TEXT DEFAULT NULL,
    p_max_users INTEGER DEFAULT NULL,
    p_months_extend INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
    v_license RECORD;
BEGIN
    v_caller := public._require_superadmin();

    SELECT * INTO v_license FROM public.licenses WHERE id = p_license_id;
    IF v_license IS NULL THEN
        RAISE EXCEPTION 'Licencia no encontrada';
    END IF;

    UPDATE public.licenses SET
        plan = COALESCE(p_plan, plan),
        max_users = COALESCE(p_max_users, max_users),
        expires_at = CASE
            WHEN p_months_extend IS NOT NULL THEN
                GREATEST(expires_at, CURRENT_DATE) + (p_months_extend || ' months')::INTERVAL
            ELSE expires_at
        END,
        status = CASE
            WHEN p_months_extend IS NOT NULL THEN 'active'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_license_id;

    SELECT jsonb_build_object(
        'id', l.id,
        'clinic_id', l.clinic_id,
        'plan', l.plan,
        'max_users', l.max_users,
        'expires_at', l.expires_at,
        'status', l.status
    ) INTO v_license
    FROM public.licenses l WHERE l.id = p_license_id;

    RETURN v_license::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TOGGLE CLINIC ACTIVE =====
CREATE OR REPLACE FUNCTION public.toggle_clinic_active(
    p_clinic_id UUID,
    p_is_active BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
BEGIN
    v_caller := public._require_superadmin();

    IF NOT EXISTS (SELECT 1 FROM public.clinics WHERE id = p_clinic_id) THEN
        RAISE EXCEPTION 'Clinica no encontrada';
    END IF;

    UPDATE public.clinics
    SET is_active = p_is_active, updated_at = NOW()
    WHERE id = p_clinic_id;

    RETURN jsonb_build_object(
        'clinic_id', p_clinic_id,
        'is_active', p_is_active
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
