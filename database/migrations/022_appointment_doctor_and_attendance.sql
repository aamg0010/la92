-- Migration 022: Add doctor assignment and attendance tracking to appointments
-- Date: 2026-04-25

-- Add assigned_doctor_id to appointments (tracks which doctor handles the appointment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinic_la92'
    AND table_name = 'appointments'
    AND column_name = 'assigned_doctor_id'
  ) THEN
    ALTER TABLE clinic_la92.appointments ADD COLUMN assigned_doctor_id UUID REFERENCES clinic_la92.users(id);
    CREATE INDEX IF NOT EXISTS idx_appointments_assigned_doctor ON clinic_la92.appointments(assigned_doctor_id);
    RAISE NOTICE 'Added assigned_doctor_id column to clinic_la92.appointments';
  END IF;
END $$;

-- Add attendance_status to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinic_la92'
    AND table_name = 'appointments'
    AND column_name = 'attendance_status'
  ) THEN
    ALTER TABLE clinic_la92.appointments ADD COLUMN attendance_status TEXT DEFAULT 'pending'
    CHECK (attendance_status IN ('pending', 'attended', 'no_show', 'cancelled', 'rescheduled'));
    RAISE NOTICE 'Added attendance_status column to clinic_la92.appointments';
  END IF;
END $$;

-- Also add to public schema template for new clinics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'appointments'
    AND column_name = 'assigned_doctor_id'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'appointments'
    AND column_name = 'attendance_status'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
