-- =====================================================
-- MIGRATION 002: Function to create per-clinic schemas
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_clinic_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Crear schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);

    -- Permisos para la92_user
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO la92_user', p_schema_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO la92_user', p_schema_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO la92_user', p_schema_name);

    -- ===== CLINIC SETTINGS =====
    EXECUTE format('
        CREATE TABLE %I.clinic_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            clinic_name VARCHAR(255) DEFAULT ''Consultorio Odontologico'',
            logo_url TEXT,
            address TEXT,
            city VARCHAR(100),
            phone VARCHAR(50),
            email VARCHAR(255),
            website VARCHAR(255),
            tax_id VARCHAR(50),
            opening_time TIME DEFAULT ''09:00'',
            closing_time TIME DEFAULT ''18:00'',
            working_days TEXT[] DEFAULT ARRAY[''monday'',''tuesday'',''wednesday'',''thursday'',''friday'',''saturday''],
            timezone VARCHAR(50) DEFAULT ''America/Bogota'',
            currency VARCHAR(10) DEFAULT ''COP'',
            date_format VARCHAR(20) DEFAULT ''DD/MM/YYYY'',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- ===== AI SETTINGS =====
    EXECUTE format('
        CREATE TABLE %I.ai_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ai_enabled BOOLEAN DEFAULT TRUE,
            default_model VARCHAR(100) DEFAULT ''google/gemini-2.5-flash'',
            auto_suggestions BOOLEAN DEFAULT TRUE,
            diagnosis_assistance BOOLEAN DEFAULT TRUE,
            treatment_recommendations BOOLEAN DEFAULT TRUE,
            max_tokens INTEGER DEFAULT 2000,
            temperature DECIMAL(3,2) DEFAULT 0.7,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- ===== PATIENTS =====
    EXECUTE format('
        CREATE TABLE %I.patients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            document_type VARCHAR(20) DEFAULT ''CC'',
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
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- ===== PATIENT HEALTH HISTORY =====
    EXECUTE format('
        CREATE TABLE %I.patient_health_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_id UUID NOT NULL REFERENCES %I.patients(id) ON DELETE CASCADE,
            diagnosis TEXT NOT NULL,
            treatment TEXT,
            tooth_number VARCHAR(10),
            notes TEXT,
            attachments JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            created_by UUID REFERENCES public.users(id),
            archived_at TIMESTAMPTZ,
            archived_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    -- ===== TREATMENTS =====
    EXECUTE format('
        CREATE TABLE %I.treatments (
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
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- ===== APPOINTMENTS =====
    EXECUTE format('
        CREATE TABLE %I.appointments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_id UUID NOT NULL REFERENCES %I.patients(id) ON DELETE CASCADE,
            doctor_id UUID NOT NULL REFERENCES public.users(id),
            appointment_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            treatment_type VARCHAR(200),
            status VARCHAR(30) DEFAULT ''scheduled'',
            notes TEXT,
            reminder_sent BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    -- ===== INVOICES =====
    EXECUTE format('
        CREATE TABLE %I.invoices (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            invoice_number VARCHAR(50) UNIQUE NOT NULL,
            patient_id UUID NOT NULL REFERENCES %I.patients(id),
            issue_date DATE DEFAULT CURRENT_DATE,
            due_date DATE,
            subtotal DECIMAL(12,2) DEFAULT 0,
            discount DECIMAL(12,2) DEFAULT 0,
            tax_amount DECIMAL(12,2) DEFAULT 0,
            total DECIMAL(12,2) DEFAULT 0,
            status VARCHAR(30) DEFAULT ''draft'',
            notes TEXT,
            cufe VARCHAR(100),
            dian_status VARCHAR(30),
            dian_response JSONB,
            rips_data JSONB,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    -- ===== INVOICE ITEMS =====
    EXECUTE format('
        CREATE TABLE %I.invoice_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            invoice_id UUID NOT NULL REFERENCES %I.invoices(id) ON DELETE CASCADE,
            treatment_id UUID REFERENCES %I.treatments(id),
            description TEXT NOT NULL,
            tooth_number VARCHAR(10),
            quantity INTEGER DEFAULT 1,
            unit_price DECIMAL(12,2) NOT NULL,
            discount DECIMAL(12,2) DEFAULT 0,
            tax_rate DECIMAL(5,2) DEFAULT 0,
            total DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    -- ===== FINANCING PLANS (before payments due to FK) =====
    EXECUTE format('
        CREATE TABLE %I.financing_plans (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_id UUID NOT NULL REFERENCES %I.patients(id),
            invoice_id UUID REFERENCES %I.invoices(id),
            total_amount DECIMAL(12,2) NOT NULL,
            down_payment DECIMAL(12,2) DEFAULT 0,
            remaining_amount DECIMAL(12,2) NOT NULL,
            installments INTEGER DEFAULT 1,
            installment_amount DECIMAL(12,2) NOT NULL,
            interest_rate DECIMAL(5,2) DEFAULT 0,
            start_date DATE NOT NULL,
            status VARCHAR(30) DEFAULT ''active'',
            payment_mode TEXT DEFAULT ''flexible'' CHECK (payment_mode IN (''fixed_date'', ''flexible'')),
            day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
            notes TEXT,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    -- ===== PAYMENTS =====
    EXECUTE format('
        CREATE TABLE %I.payments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            invoice_id UUID NOT NULL REFERENCES %I.invoices(id),
            patient_id UUID NOT NULL REFERENCES %I.patients(id),
            amount DECIMAL(12,2) NOT NULL,
            payment_method VARCHAR(50) DEFAULT ''cash'',
            payment_date DATE DEFAULT CURRENT_DATE,
            reference_number VARCHAR(100),
            notes TEXT,
            is_financing_payment BOOLEAN DEFAULT FALSE,
            financing_plan_id UUID REFERENCES %I.financing_plans(id),
            processed_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name, p_schema_name);

    -- ===== INSTALLMENTS (Cuotas de planes de pago) =====
    EXECUTE format('
        CREATE TABLE %I.installments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            plan_id UUID NOT NULL REFERENCES %I.financing_plans(id) ON DELETE CASCADE,
            installment_number INTEGER NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            due_date DATE,
            paid_amount DECIMAL(12,2) DEFAULT 0,
            paid_date DATE,
            payment_id UUID REFERENCES %I.payments(id),
            status TEXT DEFAULT ''pending'' CHECK (status IN (''pending'', ''partial'', ''paid'', ''overdue'')),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    -- Indices para installments
    EXECUTE format('CREATE INDEX idx_%s_installments_plan_id ON %I.installments(plan_id)', replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_installments_status ON %I.installments(status)', replace(p_schema_name, 'clinic_', ''), p_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_installments_due_date ON %I.installments(due_date)', replace(p_schema_name, 'clinic_', ''), p_schema_name);

    -- ===== INVENTORY =====
    EXECUTE format('
        CREATE TABLE %I.inventory_categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.inventory_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            sku VARCHAR(50) UNIQUE,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            category_id UUID REFERENCES %I.inventory_categories(id),
            quantity INTEGER DEFAULT 0,
            unit VARCHAR(30) DEFAULT ''unidad'',
            unit_cost DECIMAL(12,2) DEFAULT 0,
            min_stock INTEGER DEFAULT 0,
            max_stock INTEGER,
            location VARCHAR(100),
            supplier VARCHAR(200),
            expiration_date DATE,
            is_active BOOLEAN DEFAULT TRUE,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.inventory_movements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            item_id UUID NOT NULL REFERENCES %I.inventory_items(id) ON DELETE CASCADE,
            movement_type VARCHAR(30) NOT NULL,
            quantity INTEGER NOT NULL,
            previous_quantity INTEGER NOT NULL,
            new_quantity INTEGER NOT NULL,
            unit_cost DECIMAL(12,2),
            reference_id UUID,
            notes TEXT,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.treatment_materials (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            treatment_id UUID NOT NULL REFERENCES %I.treatments(id) ON DELETE CASCADE,
            inventory_item_id UUID NOT NULL REFERENCES %I.inventory_items(id),
            quantity_required INTEGER DEFAULT 1,
            is_optional BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    -- ===== SUPPLIERS =====
    EXECUTE format('
        CREATE TABLE %I.suppliers (
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
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.stock_alerts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            inventory_item_id UUID NOT NULL REFERENCES %I.inventory_items(id) ON DELETE CASCADE,
            alert_type VARCHAR(30) DEFAULT ''low_stock'',
            current_quantity INTEGER NOT NULL,
            min_stock INTEGER NOT NULL,
            status VARCHAR(30) DEFAULT ''active'',
            notes TEXT,
            acknowledged_at TIMESTAMPTZ,
            acknowledged_by UUID REFERENCES public.users(id),
            resolved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.stock_alert_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            inventory_item_id UUID UNIQUE NOT NULL REFERENCES %I.inventory_items(id) ON DELETE CASCADE,
            reorder_point INTEGER NOT NULL,
            reorder_quantity INTEGER NOT NULL,
            preferred_supplier_id UUID REFERENCES %I.suppliers(id),
            alert_enabled BOOLEAN DEFAULT TRUE,
            last_alert_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.supplier_products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            supplier_id UUID NOT NULL REFERENCES %I.suppliers(id) ON DELETE CASCADE,
            inventory_item_id UUID REFERENCES %I.inventory_items(id),
            product_name VARCHAR(200) NOT NULL,
            supplier_sku VARCHAR(50),
            unit_price DECIMAL(12,2) DEFAULT 0,
            min_order_quantity INTEGER DEFAULT 1,
            lead_time_days INTEGER,
            is_preferred BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.purchase_orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_number VARCHAR(50) UNIQUE NOT NULL,
            supplier_id UUID NOT NULL REFERENCES %I.suppliers(id),
            order_date DATE DEFAULT CURRENT_DATE,
            expected_delivery DATE,
            actual_delivery DATE,
            subtotal DECIMAL(12,2) DEFAULT 0,
            tax_amount DECIMAL(12,2) DEFAULT 0,
            shipping_cost DECIMAL(12,2) DEFAULT 0,
            total DECIMAL(12,2) DEFAULT 0,
            status VARCHAR(30) DEFAULT ''pending'',
            notes TEXT,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.purchase_order_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            purchase_order_id UUID NOT NULL REFERENCES %I.purchase_orders(id) ON DELETE CASCADE,
            inventory_item_id UUID REFERENCES %I.inventory_items(id),
            supplier_product_id UUID REFERENCES %I.supplier_products(id),
            description TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            quantity_received INTEGER DEFAULT 0,
            unit_price DECIMAL(12,2) NOT NULL,
            total DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name, p_schema_name);

    -- ===== DENTAL LABS =====
    EXECUTE format('
        CREATE TABLE %I.dental_labs (
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
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.lab_orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_number VARCHAR(50) UNIQUE NOT NULL,
            patient_id UUID REFERENCES %I.patients(id),
            doctor_id UUID NOT NULL REFERENCES public.users(id),
            selected_lab_id UUID REFERENCES %I.dental_labs(id),
            work_type VARCHAR(100) NOT NULL,
            material VARCHAR(100),
            shade VARCHAR(20),
            tooth_numbers TEXT[],
            priority VARCHAR(20) DEFAULT ''normal'',
            design_file_url TEXT,
            design_file_format VARCHAR(20),
            notes TEXT,
            status VARCHAR(30) DEFAULT ''draft'',
            estimated_delivery DATE,
            actual_delivery DATE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.lab_order_tracking (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id UUID NOT NULL REFERENCES %I.lab_orders(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL,
            notes TEXT,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.lab_quotes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id UUID NOT NULL REFERENCES %I.lab_orders(id) ON DELETE CASCADE,
            lab_id UUID NOT NULL REFERENCES %I.dental_labs(id),
            price DECIMAL(12,2) NOT NULL,
            currency VARCHAR(10) DEFAULT ''COP'',
            turnaround_days INTEGER NOT NULL,
            valid_until DATE,
            status VARCHAR(30) DEFAULT ''pending'',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name, p_schema_name);

    -- ===== MESSAGING =====
    EXECUTE format('
        CREATE TABLE %I.message_templates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(200) NOT NULL,
            type VARCHAR(50) NOT NULL,
            channel VARCHAR(20) NOT NULL,
            subject TEXT,
            content TEXT NOT NULL,
            variables TEXT[],
            is_active BOOLEAN DEFAULT TRUE,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(200),
            is_group BOOLEAN DEFAULT FALSE,
            created_by UUID NOT NULL REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.conversation_participants (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES %I.conversations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            is_admin BOOLEAN DEFAULT FALSE,
            joined_at TIMESTAMPTZ DEFAULT NOW(),
            last_read_at TIMESTAMPTZ,
            UNIQUE(conversation_id, user_id)
        )', p_schema_name, p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES %I.conversations(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES public.users(id),
            message_type VARCHAR(20) DEFAULT ''text'',
            content TEXT,
            file_url TEXT,
            file_name VARCHAR(255),
            file_size INTEGER,
            is_edited BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    -- ===== NOTIFICATIONS =====
    EXECUTE format('
        CREATE TABLE %I.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            type VARCHAR(50) DEFAULT ''info'',
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            link VARCHAR(255),
            metadata JSONB,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- ===== CLINIC DOCUMENTS =====
    EXECUTE format('
        CREATE TABLE %I.clinic_documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES public.users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(50) NOT NULL,
            file_path TEXT NOT NULL,
            file_type VARCHAR(50),
            file_size INTEGER,
            uploaded_by VARCHAR(200) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- ===== DOCTOR SETTLEMENTS (Liquidacion de Odontologos) =====
    EXECUTE format('
        CREATE TABLE %I.doctor_settlements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            doctor_id UUID NOT NULL REFERENCES public.users(id),
            settlement_date DATE NOT NULL,
            gross_income DECIMAL(12,2) NOT NULL DEFAULT 0,
            lab_costs DECIMAL(12,2) DEFAULT 0,
            net_income DECIMAL(12,2) NOT NULL DEFAULT 0,
            settlement_percentage DECIMAL(5,2) NOT NULL,
            settlement_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            status TEXT DEFAULT ''pending'' CHECK (status IN (''pending'', ''paid'', ''cancelled'')),
            paid_date DATE,
            paid_by UUID REFERENCES public.users(id),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(doctor_id, settlement_date)
        )', p_schema_name);

    EXECUTE format('
        CREATE TABLE %I.settlement_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            settlement_id UUID NOT NULL REFERENCES %I.doctor_settlements(id) ON DELETE CASCADE,
            item_type TEXT NOT NULL CHECK (item_type IN (''income'', ''lab_cost'')),
            description TEXT,
            amount DECIMAL(12,2) NOT NULL,
            reference_id UUID,
            reference_type TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name, p_schema_name);

    -- ===== INDEXES =====
    EXECUTE format('CREATE INDEX ON %I.patients(document_type, document_number)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.patients(last_name, first_name)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.patients(phone)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.appointments(appointment_date)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.appointments(patient_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.appointments(doctor_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.invoices(patient_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.invoices(issue_date)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.payments(invoice_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.payments(patient_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.inventory_movements(item_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.lab_orders(patient_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.lab_orders(doctor_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.notifications(user_id, is_read)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.messages(conversation_id, created_at)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.doctor_settlements(doctor_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.doctor_settlements(settlement_date)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.doctor_settlements(status)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.settlement_items(settlement_id)', p_schema_name);

    -- ===== TRIGGERS (updated_at) =====
    EXECUTE format('CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON %I.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON %I.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON %I.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON %I.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON %I.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON %I.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON %I.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON %I.lab_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);
    EXECUTE format('CREATE TRIGGER update_doctor_settlements_updated_at BEFORE UPDATE ON %I.doctor_settlements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', p_schema_name);

    -- ===== Clinical history code trigger =====
    EXECUTE format('CREATE TRIGGER patients_auto_clinical_code BEFORE INSERT ON %I.patients FOR EACH ROW EXECUTE FUNCTION public.auto_generate_clinical_history_code()', p_schema_name);

    -- ===== Grant all on new tables =====
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I TO la92_user', p_schema_name);
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO la92_user', p_schema_name);

END;
$$ LANGUAGE plpgsql;
