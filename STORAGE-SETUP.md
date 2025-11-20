# Image Storage Setup Guide

## Problem: Base64 Images Instead of Supabase Storage

If you're seeing base64-encoded images (data:image/...) instead of Supabase Storage URLs (https://...), it means your Supabase Service Role Key is not configured.

## Solution: Configure Service Role Key

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://aamjoctqvztopmmultsl.supabase.co
2. Click on "Project Settings" (gear icon in the left sidebar)
3. Navigate to "API" section
4. Find the **`service_role`** key (NOT the anon key!)
5. Click "Reveal" and copy the key

### Step 2: Add to Environment Variables

Add this line to your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-key-here
```

⚠️ **Important**: The service role key bypasses Row Level Security (RLS) and should NEVER be exposed to the client. Keep it secret!

### Step 3: Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
npm run dev
```

### Step 4: Verify Configuration

Run the migration status check:

```bash
npx tsx migrate-base64-images.ts
```

You should see:
```
✅ Service role configured: ✅
```

## Migrating Existing Base64 Images

If you already have base64 images in your database, migrate them to Supabase Storage:

### Check Status

```bash
npx tsx migrate-base64-images.ts
```

### Run Migration

```bash
npx tsx migrate-base64-images.ts migrate
```

This will:
- Process images in batches of 10
- Compress them to WebP format (80% quality)
- Upload to Supabase Storage
- Update database URLs
- Show progress for each batch

## How It Works

### Image Generation Flow

1. **Image Generated** → BFL API returns image URL
2. **Download** → Fetch the image from BFL
3. **Compress** → Convert to WebP (80% quality, 2048px max)
4. **Upload** → Store in Supabase `generated-images` bucket
5. **Save** → Store public URL in database

### Storage Bucket

- **Bucket Name**: `generated-images`
- **Path**: `generated/timestamp-random.webp`
- **Format**: WebP (optimal compression)
- **Max Size**: 2048px (maintains quality, reduces size)
- **Cache**: 1 year (31536000 seconds)

### Fallback Behavior

If storage upload fails OR service key is missing:
- Falls back to base64 encoding
- Logs warning to console
- Image still works but is slower and larger

## Troubleshooting

### Still seeing base64 images after adding key?

1. **Restart dev server** - Environment variables require restart
2. **Check the key** - Make sure you copied the SERVICE role key, not anon key
3. **Check logs** - Look for "Storage upload error" in console
4. **Verify bucket** - Ensure `generated-images` bucket exists and is public

### Migration failing?

1. **Check network** - Ensure you can reach your Supabase project
2. **Check permissions** - Service role key should have storage permissions
3. **Check bucket** - `generated-images` bucket must exist
4. **Check logs** - Look for specific error messages in output

### How to verify images are using storage?

1. **Check URL format** - Storage URLs start with `https://`, base64 starts with `data:`
2. **Check database** - Run SQL: `SELECT image_url FROM generated_images LIMIT 1`
3. **Network tab** - Storage images appear as separate network requests
4. **File size** - WebP storage images are ~60% smaller than base64

## Benefits of Supabase Storage

✅ **60% smaller** - WebP compression vs base64
✅ **Faster page loads** - Browser can cache storage URLs
✅ **Better performance** - Images load in parallel
✅ **CDN benefits** - Supabase serves from edge locations
✅ **Database efficiency** - Small URLs vs large base64 strings
