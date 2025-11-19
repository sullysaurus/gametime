-- Delete All Generated Images
-- This will remove all existing images from the database
-- WARNING: This is irreversible! Make sure you want to do this.

-- First, check how many images will be deleted
SELECT
  COUNT(*) as total_images,
  COUNT(CASE WHEN gi.image_url LIKE 'data:%' THEN 1 END) as base64_images,
  COUNT(CASE WHEN gi.image_url LIKE 'https:%' THEN 1 END) as storage_images,
  SUM(LENGTH(gi.image_url)) / 1024 / 1024 as total_mb
FROM generated_images gi;

-- View all images to see what you're deleting
SELECT
  gi.id,
  s.section_code,
  s.name as section_name,
  LEFT(gi.image_url, 50) as url_preview,
  CASE
    WHEN gi.image_url LIKE 'data:%' THEN 'base64'
    WHEN gi.image_url LIKE 'https:%' THEN 'storage'
    ELSE 'unknown'
  END as storage_type,
  gi.status,
  gi.created_at
FROM generated_images gi
JOIN sections s ON gi.section_id = s.id
ORDER BY gi.created_at DESC;

-- Uncomment the line below to delete all images
-- DELETE FROM generated_images;

-- After deletion, verify
-- SELECT COUNT(*) FROM generated_images;

-- Note: This will NOT delete images from Supabase Storage
-- To clean up storage, you'll need to go to:
-- Supabase Dashboard → Storage → generated-images → Select files → Delete
