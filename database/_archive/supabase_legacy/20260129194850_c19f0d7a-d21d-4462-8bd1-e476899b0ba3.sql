-- =============================================
-- LABORATORIOS DENTALES Y ÓRDENES DE TRABAJO
-- Sistema de integración con laboratorios locales
-- =============================================

-- Tabla de laboratorios dentales registrados
CREATE TABLE public.dental_labs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT DEFAULT 'Medellín',
    specialties TEXT[] DEFAULT '{}',
    accepts_digital BOOLEAN DEFAULT true,
    supported_formats TEXT[] DEFAULT ARRAY['STL', '3MF'],
    average_turnaround_days INTEGER DEFAULT 5,
    rating NUMERIC(2,1) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Órdenes de trabajo a laboratorios
CREATE TABLE public.lab_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    doctor_id UUID NOT NULL,
    work_type TEXT NOT NULL, -- 'corona', 'puente', 'protesis', 'implante', etc.
    tooth_numbers TEXT[],
    material TEXT, -- 'zirconia', 'emax', 'metal_ceramica', 'acrilico', etc.
    shade TEXT, -- color/tono dental
    design_file_url TEXT,
    design_file_format TEXT, -- 'STL', '3MF', 'PLY'
    notes TEXT,
    priority TEXT DEFAULT 'normal', -- 'urgente', 'normal', 'flexible'
    status TEXT DEFAULT 'draft', -- 'draft', 'pending_quotes', 'quoted', 'in_production', 'completed', 'delivered'
    selected_lab_id UUID REFERENCES public.dental_labs(id),
    estimated_delivery DATE,
    actual_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cotizaciones de laboratorios
CREATE TABLE public.lab_quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE NOT NULL,
    lab_id UUID REFERENCES public.dental_labs(id) ON DELETE CASCADE NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'COP',
    turnaround_days INTEGER NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(order_id, lab_id)
);

-- Tracking de producción
CREATE TABLE public.lab_order_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL, -- 'received', 'designing', 'milling', 'polishing', 'finishing', 'quality_check', 'shipped', 'delivered'
    notes TEXT,
    created_by TEXT, -- nombre del técnico del laboratorio
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mensajes de contacto del sitio web público
CREATE TABLE public.contact_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dental_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para dental_labs (lectura pública, escritura staff)
CREATE POLICY "Labs visibles públicamente"
    ON public.dental_labs FOR SELECT
    USING (is_active = true);

CREATE POLICY "Staff puede gestionar laboratorios"
    ON public.dental_labs FOR ALL
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

-- Políticas para lab_orders
CREATE POLICY "Staff puede ver órdenes"
    ON public.lab_orders FOR SELECT
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Staff puede crear órdenes"
    ON public.lab_orders FOR INSERT
    TO authenticated
    WITH CHECK (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Staff puede actualizar órdenes"
    ON public.lab_orders FOR UPDATE
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

-- Políticas para lab_quotes
CREATE POLICY "Staff puede ver cotizaciones"
    ON public.lab_quotes FOR SELECT
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Cualquiera puede crear cotizaciones"
    ON public.lab_quotes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Staff puede actualizar cotizaciones"
    ON public.lab_quotes FOR UPDATE
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

-- Políticas para tracking
CREATE POLICY "Staff puede ver tracking"
    ON public.lab_order_tracking FOR SELECT
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Cualquiera puede agregar tracking"
    ON public.lab_order_tracking FOR INSERT
    WITH CHECK (true);

-- Políticas para mensajes de contacto (inserción pública, lectura staff)
CREATE POLICY "Visitantes pueden enviar mensajes"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Staff puede ver mensajes"
    ON public.contact_messages FOR SELECT
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Staff puede actualizar mensajes"
    ON public.contact_messages FOR UPDATE
    TO authenticated
    USING (public.is_clinic_staff(auth.uid()));

-- Trigger para updated_at en lab_orders
CREATE TRIGGER update_lab_orders_updated_at
    BEFORE UPDATE ON public.lab_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Datos iniciales de laboratorios
INSERT INTO public.dental_labs (name, slug, website, specialties, supported_formats, average_turnaround_days) VALUES
('Prisma Dental Lab', 'prisma-dental', 'https://prismadentallab.amawebs.com', ARRAY['CAD/CAM', 'Zirconia', 'E.max', 'Implantes'], ARRAY['STL', '3MF', 'PLY'], 4),
('Damildent', 'damildent', NULL, ARRAY['Prótesis fija', 'Coronas', 'Puentes', 'Metal-cerámica'], ARRAY['STL', '3MF'], 5),
('Rapinucleos', 'rapinucleos', 'https://www.rapinucleos.com', ARRAY['Núcleos', 'Postes', 'Coronas', 'CAD/CAM'], ARRAY['STL', '3MF', 'STEP'], 3),
('LabDental Elite', 'labdental-elite', NULL, ARRAY['Ortodoncia', 'Alineadores', 'Retenedores'], ARRAY['STL', '3MF'], 7),
('Cerámicas Medellín', 'ceramicas-medellin', NULL, ARRAY['Carillas', 'Inlays', 'Onlays', 'Estratificación'], ARRAY['STL'], 6);