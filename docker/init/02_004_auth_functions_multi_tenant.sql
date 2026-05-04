-- =====================================================
-- MIGRATION 004: Auth functions rewritten for multi-tenant
-- =====================================================
-- NOTE: If upgrading from single-tenant, run first:
--   DROP FUNCTION IF EXISTS public.login(text, text);
--   DROP FUNCTION IF EXISTS public.get_current_user();
-- because return type changed from json to jsonb

-- Helper to read session token from headers
-- Reads X-Session-Token first, falls back to Authorization Bearer
CREATE OR REPLACE FUNCTION public._get_session_token()
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
BEGIN
    v_token := current_setting('request.header.x-session-token', true);
    IF v_token IS NULL OR v_token = '' THEN
        v_token := current_setting('request.header.authorization', true);
        IF v_token IS NOT NULL AND v_token LIKE 'Bearer %' THEN
            v_token := substring(v_token from 8);
        END IF;
    END IF;
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== LOGIN =====
CREATE OR REPLACE FUNCTION public.login(p_email TEXT, p_password TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_token TEXT;
    v_clinics JSONB;
    v_clinic_count INTEGER;
    v_single_clinic RECORD;
BEGIN
    -- Buscar usuario
    SELECT id, email, password_hash, is_active, is_superadmin
    INTO v_user
    FROM public.users
    WHERE email = lower(trim(p_email));

    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Credenciales invalidas';
    END IF;

    IF v_user.is_active = FALSE THEN
        RAISE EXCEPTION 'Tu cuenta ha sido deshabilitada. Contacta al administrador.';
    END IF;

    -- Verificar password
    IF NOT public.verify_password(p_password, v_user.password_hash) THEN
        RAISE EXCEPTION 'Credenciales invalidas';
    END IF;

    -- Obtener clinicas del usuario
    SELECT jsonb_agg(jsonb_build_object(
        'clinic_id', c.id,
        'name', c.name,
        'slug', c.slug,
        'logo_url', c.logo_url,
        'role', cu.role::text
    )), count(*)
    INTO v_clinics, v_clinic_count
    FROM public.clinic_users cu
    JOIN public.clinics c ON c.id = cu.clinic_id
    WHERE cu.user_id = v_user.id
      AND cu.is_active = TRUE
      AND c.is_active = TRUE;

    -- Generar token
    v_token := encode(gen_random_bytes(32), 'hex');

    -- Update last_login
    UPDATE public.users SET last_login = NOW() WHERE id = v_user.id;

    IF v_clinic_count = 1 THEN
        -- Una sola clinica: auto-seleccionar
        SELECT c.id, c.name, c.slug, cu.role::text as role
        INTO v_single_clinic
        FROM public.clinic_users cu
        JOIN public.clinics c ON c.id = cu.clinic_id
        WHERE cu.user_id = v_user.id AND cu.is_active = TRUE AND c.is_active = TRUE
        LIMIT 1;

        INSERT INTO public.sessions (user_id, token, expires_at, clinic_id)
        VALUES (v_user.id, v_token, NOW() + INTERVAL '24 hours', v_single_clinic.id);

        RETURN jsonb_build_object(
            'user_id', v_user.id,
            'email', v_user.email,
            'token', v_token,
            'role', v_single_clinic.role,
            'clinic_id', v_single_clinic.id,
            'clinic_name', v_single_clinic.name,
            'clinic_slug', v_single_clinic.slug,
            'needs_clinic_selection', false,
            'is_superadmin', COALESCE(v_user.is_superadmin, false)
        );

    ELSIF v_clinic_count > 1 THEN
        -- Multiples clinicas: usuario debe seleccionar
        INSERT INTO public.sessions (user_id, token, expires_at)
        VALUES (v_user.id, v_token, NOW() + INTERVAL '24 hours');

        RETURN jsonb_build_object(
            'user_id', v_user.id,
            'email', v_user.email,
            'token', v_token,
            'clinics', v_clinics,
            'needs_clinic_selection', true,
            'is_superadmin', COALESCE(v_user.is_superadmin, false)
        );

    ELSE
        -- Sin clinicas: superadmin o usuario sin asignar
        IF COALESCE(v_user.is_superadmin, false) THEN
            INSERT INTO public.sessions (user_id, token, expires_at)
            VALUES (v_user.id, v_token, NOW() + INTERVAL '24 hours');

            RETURN jsonb_build_object(
                'user_id', v_user.id,
                'email', v_user.email,
                'token', v_token,
                'role', 'superadmin',
                'needs_clinic_selection', false,
                'is_superadmin', true
            );
        ELSE
            -- BACKWARD COMPAT: si no hay clinic_users, buscar en user_roles (legacy)
            DECLARE
                v_legacy_role TEXT;
            BEGIN
                SELECT role::text INTO v_legacy_role
                FROM public.user_roles WHERE user_id = v_user.id LIMIT 1;

                IF v_legacy_role IS NOT NULL THEN
                    INSERT INTO public.sessions (user_id, token, expires_at)
                    VALUES (v_user.id, v_token, NOW() + INTERVAL '24 hours');

                    RETURN jsonb_build_object(
                        'user_id', v_user.id,
                        'email', v_user.email,
                        'token', v_token,
                        'role', v_legacy_role,
                        'needs_clinic_selection', false,
                        'is_superadmin', COALESCE(v_user.is_superadmin, false)
                    );
                END IF;
            END;

            RAISE EXCEPTION 'No tienes acceso a ninguna clinica. Contacta al administrador.';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== SELECT CLINIC =====
CREATE OR REPLACE FUNCTION public.select_clinic(p_clinic_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_token TEXT;
    v_session RECORD;
    v_clinic RECORD;
    v_role TEXT;
BEGIN
    v_token := public._get_session_token();

    SELECT s.id, s.user_id INTO v_session
    FROM public.sessions s WHERE s.token = v_token AND s.expires_at > NOW();

    IF v_session IS NULL THEN RAISE EXCEPTION 'Sesion invalida'; END IF;

    SELECT cu.role::text, c.name, c.slug, c.logo_url
    INTO v_role, v_clinic.name, v_clinic.slug, v_clinic.logo_url
    FROM public.clinic_users cu
    JOIN public.clinics c ON c.id = cu.clinic_id
    WHERE cu.user_id = v_session.user_id AND cu.clinic_id = p_clinic_id
      AND cu.is_active = TRUE AND c.is_active = TRUE;

    IF v_role IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta clinica'; END IF;

    UPDATE public.sessions SET clinic_id = p_clinic_id WHERE id = v_session.id;

    RETURN jsonb_build_object(
        'clinic_id', p_clinic_id,
        'clinic_name', v_clinic.name,
        'clinic_slug', v_clinic.slug,
        'clinic_logo_url', v_clinic.logo_url,
        'role', v_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== GET CURRENT USER =====
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS JSONB AS $$
DECLARE
    v_token TEXT;
    v_session RECORD;
    v_user RECORD;
    v_role TEXT;
    v_clinic RECORD;
    v_profile RECORD;
BEGIN
    v_token := public._get_session_token();

    IF v_token IS NULL OR v_token = '' THEN
        RETURN jsonb_build_object('id', null);
    END IF;

    SELECT s.user_id, s.clinic_id, s.expires_at
    INTO v_session
    FROM public.sessions s
    WHERE s.token = v_token AND s.expires_at > NOW();

    IF v_session IS NULL THEN
        RETURN jsonb_build_object('id', null);
    END IF;

    SELECT u.id, u.email, u.is_superadmin, u.is_active
    INTO v_user
    FROM public.users u
    WHERE u.id = v_session.user_id;

    IF v_user IS NULL OR v_user.is_active = FALSE THEN
        RETURN jsonb_build_object('id', null);
    END IF;

    SELECT p.full_name, p.avatar_url
    INTO v_profile
    FROM public.profiles p
    WHERE p.user_id = v_user.id;

    IF v_session.clinic_id IS NOT NULL THEN
        SELECT cu.role::text INTO v_role
        FROM public.clinic_users cu
        WHERE cu.user_id = v_user.id AND cu.clinic_id = v_session.clinic_id;

        IF v_role IS NULL THEN
            SELECT role::text INTO v_role
            FROM public.user_roles WHERE user_id = v_user.id LIMIT 1;
        END IF;

        SELECT c.id, c.name, c.slug, c.logo_url
        INTO v_clinic
        FROM public.clinics c WHERE c.id = v_session.clinic_id;
    ELSE
        SELECT role::text INTO v_role
        FROM public.user_roles WHERE user_id = v_user.id LIMIT 1;
    END IF;

    RETURN jsonb_build_object(
        'id', v_user.id,
        'email', v_user.email,
        'role', COALESCE(v_role, CASE WHEN v_user.is_superadmin THEN 'superadmin' ELSE 'staff' END),
        'full_name', v_profile.full_name,
        'avatar_url', v_profile.avatar_url,
        'is_superadmin', COALESCE(v_user.is_superadmin, false),
        'clinic_id', v_session.clinic_id,
        'clinic_name', v_clinic.name,
        'clinic_slug', v_clinic.slug,
        'clinic_logo_url', v_clinic.logo_url
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== LOGOUT =====
CREATE OR REPLACE FUNCTION public.logout()
RETURNS VOID AS $$
DECLARE
    v_token TEXT;
BEGIN
    v_token := public._get_session_token();

    IF v_token IS NOT NULL AND v_token != '' THEN
        DELETE FROM public.sessions WHERE token = v_token;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== REGISTER =====
CREATE OR REPLACE FUNCTION public.register(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM public.users WHERE email = lower(trim(p_email))) THEN
        RAISE EXCEPTION 'Ya existe una cuenta con ese correo electronico';
    END IF;

    INSERT INTO public.users (email, password_hash)
    VALUES (lower(trim(p_email)), public.hash_password(p_password))
    RETURNING id INTO v_user_id;

    INSERT INTO public.profiles (user_id, full_name)
    VALUES (v_user_id, COALESCE(NULLIF(trim(p_full_name), ''), 'Usuario'));

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'staff');

    v_token := encode(gen_random_bytes(32), 'hex');

    INSERT INTO public.sessions (user_id, token, expires_at)
    VALUES (v_user_id, v_token, NOW() + INTERVAL '24 hours');

    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'email', lower(trim(p_email)),
        'token', v_token,
        'needs_clinic_selection', true,
        'clinics', '[]'::jsonb
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
