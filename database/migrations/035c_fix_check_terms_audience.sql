-- Migration 035c: check_terms_acceptance debe filtrar por audience='user'
-- Date: 2026-05-04
--
-- Bug detectado tras deploy: la 033 introdujo documentos con audience='patient'.
-- check_terms_acceptance no filtra por audience, asi que al loguearse un usuario
-- (operador/recepcion/dentista) le pide aceptar plantillas de paciente con
-- requires_signature=TRUE, lo que rompe el flujo de login porque
-- TermsAcceptanceDialog no captura firma.
--
-- Fix: solo devolver documentos audience='user' al chequear aceptacion del usuario.

BEGIN;

CREATE OR REPLACE FUNCTION public.check_terms_acceptance(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_needs_acceptance BOOLEAN;
    v_pending_docs JSONB;
BEGIN
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
      AND ld.audience = 'user'  -- <-- FIX: solo documentos para usuarios
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
$function$;

NOTIFY pgrst, 'reload schema';

COMMIT;
