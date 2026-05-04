-- =====================================================
-- MIGRATION 005: Migrate La 92 data to clinic_la92 schema
-- =====================================================

BEGIN;

-- 1. Crear registro de clinica La 92
INSERT INTO public.clinics (id, name, slug, schema_name, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Consultorio Odontologico La 92',
    'la92',
    'clinic_la92',
    true
);

-- 2. Crear licencia (perpetua para la clinica fundadora)
INSERT INTO public.licenses (clinic_id, plan, status, max_users, starts_at, expires_at, amount)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'professional',
    'active',
    20,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '10 years',
    0
);

-- 3. Crear schema con todas las tablas
SELECT public.create_clinic_schema('clinic_la92');

-- 4. Migrar usuarios a clinic_users desde user_roles
INSERT INTO public.clinic_users (clinic_id, user_id, role, is_active)
SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    ur.user_id,
    ur.role,
    TRUE
FROM public.user_roles ur
ON CONFLICT (clinic_id, user_id) DO NOTHING;

-- 5. Marcar admin como superadmin
UPDATE public.users SET is_superadmin = TRUE
WHERE email = 'admin@la92.com';

-- 6. Actualizar sesiones existentes para apuntar a La 92
UPDATE public.sessions
SET clinic_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE clinic_id IS NULL;

-- 7. Copiar datos a clinic_la92 (orden por dependencias FK)

-- clinic_settings
INSERT INTO clinic_la92.clinic_settings
SELECT * FROM public.clinic_settings;

-- ai_settings
INSERT INTO clinic_la92.ai_settings
SELECT * FROM public.ai_settings;

-- patients
INSERT INTO clinic_la92.patients
SELECT * FROM public.patients;

-- patient_health_history
INSERT INTO clinic_la92.patient_health_history
SELECT * FROM public.patient_health_history;

-- treatments
INSERT INTO clinic_la92.treatments
SELECT * FROM public.treatments;

-- appointments
INSERT INTO clinic_la92.appointments
SELECT * FROM public.appointments;

-- invoices
INSERT INTO clinic_la92.invoices
SELECT * FROM public.invoices;

-- invoice_items
INSERT INTO clinic_la92.invoice_items
SELECT * FROM public.invoice_items;

-- financing_plans (antes de payments por FK)
INSERT INTO clinic_la92.financing_plans
SELECT * FROM public.financing_plans;

-- payments
INSERT INTO clinic_la92.payments
SELECT * FROM public.payments;

-- inventory_categories
INSERT INTO clinic_la92.inventory_categories
SELECT * FROM public.inventory_categories;

-- inventory_items
INSERT INTO clinic_la92.inventory_items
SELECT * FROM public.inventory_items;

-- inventory_movements
INSERT INTO clinic_la92.inventory_movements
SELECT * FROM public.inventory_movements;

-- treatment_materials
INSERT INTO clinic_la92.treatment_materials
SELECT * FROM public.treatment_materials;

-- suppliers
INSERT INTO clinic_la92.suppliers
SELECT * FROM public.suppliers;

-- stock_alerts
INSERT INTO clinic_la92.stock_alerts
SELECT * FROM public.stock_alerts;

-- stock_alert_settings
INSERT INTO clinic_la92.stock_alert_settings
SELECT * FROM public.stock_alert_settings;

-- supplier_products
INSERT INTO clinic_la92.supplier_products
SELECT * FROM public.supplier_products;

-- purchase_orders
INSERT INTO clinic_la92.purchase_orders
SELECT * FROM public.purchase_orders;

-- purchase_order_items
INSERT INTO clinic_la92.purchase_order_items
SELECT * FROM public.purchase_order_items;

-- dental_labs
INSERT INTO clinic_la92.dental_labs
SELECT * FROM public.dental_labs;

-- lab_orders
INSERT INTO clinic_la92.lab_orders
SELECT * FROM public.lab_orders;

-- lab_order_tracking
INSERT INTO clinic_la92.lab_order_tracking
SELECT * FROM public.lab_order_tracking;

-- lab_quotes
INSERT INTO clinic_la92.lab_quotes
SELECT * FROM public.lab_quotes;

-- message_templates
INSERT INTO clinic_la92.message_templates
SELECT * FROM public.message_templates;

-- conversations
INSERT INTO clinic_la92.conversations
SELECT * FROM public.conversations;

-- conversation_participants
INSERT INTO clinic_la92.conversation_participants
SELECT * FROM public.conversation_participants;

-- messages
INSERT INTO clinic_la92.messages
SELECT * FROM public.messages;

-- notifications
INSERT INTO clinic_la92.notifications
SELECT * FROM public.notifications;

-- clinic_documents
INSERT INTO clinic_la92.clinic_documents
SELECT * FROM public.clinic_documents;

COMMIT;
