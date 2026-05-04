-- Create storage bucket for lab design files (STL, 3MF, PLY)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-designs', 
  'lab-designs', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/sla', 'application/vnd.ms-pki.stl', 'model/stl', 'application/octet-stream', 'model/3mf', 'application/x-3mf']
);

-- RLS: Staff can upload files
CREATE POLICY "Staff can upload lab design files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lab-designs' 
  AND is_clinic_staff(auth.uid())
);

-- RLS: Staff can view lab design files
CREATE POLICY "Staff can view lab design files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lab-designs' 
  AND is_clinic_staff(auth.uid())
);

-- RLS: Staff can update their uploaded files
CREATE POLICY "Staff can update lab design files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lab-designs' 
  AND is_clinic_staff(auth.uid())
);

-- RLS: Staff can delete files
CREATE POLICY "Staff can delete lab design files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lab-designs' 
  AND is_clinic_staff(auth.uid())
);

-- Insert initial dental labs data
INSERT INTO public.dental_labs (name, slug, website, specialties, supported_formats, average_turnaround_days, rating, total_orders, city, phone, email, is_active, accepts_digital)
VALUES 
  ('Prisma Dental Lab', 'prisma-dental', 'https://prismadentallab.amawebs.com', ARRAY['CAD/CAM', 'Zirconia', 'E.max', 'Implantes'], ARRAY['STL', '3MF', 'PLY'], 4, 4.8, 127, 'Medellín', NULL, NULL, true, true),
  ('Rapinucleos', 'rapinucleos', 'https://www.rapinucleos.com', ARRAY['Núcleos', 'Postes', 'Coronas', 'CAD/CAM'], ARRAY['STL', '3MF', 'STEP'], 3, 4.9, 89, 'Medellín', NULL, NULL, true, true),
  ('Damildent', 'damildent', NULL, ARRAY['Prótesis fija', 'Coronas', 'Puentes', 'Metal-cerámica'], ARRAY['STL', '3MF'], 5, 4.6, 156, 'Medellín', NULL, NULL, true, true),
  ('LabDental Elite', 'labdental-elite', NULL, ARRAY['Ortodoncia', 'Alineadores', 'Retenedores'], ARRAY['STL', '3MF'], 7, 4.7, 64, 'Medellín', NULL, NULL, true, true),
  ('Cerámicas Medellín', 'ceramicas-medellin', NULL, ARRAY['Carillas', 'Inlays', 'Onlays', 'Estratificación'], ARRAY['STL'], 6, 4.5, 92, 'Medellín', NULL, NULL, true, true)
ON CONFLICT DO NOTHING;