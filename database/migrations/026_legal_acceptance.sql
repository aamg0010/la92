-- Migration 026: Legal acceptance and electronic signatures
-- Date: 2026-04-25

-- Table to store legal document templates
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy', 'rgpd', 'data_processing')),
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    requires_signature BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_type, version)
);

-- Table to store user/clinic acceptances
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    clinic_id UUID REFERENCES public.clinics(id),
    document_id UUID NOT NULL REFERENCES public.legal_documents(id),
    document_type TEXT NOT NULL,
    document_version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    signature_data TEXT, -- Base64 encoded signature image
    signature_hash TEXT, -- SHA256 hash for verification
    full_name TEXT NOT NULL,
    document_number TEXT,
    acceptance_method TEXT DEFAULT 'electronic' CHECK (acceptance_method IN ('electronic', 'manual', 'api')),
    pdf_document_url TEXT, -- URL to generated PDF
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add field to clinics to track if terms were accepted
ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_accepted_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS rgpd_accepted_at TIMESTAMPTZ;

-- Add field to users to track individual acceptance
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS must_accept_terms BOOLEAN DEFAULT TRUE;

-- Insert default legal documents (Spanish versions)
INSERT INTO public.legal_documents (document_type, version, title, content, is_active, requires_signature)
VALUES
(
    'terms',
    '1.0',
    'Términos y Condiciones de Uso',
    E'# TÉRMINOS Y CONDICIONES DE USO DE CLINIDENT

## 1. OBJETO Y ACEPTACIÓN

Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma CLINIDENT (en adelante, "la Plataforma"), un software de gestión integral para clínicas odontológicas desarrollado por TRY COMPANY.

La utilización de la Plataforma atribuye la condición de Usuario e implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en estos Términos y Condiciones.

## 2. DESCRIPCIÓN DEL SERVICIO

CLINIDENT es una plataforma SaaS (Software as a Service) que proporciona herramientas para:
- Gestión de pacientes e historias clínicas
- Agenda y citas
- Facturación y cobros
- Presupuestos y tratamientos
- Odontograma digital
- Gestión de inventario
- Control de egresos y finanzas
- Generación de informes RIPS

## 3. CONDICIONES DE ACCESO

3.1. El acceso a la Plataforma requiere una licencia válida.
3.2. El Usuario es responsable de mantener la confidencialidad de sus credenciales.
3.3. Cada usuario debe corresponder a una persona física identificable.

## 4. OBLIGACIONES DEL USUARIO

El Usuario se compromete a:
- Utilizar la Plataforma conforme a la ley y estos Términos
- No introducir datos falsos o de terceros sin autorización
- Mantener actualizados sus datos de contacto
- No compartir credenciales de acceso
- Notificar cualquier uso no autorizado de su cuenta

## 5. PROPIEDAD INTELECTUAL

Todos los derechos de propiedad intelectual sobre la Plataforma pertenecen a TRY COMPANY. Se prohíbe la reproducción, distribución o modificación sin autorización expresa.

## 6. PROTECCIÓN DE DATOS

El tratamiento de datos personales se realiza conforme al Reglamento General de Protección de Datos (RGPD) y la normativa aplicable. Ver Política de Privacidad para más detalles.

## 7. LIMITACIÓN DE RESPONSABILIDAD

TRY COMPANY no será responsable de:
- Interrupciones del servicio por causas ajenas
- Pérdida de datos por uso indebido del Usuario
- Daños derivados de virus o ataques informáticos

## 8. MODIFICACIONES

TRY COMPANY se reserva el derecho de modificar estos Términos, notificando a los Usuarios con antelación razonable.

## 9. LEGISLACIÓN APLICABLE

Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Madrid.

---
Última actualización: Abril 2026
Versión: 1.0',
    TRUE,
    TRUE
),
(
    'privacy',
    '1.0',
    'Política de Privacidad',
    E'# POLÍTICA DE PRIVACIDAD DE CLINIDENT

## 1. RESPONSABLE DEL TRATAMIENTO

**Identidad:** TRY COMPANY S.L.
**Dirección:** [Dirección fiscal]
**Email:** privacy@trycompany.es
**Delegado de Protección de Datos:** dpo@trycompany.es

## 2. DATOS QUE RECOPILAMOS

### 2.1. Datos del Usuario (personal de la clínica)
- Nombre y apellidos
- Email
- Teléfono
- Rol y especialidad

### 2.2. Datos de Pacientes (introducidos por la clínica)
- Datos identificativos
- Datos de salud (historia clínica, tratamientos)
- Imágenes odontológicas

## 3. FINALIDAD DEL TRATAMIENTO

Los datos se tratan para:
- Prestación del servicio de gestión clínica
- Facturación y administración
- Comunicaciones sobre el servicio
- Cumplimiento de obligaciones legales

## 4. BASE LEGAL

- **Ejecución del contrato:** Prestación del servicio contratado
- **Obligación legal:** Cumplimiento normativo sanitario y fiscal
- **Consentimiento:** Para comunicaciones comerciales

## 5. DESTINATARIOS

Los datos pueden comunicarse a:
- Autoridades sanitarias (RIPS, requisitos legales)
- Proveedores tecnológicos (hosting, email)
- Entidades financieras (para pagos)

## 6. TRANSFERENCIAS INTERNACIONALES

Los datos se almacenan en servidores ubicados en la Unión Europea.

## 7. CONSERVACIÓN

- **Datos de usuarios:** Durante la vigencia del contrato + 5 años
- **Datos de pacientes:** Según normativa sanitaria aplicable (mínimo 5 años)
- **Datos fiscales:** 4 años según normativa tributaria

## 8. DERECHOS

Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a privacy@trycompany.es

## 9. SEGURIDAD

Implementamos medidas técnicas y organizativas:
- Cifrado de datos en tránsito y reposo
- Control de acceso por roles
- Copias de seguridad periódicas
- Auditorías de seguridad

---
Última actualización: Abril 2026
Versión: 1.0',
    TRUE,
    TRUE
),
(
    'rgpd',
    '1.0',
    'Consentimiento RGPD - Tratamiento de Datos',
    E'# CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES

De conformidad con el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (RGPD), y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD):

