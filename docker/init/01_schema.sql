-- =====================================================
-- LA 92 - CRM Odontológico
-- Esquema de Base de Datos PostgreSQL
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE app_role AS ENUM ('admin', 'doctor', 'assistant', 'accountant');

-- =====================================================
-- TABLAS DE AUTENTICACIÓN Y USUARIOS
-- =====================================================

-- Usuarios (auth básica - reemplaza Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Perfiles de usuario
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    specialty VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles de usuario
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role DEFAULT 'doctor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Preferencias de usuario
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'es',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    compact_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presencia de usuario (online/offline)
CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sesiones (JWT tokens)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- =====================================================
-- CONFIGURACIÓN DE LA CLÍNICA
-- =====================================================

CREATE TABLE clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_name VARCHAR(255) DEFAULT 'Consultorio Odontológico La 92',
    logo_url TEXT,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    tax_id VARCHAR(50),
    opening_time TIME DEFAULT '09:00',
    closing_time TIME DEFAULT '18:00',
    working_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    currency VARCHAR(10) DEFAULT 'COP',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuración de IA
CREATE TABLE ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_enabled BOOLEAN DEFAULT TRUE,
    default_model VARCHAR(100) DEFAULT 'google/gemini-2.5-flash',
    auto_suggestions BOOLEAN DEFAULT TRUE,
    diagnosis_assistance BOOLEAN DEFAULT TRUE,
    treatment_recommendations BOOLEAN DEFAULT TRUE,
    max_tokens INTEGER DEFAULT 2000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PACIENTES
-- =====================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_type VARCHAR(20) DEFAULT 'CC',
    document_number VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    birth_date DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    health_insurance VARCHAR(100),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    notes TEXT,
    clinical_history_code VARCHAR(20) UNIQUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historia clínica
CREATE TABLE patient_health_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    diagnosis TEXT NOT NULL,
    treatment TEXT,
    tooth_number VARCHAR(10),
    notes TEXT,
    attachments JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRATAMIENTOS
-- =====================================================

CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    base_price DECIMAL(12,2) DEFAULT 0,
    duration_minutes INTEGER,
    pre_instructions TEXT,
    post_instructions TEXT,
    consent_required BOOLEAN DEFAULT FALSE,
    consent_template_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CITAS
-- =====================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    treatment_type VARCHAR(200),
    status VARCHAR(30) DEFAULT 'scheduled',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FACTURACIÓN
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft',
    notes TEXT,
    -- DIAN integration fields
    cufe VARCHAR(100),
    dian_status VARCHAR(30),
    dian_response JSONB,
    rips_data JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES treatments(id),
    description TEXT NOT NULL,
    tooth_number VARCHAR(10),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAGOS Y FINANCIAMIENTO
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_number VARCHAR(100),
    notes TEXT,
    is_financing_payment BOOLEAN DEFAULT FALSE,
    financing_plan_id UUID,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE financing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    invoice_id UUID REFERENCES invoices(id),
    total_amount DECIMAL(12,2) NOT NULL,
    down_payment DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL,
    installments INTEGER DEFAULT 1,
    installment_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    start_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add FK to payments after financing_plans exists
ALTER TABLE payments ADD CONSTRAINT payments_financing_plan_id_fkey
    FOREIGN KEY (financing_plan_id) REFERENCES financing_plans(id);

-- =====================================================
-- INVENTARIO
-- =====================================================

CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES inventory_categories(id),
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(30) DEFAULT 'unidad',
    unit_cost DECIMAL(12,2) DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    location VARCHAR(100),
    supplier VARCHAR(200),
    expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(30) NOT NULL, -- 'entry', 'exit', 'adjustment', 'return', 'expired'
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relación tratamientos-materiales
CREATE TABLE treatment_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity_required INTEGER DEFAULT 1,
    is_optional BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alertas de stock
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    alert_type VARCHAR(30) DEFAULT 'low_stock',
    current_quantity INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    notes TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stock_alert_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID UNIQUE NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    preferred_supplier_id UUID,
    alert_enabled BOOLEAN DEFAULT TRUE,
    last_alert_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROVEEDORES
-- =====================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(200),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    rating DECIMAL(3,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK for stock_alert_settings
ALTER TABLE stock_alert_settings ADD CONSTRAINT stock_alert_settings_preferred_supplier_id_fkey
    FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id);

CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id),
    product_name VARCHAR(200) NOT NULL,
    supplier_sku VARCHAR(50),
    unit_price DECIMAL(12,2) DEFAULT 0,
    min_order_quantity INTEGER DEFAULT 1,
    lead_time_days INTEGER,
    is_preferred BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    actual_delivery DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id),
    supplier_product_id UUID REFERENCES supplier_products(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LABORATORIOS DENTALES
-- =====================================================

CREATE TABLE dental_labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    website VARCHAR(255),
    specialties TEXT[],
    supported_formats TEXT[],
    accepts_digital BOOLEAN DEFAULT TRUE,
    average_turnaround_days INTEGER,
    rating DECIMAL(3,2),
    total_orders INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    selected_lab_id UUID REFERENCES dental_labs(id),
    work_type VARCHAR(100) NOT NULL,
    material VARCHAR(100),
    shade VARCHAR(20),
    tooth_numbers TEXT[],
    priority VARCHAR(20) DEFAULT 'normal',
    design_file_url TEXT,
    design_file_format VARCHAR(20),
    notes TEXT,
    status VARCHAR(30) DEFAULT 'draft',
    estimated_delivery DATE,
    actual_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lab_order_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lab_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES dental_labs(id),
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'COP',
    turnaround_days INTEGER NOT NULL,
    valid_until DATE,
    status VARCHAR(30) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MENSAJERÍA Y COMUNICACIÓN
-- =====================================================

CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'appointment_reminder', 'payment_reminder', etc.
    channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'email', 'sms'
    subject TEXT,
    content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200),
    is_group BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message_type VARCHAR(20) DEFAULT 'text',
    content TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensajes de contacto (desde landing page)
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(300),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notificaciones
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documentos de la clínica
CREATE TABLE clinic_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Generar código de historia clínica
CREATE OR REPLACE FUNCTION generate_clinical_history_code()
RETURNS VARCHAR AS $$
DECLARE
    new_code VARCHAR;
    year_part VARCHAR;
    sequence_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YY');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(clinical_history_code FROM 4) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM patients
    WHERE clinical_history_code LIKE 'HC' || year_part || '%';

    new_code := 'HC' || year_part || LPAD(sequence_num::TEXT, 5, '0');

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Verificar si usuario tiene rol
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql;

