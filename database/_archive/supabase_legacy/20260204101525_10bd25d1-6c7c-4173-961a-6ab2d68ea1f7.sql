-- Add clinical history code to patients table
ALTER TABLE public.patients
ADD COLUMN clinical_history_code TEXT UNIQUE;

-- Create function to generate clinical history code
CREATE OR REPLACE FUNCTION public.generate_clinical_history_code()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(clinical_history_code FROM 5 FOR 6) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.patients
  WHERE clinical_history_code LIKE year_part || '%';
  
  -- Format: YYYY-NNNNNN (e.g., 2025-000001)
  new_code := year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate clinical history code on patient insert
CREATE OR REPLACE FUNCTION public.set_clinical_history_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clinical_history_code IS NULL THEN
    NEW.clinical_history_code := generate_clinical_history_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_set_clinical_history_code
BEFORE INSERT ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.set_clinical_history_code();

-- Update existing patients with clinical history codes
DO $$
DECLARE
  patient_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR patient_record IN 
    SELECT id FROM public.patients 
    WHERE clinical_history_code IS NULL 
    ORDER BY created_at
  LOOP
    UPDATE public.patients 
    SET clinical_history_code = TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0')
    WHERE id = patient_record.id;
    counter := counter + 1;
  END LOOP;
END $$;