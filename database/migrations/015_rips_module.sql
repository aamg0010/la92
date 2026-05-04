-- =====================================================
-- MIGRATION 015: RIPS Module (Reportes IPS)
-- Resolucion 2275/2023 - Ministerio de Salud Colombia
-- =====================================================

-- =====================================================
-- TABLES FOR PUBLIC SCHEMA (Shared catalogs)
-- =====================================================

-- Catalogo de diagnosticos CIE-10
CREATE TABLE IF NOT EXISTS public.rips_diagnosis_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    chapter VARCHAR(5),
    group_code VARCHAR(5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalogo de servicios CUPS (Procedimientos)
CREATE TABLE IF NOT EXISTS public.rips_services_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    service_type VARCHAR(2) NOT NULL CHECK (service_type IN ('AC', 'AP', 'AM', 'AT')),
    -- AC = Consultas, AP = Procedimientos, AM = Medicamentos, AT = Otros servicios
    specialty VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para catalogos
CREATE INDEX IF NOT EXISTS idx_rips_diagnosis_code ON public.rips_diagnosis_catalog(code);
CREATE INDEX IF NOT EXISTS idx_rips_diagnosis_name ON public.rips_diagnosis_catalog(name);
CREATE INDEX IF NOT EXISTS idx_rips_services_code ON public.rips_services_catalog(code);
CREATE INDEX IF NOT EXISTS idx_rips_services_type ON public.rips_services_catalog(service_type);

-- Permisos catalogos
GRANT SELECT ON public.rips_diagnosis_catalog TO la92_user;
GRANT SELECT ON public.rips_services_catalog TO la92_user;

-- =====================================================
-- INSERT DEFAULT DENTAL SERVICES (CUPS)
-- =====================================================

INSERT INTO public.rips_services_catalog (code, name, service_type, specialty) VALUES
-- Consultas (AC)
('890201', 'Consulta de primera vez por odontologia general', 'AC', 'Odontologia'),
('890202', 'Consulta de control por odontologia general', 'AC', 'Odontologia'),
('890281', 'Consulta de primera vez por especialista en odontologia', 'AC', 'Odontologia'),
('890282', 'Consulta de control por especialista en odontologia', 'AC', 'Odontologia'),

-- Procedimientos (AP) - Profilaxis y prevencion
('997101', 'Aplicacion de sellantes de fotocurado', 'AP', 'Odontologia'),
('997102', 'Aplicacion topica de fluor', 'AP', 'Odontologia'),
('997103', 'Control de placa bacteriana', 'AP', 'Odontologia'),
('997310', 'Profilaxis dental (detartraje, supragingival)', 'AP', 'Odontologia'),

-- Procedimientos (AP) - Operatoria
('232101', 'Obturacion dental con amalgama (1 superficie)', 'AP', 'Odontologia'),
('232102', 'Obturacion dental con amalgama (2 superficies)', 'AP', 'Odontologia'),
('232103', 'Obturacion dental con amalgama (3 o mas superficies)', 'AP', 'Odontologia'),
('232201', 'Obturacion dental con resina (1 superficie)', 'AP', 'Odontologia'),
('232202', 'Obturacion dental con resina (2 superficies)', 'AP', 'Odontologia'),
('232203', 'Obturacion dental con resina (3 o mas superficies)', 'AP', 'Odontologia'),

-- Procedimientos (AP) - Endodoncia
('233101', 'Pulpotomia', 'AP', 'Endodoncia'),
('233201', 'Tratamiento de conducto diente unirradicular', 'AP', 'Endodoncia'),
('233202', 'Tratamiento de conducto diente birradicular', 'AP', 'Endodoncia'),
('233203', 'Tratamiento de conducto diente multirradicular', 'AP', 'Endodoncia'),

-- Procedimientos (AP) - Cirugia oral
('234101', 'Exodoncia de diente temporal', 'AP', 'Cirugia Oral'),
('234201', 'Exodoncia de diente permanente unirradicular', 'AP', 'Cirugia Oral'),
('234202', 'Exodoncia de diente permanente multirradicular', 'AP', 'Cirugia Oral'),
('234301', 'Exodoncia de diente incluido (cirugia)', 'AP', 'Cirugia Oral'),

-- Procedimientos (AP) - Periodoncia
('235101', 'Raspado y alisado radicular (por cuadrante)', 'AP', 'Periodoncia'),
('235201', 'Cirugia periodontal (colgajo por sextante)', 'AP', 'Periodoncia'),

-- Procedimientos (AP) - Protesis
('236101', 'Corona en metal porcelana', 'AP', 'Rehabilitacion'),
('236102', 'Corona libre de metal', 'AP', 'Rehabilitacion'),
('236201', 'Protesis parcial fija de 3 unidades', 'AP', 'Rehabilitacion'),
('236301', 'Protesis total mucosoportada', 'AP', 'Rehabilitacion'),
('236401', 'Protesis parcial removible', 'AP', 'Rehabilitacion'),

-- Procedimientos (AP) - Ortodoncia
('237101', 'Colocacion de aparatologia ortodontica fija', 'AP', 'Ortodoncia'),
('237102', 'Control mensual de ortodoncia', 'AP', 'Ortodoncia'),
('237201', 'Retenedores ortodonticos', 'AP', 'Ortodoncia'),

-- Procedimientos (AP) - Implantes
('238101', 'Colocacion de implante dental', 'AP', 'Implantologia'),
('238201', 'Corona sobre implante', 'AP', 'Implantologia'),

-- Procedimientos (AP) - Rayos X
('871101', 'Radiografia periapical', 'AP', 'Radiologia'),
('871102', 'Radiografia oclusal', 'AP', 'Radiologia'),
('871103', 'Radiografia panoramica (ortopantomografia)', 'AP', 'Radiologia'),
('871104', 'Radiografia cefalometrica lateral', 'AP', 'Radiologia')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    service_type = EXCLUDED.service_type,
    specialty = EXCLUDED.specialty;

-- =====================================================
-- INSERT COMMON DENTAL DIAGNOSES (CIE-10)
-- =====================================================

INSERT INTO public.rips_diagnosis_catalog (code, name, chapter, group_code) VALUES
-- Caries
('K020', 'Caries limitada al esmalte', 'XI', 'K02'),
('K021', 'Caries de la dentina', 'XI', 'K02'),
('K022', 'Caries del cemento', 'XI', 'K02'),
('K023', 'Caries dentaria detenida', 'XI', 'K02'),
('K028', 'Otras caries dentales', 'XI', 'K02'),
('K029', 'Caries dental, no especificada', 'XI', 'K02'),

-- Enfermedades periodontales
('K050', 'Gingivitis aguda', 'XI', 'K05'),
('K051', 'Gingivitis cronica', 'XI', 'K05'),
('K052', 'Periodontitis aguda', 'XI', 'K05'),
('K053', 'Periodontitis cronica', 'XI', 'K05'),
('K054', 'Periodontosis', 'XI', 'K05'),
('K055', 'Otras enfermedades periodontales', 'XI', 'K05'),
('K056', 'Enfermedad periodontal, no especificada', 'XI', 'K05'),

-- Pulpitis y enfermedades periapicales
('K040', 'Pulpitis', 'XI', 'K04'),
('K041', 'Necrosis de la pulpa', 'XI', 'K04'),
('K042', 'Degeneracion de la pulpa', 'XI', 'K04'),
('K043', 'Formacion anormal de tejido duro en la pulpa', 'XI', 'K04'),
('K044', 'Periodontitis apical aguda originada en la pulpa', 'XI', 'K04'),
('K045', 'Periodontitis apical cronica', 'XI', 'K04'),
('K046', 'Absceso periapical con fistula', 'XI', 'K04'),
('K047', 'Absceso periapical sin fistula', 'XI', 'K04'),
('K048', 'Quiste radicular', 'XI', 'K04'),
('K049', 'Otras enfermedades de la pulpa y tejidos periapicales', 'XI', 'K04'),

-- Otras enfermedades dentales
('K000', 'Anodoncia', 'XI', 'K00'),
('K001', 'Dientes supernumerarios', 'XI', 'K00'),
('K002', 'Anomalias del tamano y de la forma del diente', 'XI', 'K00'),
('K003', 'Dientes moteados', 'XI', 'K00'),
('K006', 'Alteraciones en la erupcion dentaria', 'XI', 'K00'),
('K007', 'Sindrome de la erupcion dentaria', 'XI', 'K00'),
('K008', 'Otras alteraciones del desarrollo de los dientes', 'XI', 'K00'),
('K010', 'Dientes incluidos', 'XI', 'K01'),
('K011', 'Dientes impactados', 'XI', 'K01'),

-- Maloclusiones
('K070', 'Anomalias evidentes del tamano de los maxilares', 'XI', 'K07'),
('K071', 'Anomalias de la relacion maxilobasilar', 'XI', 'K07'),
('K072', 'Anomalias de la relacion entre los arcos dentarios', 'XI', 'K07'),
('K073', 'Anomalias de la posicion del diente', 'XI', 'K07'),
('K074', 'Maloclusion de tipo no especificado', 'XI', 'K07'),
('K075', 'Anomalias dentofaciales funcionales', 'XI', 'K07'),
('K076', 'Trastornos de la articulacion temporomandibular', 'XI', 'K07'),

-- Traumatismo dental
('S022', 'Fractura de los dientes', 'XIX', 'S02'),
('S032', 'Luxacion de diente', 'XIX', 'S03'),

-- Consulta de control
('Z012', 'Examen odontologico', 'XXI', 'Z01'),
('Z461', 'Colocacion y ajuste de protesis dentaria', 'XXI', 'Z46')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    chapter = EXCLUDED.chapter,
    group_code = EXCLUDED.group_code;

-- =====================================================
-- FUNCTION TO ADD RIPS TABLES TO CLINIC SCHEMA
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_rips_tables_to_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- RIPS Reports table (generated reports history)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.rips_reports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            report_number VARCHAR(50) NOT NULL,
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            format VARCHAR(10) NOT NULL CHECK (format IN (''json'', ''plano'')),
            status VARCHAR(20) DEFAULT ''generated'' CHECK (status IN (''generated'', ''submitted'', ''accepted'', ''rejected'')),
            file_path TEXT,
            file_name TEXT,
            records_count INTEGER DEFAULT 0,
            total_invoiced DECIMAL(15,2) DEFAULT 0,
            json_data JSONB,
            validation_errors JSONB,
            submission_date TIMESTAMPTZ,
            response_date TIMESTAMPTZ,
            response_message TEXT,
            generated_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- RIPS Provider settings (clinic configuration for RIPS)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.rips_provider_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            -- Datos del prestador
            nit VARCHAR(20) NOT NULL,
            razon_social TEXT NOT NULL,
            tipo_identificacion VARCHAR(2) DEFAULT ''31'',
            codigo_habilitacion VARCHAR(20),
            -- Direccion
            direccion TEXT,
            municipio_codigo VARCHAR(10),
            departamento_codigo VARCHAR(5),
            telefono VARCHAR(20),
            email VARCHAR(100),
            -- Configuracion RIPS
            prefijo_factura VARCHAR(10) DEFAULT ''FEV'',
            resolucion_facturacion TEXT,
            fecha_resolucion DATE,
            rango_desde INTEGER,
            rango_hasta INTEGER,
            -- Representante legal
            representante_nombre TEXT,
            representante_documento VARCHAR(20),
            representante_tipo_doc VARCHAR(2) DEFAULT ''CC'',
            -- Metadatos
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- Indices
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_rips_reports_period ON %I.rips_reports(period_start, period_end)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_rips_reports_status ON %I.rips_reports(status)',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Triggers
    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_rips_reports_updated_at
        BEFORE UPDATE ON %I.rips_reports
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    EXECUTE format('
        CREATE OR REPLACE TRIGGER update_%s_rips_provider_settings_updated_at
        BEFORE UPDATE ON %I.rips_provider_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- Permisos
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.rips_reports TO la92_user', p_schema_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.rips_provider_settings TO la92_user', p_schema_name);

    -- Add RIPS fields to patients if not exist
    EXECUTE format('
        DO $inner$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''patients'' AND column_name = ''tipo_documento_rips'') THEN
                ALTER TABLE %I.patients ADD COLUMN tipo_documento_rips VARCHAR(2) DEFAULT ''CC'';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''patients'' AND column_name = ''codigo_municipio'') THEN
                ALTER TABLE %I.patients ADD COLUMN codigo_municipio VARCHAR(10);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''patients'' AND column_name = ''zona_residencia'') THEN
                ALTER TABLE %I.patients ADD COLUMN zona_residencia VARCHAR(1) DEFAULT ''U'';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''patients'' AND column_name = ''tipo_usuario'') THEN
                ALTER TABLE %I.patients ADD COLUMN tipo_usuario VARCHAR(2) DEFAULT ''01'';
            END IF;
        END $inner$;
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name);

    -- Add RIPS fields to invoices if not exist
    EXECUTE format('
        DO $inner$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoices'' AND column_name = ''finalidad_consulta'') THEN
                ALTER TABLE %I.invoices ADD COLUMN finalidad_consulta VARCHAR(2) DEFAULT ''05'';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoices'' AND column_name = ''causa_externa'') THEN
                ALTER TABLE %I.invoices ADD COLUMN causa_externa VARCHAR(2) DEFAULT ''13'';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoices'' AND column_name = ''tipo_diagnostico_principal'') THEN
                ALTER TABLE %I.invoices ADD COLUMN tipo_diagnostico_principal VARCHAR(1) DEFAULT ''1'';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoices'' AND column_name = ''diagnostico_principal'') THEN
                ALTER TABLE %I.invoices ADD COLUMN diagnostico_principal VARCHAR(10);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoices'' AND column_name = ''diagnostico_relacionado'') THEN
                ALTER TABLE %I.invoices ADD COLUMN diagnostico_relacionado VARCHAR(10);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoices'' AND column_name = ''rips_status'') THEN
                ALTER TABLE %I.invoices ADD COLUMN rips_status VARCHAR(20) DEFAULT ''pending'';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoices'' AND column_name = ''rips_report_id'') THEN
                ALTER TABLE %I.invoices ADD COLUMN rips_report_id UUID;
            END IF;
        END $inner$;
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name);

    -- Add RIPS fields to invoice_items if not exist
    EXECUTE format('
        DO $inner$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoice_items'' AND column_name = ''cups_code'') THEN
                ALTER TABLE %I.invoice_items ADD COLUMN cups_code VARCHAR(20);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = %L AND table_name = ''invoice_items'' AND column_name = ''service_type'') THEN
                ALTER TABLE %I.invoice_items ADD COLUMN service_type VARCHAR(2) DEFAULT ''AP'';
            END IF;
        END $inner$;
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name);

