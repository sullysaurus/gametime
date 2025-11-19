-- Delete All Generated Images
-- This will remove all existing images from the database
-- WARNING: This is irreversible! Make sure you want to do this.

-- First, check how many images will be deleted
SELECT
  COUNT(*) as total_images,
  COUNT(CASE WHEN image_url LIKE 'data:%' THEN 1 END) as base64_images,
  COUNT(CASE WHEN image_url LIKE 'https:%' THEN 1 END) as storage_images,
  SUM(LENGTH(image_url)) / 1024 / 1024 as total_mb
FROM generated_images;

-- Uncomment the line below to delete all images
-- DELETE FROM generated_images;

-- After deletion, verify
-- SELECT COUNT(*) FROM generated_images;

-- Note: This will NOT delete images from Supabase Storage
-- To clean up storage, you'll need to go to:
-- Supabase Dashboard → Storage → generated-images → Select files → Delete
