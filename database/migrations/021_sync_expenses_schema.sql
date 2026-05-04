-- Migration 021: Sync expenses schema for tenant
-- Fix: "Could not find the 'beneficiary_name' column of 'expens' in the schema cache"
-- Date: 2026-04-25

-- Ensure beneficiary_name column exists in clinic_la92 schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinic_la92'
    AND table_name = 'expenses'
    AND column_name = 'beneficiary_name'
  ) THEN
    ALTER TABLE clinic_la92.expenses ADD COLUMN beneficiary_name TEXT;
    RAISE NOTICE 'Added beneficiary_name column to clinic_la92.expenses';
  ELSE
    RAISE NOTICE 'beneficiary_name column already exists in clinic_la92.expenses';
  END IF;
END $$;

-- Also ensure beneficiary_type column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinic_la92'
    AND table_name = 'expenses'
    AND column_name = 'beneficiary_type'
  ) THEN
    ALTER TABLE clinic_la92.expenses ADD COLUMN beneficiary_type TEXT;
    RAISE NOTICE 'Added beneficiary_type column to clinic_la92.expenses';
  END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
