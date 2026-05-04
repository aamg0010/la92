-- =====================================================
-- MIGRATION 029: Fix register_with_license (full_name in profiles, not users)
-- =====================================================

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

    IF v_license.expires_at < CURRENT_DATE THEN
        RAISE EXCEPTION 'La licencia ha expirado';
    END IF;

    IF v_license.code_uses >= v_license.code_max_uses THEN
        RAISE EXCEPTION 'El código de licencia ha alcanzado el límite de usos';
    END IF;

    IF (SELECT COUNT(*) FROM public.clinic_users WHERE clinic_id = v_license.clinic_id AND is_active = TRUE) >= v_license.max_users THEN
        RAISE EXCEPTION 'La clínica ha alcanzado el límite de usuarios permitidos';
    END IF;

    IF EXISTS(SELECT 1 FROM public.users WHERE email = LOWER(TRIM(p_email))) THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado';
    END IF;

    IF p_role NOT IN ('admin', 'doctor', 'assistant', 'accountant') THEN
        RAISE EXCEPTION 'Rol inválido';
    END IF;

    -- Create user (without full_name - it goes in profiles)
    INSERT INTO public.users (email, password_hash, is_active)
    VALUES (LOWER(TRIM(p_email)), crypt(p_password, gen_salt('bf')), TRUE)
    RETURNING id INTO v_user_id;

    -- Create profile with full_name
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (v_user_id, TRIM(p_full_name));

    -- Link user to clinic
    INSERT INTO public.clinic_users (clinic_id, user_id, role, is_active)
    VALUES (v_license.clinic_id, v_user_id, p_role::app_role, TRUE);

    -- Increment license code uses
    UPDATE public.licenses
    SET code_uses = code_uses + 1, updated_at = NOW()
    WHERE id = v_license.id;

    -- Activate license if first use
    UPDATE public.licenses
    SET status = 'active'
    WHERE id = v_license.id AND status = 'pending_activation';

    -- Create session with clinic context
    v_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public.sessions (user_id, token, expires_at, clinic_id)
    VALUES (v_user_id, v_token, NOW() + INTERVAL '7 days', v_license.clinic_id);

    RETURN jsonb_build_object(
        'success', TRUE,
        'user_id', v_user_id,
        'email', LOWER(TRIM(p_email)),
        'full_name', TRIM(p_full_name),
        'token', v_token,
        'clinic_id', v_license.clinic_id,
        'clinic_name', v_license.clinic_name,
        'clinic_slug', v_license.clinic_slug,
        'role', p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
