-- Create storage bucket for restaurant logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos');

-- Allow public read access to logos
CREATE POLICY "Public read access for logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'restaurant-logos');

-- Allow authenticated users to update/delete their logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-logos');