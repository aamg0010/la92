-- =====================================================
-- Migration 020: Budgets (Presupuestos) module
-- =====================================================
-- Context:
--   Permite crear presupuestos de tratamiento para pacientes con items
--   detallados (descripciones, dientes, cantidades, precios, descuentos,
--   impuestos). Un presupuesto puede convertirse en factura cuando el
--   paciente lo acepta; en ese caso se guarda la referencia a la factura
--   generada y el status pasa a 'converted'.
--
--   Numeración: PRE-YYYY-NNNN (secuencia + año en curso). La función
--   generate_budget_number() expone la generación a la capa aplicativa
--   (uso opcional vía RPC; también se puede calcular en JS).
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

-- Trigger para actualizar updated_at (la función ya existe en schema.sql)
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función helper para generar número: PRE-YYYY-NNNN
CREATE OR REPLACE FUNCTION generate_budget_number() RETURNS TEXT AS $$
DECLARE
  next_num BIGINT;
BEGIN
  next_num := nextval('budget_number_seq');
  RETURN 'PRE-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Permisos para PostgREST
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets, budget_items TO la92_api;
GRANT USAGE, SELECT ON SEQUENCE budget_number_seq TO la92_api;
GRANT EXECUTE ON FUNCTION generate_budget_number() TO la92_api;
