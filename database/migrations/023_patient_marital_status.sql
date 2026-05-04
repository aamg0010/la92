-- Migration 023: Add marital_status to patients
-- Date: 2026-04-25

-- Add marital_status to clinic_la92 patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinic_la92'
    AND table_name = 'patients'
    AND column_name = 'marital_status'
  ) THEN
    ALTER TABLE clinic_la92.patients ADD COLUMN marital_status TEXT;
    RAISE NOTICE 'Added marital_status column to clinic_la92.patients';
  END IF;
END $$;

-- Also add to public schema template
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'patients'
    AND column_name = 'marital_status'
  ) THEN
    ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS marital_status TEXT;
  END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
