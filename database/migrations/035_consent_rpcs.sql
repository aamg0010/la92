-- Migration 035: RPCs para consentimientos de pacientes
-- Date: 2026-05-04
--
-- Capa de logica que escribe/lee patient_consents y signature_tokens en el
-- schema de la clinica activa. Resuelve el schema mediante:
--   - app.current_clinic_id (set por public.set_tenant() al validar la sesion)
--   - O p_session_token explicito en RPCs de uso autenticado especial
--
-- Las RPCs PUBLIC (validate_signature_token, submit_signature_via_token) NO
-- consumen sesion: reciben el token UUID y resuelven la clinica buscando el
-- token en TODOS los schemas clinic_*. Es el unico camino seguro porque la
-- firma remota la abre el paciente desde su movil sin estar logueado.
--
-- Patron de respuesta JSONB para todas las RPCs (consistente con el resto del
-- sistema): { success: bool, error?: text, ...payload }

BEGIN;

-- ============================================================================
-- HELPER: resolve_active_clinic_schema()
-- Devuelve el schema de la clinica de la sesion activa.
-- Si no hay sesion -> NULL.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.resolve_active_clinic_schema()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_clinic_id UUID;
    v_schema TEXT;
BEGIN
    BEGIN
        v_clinic_id := current_setting('app.current_clinic_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;

    IF v_clinic_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT schema_name INTO v_schema
    FROM public.clinics
    WHERE id = v_clinic_id;

    RETURN v_schema;
END;
$$;

-- ============================================================================
-- record_patient_consent
-- Registra una firma de consentimiento de paciente en la clinica de la sesion.
-- Snapshot del contenido + hash SHA256 para evidencia legal.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_patient_consent(
    p_patient_id UUID,
    p_template_id UUID,
    p_signature_data TEXT,
    p_signer_role TEXT DEFAULT 'patient',
    p_signer_full_name TEXT DEFAULT NULL,
    p_signer_document TEXT DEFAULT NULL,
    p_signer_relationship TEXT DEFAULT NULL,
    p_treatment_id UUID DEFAULT NULL,
    p_device_type TEXT DEFAULT 'desktop',
    p_collection_method TEXT DEFAULT 'in_clinic',
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_schema TEXT;
    v_template RECORD;
    v_consent_id UUID;
    v_signature_hash TEXT;
    v_content_hash TEXT;
    v_ip TEXT;
BEGIN
    -- Sesion / tenant
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
    END IF;

    v_schema := public.resolve_active_clinic_schema();
    IF v_schema IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin clinica activa');
    END IF;

    -- Validaciones basicas
    IF p_signature_data IS NULL OR p_signature_data = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'La firma es obligatoria');
    END IF;
    IF p_signer_full_name IS NULL OR length(trim(p_signer_full_name)) < 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nombre del firmante requerido');
    END IF;

    -- Recuperar plantilla (debe ser audience='patient')
    SELECT id, document_type, version, title, content, is_active, audience, treatment_type
    INTO v_template
    FROM public.legal_documents
    WHERE id = p_template_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plantilla no encontrada');
    END IF;
    IF v_template.audience <> 'patient' THEN
        RETURN jsonb_build_object('success', false, 'error', 'La plantilla no es de paciente');
    END IF;
    IF NOT v_template.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'La plantilla esta desactivada');
    END IF;

    -- Hashes
    v_signature_hash := encode(sha256(p_signature_data::bytea), 'hex');
    v_content_hash := encode(sha256(v_template.content::bytea), 'hex');

    -- IP del cliente (si disponible)
    BEGIN
        v_ip := host(inet_client_addr());
    EXCEPTION WHEN OTHERS THEN
        v_ip := NULL;
    END;

    v_consent_id := gen_random_uuid();

    EXECUTE format($sql$
        INSERT INTO %I.patient_consents (
            id,
            patient_id,
            template_id,
            template_document_type,
            template_version,
            template_title,
            template_content_snapshot,
            template_content_hash,
            treatment_id,
            treatment_type,
            signer_role,
            signer_full_name,
            signer_document,
            signer_relationship,
            signature_data,
            signature_hash,
            collection_method,
            device_type,
            ip_address,
            user_agent,
            collected_by_user_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
    $sql$, v_schema)
    USING
        v_consent_id,
        p_patient_id,
        v_template.id,
        v_template.document_type,
        v_template.version,
        v_template.title,
        v_template.content,
        v_content_hash,
        p_treatment_id,
        v_template.treatment_type,
        p_signer_role,
        trim(p_signer_full_name),
        p_signer_document,
        p_signer_relationship,
        p_signature_data,
        v_signature_hash,
        p_collection_method,
        p_device_type,
        v_ip,
        p_user_agent,
        v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'consent_id', v_consent_id,
        'template_id', v_template.id,
        'template_title', v_template.title,
        'signature_hash', v_signature_hash,
        'content_hash', v_content_hash
    );
