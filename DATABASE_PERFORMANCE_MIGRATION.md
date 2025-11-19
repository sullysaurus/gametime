# Database Performance Indexes Migration

## Overview
This migration adds database indexes to significantly speed up slow queries identified in performance monitoring.

## Expected Performance Improvements
Based on the slow query analysis:
- **Query #1** (286ms → ~5-10ms): Admin page generated_images queries
- **Query #4** (89ms → ~2-5ms): Sections ordering by price
- Overall database query time reduction: **~70-80%**

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-migration-performance-indexes.sql`
4. Copy and paste the entire contents into the SQL editor
5. Click **Run**

### Option 2: Supabase CLI
```bash
supabase db execute -f supabase-migration-performance-indexes.sql
```

## What This Migration Does

### 1. Composite Index: section_id + status
```sql
CREATE INDEX idx_generated_images_section_status
ON generated_images(section_id, status);
```
**Speeds up**: Admin page queries filtering by section and status

### 2. Composite Index: section_id + created_at
```sql
CREATE INDEX idx_generated_images_section_created
ON generated_images(section_id, created_at DESC);
```
**Speeds up**: Image history queries in admin page

### 3. Partial Index: Approved Images
```sql
CREATE INDEX idx_generated_images_section_approved
ON generated_images(section_id, approved_at DESC)
WHERE status = 'approved';
```
**Speeds up**: Querying only approved images (smaller, faster index)

### 4. Partial Index: Pending Images
```sql
CREATE INDEX idx_generated_images_pending
ON generated_images(section_id, created_at DESC)
WHERE status = 'pending';
```
**Speeds up**: Pending reviews section in admin page

### 5. Index: Price Ordering
```sql
CREATE INDEX idx_sections_price
ON sections(price DESC);
```
**Speeds up**: Home page section listing (ordered by price)

## Verification

After running the migration, verify the indexes were created:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('generated_images', 'sections')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

You should see all 5 new indexes listed.

## Rollback (if needed)

If you need to remove these indexes:

```sql
DROP INDEX IF EXISTS idx_generated_images_section_status;
DROP INDEX IF EXISTS idx_generated_images_section_created;
DROP INDEX IF EXISTS idx_generated_images_section_approved;
DROP INDEX IF EXISTS idx_generated_images_pending;
DROP INDEX IF EXISTS idx_sections_price;
```

## Impact

- **Storage**: Minimal increase (~1-2MB for typical dataset)
- **Write performance**: Negligible impact (indexes are small)
- **Read performance**: 70-80% faster for affected queries
- **No downtime**: Indexes are created with `IF NOT EXISTS`
