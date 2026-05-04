-- ===== UPDATE LICENSE: Add p_expires_at parameter =====
-- Allows setting a specific expiration date instead of just extending by months

CREATE OR REPLACE FUNCTION public.update_license(
    p_license_id UUID,
    p_plan TEXT DEFAULT NULL,
    p_max_users INTEGER DEFAULT NULL,
    p_months_extend INTEGER DEFAULT NULL,
    p_expires_at DATE DEFAULT NULL
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
            WHEN p_expires_at IS NOT NULL THEN p_expires_at
            WHEN p_months_extend IS NOT NULL THEN
                GREATEST(expires_at, CURRENT_DATE) + (p_months_extend || ' months')::INTERVAL
            ELSE expires_at
        END,
        status = CASE
            WHEN p_expires_at IS NOT NULL AND p_expires_at > CURRENT_DATE THEN 'active'
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
