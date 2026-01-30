-- Extender tabla treatments con campos completos
ALTER TABLE public.treatments 
ADD COLUMN IF NOT EXISTS pre_instructions text,
ADD COLUMN IF NOT EXISTS post_instructions text,
ADD COLUMN IF NOT EXISTS consent_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_template_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Crear tabla de materiales por tratamiento
CREATE TABLE public.treatment_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_required numeric NOT NULL DEFAULT 1,
  is_optional boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_materials_treatment ON public.treatment_materials(treatment_id);
CREATE INDEX idx_treatment_materials_item ON public.treatment_materials(inventory_item_id);

-- Tabla de proveedores
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  city text DEFAULT 'Medellín',
  tax_id text,
  payment_terms text,
  notes text,
  is_active boolean DEFAULT true,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Productos de proveedores (catálogo)
CREATE TABLE public.supplier_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  supplier_sku text,
  unit_price numeric NOT NULL DEFAULT 0,
  min_order_quantity numeric DEFAULT 1,
  lead_time_days integer DEFAULT 3,
  is_preferred boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_item ON public.supplier_products(inventory_item_id);

-- Órdenes de compra
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled')),
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  expected_delivery date,
  actual_delivery date,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  shipping_cost numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);

-- Items de orden de compra
CREATE TABLE public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  supplier_product_id uuid REFERENCES public.supplier_products(id) ON DELETE SET NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  quantity_received numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_items_order ON public.purchase_order_items(purchase_order_id);

-- Configuración de alertas de stock
CREATE TABLE public.stock_alert_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE UNIQUE,
  preferred_supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  reorder_point numeric NOT NULL,
  reorder_quantity numeric NOT NULL,
  alert_enabled boolean DEFAULT true,
  last_alert_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Historial de alertas
CREATE TABLE public.stock_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'low_stock' CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiring_soon')),
  current_quantity numeric NOT NULL,
  min_stock numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  acknowledged_by uuid,
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_alerts_item ON public.stock_alerts(inventory_item_id);
CREATE INDEX idx_stock_alerts_status ON public.stock_alerts(status);

-- Habilitar RLS
ALTER TABLE public.treatment_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para treatment_materials
CREATE POLICY "Staff can view treatment materials"
ON public.treatment_materials FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins and doctors can manage treatment materials"
ON public.treatment_materials FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));

-- Políticas para suppliers (solo admin)
CREATE POLICY "Staff can view suppliers"
ON public.suppliers FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage suppliers"
ON public.suppliers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para supplier_products
CREATE POLICY "Staff can view supplier products"
ON public.supplier_products FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage supplier products"
ON public.supplier_products FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para purchase_orders
CREATE POLICY "Staff can view purchase orders"
ON public.purchase_orders FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage purchase orders"
ON public.purchase_orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para purchase_order_items
CREATE POLICY "Staff can view purchase order items"
ON public.purchase_order_items FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage purchase order items"
ON public.purchase_order_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para stock_alert_settings
CREATE POLICY "Staff can view stock alert settings"
ON public.stock_alert_settings FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Admins can manage stock alert settings"
ON public.stock_alert_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para stock_alerts
CREATE POLICY "Staff can view stock alerts"
ON public.stock_alerts FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Staff can acknowledge alerts"
ON public.stock_alerts FOR UPDATE
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "System can create alerts"
ON public.stock_alerts FOR INSERT
WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_alert_settings_updated_at
  BEFORE UPDATE ON public.stock_alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Actualizar política de treatments para doctores
DROP POLICY IF EXISTS "Admins can manage treatments" ON public.treatments;
CREATE POLICY "Admins and doctors can manage treatments"
ON public.treatments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));