## DECLARO:

1. Que he sido informado/a de forma clara sobre el tratamiento de mis datos personales.

2. Que conozco la identidad del Responsable del Tratamiento (TRY COMPANY S.L.) y sus datos de contacto.

3. Que entiendo las finalidades del tratamiento de mis datos.

4. Que conozco mis derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento, portabilidad y a no ser objeto de decisiones automatizadas.

5. Que puedo ejercer estos derechos en cualquier momento contactando con privacy@trycompany.es

## CONSIENTO EXPRESAMENTE:

☑ El tratamiento de mis datos personales para la prestación del servicio CLINIDENT.

☑ El acceso a datos de salud de pacientes en el ejercicio de mis funciones profesionales dentro de la plataforma.

☑ La generación y almacenamiento de registros de actividad para fines de auditoría y seguridad.

## INFORMACIÓN ADICIONAL

Este consentimiento puede ser revocado en cualquier momento, sin que ello afecte a la licitud del tratamiento basado en el consentimiento previo a su retirada.

La retirada del consentimiento implicará la imposibilidad de continuar utilizando los servicios de CLINIDENT.

---
Última actualización: Abril 2026
Versión: 1.0',
    TRUE,
    TRUE
),
(
    'data_processing',
    '1.0',
    'Contrato de Encargado de Tratamiento',
    E'# CONTRATO DE ENCARGADO DE TRATAMIENTO

En cumplimiento del artículo 28 del Reglamento General de Protección de Datos (RGPD):

## PARTES

**RESPONSABLE DEL TRATAMIENTO:** La clínica odontológica que contrata los servicios (en adelante, "la Clínica")

**ENCARGADO DEL TRATAMIENTO:** TRY COMPANY S.L., como proveedor de la plataforma CLINIDENT

## OBJETO

El presente contrato regula el tratamiento de datos personales que TRY COMPANY realizará por cuenta de la Clínica en el marco de la prestación del servicio CLINIDENT.

## OBLIGACIONES DEL ENCARGADO

TRY COMPANY se compromete a:

1. Tratar los datos únicamente siguiendo instrucciones documentadas de la Clínica.

2. Garantizar que el personal autorizado se ha comprometido a respetar la confidencialidad.

3. Tomar las medidas de seguridad técnicas y organizativas apropiadas.

4. No recurrir a otro encargado sin autorización previa por escrito.

5. Asistir a la Clínica en el cumplimiento de sus obligaciones frente a los interesados.

6. Suprimir o devolver todos los datos al finalizar la prestación del servicio.

7. Poner a disposición de la Clínica toda la información necesaria para demostrar el cumplimiento.

## SUBENCARGADOS AUTORIZADOS

Se autoriza el uso de los siguientes subencargados:
- Proveedor de hosting: [Nombre del proveedor]
- Servicios de backup: [Nombre del proveedor]

## DURACIÓN

Este contrato tiene la misma duración que el contrato de servicios de CLINIDENT.

---
Última actualización: Abril 2026
Versión: 1.0',
    TRUE,
    TRUE
)
ON CONFLICT (document_type, version) DO NOTHING;

