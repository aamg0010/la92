-- =====================================================
-- MIGRATION 028: Create clinic with license (no user required)
-- =====================================================

-- Add columns to licenses table for pending admin info
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_name TEXT;

-- Function to create clinic with license code (admin registers later)
CREATE OR REPLACE FUNCTION public.create_clinic_with_license(
    p_name TEXT,
    p_slug TEXT,
    p_admin_email TEXT,
    p_admin_name TEXT DEFAULT NULL,
    p_plan TEXT DEFAULT 'basic',
    p_max_users INTEGER DEFAULT 5,
    p_months NUMERIC DEFAULT 12
)
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
    v_clinic_id UUID;
    v_license_id UUID;
    v_schema_name TEXT;
    v_license_code TEXT;
    v_expires_at DATE;
BEGIN
    -- Verify superadmin
    v_caller := public._require_superadmin();

    -- Validate email
    IF p_admin_email IS NULL OR trim(p_admin_email) = '' THEN
        RAISE EXCEPTION 'El email del administrador es requerido';
    END IF;

    -- Sanitize slug for schema name
    v_schema_name := 'clinic_' || regexp_replace(lower(trim(p_slug)), '[^a-z0-9]', '_', 'g');

    -- Validate slug uniqueness
    IF EXISTS (SELECT 1 FROM public.clinics WHERE slug = lower(trim(p_slug))) THEN
        RAISE EXCEPTION 'Ya existe una clinica con el slug "%"', p_slug;
    END IF;

    IF EXISTS (SELECT 1 FROM public.clinics WHERE schema_name = v_schema_name) THEN
        RAISE EXCEPTION 'Ya existe un schema con el nombre "%"', v_schema_name;
    END IF;

    -- Generate license code
    v_license_code := 'CL-' || upper(substr(md5(random()::text), 1, 8));

    -- Calculate expiration
    v_expires_at := CURRENT_DATE + (p_months || ' months')::INTERVAL;

    -- 1. Create clinic record
    INSERT INTO public.clinics (name, slug, schema_name, is_active)
    VALUES (trim(p_name), lower(trim(p_slug)), v_schema_name, TRUE)
    RETURNING id INTO v_clinic_id;

    -- 2. Create license with admin info and code
    INSERT INTO public.licenses (
        clinic_id, plan, status, max_users,
        starts_at, expires_at, amount,
        license_code, code_max_uses,
        admin_email, admin_name
    )
    VALUES (
        v_clinic_id,
        p_plan,
        'pending_activation',
        p_max_users,
        CURRENT_DATE,
        v_expires_at,
        0,
        v_license_code,
        1,
        lower(trim(p_admin_email)),
        trim(p_admin_name)
    )
    RETURNING id INTO v_license_id;

    -- 3. Create clinic schema with all tables
    PERFORM public.create_clinic_schema(v_schema_name);

    -- 4. Notify PostgREST to reload schema cache
    NOTIFY pgrst, 'reload schema';

    RETURN jsonb_build_object(
        'clinic_id', v_clinic_id,
        'clinic_name', trim(p_name),
        'schema_name', v_schema_name,
        'license_id', v_license_id,
        'license_code', v_license_code,
        'admin_email', lower(trim(p_admin_email)),
        'admin_name', trim(p_admin_name),
        'plan', p_plan,
        'max_users', p_max_users,
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_all_clinics to include admin info from license
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
                    'days_remaining', (l.expires_at - CURRENT_DATE),
                    'license_code', l.license_code,
                    'code_uses', l.code_uses,
                    'code_max_uses', l.code_max_uses,
                    'admin_email', l.admin_email,
                    'admin_name', l.admin_name
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

NOTIFY pgrst, 'reload schema';
