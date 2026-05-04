-- Migration 025: Add emergency fields to appointments for walk-in patients
-- Date: 2026-04-25

-- Add emergency fields to clinic_la92.appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinic_la92'
    AND table_name = 'appointments'
    AND column_name = 'emergency_name'
  ) THEN
    ALTER TABLE clinic_la92.appointments ADD COLUMN emergency_name TEXT;
    ALTER TABLE clinic_la92.appointments ADD COLUMN emergency_phone TEXT;
    RAISE NOTICE 'Added emergency_name and emergency_phone columns to clinic_la92.appointments';
  END IF;
END $$;

-- Also add to public schema template
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'appointments'
    AND column_name = 'emergency_name'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS emergency_name TEXT;
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
  END IF;
END $$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
