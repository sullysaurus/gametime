-- ============================================
-- DELETE BASE64 IMAGES ONLY
-- ============================================
-- This will delete only base64-encoded images (data:image/...)
-- Storage-based images (https://...) will be kept
-- ============================================

-- STEP 1: See how many base64 images exist
SELECT COUNT(*) as total_base64_images
FROM generated_images
WHERE image_url LIKE 'data:image%';

-- STEP 2: Preview what will be deleted
SELECT
  id,
  section_id,
  LEFT(image_url, 100) as url_preview,
  model_name,
  status,
  created_at
FROM generated_images
WHERE image_url LIKE 'data:image%'
ORDER BY created_at DESC;

-- STEP 3: Uncomment to DELETE all base64 images
-- DELETE FROM generated_images
-- WHERE image_url LIKE 'data:image%';

-- STEP 4: After deletion, verify they're gone
-- SELECT COUNT(*) as remaining_base64_images
-- FROM generated_images
-- WHERE image_url LIKE 'data:image%';

-- STEP 5: Check total remaining images
-- SELECT COUNT(*) as total_images FROM generated_images;
