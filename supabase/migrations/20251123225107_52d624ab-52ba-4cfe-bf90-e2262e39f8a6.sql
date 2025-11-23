-- Create storage bucket for certificate templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to allow recreation)
DROP POLICY IF EXISTS "Public read access for certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON storage.objects;

-- Create RLS policies for the certificates bucket
-- Allow public read access
CREATE POLICY "Public read access for certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

-- Allow authenticated users to upload certificates
CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- Allow authenticated users to update certificates
CREATE POLICY "Authenticated users can update certificates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');