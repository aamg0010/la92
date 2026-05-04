-- =====================================================
-- MIGRATION 030: Country-based modules configuration
-- =====================================================
-- This migration documents the country-based module visibility:
--
-- Colombia (CO):
--   - Facturacion DIAN: Visible
--   - RIPS: Visible
--   - Facturacion Verifactu: Hidden
--
-- España (ES):
--   - Facturacion DIAN: Hidden
--   - RIPS: Hidden
--   - Facturacion Verifactu: Visible
--
-- The visibility is controlled by:
--   1. clinic_settings.tax_country field
--   2. useCountryModules hook in frontend
--   3. Sidebar.tsx filters menu items based on country
--
-- No database changes needed - this is frontend logic only.
-- The tax_country column was added in migration 016_invoice_settings.sql

-- Verify tax_country column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinic_settings'
        AND column_name = 'tax_country'
    ) THEN
        RAISE NOTICE 'tax_country column should exist from migration 016';
    END IF;
END $$;

-- Set default country for existing clinics without one
UPDATE clinic_la92.clinic_settings
SET tax_country = 'CO'
WHERE tax_country IS NULL;

UPDATE clinic_su_sonrisa.clinic_settings
SET tax_country = 'ES'
WHERE tax_country IS NULL;

UPDATE clinic_clinicatry_pruebas.clinic_settings
SET tax_country = 'ES'
WHERE tax_country IS NULL;
