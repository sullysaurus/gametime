# Section Labels Update

## Overview
This update changes section codes and names to match the stadium layout, fixes mobile image slideout rendering, and reorganizes sections from pit to back.

## Changes Made

### 1. Mobile Image Slideout Fix
- **Problem**: When clicking on an image on mobile, the slideout panel would open but the image wouldn't render properly
- **Fix**: Added explicit width (`w-full`) and minimum height (`min-h-[200px]`) to the image container
- **Result**: Images now display properly in the mobile detail panel

### 2. Section Label Updates
Updated section codes to match the stadium configuration:

| Old Code | Old Name | → | New Code | New Name |
|----------|----------|---|----------|----------|
| GA1 | General Admission | → | Pit GA | Pit GA |
| GA2 | General Admission 2 | → | Seating GA | Seating GA |
| L | Left | → | ML | Middle Left |
| CL | Center Left | → | MLC | Middle Left Center |
| CR | Center Right | → | MRC | Middle Right Center |
| R | Right | → | MR | Middle Right |
| BCL | Back Center Left | → | BLC | Back Left Center |
| BCR | Back Center Right | → | BRC | Back Right Center |

**Unchanged sections:**
- FC (Front Center)
- FR (Front Right)
- FL (Front Left)
- BR (Back Right)
- BL (Back Left)
- SRO (Standing Room Only)

### 3. Section Ordering
Sections now display in front-to-back order:
1. Pit GA
2. FC (Front Center)
3. FR (Front Right)
4. FL (Front Left)
5. MR (Middle Right)
6. MRC (Middle Right Center)
7. MLC (Middle Left Center)
8. ML (Middle Left)
9. BR (Back Right)
10. BRC (Back Right Center)
11. BLC (Back Left Center)
12. BL (Back Left)
13. Seating GA
14. SRO (Standing Room Only)

## How to Apply

### Step 1: Run Database Migration
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open `supabase-migration-update-section-labels.sql`
4. Copy the contents and paste into the SQL Editor
5. Click **Run**

### Step 2: Verify Changes
After running the migration, verify in the SQL Editor:
```sql
SELECT section_code, name, category, price
FROM sections
ORDER BY section_code;
```

You should see the updated section codes and names.

### Step 3: Deploy Code Changes
The code changes have been deployed automatically via Vercel. Once the database migration is complete, the updated labels will appear throughout the app.

## What Will Change

### Admin Page
- Sections now appear in front-to-back order instead of by category
- Section codes updated to new labels (Pit GA, ML, MLC, etc.)

### Homepage
- Section tickets display with updated labels
- Clicking on a ticket now properly shows the image on mobile
- Sections maintain front-to-back ordering

## Rollback Plan

If you need to revert the changes:

```sql
-- Rollback section labels
UPDATE sections SET name = 'General Admission', section_code = 'GA1' WHERE section_code = 'Pit GA';
UPDATE sections SET name = 'General Admission 2', section_code = 'GA2' WHERE section_code = 'Seating GA';
UPDATE sections SET name = 'Left', section_code = 'L' WHERE section_code = 'ML';
UPDATE sections SET name = 'Center Left', section_code = 'CL' WHERE section_code = 'MLC';
UPDATE sections SET name = 'Center Right', section_code = 'CR' WHERE section_code = 'MRC';
UPDATE sections SET name = 'Right', section_code = 'R' WHERE section_code = 'MR';
UPDATE sections SET name = 'Back Center Left', section_code = 'BCL' WHERE section_code = 'BLC';
UPDATE sections SET name = 'Back Center Right', section_code = 'BCR' WHERE section_code = 'BRC';
```

Then revert the code:
```bash
git revert HEAD
git push
```

## Notes

- **Image mappings updated**: Local photo fallbacks now use the new section codes
- **Generated images preserved**: All existing AI-generated images remain linked to their sections (by section ID, not code)
- **No data loss**: This update only changes display labels, not the underlying data structure

## Success Checklist

After applying the migration and deploying:

- [ ] Database migration completed without errors
- [ ] Section codes updated in database
- [ ] Admin page shows sections in front-to-back order
- [ ] Homepage displays updated section labels
- [ ] Mobile image slideout shows images properly
- [ ] All existing images still display correctly
