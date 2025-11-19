-- Supabase Storage Setup for Generated Images
-- Run this in your Supabase SQL Editor

-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "Public read access for generated images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anon users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage images" ON storage.objects;

-- Policy: Public read access for all generated images
CREATE POLICY "Public read access for generated images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-images');

-- Policy: Anon users can upload images (needed for API routes)
CREATE POLICY "Anon users can upload images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'generated-images');

-- Policy: Service role can do anything
CREATE POLICY "Service role can manage images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'generated-images')
WITH CHECK (bucket_id = 'generated-images');

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'generated-images';

-- Check policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%generated%';
