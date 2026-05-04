-- Table for clinic general settings (one row per clinic, for now single-tenant)
CREATE TABLE public.clinic_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name text NOT NULL DEFAULT 'Mi Consultorio Dental',
    logo_url text,
    address text,
    city text DEFAULT 'Medellín',
    phone text,
    email text,
    website text,
    tax_id text,
    opening_time time DEFAULT '08:00',
    closing_time time DEFAULT '18:00',
    working_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    timezone text DEFAULT 'America/Bogota',
    currency text DEFAULT 'COP',
    date_format text DEFAULT 'DD/MM/YYYY',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table for message templates (WhatsApp, Email, SMS)
CREATE TABLE public.message_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('appointment_reminder', 'appointment_confirmation', 'post_treatment', 'payment_reminder', 'birthday', 'custom')),
    channel text NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
    subject text,
    content text NOT NULL,
    variables text[] DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table for user preferences (per-user settings)
CREATE TABLE public.user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language text DEFAULT 'es',
    notifications_enabled boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    sound_enabled boolean DEFAULT true,
    compact_mode boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table for AI settings
CREATE TABLE public.ai_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_enabled boolean DEFAULT true,
    default_model text DEFAULT 'google/gemini-2.5-flash',
    auto_suggestions boolean DEFAULT true,
    diagnosis_assistance boolean DEFAULT true,
    treatment_recommendations boolean DEFAULT true,
    max_tokens integer DEFAULT 2000,
    temperature numeric DEFAULT 0.7,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinic_settings (only admin can modify, staff can view)
CREATE POLICY "Staff can view clinic settings"
ON public.clinic_settings FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage clinic settings"
ON public.clinic_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for message_templates
CREATE POLICY "Staff can view message templates"
ON public.message_templates FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage all templates"
ON public.message_templates FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can manage their templates"
ON public.message_templates FOR ALL
USING (
    has_role(auth.uid(), 'doctor') AND 
    (created_by = auth.uid() OR created_by IS NULL)
);

-- RLS Policies for user_preferences (each user manages their own)
CREATE POLICY "Users can view their preferences"
ON public.user_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their preferences"
ON public.user_preferences FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for ai_settings (admin only)
CREATE POLICY "Staff can view AI settings"
ON public.ai_settings FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage AI settings"
ON public.ai_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default clinic settings
INSERT INTO public.clinic_settings (clinic_name) VALUES ('Mi Consultorio Dental');

-- Insert default AI settings
INSERT INTO public.ai_settings (ai_enabled) VALUES (true);

-- Insert default message templates
INSERT INTO public.message_templates (name, type, channel, subject, content, variables) VALUES
('Recordatorio de Cita WhatsApp', 'appointment_reminder', 'whatsapp', NULL, 
'Hola {{patient_name}}, le recordamos que tiene una cita programada para mañana {{appointment_date}} a las {{appointment_time}}. Por favor confirme su asistencia respondiendo a este mensaje. ¡Gracias!',
ARRAY['patient_name', 'appointment_date', 'appointment_time', 'doctor_name']),

('Confirmación de Cita Email', 'appointment_confirmation', 'email', 'Confirmación de Cita - {{clinic_name}}',
'Estimado/a {{patient_name}},\n\nSu cita ha sido confirmada para el {{appointment_date}} a las {{appointment_time}} con el Dr./Dra. {{doctor_name}}.\n\nDirección: {{clinic_address}}\n\n¡Lo esperamos!',
ARRAY['patient_name', 'appointment_date', 'appointment_time', 'doctor_name', 'clinic_name', 'clinic_address']),

('Seguimiento Post-Tratamiento', 'post_treatment', 'whatsapp', NULL,
'Hola {{patient_name}}, esperamos que se encuentre bien después de su tratamiento de {{treatment_name}}. Si tiene alguna molestia o pregunta, no dude en contactarnos. ¡Estamos para ayudarle!',
ARRAY['patient_name', 'treatment_name', 'doctor_name']),

('Recordatorio de Pago', 'payment_reminder', 'email', 'Recordatorio de Pago Pendiente',
'Estimado/a {{patient_name}},\n\nLe recordamos que tiene un saldo pendiente de ${{pending_amount}} correspondiente a su tratamiento del {{treatment_date}}.\n\nPuede realizar el pago en nuestro consultorio o contactarnos para más información.\n\nGracias.',
ARRAY['patient_name', 'pending_amount', 'treatment_date']);