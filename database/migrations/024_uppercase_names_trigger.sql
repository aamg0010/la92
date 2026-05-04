-- Migration 024: Trigger to uppercase patient names
-- Date: 2026-04-25

-- Create function to uppercase patient names
CREATE OR REPLACE FUNCTION clinic_la92.uppercase_patient_names()
RETURNS TRIGGER AS $$
BEGIN
  NEW.first_name = UPPER(TRIM(COALESCE(NEW.first_name, '')));
  NEW.last_name = UPPER(TRIM(COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on clinic_la92.patients
DROP TRIGGER IF EXISTS patient_uppercase_names ON clinic_la92.patients;
CREATE TRIGGER patient_uppercase_names
BEFORE INSERT OR UPDATE ON clinic_la92.patients
FOR EACH ROW EXECUTE FUNCTION clinic_la92.uppercase_patient_names();

-- Update existing patients to uppercase
UPDATE clinic_la92.patients SET
  first_name = UPPER(TRIM(COALESCE(first_name, ''))),
  last_name = UPPER(TRIM(COALESCE(last_name, '')));

-- Also create in public schema for new clinics
CREATE OR REPLACE FUNCTION public.uppercase_patient_names()
RETURNS TRIGGER AS $$
BEGIN
  NEW.first_name = UPPER(TRIM(COALESCE(NEW.first_name, '')));
  NEW.last_name = UPPER(TRIM(COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