-- Function to check if user needs to accept terms
CREATE OR REPLACE FUNCTION public.check_terms_acceptance(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_needs_acceptance BOOLEAN;
    v_pending_docs JSONB;
BEGIN
    -- Get active documents that user hasn't accepted
    SELECT jsonb_agg(jsonb_build_object(
        'id', ld.id,
        'document_type', ld.document_type,
        'version', ld.version,
        'title', ld.title,
        'requires_signature', ld.requires_signature
    ))
    INTO v_pending_docs
    FROM public.legal_documents ld
    WHERE ld.is_active = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM public.legal_acceptances la
        WHERE la.user_id = p_user_id
        AND la.document_id = ld.id
    );

    v_needs_acceptance := (v_pending_docs IS NOT NULL AND jsonb_array_length(v_pending_docs) > 0);

    RETURN jsonb_build_object(
        'needs_acceptance', v_needs_acceptance,
        'pending_documents', COALESCE(v_pending_docs, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept legal document with signature
CREATE OR REPLACE FUNCTION public.accept_legal_document(
    p_document_id UUID,
    p_full_name TEXT,
    p_document_number TEXT DEFAULT NULL,
    p_signature_data TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_clinic_id UUID;
    v_document RECORD;
    v_acceptance_id UUID;
    v_signature_hash TEXT;
BEGIN
    -- Get current user
    v_user_id := current_setting('app.current_user_id', true)::UUID;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user's clinic
    SELECT clinic_id INTO v_clinic_id
    FROM public.clinic_users
    WHERE user_id = v_user_id AND is_active = TRUE
    LIMIT 1;

    -- Get document info
    SELECT * INTO v_document
    FROM public.legal_documents
    WHERE id = p_document_id AND is_active = TRUE;

    IF v_document IS NULL THEN
        RAISE EXCEPTION 'Document not found or inactive';
    END IF;

    -- Check if signature is required but not provided
    IF v_document.requires_signature AND (p_signature_data IS NULL OR p_signature_data = '') THEN
        RAISE EXCEPTION 'Signature is required for this document';
    END IF;

    -- Generate signature hash if signature provided
    IF p_signature_data IS NOT NULL THEN
        v_signature_hash := encode(sha256(p_signature_data::bytea), 'hex');
    END IF;

    -- Check if already accepted
    IF EXISTS (
        SELECT 1 FROM public.legal_acceptances
        WHERE user_id = v_user_id AND document_id = p_document_id
    ) THEN
        RAISE EXCEPTION 'Document already accepted';
    END IF;

    -- Insert acceptance
    INSERT INTO public.legal_acceptances (
        user_id,
        clinic_id,
        document_id,
        document_type,
        document_version,
        full_name,
        document_number,
        signature_data,
        signature_hash,
        ip_address,
        user_agent
    )
    VALUES (
        v_user_id,
        v_clinic_id,
        p_document_id,
        v_document.document_type,
        v_document.version,
        p_full_name,
        p_document_number,
        p_signature_data,
        v_signature_hash,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_acceptance_id;

    -- Update user's terms_accepted_at if this was terms document
    IF v_document.document_type = 'terms' THEN
        UPDATE public.users
        SET terms_accepted_at = NOW(), must_accept_terms = FALSE
        WHERE id = v_user_id;
    END IF;

    -- Update clinic's terms if applicable
    IF v_clinic_id IS NOT NULL AND v_document.document_type = 'terms' THEN
        UPDATE public.clinics
        SET terms_accepted_at = COALESCE(terms_accepted_at, NOW()),
            terms_accepted_by = COALESCE(terms_accepted_by, v_user_id)
        WHERE id = v_clinic_id;
    END IF;

    IF v_clinic_id IS NOT NULL AND v_document.document_type = 'rgpd' THEN
        UPDATE public.clinics
        SET rgpd_accepted_at = NOW()
        WHERE id = v_clinic_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'acceptance_id', v_acceptance_id,
        'document_type', v_document.document_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accepted documents
CREATE OR REPLACE FUNCTION public.get_my_legal_acceptances()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_agg(jsonb_build_object(
        'id', la.id,
        'document_type', la.document_type,
        'document_version', la.document_version,
        'title', ld.title,
        'accepted_at', la.accepted_at,
        'full_name', la.full_name,
        'has_signature', (la.signature_data IS NOT NULL),
        'signature_hash', la.signature_hash
    ) ORDER BY la.accepted_at DESC)
    INTO v_result
    FROM public.legal_acceptances la
    JOIN public.legal_documents ld ON ld.id = la.document_id
    WHERE la.user_id = v_user_id;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a specific acceptance with full details (for PDF generation)
CREATE OR REPLACE FUNCTION public.get_legal_acceptance_detail(p_acceptance_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_build_object(
        'id', la.id,
        'document_type', la.document_type,
        'document_version', la.document_version,
        'title', ld.title,
        'content', ld.content,
        'accepted_at', la.accepted_at,
        'full_name', la.full_name,
        'document_number', la.document_number,
        'signature_data', la.signature_data,
        'signature_hash', la.signature_hash,
        'ip_address', la.ip_address,
        'clinic_name', c.name
    )
    INTO v_result
    FROM public.legal_acceptances la
    JOIN public.legal_documents ld ON ld.id = la.document_id
    LEFT JOIN public.clinics c ON c.id = la.clinic_id
    WHERE la.id = p_acceptance_id AND la.user_id = v_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_terms_acceptance(UUID) TO la92_user;
GRANT EXECUTE ON FUNCTION public.accept_legal_document(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_my_legal_acceptances() TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_legal_acceptance_detail(UUID) TO la92_user;
GRANT SELECT ON public.legal_documents TO la92_user;
GRANT SELECT, INSERT ON public.legal_acceptances TO la92_user;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
