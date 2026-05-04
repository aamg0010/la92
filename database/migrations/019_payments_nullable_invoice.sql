-- =====================================================
-- Migration 019: Allow payments without invoice (pago a cuenta / abono)
-- =====================================================
-- Context:
--   payments.invoice_id was declared NOT NULL in the original schema,
--   but the application already supports registering independent payments
--   (abonos / pagos a cuenta) that may not be linked to a specific invoice.
--   The TypeScript layer (src/hooks/usePayments.ts) already types it as
--   `string | null`, and the sibling table `financing_plans.invoice_id`
--   is nullable. This migration aligns the DB constraint with the design.
-- =====================================================

ALTER TABLE payments ALTER COLUMN invoice_id DROP NOT NULL;

-- Partial index on invoice_id to keep lookups fast for payments actually
-- associated with an invoice (used by the payment-total aggregation that
-- auto-marks invoices as 'paid' once fully settled).
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id
  ON payments(invoice_id) WHERE invoice_id IS NOT NULL;
