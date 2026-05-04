-- =====================================================
-- MIGRATION 018: License Codes for Registration
-- =====================================================

-- Add license_code column to licenses table
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS license_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS code_uses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS code_max_uses INTEGER DEFAULT 10;

-- Function to generate a unique license code
CREATE OR REPLACE FUNCTION public.generate_license_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code: DENT-XXXX-XXXX format
        v_code := 'DENT-' ||
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)) || '-' ||
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.licenses WHERE license_code = v_code) INTO v_exists;

        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to generate/regenerate license code
CREATE OR REPLACE FUNCTION public.admin_generate_license_code(p_license_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
    v_code TEXT;
    v_result JSONB;
BEGIN
    -- Require superadmin
    v_caller := public._require_superadmin();

    -- Generate new code
    v_code := public.generate_license_code();

    -- Update license with new code
    UPDATE public.licenses
    SET license_code = v_code,
        code_uses = 0,
        updated_at = NOW()
    WHERE id = p_license_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Licencia no encontrada';
    END IF;

    -- Return updated license info
    SELECT jsonb_build_object(
        'license_id', l.id,
        'clinic_id', l.clinic_id,
        'clinic_name', c.name,
        'license_code', l.license_code,
        'code_uses', l.code_uses,
        'code_max_uses', l.code_max_uses,
        'plan', l.plan,
        'expires_at', l.expires_at
    ) INTO v_result
    FROM public.licenses l
    JOIN public.clinics c ON c.id = l.clinic_id
    WHERE l.id = p_license_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register with license code
CREATE OR REPLACE FUNCTION public.register_with_license(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_license_code TEXT,
    p_role TEXT DEFAULT 'doctor'
)
RETURNS JSONB AS $$
DECLARE
    v_license RECORD;
    v_user_id UUID;
    v_token TEXT;
    v_clinic RECORD;
BEGIN
    -- Validate license code
    SELECT l.*, c.id as clinic_id, c.name as clinic_name, c.slug as clinic_slug, c.schema_name
    INTO v_license
    FROM public.licenses l
    JOIN public.clinics c ON c.id = l.clinic_id
    WHERE l.license_code = UPPER(TRIM(p_license_code))
    AND c.is_active = TRUE;

    IF v_license IS NULL THEN
        RAISE EXCEPTION 'Código de licencia inválido';
    END IF;

    -- Check if license is expired
    IF v_license.expires_at < CURRENT_DATE THEN
        RAISE EXCEPTION 'La licencia ha expirado';
    END IF;

    -- Check if license has reached max uses
    IF v_license.code_uses >= v_license.code_max_uses THEN
        RAISE EXCEPTION 'El código de licencia ha alcanzado el límite de usos';
    END IF;

    -- Check current user count vs max_users
    IF (SELECT COUNT(*) FROM public.clinic_users WHERE clinic_id = v_license.clinic_id AND is_active = TRUE) >= v_license.max_users THEN
        RAISE EXCEPTION 'La clínica ha alcanzado el límite de usuarios permitidos';
    END IF;

    -- Check if email already exists
    IF EXISTS(SELECT 1 FROM public.users WHERE email = LOWER(TRIM(p_email))) THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado';
    END IF;

    -- Validate role
    IF p_role NOT IN ('admin', 'doctor', 'assistant', 'accountant') THEN
        RAISE EXCEPTION 'Rol inválido';
    END IF;

    -- Create user
    INSERT INTO public.users (email, password_hash, full_name, is_active)
    VALUES (LOWER(TRIM(p_email)), crypt(p_password, gen_salt('bf')), TRIM(p_full_name), TRUE)
    RETURNING id INTO v_user_id;

    -- Link user to clinic
    INSERT INTO public.clinic_users (clinic_id, user_id, role, is_active)
    VALUES (v_license.clinic_id, v_user_id, p_role::app_role, TRUE);

    -- Increment license code uses
    UPDATE public.licenses
    SET code_uses = code_uses + 1, updated_at = NOW()
    WHERE id = v_license.id;

    -- Create session with clinic context
    v_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public.sessions (user_id, token, expires_at, clinic_id)
    VALUES (v_user_id, v_token, NOW() + INTERVAL '7 days', v_license.clinic_id);

    RETURN jsonb_build_object(
        'success', TRUE,
        'user_id', v_user_id,
        'email', LOWER(TRIM(p_email)),
        'token', v_token,
        'clinic_id', v_license.clinic_id,
        'clinic_name', v_license.clinic_name,
        'clinic_slug', v_license.clinic_slug,
        'role', p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate codes for existing licenses that don't have one
UPDATE public.licenses
SET license_code = public.generate_license_code()
WHERE license_code IS NULL;

-- Update get_all_clinics to include license code fields
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
                    'code_uses', COALESCE(l.code_uses, 0),
                    'code_max_uses', COALESCE(l.code_max_uses, 10)
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
