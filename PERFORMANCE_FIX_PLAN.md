# Performance Fix Plan - Base64 to Blob Storage Migration

## Current Performance Issues

### Vercel Speed Insights (Nov 19, 2025):
- **Largest Contentful Paint (LCP)**: 13.26s ❌ (Target: <2.5s)
- **Real Experience Score**: 70/100 ❌ (Target: >90)
- **Home Page LCP**: 14.56s ❌
- **Admin Page LCP**: 4.55s ❌

### Root Cause: Base64 Image Storage

**Current Flow:**
1. Generate image with BFL API
2. Download image to memory
3. Convert to base64 string
4. Store base64 in PostgreSQL database
5. Query returns massive base64 strings
6. Browser parses and decodes base64
7. Finally renders image (13+ seconds later!)

**Problems:**
- Base64 adds 33% size overhead
- 1MP image: 200KB → 266KB base64
- 7 sections = ~1.86MB of base64 data in HTML
- No browser caching possible
- Blocks HTML parsing and rendering
- Database queries transfer megabytes unnecessarily

---

## Solution: Supabase Storage + Compression

### New Flow:
1. Generate image with BFL API
2. Download image to memory
3. **Compress to WebP (80% quality, ~60% size reduction)**
4. **Upload to Supabase Storage (CDN)**
5. Store public URL in database
6. Browser loads image from CDN
7. Next.js optimizes and caches
8. **Renders in ~1-2s!**

### Benefits:
- **85-90% faster LCP** (13s → 1-2s)
- **78% smaller page weight** (1.86MB → 400KB)
- **Browser caching** (subsequent loads instant)
- **CDN distribution** (global edge network)
- **Automatic optimization** (Next.js Image)

---

## Implementation Steps

### 1. Set Up Supabase Storage
```sql
-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

-- Enable public access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');

-- Enable authenticated uploads
CREATE POLICY "Authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');
```

### 2. Create Image Compression Utility
- Use Sharp library for server-side compression
- Convert to WebP format (better compression than JPEG)
- 80% quality setting (visually identical, 40-60% smaller)
- Resize to max 2048px width (sufficient for displays)

### 3. Update API Route
- Replace base64 conversion with compression + upload
- Store Supabase Storage public URL in database
- Maintain backward compatibility with existing base64 images

### 4. Update Frontend
- Remove `unoptimized` prop from Image components
- Let Next.js handle optimization for URL-based images
- Add proper loading states

### 5. Optional: Migrate Existing Images
- Background job to convert existing base64 images
- Upload to storage, update database URLs
- Can run gradually without downtime

---

## Expected Performance Improvements

### Before:
```
Home Page Load:
├─ HTML Download: 0.1s
├─ Parse 1.86MB base64: 8s
├─ Decode base64: 3s
└─ Render images: 2s
Total: 13.26s LCP
```

### After:
```
Home Page Load:
├─ HTML Download: 0.1s
├─ Image URLs in HTML: <0.01s
├─ CDN fetch (parallel): 0.5s
├─ Next.js optimization: 0.3s
└─ Render images: 0.2s
Total: ~1-2s LCP
```

### Metrics:
- **LCP**: 13.26s → 1-2s (85-90% faster)
- **Page Weight**: 1.86MB → 400KB (78% smaller)
- **Real Experience Score**: 70 → 90+ (Excellent)
- **Time to Interactive**: Significantly faster
- **Bandwidth Cost**: 78% reduction

---

## Migration Strategy

### Phase 1: New Images (Immediate)
- All new images use Supabase Storage
- No code changes needed for display
- Backward compatible

### Phase 2: Existing Images (Optional)
- Identify base64 images: `image_url LIKE 'data:%'`
- Convert in batches
- Update database URLs
- Zero downtime

### Phase 3: Cleanup (Future)
- Remove base64 handling code
- Simplify codebase
- Further optimizations

---

## Risk Mitigation

1. **Backward Compatibility**: Keep base64 support during transition
2. **Gradual Rollout**: New images first, then migrate existing
3. **Monitoring**: Track LCP before/after with Speed Insights
4. **Rollback Plan**: Can revert API changes if issues arise
5. **Testing**: Test with various image sizes and formats

---

## Success Criteria

✅ LCP under 2.5s (currently 13.26s)
✅ Real Experience Score over 90 (currently 70)
✅ Page weight under 500KB (currently 1.86MB)
✅ All Core Web Vitals in "Good" range
✅ No regression in image quality
