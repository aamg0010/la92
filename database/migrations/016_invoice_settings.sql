-- =====================================================
-- MIGRATION 016: Invoice Settings for Tenant Configuration
-- Allows each clinic to customize their payment receipts
-- =====================================================

-- Add invoice configuration columns to clinic_settings in the template schema
-- This will be applied to each tenant schema

-- Function to add invoice settings to a specific schema
CREATE OR REPLACE FUNCTION public.add_invoice_settings_to_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Add invoice_logo_url (can be different from main logo)
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS invoice_logo_url TEXT
    ', p_schema_name);

    -- Add primary color for invoice branding
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS invoice_primary_color VARCHAR(7) DEFAULT ''#0ea5e9''
    ', p_schema_name);

    -- Add secondary color for invoice branding
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS invoice_secondary_color VARCHAR(7) DEFAULT ''#64748b''
    ', p_schema_name);

    -- Add default tax rate (percentage, 0-100)
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS default_tax_rate DECIMAL(5,2) DEFAULT 0
    ', p_schema_name);

    -- Show warning when tax is 0
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS show_tax_warning BOOLEAN DEFAULT true
    ', p_schema_name);

    -- Custom header text for invoice
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS invoice_header_text TEXT
    ', p_schema_name);

    -- Custom footer text for invoice
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS invoice_footer_text TEXT DEFAULT ''Gracias por su preferencia''
    ', p_schema_name);

    -- Invoice terms and conditions
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS invoice_terms TEXT
    ', p_schema_name);

    -- Show clinic NIT/Tax ID on invoice
    EXECUTE format('
        ALTER TABLE %I.clinic_settings
        ADD COLUMN IF NOT EXISTS show_tax_id_on_invoice BOOLEAN DEFAULT true
    ', p_schema_name);

    RAISE NOTICE 'Invoice settings added to schema %', p_schema_name;
END;
$$ LANGUAGE plpgsql;

-- Apply to existing schemas
DO $$
DECLARE
    schema_record RECORD;
BEGIN
    -- Apply to all clinic_* schemas
    FOR schema_record IN
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'clinic_%'
    LOOP
        PERFORM public.add_invoice_settings_to_schema(schema_record.schema_name);
    END LOOP;
END $$;

-- Update the create_clinic_schema function to include invoice settings
-- This ensures new clinics get these columns automatically
CREATE OR REPLACE FUNCTION public.create_clinic_schema_with_invoice_settings(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- First create the base schema
    PERFORM public.create_clinic_schema(p_schema_name);
    -- Then add invoice settings
    PERFORM public.add_invoice_settings_to_schema(p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_invoice_settings_to_schema(TEXT) TO la92_user;
GRANT EXECUTE ON FUNCTION public.create_clinic_schema_with_invoice_settings(TEXT) TO la92_user;

-- =====================================================
-- PART 2: Country-specific tax settings (Spain/Colombia)
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_country_tax_settings_to_schema(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Tax country (ES = Spain, CO = Colombia)
    EXECUTE format('ALTER TABLE %I.clinic_settings ADD COLUMN IF NOT EXISTS tax_country VARCHAR(2) DEFAULT ''CO''', p_schema_name);
    -- Spain: CIF (Codigo de Identificacion Fiscal)
    EXECUTE format('ALTER TABLE %I.clinic_settings ADD COLUMN IF NOT EXISTS cif VARCHAR(20)', p_schema_name);
    -- Spain: IRPF retention rate for professionals
    EXECUTE format('ALTER TABLE %I.clinic_settings ADD COLUMN IF NOT EXISTS irpf_rate DECIMAL(5,2) DEFAULT 0', p_schema_name);
    -- Tax regime description
    EXECUTE format('ALTER TABLE %I.clinic_settings ADD COLUMN IF NOT EXISTS tax_regime VARCHAR(100)', p_schema_name);
    RAISE NOTICE 'Country tax settings added to schema %', p_schema_name;
END;
$$ LANGUAGE plpgsql;

-- Apply to existing schemas
DO $$
DECLARE
    schema_record RECORD;
BEGIN
    FOR schema_record IN SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'clinic_%'
    LOOP
        PERFORM public.add_country_tax_settings_to_schema(schema_record.schema_name);
    END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.add_country_tax_settings_to_schema(TEXT) TO la92_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 016_invoice_settings completed successfully';
END $$;