END;
$$;

-- ============================================================================
-- get_patient_pending_consents
-- Plantillas activas para pacientes que el paciente AUN NO ha firmado.
-- Filtra por:
--   - audience='patient' AND is_active=TRUE
--   - clinic_id IS NULL  (plantilla global)
--     OR clinic_id = clinica_actual  (plantilla propia)
--   - Si p_treatment_id != NULL, incluye plantillas con treatment_type
--     coincidente con el tratamiento (clinical_treatment).
--   - Excluye las que ya tiene firmadas (status='active') para esa version.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_patient_pending_consents(
    p_patient_id UUID,
    p_treatment_id UUID DEFAULT NULL,
    p_treatment_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_clinic_id UUID;
    v_schema TEXT;
    v_pending JSONB;
    v_signed_template_ids UUID[];
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::UUID;
        v_clinic_id := current_setting('app.current_clinic_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NULL OR v_clinic_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
    END IF;

    v_schema := public.resolve_active_clinic_schema();
    IF v_schema IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin clinica activa');
    END IF;

    -- IDs de plantillas ya firmadas (estado active) por este paciente
    EXECUTE format($sql$
        SELECT COALESCE(array_agg(DISTINCT template_id), ARRAY[]::UUID[])
        FROM %I.patient_consents
        WHERE patient_id = $1 AND status = 'active'
    $sql$, v_schema)
    INTO v_signed_template_ids
    USING p_patient_id;

    -- Plantillas pendientes
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ld.id,
        'document_type', ld.document_type,
        'version', ld.version,
        'title', ld.title,
        'treatment_type', ld.treatment_type,
        'requires_signature', ld.requires_signature,
        'is_clinic_specific', (ld.clinic_id IS NOT NULL)
    ) ORDER BY
        CASE ld.document_type
            WHEN 'rgpd_patient' THEN 1
            WHEN 'clinical_general' THEN 2
            WHEN 'clinical_treatment' THEN 3
            ELSE 99
        END,
        ld.title), '[]'::jsonb)
    INTO v_pending
    FROM public.legal_documents ld
    WHERE ld.audience = 'patient'
      AND ld.is_active = TRUE
      AND (ld.clinic_id IS NULL OR ld.clinic_id = v_clinic_id)
      AND NOT (ld.id = ANY(v_signed_template_ids))
      -- Si se pasa treatment_type, incluye solo las clinical_treatment de ese tipo o las generales
      AND (
          p_treatment_type IS NULL
          OR ld.document_type <> 'clinical_treatment'
          OR ld.treatment_type IS NULL
          OR ld.treatment_type = p_treatment_type
      );

    RETURN jsonb_build_object(
        'success', true,
        'patient_id', p_patient_id,
        'treatment_id', p_treatment_id,
        'pending_consents', v_pending
    );
END;
$$;

-- ============================================================================
-- get_patient_consents_history
-- Historial de consentimientos firmados (y revocados) del paciente.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_patient_consents_history(
    p_patient_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_schema TEXT;
    v_history JSONB;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
    END IF;

    v_schema := public.resolve_active_clinic_schema();
    IF v_schema IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin clinica activa');
    END IF;

    EXECUTE format($sql$
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', id,
            'template_id', template_id,
            'template_document_type', template_document_type,
            'template_version', template_version,
            'template_title', template_title,
            'treatment_id', treatment_id,
            'treatment_type', treatment_type,
            'signer_role', signer_role,
            'signer_full_name', signer_full_name,
            'signer_document', signer_document,
            'signer_relationship', signer_relationship,
            'signature_hash', signature_hash,
            'content_hash', template_content_hash,
            'collection_method', collection_method,
            'device_type', device_type,
            'status', status,
            'revoked_at', revoked_at,
            'revocation_reason', revocation_reason,
            'signed_at', signed_at
        ) ORDER BY signed_at DESC), '[]'::jsonb)
        FROM %I.patient_consents
        WHERE patient_id = $1
    $sql$, v_schema)
    INTO v_history
    USING p_patient_id;

    RETURN jsonb_build_object(
        'success', true,
        'patient_id', p_patient_id,
        'consents', v_history
    );
