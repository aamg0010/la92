-- =====================================================
-- MIGRATION 027: Get users without clinic for superadmin
-- =====================================================

-- Function to get all users without a clinic assigned (for superadmin use in create clinic dialog)
CREATE OR REPLACE FUNCTION public.get_users_without_clinic()
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
    v_result JSONB;
BEGIN
    -- Require superadmin
    v_caller := public._require_superadmin();

    SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'full_name'), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT jsonb_build_object(
            'user_id', u.id,
            'email', u.email,
            'full_name', COALESCE(p.full_name, u.email),
            'is_active', u.is_active,
            'is_superadmin', u.is_superadmin,
            'created_at', u.created_at
        ) as row_data
        FROM public.users u
        LEFT JOIN public.profiles p ON p.user_id = u.id
        WHERE u.is_active = TRUE
          AND u.is_superadmin = FALSE
          AND NOT EXISTS (
              SELECT 1 FROM public.clinic_users cu
              WHERE cu.user_id = u.id AND cu.is_active = TRUE
          )
    ) sub;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (RPC will check superadmin internally)
GRANT EXECUTE ON FUNCTION public.get_users_without_clinic() TO authenticated;

NOTIFY pgrst, 'reload schema';
