-- Migration 034: Tablas patient_consents y signature_tokens en cada schema clinic_*
-- Date: 2026-05-04
--
-- Modelo:
--   - patient_consents: registro inmutable de cada firma de paciente. Snapshot del contenido
--     del documento en el momento de firmar (template_content_snapshot + hash) para
--     evidencia legal: si la plantilla cambia, las firmas anteriores siguen reflejando lo firmado.
--   - signature_tokens: token efimero para firma remota desde movil. La clinica genera
--     el token, lo envia al paciente (QR/SMS/WhatsApp/email), el paciente abre /firma/<token>
--     desde su movil, firma, y el token se marca como usado.
--
-- Patron multi-tenant: funcion create_patient_consent_tables(p_clinic_schema) que crea las
-- tablas en el schema indicado. Al final del fichero llamamos a la funcion para cada
-- clinica activa.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_patient_consent_tables(p_clinic_schema TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    -- ========================================================================
    -- patient_consents: registro de consentimientos firmados por pacientes
    -- ========================================================================
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %I.patient_consents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            -- A quien pertenece el consentimiento
            patient_id UUID NOT NULL,

            -- Plantilla legal usada (vive en public.legal_documents)
            template_id UUID NOT NULL,
            template_document_type TEXT NOT NULL,
            template_version TEXT NOT NULL,
            template_title TEXT NOT NULL,

            -- Snapshot del contenido en el momento de firmar (evidencia legal)
            template_content_snapshot TEXT NOT NULL,
            template_content_hash TEXT NOT NULL, -- sha256 del contenido

            -- Asociacion opcional con un tratamiento concreto
            treatment_id UUID,
            treatment_type TEXT,

            -- Datos del firmante
            signer_role TEXT NOT NULL CHECK (signer_role IN ('patient', 'guardian', 'representative')),
            signer_full_name TEXT NOT NULL,
            signer_document TEXT, -- DNI/NIE
            signer_relationship TEXT, -- 'padre', 'madre', 'tutor legal', etc. cuando signer_role != patient

            -- Firma manuscrita (data URL base64)
            signature_data TEXT NOT NULL,
            signature_hash TEXT NOT NULL, -- sha256(signature_data) para verificacion

            -- Como se recogio la firma
            collection_method TEXT NOT NULL DEFAULT 'in_clinic'
                CHECK (collection_method IN ('in_clinic', 'remote_link', 'remote_qr')),
            device_type TEXT, -- 'tablet', 'mobile', 'desktop'

            -- Trazabilidad
            ip_address TEXT,
            user_agent TEXT,
            collected_by_user_id UUID, -- quien estaba logueado cuando se recogio (NULL si remoto)

            -- Estado
            status TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'revoked', 'superseded')),
            revoked_at TIMESTAMPTZ,
            revoked_by_user_id UUID,
            revocation_reason TEXT,

            -- Metadatos
            signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    $sql$, p_clinic_schema);

    -- Indices
    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_patient_consents_patient
        ON %I.patient_consents(patient_id)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_patient_consents_treatment
        ON %I.patient_consents(treatment_id) WHERE treatment_id IS NOT NULL
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_patient_consents_active
        ON %I.patient_consents(patient_id, template_id, status) WHERE status = 'active'
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_patient_consents_signed_at
        ON %I.patient_consents(signed_at DESC)
    $sql$, p_clinic_schema);

    -- ========================================================================
    -- signature_tokens: tokens efimeros para firma remota
    -- ========================================================================
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %I.signature_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

            -- A quien va dirigido
            patient_id UUID NOT NULL,

            -- Plantillas que tiene que firmar (array de UUIDs en public.legal_documents)
            template_ids UUID[] NOT NULL,

            -- Asociacion opcional con tratamiento
            treatment_id UUID,

            -- Quien creo el token
            created_by_user_id UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            -- Vigencia
            expires_at TIMESTAMPTZ NOT NULL,

            -- Uso
            used_at TIMESTAMPTZ,
            used_from_ip TEXT,
            used_user_agent TEXT,

            -- Resultado: array de UUIDs en patient_consents creados al firmar
            resulting_consent_ids UUID[],

            status TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'used', 'expired', 'cancelled'))
        )
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_signature_tokens_token
        ON %I.signature_tokens(token)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_signature_tokens_patient
        ON %I.signature_tokens(patient_id)
    $sql$, p_clinic_schema);

    EXECUTE format($sql$
        CREATE INDEX IF NOT EXISTS idx_signature_tokens_pending
        ON %I.signature_tokens(status, expires_at) WHERE status = 'pending'
    $sql$, p_clinic_schema);
END;
$func$;

-- ============================================================================
-- Aplicar a todas las clinicas activas
-- ============================================================================
DO $$
DECLARE
    v_clinic RECORD;
BEGIN
    FOR v_clinic IN
        SELECT schema_name FROM public.clinics WHERE schema_name IS NOT NULL
    LOOP
        PERFORM public.create_patient_consent_tables(v_clinic.schema_name);
    END LOOP;
END $$;

-- ============================================================================
-- Tambien creamos las tablas en public para que PostgREST pueda exponerlas
-- vistas/proxies cuando sea necesario. NO se almacenan datos aqui directamente:
-- las RPC de la migracion 035 leen/escriben siempre en el schema de la clinica
-- de la sesion. Estas tablas en public sirven solo para que PostgREST conozca
-- la forma del recurso para futuras vistas.
-- ============================================================================

-- (Intencionadamente vacio: el acceso a patient_consents se hace via RPC, no por
-- tabla expuesta, porque cada peticion debe enrutarse al schema correcto.)

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
