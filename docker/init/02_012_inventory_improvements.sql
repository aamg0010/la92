-- =====================================================
-- MIGRATION 012: Inventory Improvements - Phase 4A
-- =====================================================
-- - Seed data for inventory categories (Aseo, Insumos)
-- - Add color and icon fields to categories for better UX
-- =====================================================

-- =====================================================
-- 1. ADD EXTRA COLUMNS TO INVENTORY_CATEGORIES
-- =====================================================

-- Add icon and color columns to allow visual differentiation
DO $$
BEGIN
    -- For public schema (reference)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'inventory_categories'
                   AND column_name = 'icon') THEN
        ALTER TABLE public.inventory_categories ADD COLUMN icon VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'inventory_categories'
                   AND column_name = 'color') THEN
        ALTER TABLE public.inventory_categories ADD COLUMN color VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'inventory_categories'
                   AND column_name = 'is_default') THEN
        ALTER TABLE public.inventory_categories ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- =====================================================
-- 2. FUNCTION TO ADD COLUMNS TO CLINIC SCHEMAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_inventory_category_columns(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Add icon column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = p_schema_name
                   AND table_name = 'inventory_categories'
                   AND column_name = 'icon') THEN
        EXECUTE format('ALTER TABLE %I.inventory_categories ADD COLUMN icon VARCHAR(50)', p_schema_name);
    END IF;

    -- Add color column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = p_schema_name
                   AND table_name = 'inventory_categories'
                   AND column_name = 'color') THEN
        EXECUTE format('ALTER TABLE %I.inventory_categories ADD COLUMN color VARCHAR(20)', p_schema_name);
    END IF;

    -- Add is_default column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = p_schema_name
                   AND table_name = 'inventory_categories'
                   AND column_name = 'is_default') THEN
        EXECUTE format('ALTER TABLE %I.inventory_categories ADD COLUMN is_default BOOLEAN DEFAULT FALSE', p_schema_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to clinic_la92
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.add_inventory_category_columns('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- 3. SEED DEFAULT CATEGORIES
-- =====================================================

CREATE OR REPLACE FUNCTION public.seed_inventory_categories(p_schema_name TEXT)
RETURNS VOID AS $$
DECLARE
    v_aseo_id UUID;
    v_insumos_id UUID;
BEGIN
    -- Check if categories already exist
    EXECUTE format('SELECT id FROM %I.inventory_categories WHERE name = ''Aseo''', p_schema_name) INTO v_aseo_id;

    -- Insert Aseo category if not exists
    IF v_aseo_id IS NULL THEN
        EXECUTE format('
            INSERT INTO %I.inventory_categories (id, name, description, icon, color, is_default)
            VALUES (uuid_generate_v4(), ''Aseo'', ''Productos de limpieza, desinfectantes y materiales de higiene'', ''Sparkles'', ''emerald'', TRUE)
        ', p_schema_name);
    END IF;

    -- Check if Insumos exists
    EXECUTE format('SELECT id FROM %I.inventory_categories WHERE name = ''Insumos''', p_schema_name) INTO v_insumos_id;

    -- Insert Insumos category if not exists
    IF v_insumos_id IS NULL THEN
        EXECUTE format('
            INSERT INTO %I.inventory_categories (id, name, description, icon, color, is_default)
            VALUES (uuid_generate_v4(), ''Insumos'', ''Materiales odontologicos, guantes, gasas, jeringas y consumibles clinicos'', ''Package'', ''blue'', TRUE)
        ', p_schema_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply seed to clinic_la92
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinic_la92') THEN
        PERFORM public.seed_inventory_categories('clinic_la92');
    END IF;
END $$;

-- =====================================================
-- 4. UPDATE CLONE SCHEMA FUNCTION TO INCLUDE NEW COLUMNS
-- =====================================================

-- Update the create_clinic_schema function to include new columns in inventory_categories
-- This is done by recreating the relevant portion

CREATE OR REPLACE FUNCTION public.create_inventory_tables(p_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- inventory_categories with new columns
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.inventory_categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            color VARCHAR(20),
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', p_schema_name);

    -- Grant permissions
    EXECUTE format('GRANT ALL PRIVILEGES ON %I.inventory_categories TO la92_user', p_schema_name);

    -- Seed default categories
    PERFORM public.seed_inventory_categories(p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. RPC FUNCTION FOR INVENTORY STATS (OPTIMIZED)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_inventory_stats()
RETURNS JSON AS $$
DECLARE
    v_schema TEXT;
    v_result JSON;
BEGIN
    -- Get current schema from session
    v_schema := current_setting('app.current_schema', true);
    IF v_schema IS NULL OR v_schema = '' THEN
        v_schema := 'clinic_la92';
    END IF;

    EXECUTE format('
        SELECT json_build_object(
            ''totalItems'', COUNT(*),
            ''totalValue'', COALESCE(SUM(quantity * unit_cost), 0),
            ''lowStockCount'', COUNT(*) FILTER (WHERE quantity <= min_stock),
            ''expiringCount'', COUNT(*) FILTER (
                WHERE expiration_date IS NOT NULL
                AND expiration_date <= CURRENT_DATE + INTERVAL ''30 days''
                AND expiration_date >= CURRENT_DATE
            )
        )
        FROM %I.inventory_items
        WHERE is_active = TRUE
    ', v_schema) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_inventory_stats() TO la92_user;

-- =====================================================
-- FIN MIGRATION 012
-- =====================================================
