-- Migration 035b: Fix ambiguedad columna/OUT param en _find_signature_token
-- Date: 2026-05-04
--
-- Bug detectado en deploy: la 035 declara OUT params con nombres (schema_name,
-- clinic_id, ...) que coinciden con columnas de public.clinics, causando
-- "column reference ambiguous" al ejecutar validate_signature_token.
--
-- Fix: alias 'c' en la query de iteracion + qualifications explicitas.

BEGIN;

CREATE OR REPLACE FUNCTION public._find_signature_token(p_token UUID)
RETURNS TABLE (
    schema_name TEXT,
    clinic_id UUID,
    clinic_name TEXT,
    patient_id UUID,
    template_ids UUID[],
    treatment_id UUID,
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clinic RECORD;
    v_found RECORD;
BEGIN
    FOR v_clinic IN
        SELECT c.id AS c_id, c.name AS c_name, c.schema_name AS c_schema
        FROM public.clinics c
        WHERE c.schema_name IS NOT NULL
    LOOP
        BEGIN
            EXECUTE format($sql$
                SELECT patient_id, template_ids, treatment_id, expires_at, used_at, status
                FROM %I.signature_tokens
                WHERE token = $1
                LIMIT 1
            $sql$, v_clinic.c_schema)
            INTO v_found
            USING p_token;
        EXCEPTION WHEN OTHERS THEN
            CONTINUE;
        END;

        IF v_found IS NOT NULL AND v_found.patient_id IS NOT NULL THEN
            schema_name := v_clinic.c_schema;
            clinic_id := v_clinic.c_id;
            clinic_name := v_clinic.c_name;
            patient_id := v_found.patient_id;
            template_ids := v_found.template_ids;
            treatment_id := v_found.treatment_id;
            expires_at := v_found.expires_at;
            used_at := v_found.used_at;
            status := v_found.status;
            RETURN NEXT;
            RETURN;
        END IF;
    END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
