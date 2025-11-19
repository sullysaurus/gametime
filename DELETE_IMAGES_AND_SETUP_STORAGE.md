# Delete All Images and Setup Supabase Storage

## Overview
This guide will help you:
1. Delete all existing images from the database
2. Ensure new images are stored in Supabase Storage (not base64)
3. Verify everything is working correctly

## Why Delete Images?

Current images are stored as base64 strings in the database, which causes:
- **Slow page loads** (13+ seconds LCP)
- **Large database size** (each image ~266KB of text)
- **No caching** (images can't be cached by browsers)
- **Poor performance**

New images will be stored in Supabase Storage as compressed WebP files:
- **Fast loads** (~1-2s LCP)
- **Small file size** (~100-200KB)
- **Browser caching** (instant subsequent loads)
- **CDN distribution** (global edge network)

## Prerequisites

Before deleting images, you MUST configure the service role key:

### Step 1: Add Service Role Key to Vercel

1. **Get your Service Role Key from Supabase:**
   - Go to Supabase Dashboard
   - Navigate to **Settings** → **API**
   - Under "Project API keys", find **service_role** (the secret key, NOT anon/public)
   - Copy it

2. **Add to Vercel:**
   - Go to Vercel Dashboard → Your Project
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [paste the service_role key]
   - Environment: Check **Production**, **Preview**, and **Development**
   - Click **Save**

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click ⋯ on latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete

### Step 2: Verify Storage Bucket Exists

Run this in Supabase SQL Editor:
```sql
SELECT * FROM storage.buckets WHERE id = 'generated-images';
```

If no results, run the setup from `supabase-storage-setup.sql`.

## Delete All Images

### Step 1: Check What Will Be Deleted

Run in Supabase SQL Editor:
```sql
SELECT
  COUNT(*) as total_images,
  COUNT(CASE WHEN image_url LIKE 'data:%' THEN 1 END) as base64_images,
  COUNT(CASE WHEN image_url LIKE 'https:%' THEN 1 END) as storage_images,
  SUM(LENGTH(image_url)) / 1024 / 1024 as total_mb
FROM generated_images;
```

This shows:
- How many total images exist
- How many are base64 (old format)
- How many are in storage (new format)
- Total database size used by image URLs

### Step 2: Delete All Images

**WARNING: This is irreversible!**

Run in Supabase SQL Editor:
```sql
DELETE FROM generated_images;
```

### Step 3: Verify Deletion

```sql
SELECT COUNT(*) FROM generated_images;
-- Should return 0
```

## Test New Image Generation

### Step 1: Generate a Test Image

1. Go to `/admin` page
2. Select any section (e.g., "Pit GA")
3. Click "Generate Image"
4. Wait for generation to complete (1-2 minutes)

### Step 2: Check Server Logs

Look for these log messages in Vercel deployment logs:
```
Compressing image to WebP...
Uploading image to storage: generated/[timestamp]-[random].webp
Image uploaded successfully: generated/[timestamp]-[random].webp
Public URL: https://[project].supabase.co/storage/v1/object/public/generated-images/generated/[timestamp]-[random].webp
```

If you see:
```
SUPABASE_SERVICE_ROLE_KEY not configured, using base64 fallback
```
→ Go back to Step 1 and add the service role key!

### Step 3: Verify in Database

Run in Supabase SQL Editor:
```sql
SELECT
  id,
  section_id,
  LEFT(image_url, 50) as url_preview,
  CASE
    WHEN image_url LIKE 'data:%' THEN 'base64 (OLD)'
    WHEN image_url LIKE 'https:%' THEN 'storage (NEW)'
    ELSE 'unknown'
  END as storage_type,
  created_at
FROM generated_images
ORDER BY created_at DESC
LIMIT 5;
```

The new image should show:
- `url_preview`: `https://[project].supabase.co/storage/v1/object/pu...`
- `storage_type`: `storage (NEW)`

### Step 4: Verify in Supabase Storage

1. Go to Supabase Dashboard → **Storage**
2. Click on `generated-images` bucket
3. You should see a folder called `generated/`
4. Inside, you should see a `.webp` file
5. Click on it to preview
6. File size should be ~100-200KB (much smaller than base64!)

### Step 5: Check Homepage Performance

1. Open homepage `/` in **Incognito mode** (to avoid cache)
2. Open Chrome DevTools → **Network** tab
3. Reload page
4. Look for the image request:
   - Should load from `https://[project].supabase.co/storage/...`
   - Should be WebP format
   - Should load quickly (~200-500ms)
   - Should have `cache-control: max-age=31536000` (1 year)

## Troubleshooting

### Problem: "Storage upload failed: bucket does not exist"

**Solution:** Run `supabase-storage-setup.sql` in SQL Editor

### Problem: "SUPABASE_SERVICE_ROLE_KEY not configured"

**Solution:** Add the environment variable in Vercel (see Step 1)

### Problem: Image URL still starts with "data:"

**Solution:**
1. Check Vercel logs for error messages
2. Verify service role key is added
3. Verify storage bucket exists
4. Redeploy from Vercel

### Problem: "403 Forbidden" when accessing image

**Solution:**
1. Go to Supabase Storage → `generated-images` → Settings
2. Ensure "Public bucket" is enabled
3. Run the storage setup SQL to create policies

## Success Checklist

- [ ] Service role key added to Vercel
- [ ] Vercel redeployed
- [ ] Storage bucket exists and is public
- [ ] All old images deleted from database
- [ ] Generated a new test image
- [ ] New image URL starts with `https://`
- [ ] Image file appears in Supabase Storage
- [ ] Image is WebP format (~100-200KB)
- [ ] Homepage loads quickly (<2s)
- [ ] No errors in browser console

## Expected Results

### Before:
- Images: Base64 in database
- Page weight: ~1.86MB
- LCP: 13.26s
- No caching

### After:
- Images: WebP in Supabase Storage
- Page weight: ~400KB (78% smaller)
- LCP: ~1-2s (85-90% faster)
- 1-year browser caching

## Next Steps

After verifying everything works:

1. **Generate new images** for all sections you want to display
2. **Monitor performance** in Vercel Speed Insights (wait 24 hours for data)
3. **Enjoy fast loading!** 🚀

## Rollback Plan

If something goes wrong and you need to revert:

1. Remove `SUPABASE_SERVICE_ROLE_KEY` from Vercel environment variables
2. Redeploy
3. New images will automatically fall back to base64 (old behavior)
4. No data loss - you can still generate images, they'll just be slower

---

Need help? Check the server logs in Vercel for detailed error messages.
