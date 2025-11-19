# Storage Migration Instructions - Fix 13s LCP Performance Issue

## Overview
This migration fixes the catastrophic 13.26s Largest Contentful Paint by switching from base64 image storage to Supabase Storage with WebP compression.

## Current Performance (BEFORE):
- ❌ LCP: 13.26s (Target: <2.5s)
- ❌ Page Weight: ~1.86MB base64 data
- ❌ Real Experience Score: 70/100

## Expected Performance (AFTER):
- ✅ LCP: ~1-2s (85-90% faster)
- ✅ Page Weight: ~400KB (78% smaller)
- ✅ Real Experience Score: 90+/100

---

## Step 1: Set Up Supabase Storage Bucket

### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click **"New bucket"**
4. Enter bucket name: `generated-images`
5. Enable **"Public bucket"** toggle
6. Click **"Create bucket"**

### Option B: SQL Editor
1. Go to **SQL Editor** in Supabase dashboard
2. Copy contents of `supabase-storage-setup.sql`
3. Paste and click **Run**

### Verify Bucket Creation
Go to **Storage** → You should see `generated-images` bucket listed

---

## Step 2: Deploy Code Changes

The code changes are already committed and will deploy automatically:

### What Changed:
1. **API Route** (`app/api/generate-image/route.ts`):
   - ✅ Now uses Sharp to compress images to WebP (80% quality)
   - ✅ Uploads to Supabase Storage instead of base64
   - ✅ Stores public URL in database (not base64 data)
   - ✅ Reduces image size by ~60%

2. **Frontend** (`app/page.tsx`):
   - ✅ Added proper `sizes` attribute for Next.js optimization
   - ✅ Keeps `unoptimized` for backward compatibility with existing base64 images
   - ✅ New images get full Next.js optimization

---

## Step 3: Test the Fix

### A. Generate a New Image
1. Go to `/admin` page
2. Select any section
3. Generate a new image
4. Wait for completion

### B. Check Storage
1. Go to Supabase Dashboard → **Storage** → `generated-images`
2. You should see a new `.webp` file in the `generated/` folder
3. File size should be ~100-200KB (instead of ~266KB base64)

### C. Check Database
1. Go to **Table Editor** → `generated_images`
2. Find the new image
3. `image_url` should start with `https://` (not `data:`)
4. URL format: `https://[project].supabase.co/storage/v1/object/public/generated-images/generated/[timestamp]-[random].webp`

### D. Check Homepage Performance
1. Open homepage `/` in incognito mode
2. Open Chrome DevTools → **Network** tab
3. Reload page
4. Check the waterfall:
   - HTML should be small (~50KB)
   - Images load separately from CDN
   - Total load time should be ~1-2s

---

## Step 4: Monitor Performance

### Vercel Speed Insights
1. Wait 24 hours for Speed Insights to collect new data
2. Go to Vercel Dashboard → **Speed Insights**
3. Check metrics:
   - **LCP should drop from 13.26s to ~1-2s**
   - **Real Experience Score should improve to 90+**

### Expected Improvements:
- 🚀 **85-90% faster LCP**: 13.26s → 1-2s
- 📉 **78% smaller page**: 1.86MB → 400KB
- ⚡ **Instant subsequent loads** (browser caching)
- 🌍 **Global CDN delivery** (Supabase Storage)

---

## Backward Compatibility

### Existing Base64 Images
- ✅ Continue to work
- ✅ Display with `unoptimized` prop
- ⚠️ Still slow to load
- 💡 Will be gradually replaced as you generate new images

### New Images
- ✅ Automatically use Supabase Storage
- ✅ Compressed to WebP
- ✅ Served from CDN
- ✅ Fast loading (<1s)

---

## Troubleshooting

### Issue: "Failed to upload image: bucket does not exist"
**Solution**: Run Step 1 again to create the storage bucket

### Issue: "403 Forbidden" when accessing images
**Solution**:
1. Go to Supabase Dashboard → **Storage** → `generated-images`
2. Click ⚙️ **Settings**
3. Ensure **"Public bucket"** is enabled

### Issue: Images still loading slowly
**Solution**:
1. Check if image URL starts with `https://` or `data:`
2. If `data:`, the image is still base64 (old format)
3. Generate a new image to get the new format
4. Wait 24-48 hours for Speed Insights to reflect changes

### Issue: Sharp installation error
**Solution**:
```bash
npm install sharp --force
```

---

## Optional: Migrate Existing Base64 Images

**Note**: This is optional - existing images will be gradually replaced naturally.

If you want to convert all existing base64 images:

### Migration Script (Future Enhancement)
```typescript
// This would be a one-time script to:
// 1. Find all base64 images: WHERE image_url LIKE 'data:%'
// 2. Decode base64 to buffer
// 3. Compress with Sharp
// 4. Upload to Storage
// 5. Update database URL

// Can run in batches to avoid timeout
// Estimated time: ~1 minute per 100 images
```

---

## Rollback Plan (If Needed)

If something goes wrong:

### 1. Revert API Code
```bash
git revert HEAD
git push
```

### 2. New Images Will Fail
- Old base64 images continue to work
- New image generation will fail until storage is fixed
- No data loss

### 3. Fix and Redeploy
- Fix the storage bucket issue
- Redeploy the code

---

## Success Checklist

Before closing this issue, verify:

- [ ] Storage bucket `generated-images` exists and is public
- [ ] Generated a new test image successfully
- [ ] New image URL starts with `https://` (not `data:`)
- [ ] Image file in Storage is `.webp` format
- [ ] Image file size is ~100-200KB (not 266KB+)
- [ ] Homepage loads faster (check Network tab)
- [ ] No errors in browser console
- [ ] Vercel Speed Insights scheduled to monitor (24-48 hours)

---

## Expected Timeline

- **Immediate**: New images use Supabase Storage
- **24 hours**: Speed Insights shows improved metrics
- **1 week**: Most viewed sections have new optimized images
- **1 month**: All active sections using optimized images

---

## Questions?

Check `PERFORMANCE_FIX_PLAN.md` for detailed technical explanation.
