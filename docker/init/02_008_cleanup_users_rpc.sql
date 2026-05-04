-- =====================================================
-- MIGRATION 008: RPC function to cleanup users
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_cleanup_users(
    p_keep_user_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
    v_caller UUID;
    v_deleted_count INTEGER := 0;
    v_clinic RECORD;
BEGIN
    -- Verify superadmin
    v_caller := public._require_superadmin();

    -- For each clinic, clean up schema-specific tables
    FOR v_clinic IN SELECT schema_name FROM public.clinics WHERE schema_name IS NOT NULL
    LOOP
        -- Delete appointments referencing users to be deleted
        EXECUTE format('
            DELETE FROM %I.appointments
            WHERE doctor_id IS NOT NULL
            AND doctor_id != ALL($1)
        ', v_clinic.schema_name) USING p_keep_user_ids;

        -- Update odontograma_entries to use first kept user
        EXECUTE format('
            UPDATE %I.odontograma_entries
            SET performed_by = $1[1]
            WHERE performed_by IS NOT NULL
            AND performed_by != ALL($1)
        ', v_clinic.schema_name) USING p_keep_user_ids;

        -- Update treatment_plans
        EXECUTE format('
            UPDATE %I.treatment_plans
            SET created_by = $1[1]
            WHERE created_by IS NOT NULL
            AND created_by != ALL($1)
        ', v_clinic.schema_name) USING p_keep_user_ids;

        -- Update treatments performed_by
        EXECUTE format('
            UPDATE %I.treatments
            SET performed_by = $1[1]
            WHERE performed_by IS NOT NULL
            AND performed_by != ALL($1)
        ', v_clinic.schema_name) USING p_keep_user_ids;
    END LOOP;

    -- Delete from public tables in correct order
    DELETE FROM public.sessions WHERE user_id != ALL(p_keep_user_ids);
    DELETE FROM public.clinic_users WHERE user_id != ALL(p_keep_user_ids);
    DELETE FROM public.user_roles WHERE user_id != ALL(p_keep_user_ids);
    DELETE FROM public.profiles WHERE user_id != ALL(p_keep_user_ids);

    -- Finally delete users
    DELETE FROM public.users WHERE id != ALL(p_keep_user_ids);
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_users', v_deleted_count,
        'kept_users', array_length(p_keep_user_ids, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
