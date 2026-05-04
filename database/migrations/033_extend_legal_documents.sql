-- Migration 033: Extender public.legal_documents para consentimientos a pacientes
-- Date: 2026-05-04
--
-- Razon: La 026 introdujo legal_documents para usuarios del sistema (terms/privacy/rgpd/data_processing).
-- Ahora necesitamos reusar la misma estructura para CONSENTIMIENTOS DE PACIENTES:
--   a) RGPD del paciente
--   b) Consentimiento clinico general
--   c) Consentimiento clinico por tratamiento (endodoncia, implantes, ortodoncia, etc.)
--
-- Cambios:
--   1. Anadir clinic_id (NULL = plantilla global de Clinident; UUID = plantilla propia de la clinica)
--   2. Anadir treatment_type (NULL = no aplica; texto = tratamiento al que se asocia)
--   3. Anadir audience ('user' = trabajador del sistema; 'patient' = paciente firma)
--   4. Ampliar el CHECK de document_type para los nuevos tipos
--   5. Backfill: filas existentes son audience='user'

BEGIN;

-- 1. clinic_id (nullable -> plantilla global cuando es NULL)
ALTER TABLE public.legal_documents
    ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;

-- 2. treatment_type para consentimientos especificos
ALTER TABLE public.legal_documents
    ADD COLUMN IF NOT EXISTS treatment_type TEXT;

-- 3. audience: para quien es el documento
ALTER TABLE public.legal_documents
    ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'user'
        CHECK (audience IN ('user', 'patient'));

-- 4. Ampliar CHECK de document_type. Drop+Add porque postgres no permite alterar CHECK in-place.
ALTER TABLE public.legal_documents
    DROP CONSTRAINT IF EXISTS legal_documents_document_type_check;

ALTER TABLE public.legal_documents
    ADD CONSTRAINT legal_documents_document_type_check CHECK (
        document_type IN (
            -- Originales (audience='user')
            'terms',
            'privacy',
            'rgpd',
            'data_processing',
            -- Nuevos (audience='patient')
            'rgpd_patient',           -- RGPD para paciente
            'clinical_general',       -- Consentimiento clinico general
            'clinical_treatment'      -- Consentimiento por tratamiento especifico
        )
    );

-- 5. Backfill: las filas previas son del sistema (usuarios), no de pacientes
UPDATE public.legal_documents
SET audience = 'user'
WHERE audience IS NULL OR audience = '';

-- Indices utiles
CREATE INDEX IF NOT EXISTS idx_legal_documents_clinic ON public.legal_documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_audience ON public.legal_documents(audience);
CREATE INDEX IF NOT EXISTS idx_legal_documents_treatment ON public.legal_documents(treatment_type) WHERE treatment_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_legal_documents_active_audience
    ON public.legal_documents(audience, is_active) WHERE is_active = TRUE;

-- Plantillas globales por defecto para pacientes (clinic_id NULL = aplicable a todas las clinicas)
-- La clinica puede crear sus propias versiones con clinic_id=su_id si quiere personalizar.
INSERT INTO public.legal_documents (document_type, version, title, content, audience, is_active, requires_signature)
VALUES
(
    'rgpd_patient',
    '1.0',
    'Consentimiento RGPD - Tratamiento de datos del paciente',
    E'# CONSENTIMIENTO INFORMADO PARA EL TRATAMIENTO DE DATOS PERSONALES

De conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Organica 3/2018 (LOPDGDD), le informamos:

## RESPONSABLE DEL TRATAMIENTO
La clinica dental que le atiende es responsable del tratamiento de sus datos personales y de salud.

## FINALIDAD
Sus datos seran tratados para:
- Prestacion de servicios odontologicos y elaboracion de su historia clinica.
- Gestion de citas y comunicaciones relativas a su tratamiento.
- Facturacion y obligaciones contables/fiscales.
- Cumplimiento de obligaciones sanitarias legales.

## BASE LEGAL
- Ejecucion del contrato de servicios sanitarios.
- Consentimiento explicito para el tratamiento de datos de salud (categoria especial, art. 9.2 RGPD).
- Obligaciones legales sanitarias y fiscales.

## CONSERVACION
Sus datos clinicos se conservaran durante el plazo legalmente establecido (minimo 5 anios desde la ultima asistencia, segun la Ley 41/2002 de autonomia del paciente).

## DESTINATARIOS
No se cederan datos a terceros salvo obligacion legal o cuando sea necesario para la prestacion del servicio (laboratorios, mutuas, aseguradoras autorizadas por usted).

## DERECHOS
Puede ejercer sus derechos de acceso, rectificacion, supresion, oposicion, limitacion y portabilidad dirigiendose a la clinica. Tambien puede reclamar ante la Agencia Espaniola de Proteccion de Datos (www.aepd.es).

## DECLARO
Que he sido informado/a y CONSIENTO el tratamiento de mis datos personales y de salud para las finalidades descritas.

---
Version: 1.0',
    'patient',
    TRUE,
    TRUE
),
(
    'clinical_general',
    '1.0',
    'Consentimiento clinico general',
    E'# CONSENTIMIENTO INFORMADO CLINICO GENERAL

## DECLARACION DEL PACIENTE
Declaro que he sido informado/a por el equipo odontologico sobre:

1. **Estado de mi salud bucodental** y los hallazgos del diagnostico realizado.

2. **El plan de tratamiento propuesto**, sus objetivos y alternativas.

3. **Los riesgos generales** asociados a los procedimientos odontologicos:
   - Posibles molestias post-operatorias.
   - Reacciones alergicas a anestesicos o materiales.
   - Necesidad eventual de tratamientos adicionales no previstos.

4. **Los riesgos particulares** segun mi caso personal y antecedentes medicos.

5. **El pronostico** y la posible evolucion con o sin tratamiento.

## ANTECEDENTES MEDICOS
Confirmo haber facilitado a la clinica informacion veraz sobre:
- Alergias conocidas (medicamentos, latex, anestesicos).
- Medicacion actual.
- Enfermedades sistemicas relevantes (cardiovasculares, hematologicas, endocrinas, infecciosas).
- Embarazo o lactancia, si procede.

## CONSENTIMIENTO
Otorgo libremente mi consentimiento para que el equipo odontologico realice las exploraciones, pruebas diagnosticas y tratamientos descritos.

Entiendo que puedo revocar este consentimiento en cualquier momento por escrito sin que ello afecte a la atencion ya recibida.

---
Version: 1.0',
    'patient',
    TRUE,
    TRUE
)
ON CONFLICT (document_type, version) DO NOTHING;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
