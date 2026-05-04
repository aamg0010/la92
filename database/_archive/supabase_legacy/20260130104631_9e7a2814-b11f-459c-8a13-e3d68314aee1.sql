-- Create storage bucket for clinic documents (legal docs, CVs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-documents', 'clinic-documents', false);

-- Storage policies for clinic documents
CREATE POLICY "Admins can upload clinic documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can view clinic documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinic-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete clinic documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinic-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update clinic documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'clinic-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Table to track clinic documents metadata
CREATE TABLE public.clinic_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('legal', 'cv', 'other')),
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  user_id UUID REFERENCES public.profiles(user_id), -- For CVs, link to the staff member
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinic_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for clinic_documents
CREATE POLICY "Admins can manage all clinic documents"
ON public.clinic_documents FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view their own CV"
ON public.clinic_documents FOR SELECT
USING (
  category = 'cv' 
  AND user_id = auth.uid()
  AND public.is_clinic_staff(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_clinic_documents_updated_at
BEFORE UPDATE ON public.clinic_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();