-- ===========================================
-- SISTEMA CONSULTORIO ODONTOLÓGICO LA 92
-- Tablas: Perfiles, Pacientes, Citas, Facturas, Pagos, Inventario
-- ===========================================

-- 1. CREAR ENUM PARA ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'assistant');

-- 2. TABLA DE ROLES DE USUARIO (separada de profiles por seguridad)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'doctor',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. TABLA DE PERFILES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    specialty TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. TABLA DE PACIENTES
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL DEFAULT 'CC',
    document_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    address TEXT,
    city TEXT DEFAULT 'Medellín',
    health_insurance TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 5. HISTORIAL CLÍNICO DE PACIENTES
CREATE TABLE public.patient_health_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT,
    tooth_number TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_health_history ENABLE ROW LEVEL SECURITY;

-- 6. TABLA DE CITAS
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    treatment_type TEXT,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'))
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 7. TABLA DE TRATAMIENTOS/SERVICIOS
CREATE TABLE public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- 8. TABLA DE FACTURAS (Resolución 2275/2023 DIAN)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    cufe TEXT, -- Código Único de Factura Electrónica
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    dian_status TEXT DEFAULT 'pending',
    dian_response JSONB,
    rips_data JSONB, -- Datos RIPS para Ministerio de Salud
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'issued', 'paid', 'partial', 'cancelled', 'overdue')),
    CONSTRAINT valid_dian_status CHECK (dian_status IN ('pending', 'sent', 'accepted', 'rejected', 'error'))
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 9. TABLA DE ITEMS DE FACTURA
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    treatment_id UUID REFERENCES public.treatments(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    tooth_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- 10. TABLA DE PAGOS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) NOT NULL,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reference_number TEXT,
    notes TEXT,
    is_financing_payment BOOLEAN DEFAULT false,
    financing_plan_id UUID,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'financing'))
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 11. TABLA DE PLANES DE FINANCIAMIENTO
CREATE TABLE public.financing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id),
    total_amount DECIMAL(12,2) NOT NULL,
    down_payment DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL,
    installments INTEGER NOT NULL DEFAULT 1,
    installment_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_financing_status CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled'))
);

ALTER TABLE public.financing_plans ENABLE ROW LEVEL SECURITY;

-- 12. CATEGORÍAS DE INVENTARIO
CREATE TABLE public.inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- 13. TABLA DE INVENTARIO
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.inventory_categories(id),
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'unidad',
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 5,
    max_stock DECIMAL(10,2),
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    supplier TEXT,
    location TEXT,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- 14. MOVIMIENTOS DE INVENTARIO
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
    movement_type TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    previous_quantity DECIMAL(10,2) NOT NULL,
    new_quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_id UUID, -- ID de cita o factura relacionada
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_movement_type CHECK (movement_type IN ('purchase', 'use', 'adjustment', 'return', 'expired', 'transfer'))
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- FUNCIONES DE SEGURIDAD
-- ===========================================

-- Función para verificar si usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Función para verificar si es doctor o admin
CREATE OR REPLACE FUNCTION public.is_clinic_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'doctor', 'assistant')
    )
$$;

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===========================================
-- TRIGGERS PARA updated_at
-- ===========================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financing_plans_updated_at BEFORE UPDATE ON public.financing_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- POLÍTICAS RLS
-- ===========================================

-- user_roles: Solo admins pueden ver/modificar roles
CREATE POLICY "Staff can view all roles" ON public.user_roles
    FOR SELECT USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles: Staff puede ver todos, usuarios solo editan el suyo
CREATE POLICY "Staff can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- patients: Staff puede CRUD
CREATE POLICY "Staff can view patients" ON public.patients
    FOR SELECT USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Staff can create patients" ON public.patients
    FOR INSERT WITH CHECK (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Staff can update patients" ON public.patients
    FOR UPDATE USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Staff can delete patients" ON public.patients
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- patient_health_history: Staff puede CRUD
CREATE POLICY "Staff can manage health history" ON public.patient_health_history
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- appointments: Staff puede CRUD
CREATE POLICY "Staff can manage appointments" ON public.appointments
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- treatments: Staff puede ver, admins pueden modificar
CREATE POLICY "Staff can view treatments" ON public.treatments
    FOR SELECT USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage treatments" ON public.treatments
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- invoices: Staff puede CRUD
CREATE POLICY "Staff can manage invoices" ON public.invoices
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- invoice_items: Staff puede CRUD
CREATE POLICY "Staff can manage invoice items" ON public.invoice_items
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- payments: Staff puede CRUD
CREATE POLICY "Staff can manage payments" ON public.payments
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- financing_plans: Staff puede CRUD
CREATE POLICY "Staff can manage financing plans" ON public.financing_plans
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- inventory_categories: Staff puede ver, admins modificar
CREATE POLICY "Staff can view inventory categories" ON public.inventory_categories
    FOR SELECT USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage inventory categories" ON public.inventory_categories
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- inventory_items: Staff puede CRUD
CREATE POLICY "Staff can manage inventory" ON public.inventory_items
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- inventory_movements: Staff puede CRUD
CREATE POLICY "Staff can manage inventory movements" ON public.inventory_movements
    FOR ALL USING (public.is_clinic_staff(auth.uid()));

-- ===========================================
-- DATOS INICIALES
-- ===========================================

-- Categorías de inventario
INSERT INTO public.inventory_categories (name, description) VALUES
    ('Materiales Dentales', 'Resinas, composites, amalgamas'),
    ('Instrumental', 'Pinzas, espejos, exploradores'),
    ('Desechables', 'Guantes, gasas, eyectores'),
    ('Medicamentos', 'Anestésicos, antibióticos'),
    ('Equipos', 'Equipos y accesorios mayores'),
    ('Oficina', 'Papelería y suministros de oficina');

-- Tratamientos básicos con códigos CUPS
INSERT INTO public.treatments (code, name, description, category, base_price, duration_minutes) VALUES
    ('890201', 'Consulta odontológica general', 'Valoración y diagnóstico inicial', 'Consulta', 80000, 30),
    ('232101', 'Profilaxis dental', 'Limpieza dental profesional', 'Preventivo', 120000, 45),
    ('232301', 'Aplicación de flúor', 'Fluorización tópica', 'Preventivo', 50000, 15),
    ('233101', 'Obturación con resina', 'Calza estética en resina', 'Operatoria', 150000, 45),
    ('233201', 'Obturación con amalgama', 'Calza en amalgama', 'Operatoria', 100000, 45),
    ('234101', 'Endodoncia unirradicular', 'Tratamiento de conducto 1 raíz', 'Endodoncia', 400000, 90),
    ('234102', 'Endodoncia birradicular', 'Tratamiento de conducto 2 raíces', 'Endodoncia', 500000, 120),
    ('234103', 'Endodoncia multirradicular', 'Tratamiento de conducto 3+ raíces', 'Endodoncia', 650000, 150),
    ('235101', 'Exodoncia simple', 'Extracción dental simple', 'Cirugía', 120000, 30),
    ('235201', 'Exodoncia quirúrgica', 'Extracción con colgajo', 'Cirugía', 250000, 60),
    ('236101', 'Corona en porcelana', 'Corona dental cerámica', 'Rehabilitación', 800000, 90),
    ('236201', 'Corona metal-porcelana', 'Corona con base metálica', 'Rehabilitación', 600000, 90),
    ('237101', 'Blanqueamiento dental', 'Aclaramiento dental profesional', 'Estética', 500000, 60);