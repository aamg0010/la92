-- Add is_active column to patient_health_history for archiving
ALTER TABLE public.patient_health_history 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add archived_at timestamp to track when it was archived
ALTER TABLE public.patient_health_history 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add archived_by to track who archived it
ALTER TABLE public.patient_health_history 
ADD COLUMN archived_by UUID DEFAULT NULL;

-- Create index for faster filtering by active status
CREATE INDEX idx_patient_health_history_active ON public.patient_health_history(patient_id, is_active);

-- Add comment for documentation
COMMENT ON COLUMN public.patient_health_history.is_active IS 'Indicates if the clinical history entry is active (true) or archived (false)';