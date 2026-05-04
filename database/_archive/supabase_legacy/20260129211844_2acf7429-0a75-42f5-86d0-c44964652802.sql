-- Create storage bucket for clinical history attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-attachments', 'clinical-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for clinical-attachments bucket
CREATE POLICY "Staff can upload clinical attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clinical-attachments' AND is_clinic_staff(auth.uid()));

CREATE POLICY "Staff can view clinical attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinical-attachments' AND is_clinic_staff(auth.uid()));

CREATE POLICY "Staff can delete clinical attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'clinical-attachments' AND is_clinic_staff(auth.uid()));