-- Migration: Add global references and prompt tags
-- Date: 2025-01-19

-- Add is_global_reference to generated_images table
ALTER TABLE generated_images
ADD COLUMN is_global_reference BOOLEAN DEFAULT false;

-- Add tags and is_template to prompts table
ALTER TABLE prompts
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN is_template BOOLEAN DEFAULT false;

-- Create index for global references (for faster queries)
CREATE INDEX idx_generated_images_is_global_reference
ON generated_images(is_global_reference)
WHERE is_global_reference = true;

-- Create index for prompt templates
CREATE INDEX idx_prompts_is_template
ON prompts(is_template)
WHERE is_template = true;

-- Create index for prompt tags
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);

-- Update RLS policies to allow the new columns
-- (Already have "Allow all" policies, so no changes needed)

COMMENT ON COLUMN generated_images.is_global_reference IS 'Whether this image can be used as a reference across all sections';
COMMENT ON COLUMN prompts.tags IS 'Array of tag strings for categorizing prompts (e.g., "sunset", "crowd", "wide-angle")';
COMMENT ON COLUMN prompts.is_template IS 'Whether this prompt is saved as a reusable template across sections';
