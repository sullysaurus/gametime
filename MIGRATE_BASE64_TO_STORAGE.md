# Migrate Base64 Images to Supabase Storage

## Problem

Existing images are stored as base64 data URLs in the database, causing:
- **Slow page loads** (13+ seconds LCP)
- **Large database size**
- **No browser caching**

New images will be stored in Supabase Storage as WebP files, but we need to migrate the old ones.

## Solution: Two Options

### Option 1: Delete All and Regenerate (Simplest)

**Pros:**
- Clean slate
- Guaranteed to work
- Simple process

**Cons:**
- Lose existing images
- Have to regenerate everything

**Steps:**
1. Make sure `SUPABASE_SERVICE_ROLE_KEY` is added to Vercel
2. Run the delete SQL:
   ```sql
   DELETE FROM generated_images;
   ```
3. Regenerate images you want using the admin interface
4. New images will automatically go to Supabase Storage

### Option 2: Migrate Existing Images (Keep Everything)

**Pros:**
- Keep all existing images
- Convert base64 to optimized WebP in storage
- Automatic process

**Cons:**
- Takes time (processes 10 images at a time)
- Requires multiple runs if you have many images

**Steps:**

#### 1. Add Service Role Key (REQUIRED FIRST!)

1. Go to Supabase Dashboard → Settings → API
2. Copy your **service_role** key
3. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
4. Add new variable:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [paste service role key]
   - Environments: Production, Preview, Development
5. **Redeploy from Vercel Dashboard**

#### 2. Check Migration Status

Open in browser:
```
https://your-app.vercel.app/api/migrate-images-to-storage
```

You'll see:
```json
{
  "total": 25,
  "base64": 25,
  "storage": 0,
  "needsMigration": true,
  "serviceRoleConfigured": true
}
```

**Important**: If `serviceRoleConfigured: false`, go back to Step 1!

#### 3. Run Migration

Use curl, Postman, or your browser console:

```bash
curl -X POST https://your-app.vercel.app/api/migrate-images-to-storage
```

Or in browser console:
```javascript
fetch('/api/migrate-images-to-storage', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

**Response:**
```json
{
  "success": true,
  "message": "Migration complete: 10 succeeded, 0 failed",
  "migrated": 10,
  "failed": 0,
  "results": [...]
}
```

#### 4. Repeat Until Done

The migration processes **10 images at a time** to avoid timeouts.

Keep running the POST request until you get:
```json
{
  "success": true,
  "message": "No base64 images to migrate",
  "migrated": 0
}
```

#### 5. Verify

Check status again:
```
GET /api/migrate-images-to-storage
```

Should show:
```json
{
  "total": 25,
  "base64": 0,      ← All converted!
  "storage": 25,    ← All in storage!
  "needsMigration": false
}
```

## What the Migration Does

For each base64 image:

1. **Extracts** base64 data from database
2. **Decodes** to raw image buffer
3. **Compresses** to WebP format (80% quality)
4. **Uploads** to Supabase Storage (`generated/` folder)
5. **Updates** database with new `https://...` URL

**Result:**
- Base64: `data:image/jpeg;base64,/9j/4AAQSkZJRg...` (266KB in DB)
- Storage: `https://[project].supabase.co/storage/v1/object/public/generated-images/generated/[timestamp].webp` (~100KB file)

## Monitoring Progress

### In Supabase Dashboard:

**Storage → generated-images → generated/**
- You should see `.webp` files appearing as migration runs
- Each file should be ~100-200KB

**Table Editor → generated_images**
- Run this query to see progress:
```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN image_url LIKE 'data:%' THEN 1 END) as base64,
  COUNT(CASE WHEN image_url LIKE 'https:%' THEN 1 END) as storage
FROM generated_images;
```

### In Vercel Logs:

Watch deployment logs during migration:
```
Migrating 10 base64 images to storage...
Compressing image [id] to WebP...
Uploading image [id] to storage: generated/[timestamp].webp
Image [id] uploaded successfully: https://...
✓ Successfully migrated image [id]
Migration complete: 10 succeeded, 0 failed
```

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY not configured"

**Fix**: Add the service role key to Vercel environment variables and redeploy

### "bucket does not exist"

**Fix**: Run `supabase-storage-setup.sql` in Supabase SQL Editor

### "403 Forbidden" on storage upload

**Fix**:
1. Go to Supabase Storage → generated-images → Settings
2. Ensure "Public bucket" is enabled
3. Rerun storage setup SQL to create policies

### Migration fails for some images

**Check**: Look at the `results` array in the response to see which images failed and why

**Possible issues**:
- Corrupted base64 data
- Invalid image format
- Timeout (if image is very large)

**Solution**: Those specific images might need to be regenerated manually

### Images still showing base64 on homepage

**Fix**:
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Check database to ensure URLs were updated
3. Clear browser cache

## Performance Impact

### Before Migration:
- Page loads: ~13+ seconds
- Database size: Large (base64 strings)
- Browser cache: None (inline data)

### After Migration:
- Page loads: ~1-2 seconds (85-90% faster!)
- Database size: Small (just URLs)
- Browser cache: 1 year (instant subsequent loads)

## Post-Migration Cleanup

After successful migration, you can optionally clear old Vercel cache:

1. Go to Vercel Dashboard
2. Settings → Data Cache
3. Click "Purge Everything"

This ensures users get the new fast-loading images from storage.

## Alternative: Quick Delete Approach

If you don't care about keeping existing images:

```sql
-- Check what you're deleting
SELECT COUNT(*) FROM generated_images;

-- Delete all
DELETE FROM generated_images;

-- Verify
SELECT COUNT(*) FROM generated_images;
-- Should return 0
```

Then just regenerate the images you need. New images will automatically go to Supabase Storage (if service role key is configured).

---

**Recommendation**: If you have fewer than 20 images, just delete and regenerate. If you have many images, use the migration API.