-- Verificar si es personal de la clínica
CREATE OR REPLACE FUNCTION is_clinic_staff(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = _user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Hash de contraseña
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- Verificar contraseña
CREATE OR REPLACE FUNCTION verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON lab_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generar código de historia clínica
CREATE OR REPLACE FUNCTION auto_generate_clinical_history_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clinical_history_code IS NULL THEN
        NEW.clinical_history_code := generate_clinical_history_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_auto_clinical_code
    BEFORE INSERT ON patients
    FOR EACH ROW EXECUTE FUNCTION auto_generate_clinical_history_code();

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_patients_document ON patients(document_type, document_number);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_doctor ON lab_orders(doctor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Configuración inicial de la clínica
INSERT INTO clinic_settings (
    clinic_name, address, city, phone, email,
    opening_time, closing_time, working_days
) VALUES (
    'Consultorio Odontológico La 92',
    'Calle 92 #51-00, Aranjuez',
    'Medellín',
    '3892334',
    'consultoriola92@outlook.com',
    '09:00', '18:00',
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
);

-- Configuración inicial de IA
INSERT INTO ai_settings (ai_enabled, default_model, auto_suggestions, diagnosis_assistance, treatment_recommendations)
VALUES (TRUE, 'google/gemini-2.5-flash', TRUE, TRUE, TRUE);

-- Usuario admin inicial (contraseña: admin123)
INSERT INTO users (id, email, password_hash)
VALUES (
    uuid_generate_v4(),
    'admin@la92.com',
    crypt('admin123', gen_salt('bf', 10))
);

-- Perfil del admin
INSERT INTO profiles (user_id, full_name, specialty)
SELECT id, 'Administrador', 'Administración'
FROM users WHERE email = 'admin@la92.com';

-- Rol admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM users WHERE email = 'admin@la92.com';

-- Categorías de inventario iniciales
INSERT INTO inventory_categories (name, description) VALUES
('Materiales de Impresión', 'Alginatos, siliconas, yesos'),
('Anestésicos', 'Anestésicos locales y materiales'),
('Resinas y Composites', 'Materiales de restauración'),
('Instrumental Rotatorio', 'Fresas, discos, pulidores'),
('Desechables', 'Guantes, tapabocas, gasas'),
('Cemento y Adhesivos', 'Cementos dentales y sistemas adhesivos'),
('Endodoncia', 'Limas, conos, selladores'),
('Ortodoncia', 'Brackets, alambres, bandas'),
('Higiene', 'Cepillos, hilo dental, enjuagues');

-- Tratamientos iniciales
INSERT INTO treatments (code, name, category, base_price, duration_minutes) VALUES
('LIM001', 'Limpieza Dental', 'Preventivo', 80000, 30),
('BLA001', 'Blanqueamiento Dental', 'Estético', 350000, 60),
('EXT001', 'Extracción Simple', 'Cirugía', 120000, 30),
('END001', 'Endodoncia Unirradicular', 'Endodoncia', 280000, 60),
('RES001', 'Resina Simple', 'Restaurativo', 90000, 30),
('COR001', 'Corona en Porcelana', 'Prótesis', 650000, 60),
('IMP001', 'Implante Dental', 'Implantología', 2500000, 90),
('ORT001', 'Ortodoncia - Mes', 'Ortodoncia', 150000, 30);

-- Plantillas de mensaje iniciales
INSERT INTO message_templates (name, type, channel, content, variables) VALUES
('Recordatorio de Cita', 'appointment_reminder', 'whatsapp',
 'Hola {{patient_name}}, te recordamos que tienes cita el {{appointment_date}} a las {{appointment_time}} con {{doctor_name}}. Consultorio Odontológico La 92.',
 ARRAY['patient_name', 'appointment_date', 'appointment_time', 'doctor_name']),
('Confirmación de Cita', 'appointment_confirmation', 'whatsapp',
 'Hola {{patient_name}}, tu cita ha sido confirmada para el {{appointment_date}} a las {{appointment_time}}. Te esperamos en Calle 92 #51-00, Aranjuez. Consultorio La 92.',
 ARRAY['patient_name', 'appointment_date', 'appointment_time']),
('Recordatorio de Pago', 'payment_reminder', 'whatsapp',
 'Hola {{patient_name}}, te recordamos que tienes un saldo pendiente de ${{amount}}. Puedes realizar tu pago en el consultorio o transferencia. Consultorio La 92.',
 ARRAY['patient_name', 'amount']);

-- =====================================================
-- PERMISOS PARA POSTGREST
-- =====================================================

-- Crear rol para PostgREST
CREATE ROLE la92_api NOLOGIN;
GRANT USAGE ON SCHEMA public TO la92_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO la92_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO la92_api;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO la92_api;

-- Rol anónimo (para login)
CREATE ROLE la92_anon NOLOGIN;
GRANT USAGE ON SCHEMA public TO la92_anon;
GRANT SELECT ON users TO la92_anon;
GRANT INSERT ON users, profiles, user_roles TO la92_anon;
GRANT SELECT, INSERT ON contact_messages TO la92_anon;
GRANT SELECT ON appointments TO la92_anon; -- Para el calendario público
GRANT SELECT ON clinic_settings TO la92_anon;

-- =====================================================
-- PRESUPUESTOS (BUDGETS) — Migration 020
-- =====================================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    issue_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft',  -- draft, sent, accepted, rejected, expired, converted
    notes TEXT,
    converted_invoice_id UUID REFERENCES invoices(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES treatments(id),
    description TEXT NOT NULL,
    tooth_number VARCHAR(10),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_patient_id ON budgets(patient_id);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budget_items_budget_id ON budget_items(budget_id);

CREATE SEQUENCE IF NOT EXISTS budget_number_seq START 1;

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_budget_number() RETURNS TEXT AS $$
DECLARE
    next_num BIGINT;
BEGIN
    next_num := nextval('budget_number_seq');
    RETURN 'PRE-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