END;
$$ LANGUAGE plpgsql;

-- Apply to clinic_la92 if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.add_rips_tables_to_schema('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- RPC FUNCTIONS FOR RIPS
-- =====================================================

-- Function to get invoices for RIPS generation
CREATE OR REPLACE FUNCTION public.get_rips_invoices(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    patient_id UUID,
    patient_first_name TEXT,
    patient_last_name TEXT,
    patient_document_type TEXT,
    patient_document_number TEXT,
    patient_birth_date DATE,
    patient_gender TEXT,
    patient_municipio TEXT,
    patient_zona TEXT,
    patient_tipo_usuario TEXT,
    issue_date DATE,
    total DECIMAL,
    finalidad_consulta TEXT,
    causa_externa TEXT,
    diagnostico_principal TEXT,
    diagnostico_relacionado TEXT,
    rips_status TEXT
) AS $$
DECLARE
    v_schema TEXT;
BEGIN
    -- Get current schema from session
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    RETURN QUERY EXECUTE format('
        SELECT
            i.id,
            i.invoice_number::TEXT,
            p.id as patient_id,
            p.first_name::TEXT,
            p.last_name::TEXT,
            COALESCE(p.tipo_documento_rips, p.document_type)::TEXT,
            p.document_number::TEXT,
            p.birth_date,
            p.gender::TEXT,
            p.codigo_municipio::TEXT,
            COALESCE(p.zona_residencia, ''U'')::TEXT,
            COALESCE(p.tipo_usuario, ''01'')::TEXT,
            i.issue_date,
            i.total,
            COALESCE(i.finalidad_consulta, ''05'')::TEXT,
            COALESCE(i.causa_externa, ''13'')::TEXT,
            i.diagnostico_principal::TEXT,
            i.diagnostico_relacionado::TEXT,
            COALESCE(i.rips_status, ''pending'')::TEXT
        FROM %I.invoices i
        JOIN %I.patients p ON i.patient_id = p.id
        WHERE i.issue_date >= $1
          AND i.issue_date <= $2
          AND i.status NOT IN (''draft'', ''cancelled'')
        ORDER BY i.issue_date, i.invoice_number
    ', v_schema, v_schema) USING p_start_date, p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invoice items for RIPS
CREATE OR REPLACE FUNCTION public.get_rips_invoice_items(p_invoice_id UUID)
RETURNS TABLE (
    id UUID,
    invoice_id UUID,
    description TEXT,
    quantity INTEGER,
    unit_price DECIMAL,
    total DECIMAL,
    cups_code TEXT,
    service_type TEXT
) AS $$
DECLARE
    v_schema TEXT;
BEGIN
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    RETURN QUERY EXECUTE format('
        SELECT
            ii.id,
            ii.invoice_id,
            ii.description::TEXT,
            ii.quantity::INTEGER,
            ii.unit_price,
            ii.total,
            ii.cups_code::TEXT,
            COALESCE(ii.service_type, ''AP'')::TEXT
        FROM %I.invoice_items ii
        WHERE ii.invoice_id = $1
        ORDER BY ii.created_at
    ', v_schema) USING p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save RIPS report
CREATE OR REPLACE FUNCTION public.save_rips_report(
    p_report_number TEXT,
    p_period_start DATE,
    p_period_end DATE,
    p_format TEXT,
    p_records_count INTEGER,
    p_total_invoiced DECIMAL,
    p_json_data JSONB,
    p_file_name TEXT,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_schema TEXT;
    v_id UUID;
BEGIN
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    EXECUTE format('
        INSERT INTO %I.rips_reports (
            report_number, period_start, period_end, format,
            records_count, total_invoiced, json_data, file_name, generated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    ', v_schema) INTO v_id
    USING p_report_number, p_period_start, p_period_end, p_format,
          p_records_count, p_total_invoiced, p_json_data, p_file_name, p_user_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get RIPS reports history
CREATE OR REPLACE FUNCTION public.get_rips_reports()
RETURNS TABLE (
    id UUID,
    report_number TEXT,
    period_start DATE,
    period_end DATE,
    format TEXT,
    status TEXT,
    file_name TEXT,
    records_count INTEGER,
    total_invoiced DECIMAL,
    generated_by_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_schema TEXT;
BEGIN
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    RETURN QUERY EXECUTE format('
        SELECT
            r.id,
            r.report_number::TEXT,
            r.period_start,
            r.period_end,
            r.format::TEXT,
            r.status::TEXT,
            r.file_name::TEXT,
            r.records_count,
            r.total_invoiced,
            COALESCE(p.full_name, u.email)::TEXT as generated_by_name,
            r.created_at
        FROM %I.rips_reports r
        LEFT JOIN public.users u ON r.generated_by = u.id
        LEFT JOIN public.profiles p ON u.id = p.user_id
        ORDER BY r.created_at DESC
    ', v_schema);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get/update provider settings
CREATE OR REPLACE FUNCTION public.get_rips_provider_settings()
RETURNS TABLE (
    id UUID,
    nit TEXT,
    razon_social TEXT,
    tipo_identificacion TEXT,
    codigo_habilitacion TEXT,
    direccion TEXT,
    municipio_codigo TEXT,
    departamento_codigo TEXT,
    telefono TEXT,
    email TEXT,
    prefijo_factura TEXT,
    resolucion_facturacion TEXT,
    fecha_resolucion DATE,
    rango_desde INTEGER,
    rango_hasta INTEGER,
    representante_nombre TEXT,
    representante_documento TEXT,
    representante_tipo_doc TEXT
) AS $$
DECLARE
    v_schema TEXT;
BEGIN
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    RETURN QUERY EXECUTE format('
        SELECT
            id,
            nit::TEXT,
            razon_social::TEXT,
            tipo_identificacion::TEXT,
            codigo_habilitacion::TEXT,
            direccion::TEXT,
            municipio_codigo::TEXT,
            departamento_codigo::TEXT,
            telefono::TEXT,
            email::TEXT,
            prefijo_factura::TEXT,
            resolucion_facturacion::TEXT,
            fecha_resolucion,
            rango_desde,
            rango_hasta,
            representante_nombre::TEXT,
            representante_documento::TEXT,
            representante_tipo_doc::TEXT
        FROM %I.rips_provider_settings
        WHERE is_active = TRUE
        LIMIT 1
    ', v_schema);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save/update provider settings
CREATE OR REPLACE FUNCTION public.save_rips_provider_settings(
    p_nit TEXT,
    p_razon_social TEXT,
    p_tipo_identificacion TEXT DEFAULT '31',
    p_codigo_habilitacion TEXT DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_municipio_codigo TEXT DEFAULT NULL,
    p_departamento_codigo TEXT DEFAULT NULL,
    p_telefono TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_prefijo_factura TEXT DEFAULT 'FEV',
    p_resolucion_facturacion TEXT DEFAULT NULL,
    p_fecha_resolucion DATE DEFAULT NULL,
    p_rango_desde INTEGER DEFAULT NULL,
    p_rango_hasta INTEGER DEFAULT NULL,
    p_representante_nombre TEXT DEFAULT NULL,
    p_representante_documento TEXT DEFAULT NULL,
    p_representante_tipo_doc TEXT DEFAULT 'CC'
)
RETURNS UUID AS $$
DECLARE
    v_schema TEXT;
    v_id UUID;
BEGIN
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    -- Try to update existing record first
    EXECUTE format('
        UPDATE %I.rips_provider_settings SET
            nit = $1, razon_social = $2, tipo_identificacion = $3,
            codigo_habilitacion = $4, direccion = $5, municipio_codigo = $6,
            departamento_codigo = $7, telefono = $8, email = $9,
            prefijo_factura = $10, resolucion_facturacion = $11, fecha_resolucion = $12,
            rango_desde = $13, rango_hasta = $14,
            representante_nombre = $15, representante_documento = $16, representante_tipo_doc = $17,
            updated_at = NOW()
        WHERE is_active = TRUE
        RETURNING id
    ', v_schema) INTO v_id
    USING p_nit, p_razon_social, p_tipo_identificacion, p_codigo_habilitacion,
          p_direccion, p_municipio_codigo, p_departamento_codigo, p_telefono, p_email,
          p_prefijo_factura, p_resolucion_facturacion, p_fecha_resolucion,
          p_rango_desde, p_rango_hasta,
          p_representante_nombre, p_representante_documento, p_representante_tipo_doc;

    -- If no record existed, insert new one
    IF v_id IS NULL THEN
        EXECUTE format('
            INSERT INTO %I.rips_provider_settings (
                nit, razon_social, tipo_identificacion, codigo_habilitacion,
                direccion, municipio_codigo, departamento_codigo, telefono, email,
                prefijo_factura, resolucion_facturacion, fecha_resolucion,
                rango_desde, rango_hasta,
                representante_nombre, representante_documento, representante_tipo_doc
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
        ', v_schema) INTO v_id
        USING p_nit, p_razon_social, p_tipo_identificacion, p_codigo_habilitacion,
              p_direccion, p_municipio_codigo, p_departamento_codigo, p_telefono, p_email,
              p_prefijo_factura, p_resolucion_facturacion, p_fecha_resolucion,
              p_rango_desde, p_rango_hasta,
              p_representante_nombre, p_representante_documento, p_representante_tipo_doc;
    END IF;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.get_rips_invoices(DATE, DATE) TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_rips_invoice_items(UUID) TO la92_user;
GRANT EXECUTE ON FUNCTION public.save_rips_report(TEXT, DATE, DATE, TEXT, INTEGER, DECIMAL, JSONB, TEXT, UUID) TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_rips_reports() TO la92_user;
GRANT EXECUTE ON FUNCTION public.get_rips_provider_settings() TO la92_user;
GRANT EXECUTE ON FUNCTION public.save_rips_provider_settings(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO la92_user;

-- =====================================================
-- FIN MIGRATION 015
-- =====================================================
