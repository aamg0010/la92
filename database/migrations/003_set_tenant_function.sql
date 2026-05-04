-- =====================================================
-- MIGRATION 003: set_tenant() - PostgREST db-pre-request
-- =====================================================
-- Reads X-Session-Token from request.headers JSON (PostgREST v12+)
-- Falls back to Authorization: Bearer header

CREATE OR REPLACE FUNCTION public.set_tenant()
RETURNS VOID AS $$
DECLARE
    v_token TEXT;
    v_schema TEXT;
    v_clinic_id UUID;
    v_user_id UUID;
    v_headers JSONB;
BEGIN
    -- Read headers JSON (PostgREST v12+ sets request.headers as JSON)
    BEGIN
        v_headers := current_setting('request.headers', true)::jsonb;
    EXCEPTION WHEN OTHERS THEN
        v_headers := '{}'::jsonb;
    END;

    -- Read X-Session-Token from headers
    v_token := v_headers->>'x-session-token';

    -- Fallback: Authorization Bearer
    IF v_token IS NULL OR v_token = '' THEN
        v_token := v_headers->>'authorization';
        IF v_token IS NOT NULL AND v_token LIKE 'Bearer %' THEN
            v_token := substring(v_token from 8);
        END IF;
    END IF;

    -- Sin token: solo schema public (login, register, landing)
    IF v_token IS NULL OR v_token = '' THEN
        PERFORM set_config('search_path', 'public', true);
        RETURN;
    END IF;

    -- Buscar session valida con clinic info
    SELECT s.user_id, s.clinic_id, c.schema_name
    INTO v_user_id, v_clinic_id, v_schema
    FROM public.sessions s
    LEFT JOIN public.clinics c ON c.id = s.clinic_id
    WHERE s.token = v_token AND s.expires_at > NOW();

    IF v_user_id IS NOT NULL AND v_schema IS NOT NULL THEN
        -- Session valida con clinica asignada
        PERFORM set_config('search_path', v_schema || ', public', true);
        PERFORM set_config('app.current_user_id', v_user_id::text, true);
        PERFORM set_config('app.current_clinic_id', v_clinic_id::text, true);
    ELSIF v_user_id IS NOT NULL THEN
        -- Session valida pero sin clinica (superadmin o pending selection)
        PERFORM set_config('search_path', 'public', true);
        PERFORM set_config('app.current_user_id', v_user_id::text, true);
    ELSE
        -- Token invalido o expirado
        PERFORM set_config('search_path', 'public', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
