-- Migration: Add performance indexes for generated_images queries
-- Date: 2025-11-19
-- Purpose: Optimize slow database queries identified in performance monitoring

-- Index for querying by section_id and status (used heavily in admin page)
CREATE INDEX IF NOT EXISTS idx_generated_images_section_status
ON generated_images(section_id, status);

-- Index for querying by section_id and created_at (for image history)
CREATE INDEX IF NOT EXISTS idx_generated_images_section_created
ON generated_images(section_id, created_at DESC);

-- Index for querying approved images by section_id and approved_at
CREATE INDEX IF NOT EXISTS idx_generated_images_section_approved
ON generated_images(section_id, approved_at DESC)
WHERE status = 'approved';

-- Composite index for pending images query
CREATE INDEX IF NOT EXISTS idx_generated_images_pending
ON generated_images(section_id, created_at DESC)
WHERE status = 'pending';

-- Index for price ordering on sections (home page)
CREATE INDEX IF NOT EXISTS idx_sections_price
ON sections(price DESC);

COMMENT ON INDEX idx_generated_images_section_status IS 'Speeds up queries filtering by section and status';
COMMENT ON INDEX idx_generated_images_section_created IS 'Speeds up image history queries';
COMMENT ON INDEX idx_generated_images_section_approved IS 'Speeds up approved images lookup';
COMMENT ON INDEX idx_generated_images_pending IS 'Speeds up pending images queries';
COMMENT ON INDEX idx_sections_price IS 'Speeds up home page section ordering';
