# Database Migration Instructions

## Overview
This migration adds support for:
1. **Global Reference Images** - Pin images to use across all sections
2. **Prompt Tags** - Categorize and organize prompts with tags
3. **Prompt Templates** - Save prompts as reusable templates

## How to Run the Migration

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `supabase-migration-global-refs-and-tags.sql`
4. Copy all the SQL content
5. Paste it into the SQL Editor
6. Click "Run" to execute the migration

### Option 2: Via Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or execute the specific migration file
psql $DATABASE_URL < supabase-migration-global-refs-and-tags.sql
```

## What This Migration Does

### New Columns Added:

**generated_images table:**
- `is_global_reference` (BOOLEAN) - Marks images that can be used as references across all sections
  - Default: `false`
  - When `true`, the image appears in the global references selector for any section

**prompts table:**
- `tags` (TEXT[]) - Array of tag strings for categorizing prompts
  - Default: `{}`  (empty array)
  - Examples: `['sunset', 'crowd', 'wide-angle']`

- `is_template` (BOOLEAN) - Marks prompts as reusable templates
  - Default: `false`
  - When `true`, the prompt appears in the shared template library

### New Indexes:
- `idx_generated_images_is_global_reference` - Speeds up queries for global references
- `idx_prompts_is_template` - Speeds up queries for prompt templates
- `idx_prompts_tags` - Enables fast tag-based searches (GIN index)

## Features Enabled After Migration

### Global References
- Click "📌 Pin Globally" on any generated image to make it available across all sections
- Select global references from a dropdown when generating images for any section
- Perfect for reusing good compositions across different viewing angles

### Prompt Tags (Coming Soon)
- Add tags to prompts for organization (e.g., "sunset", "crowd", "close-up")
- Filter prompts by tags
- Find similar prompts across sections

### Prompt Templates (Coming Soon)
- Save successful prompts as reusable templates
- Apply templates to any section
- Build a library of proven prompts

## Rollback (if needed)

If you need to undo this migration:

```sql
-- Remove new columns
ALTER TABLE generated_images DROP COLUMN IF EXISTS is_global_reference;
ALTER TABLE prompts DROP COLUMN IF EXISTS tags;
ALTER TABLE prompts DROP COLUMN IF EXISTS is_template;

-- Drop indexes
DROP INDEX IF EXISTS idx_generated_images_is_global_reference;
DROP INDEX IF EXISTS idx_prompts_is_template;
DROP INDEX IF EXISTS idx_prompts_tags;
```

## Verification

After running the migration, verify it worked:

```sql
-- Check that new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('generated_images', 'prompts')
AND column_name IN ('is_global_reference', 'tags', 'is_template');

-- Should return 3 rows
```

## Support

If you encounter any issues with the migration:
1. Check the Supabase dashboard logs
2. Verify you have the correct permissions
3. Make sure no other migrations are running