END;
$$;

-- ============================================================================
-- get_patient_consent_detail
-- Detalle completo de un consentimiento concreto, incluyendo la firma
-- y el snapshot del contenido. Para visualizacion / generacion de PDF.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_patient_consent_detail(
    p_consent_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_schema TEXT;
    v_detail JSONB;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
    END IF;

    v_schema := public.resolve_active_clinic_schema();
    IF v_schema IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin clinica activa');
    END IF;

    EXECUTE format($sql$
        SELECT to_jsonb(c) FROM %I.patient_consents c WHERE c.id = $1
    $sql$, v_schema)
    INTO v_detail
    USING p_consent_id;

    IF v_detail IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No encontrado');
    END IF;

    RETURN jsonb_build_object('success', true, 'consent', v_detail);
END;
$$;

-- ============================================================================
-- create_signature_token
-- Genera un token UUID para firma remota desde movil. La clinica envia el
-- token al paciente (QR/SMS/WhatsApp/email) y el paciente lo abre en
-- /firma/<token> sin necesidad de login.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_signature_token(
    p_patient_id UUID,
    p_template_ids UUID[],
    p_treatment_id UUID DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT 48
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_clinic_id UUID;
    v_schema TEXT;
    v_token UUID;
    v_expires TIMESTAMPTZ;
    v_template_count INTEGER;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::UUID;
        v_clinic_id := current_setting('app.current_clinic_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NULL OR v_clinic_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
    END IF;

    v_schema := public.resolve_active_clinic_schema();
    IF v_schema IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin clinica activa');
    END IF;

    IF p_template_ids IS NULL OR array_length(p_template_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Debe indicar al menos una plantilla');
    END IF;

    -- Validar que las plantillas existen, son de paciente y estan activas
    SELECT count(*) INTO v_template_count
    FROM public.legal_documents
    WHERE id = ANY(p_template_ids)
      AND audience = 'patient'
      AND is_active = TRUE
      AND (clinic_id IS NULL OR clinic_id = v_clinic_id);

    IF v_template_count <> array_length(p_template_ids, 1) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Una o mas plantillas no son validas');
    END IF;

    IF p_expires_hours IS NULL OR p_expires_hours < 1 THEN
        p_expires_hours := 48;
    END IF;
    IF p_expires_hours > 720 THEN -- max 30 dias
        p_expires_hours := 720;
    END IF;

    v_token := gen_random_uuid();
    v_expires := NOW() + (p_expires_hours || ' hours')::INTERVAL;

    EXECUTE format($sql$
        INSERT INTO %I.signature_tokens (
            token,
            patient_id,
            template_ids,
            treatment_id,
            created_by_user_id,
            expires_at,
            status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    $sql$, v_schema)
    USING v_token, p_patient_id, p_template_ids, p_treatment_id, v_user_id, v_expires;

    RETURN jsonb_build_object(
        'success', true,
        'token', v_token,
        'expires_at', v_expires,
        'expires_hours', p_expires_hours
    );
END;
$$;

-- ============================================================================
-- _find_signature_token (helper interno)
-- Busca un token en TODOS los schemas de clinicas y devuelve schema + datos.
-- Usado por las RPCs PUBLIC de firma remota.
-- ============================================================================
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
        SELECT id, name, schema_name FROM public.clinics WHERE schema_name IS NOT NULL
    LOOP
        BEGIN
            EXECUTE format($sql$
                SELECT patient_id, template_ids, treatment_id, expires_at, used_at, status
                FROM %I.signature_tokens
                WHERE token = $1
                LIMIT 1
            $sql$, v_clinic.schema_name)
            INTO v_found
            USING p_token;
        EXCEPTION WHEN OTHERS THEN
            CONTINUE;
        END;

        IF v_found IS NOT NULL AND v_found.patient_id IS NOT NULL THEN
            schema_name := v_clinic.schema_name;
            clinic_id := v_clinic.id;
            clinic_name := v_clinic.name;
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

-- ============================================================================
-- validate_signature_token (PUBLIC - sin sesion)
-- El paciente abre /firma/<token>. Devuelve si el token es valido y los
-- datos minimos: nombre clinica, nombre paciente, plantillas (id+title+content).
-- NUNCA devuelve historial clinico ni datos sensibles del paciente.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_signature_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tok RECORD;
    v_patient_name TEXT;
    v_templates JSONB;
BEGIN
    IF p_token IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token requerido');
    END IF;

    -- Buscar token en cualquier clinica
    SELECT * INTO v_tok
    FROM public._find_signature_token(p_token)
    LIMIT 1;

    IF v_tok IS NULL OR v_tok.patient_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token no encontrado', 'state', 'invalid');
    END IF;

    -- Estado del token
    IF v_tok.status = 'used' OR v_tok.used_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este enlace ya ha sido utilizado', 'state', 'used');
    END IF;
    IF v_tok.status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Enlace cancelado', 'state', 'cancelled');
    END IF;
    IF v_tok.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'El enlace ha caducado', 'state', 'expired');
    END IF;

    -- Datos minimos del paciente: solo nombre y apellido
    EXECUTE format($sql$
        SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
        FROM %I.patients WHERE id = $1
    $sql$, v_tok.schema_name)
    INTO v_patient_name
    USING v_tok.patient_id;

    -- Plantillas
    SELECT jsonb_agg(jsonb_build_object(
        'id', ld.id,
        'document_type', ld.document_type,
        'version', ld.version,
        'title', ld.title,
        'content', ld.content,
        'treatment_type', ld.treatment_type,
        'requires_signature', ld.requires_signature
    ) ORDER BY
        CASE ld.document_type
            WHEN 'rgpd_patient' THEN 1
            WHEN 'clinical_general' THEN 2
            WHEN 'clinical_treatment' THEN 3
            ELSE 99
        END)
    INTO v_templates
    FROM public.legal_documents ld
    WHERE ld.id = ANY(v_tok.template_ids)
      AND ld.is_active = TRUE;

    RETURN jsonb_build_object(
        'success', true,
        'state', 'valid',
        'clinic_name', v_tok.clinic_name,
        'patient_name', trim(v_patient_name),
        'expires_at', v_tok.expires_at,
        'templates', COALESCE(v_templates, '[]'::jsonb)
    );
END;
$$;

-- ============================================================================
-- submit_signature_via_token (PUBLIC - sin sesion)
-- El paciente firma cada plantilla en su movil y envia un array:
-- p_signatures = [
--   { template_id, signature_data, signer_full_name, signer_document?,
--     signer_role?, signer_relationship? }
-- ]
-- Crea filas en patient_consents y marca el token como usado.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_signature_via_token(
    p_token UUID,
    p_signatures JSONB,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tok RECORD;
    v_sig JSONB;
    v_template RECORD;
    v_consent_id UUID;
    v_consent_ids UUID[] := ARRAY[]::UUID[];
    v_signature_hash TEXT;
    v_content_hash TEXT;
    v_full_name TEXT;
    v_doc TEXT;
    v_role TEXT;
    v_relationship TEXT;
    v_template_id UUID;
    v_signature_data TEXT;
    v_ip TEXT;
BEGIN
    IF p_token IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token requerido');
    END IF;
    IF p_signatures IS NULL OR jsonb_typeof(p_signatures) <> 'array' OR jsonb_array_length(p_signatures) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se han recibido firmas');
    END IF;

    -- Buscar y validar token
    SELECT * INTO v_tok
    FROM public._find_signature_token(p_token)
    LIMIT 1;

    IF v_tok IS NULL OR v_tok.patient_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token no encontrado');
    END IF;
    IF v_tok.status <> 'pending' OR v_tok.used_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token ya usado o cancelado');
    END IF;
    IF v_tok.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token caducado');
    END IF;

    BEGIN
        v_ip := host(inet_client_addr());
    EXCEPTION WHEN OTHERS THEN
        v_ip := NULL;
    END;

    -- Iterar firmas
    FOR v_sig IN SELECT * FROM jsonb_array_elements(p_signatures)
    LOOP
        v_template_id := (v_sig->>'template_id')::UUID;
        v_signature_data := v_sig->>'signature_data';
        v_full_name := COALESCE(v_sig->>'signer_full_name', '');
        v_doc := v_sig->>'signer_document';
        v_role := COALESCE(v_sig->>'signer_role', 'patient');
        v_relationship := v_sig->>'signer_relationship';

        IF v_template_id IS NULL OR v_signature_data IS NULL OR v_signature_data = '' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Firma o plantilla incompletas');
        END IF;
        IF length(trim(v_full_name)) < 3 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Nombre del firmante requerido');
        END IF;

        -- La plantilla debe estar entre las del token
        IF NOT (v_template_id = ANY(v_tok.template_ids)) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Plantilla fuera del token');
        END IF;

        SELECT id, document_type, version, title, content, treatment_type
        INTO v_template
        FROM public.legal_documents
        WHERE id = v_template_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Plantilla no encontrada');
        END IF;

        v_signature_hash := encode(sha256(v_signature_data::bytea), 'hex');
        v_content_hash := encode(sha256(v_template.content::bytea), 'hex');
        v_consent_id := gen_random_uuid();

        EXECUTE format($sql$
            INSERT INTO %I.patient_consents (
                id,
                patient_id,
                template_id,
                template_document_type,
                template_version,
                template_title,
                template_content_snapshot,
                template_content_hash,
                treatment_id,
                treatment_type,
                signer_role,
                signer_full_name,
                signer_document,
                signer_relationship,
                signature_data,
                signature_hash,
                collection_method,
                device_type,
                ip_address,
                user_agent,
                collected_by_user_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, 'remote_link', 'mobile', $17, $18, NULL
            )
        $sql$, v_tok.schema_name)
        USING
            v_consent_id,
            v_tok.patient_id,
            v_template.id,
            v_template.document_type,
            v_template.version,
            v_template.title,
            v_template.content,
            v_content_hash,
            v_tok.treatment_id,
            v_template.treatment_type,
            v_role,
            trim(v_full_name),
            v_doc,
            v_relationship,
            v_signature_data,
            v_signature_hash,
            v_ip,
            p_user_agent;

        v_consent_ids := array_append(v_consent_ids, v_consent_id);
    END LOOP;

    -- Marcar token como usado
    EXECUTE format($sql$
        UPDATE %I.signature_tokens
        SET status = 'used',
            used_at = NOW(),
            used_from_ip = $1,
            used_user_agent = $2,
            resulting_consent_ids = $3
        WHERE token = $4
    $sql$, v_tok.schema_name)
    USING v_ip, p_user_agent, v_consent_ids, p_token;

    RETURN jsonb_build_object(
        'success', true,
        'consents_created', array_length(v_consent_ids, 1),
        'consent_ids', to_jsonb(v_consent_ids)
    );
END;
$$;

-- ============================================================================
-- revoke_patient_consent
-- Revoca un consentimiento previamente firmado. No se borra: status='revoked'.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.revoke_patient_consent(
    p_consent_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_schema TEXT;
    v_updated INTEGER;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
    END IF;

    v_schema := public.resolve_active_clinic_schema();
    IF v_schema IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin clinica activa');
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Indique el motivo de la revocacion');
    END IF;

    EXECUTE format($sql$
        UPDATE %I.patient_consents
        SET status = 'revoked',
            revoked_at = NOW(),
            revoked_by_user_id = $1,
            revocation_reason = $2
        WHERE id = $3 AND status = 'active'
    $sql$, v_schema)
    USING v_user_id, trim(p_reason), p_consent_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se ha podido revocar (no existe o ya estaba revocado)');
    END IF;

    RETURN jsonb_build_object('success', true, 'consent_id', p_consent_id);
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
-- la92_user es el rol que PostgREST usa para sesiones autenticadas
GRANT EXECUTE ON FUNCTION public.resolve_active_clinic_schema() TO la92_user;
GRANT EXECUTE ON FUNCTION public.record_patient_consent(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_patient_pending_consents(UUID, UUID, TEXT) TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_patient_consents_history(UUID) TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_patient_consent_detail(UUID) TO la92_user;
GRANT EXECUTE ON FUNCTION public.create_signature_token(UUID, UUID[], UUID, INTEGER) TO la92_user;
GRANT EXECUTE ON FUNCTION public.revoke_patient_consent(UUID, TEXT) TO la92_user;

-- PUBLIC: firma remota desde movil sin login
-- Concedemos a anon (rol publico de PostgREST). Si en este despliegue el rol
-- anonimo se llama distinto, ajustar tras revisar postgrest.conf.
GRANT EXECUTE ON FUNCTION public.validate_signature_token(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_signature_via_token(UUID, JSONB, TEXT) TO PUBLIC;

-- _find_signature_token es helper interno; no se concede a PUBLIC.
-- Las RPC PUBLIC son SECURITY DEFINER asi que pueden invocarlo.

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
