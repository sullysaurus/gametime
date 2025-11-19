# Admin Interface UX Improvements

## Problem
Current admin interface is confusing because:
- **Prompts are section-specific**: Hard to reuse good prompts across sections
- **Images are section-specific**: Have to switch sections to see other images
- **Poor discoverability**: Can't easily find successful prompts or reference images
- **Cluttered layout**: Too much information on one screen

## Solution: Tab-Based Unified Libraries

### New Structure:

```
┌─────────────────────────────────────────────────┐
│  [Generate] [Prompt Library] [Image Gallery]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Content area (changes based on active tab)     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tab 1: Generate (Current Section Focus)
**Purpose**: Generate images for the currently selected section

**Contains**:
- Section selector (sidebar)
- Primary Image Manager
- Image Generator with reference image picker
- Pending reviews for CURRENT SECTION only
- Quick stats (X pending, Y approved, Z total for this section)

**Benefits**:
- Focused on the task at hand
- Less clutter
- Clear action path

### Tab 2: Prompt Library (Unified Across All Sections)
**Purpose**: Browse, manage, and reuse prompts across all sections

**Contains**:
- Search bar (search by text)
- Filter by tags (sunset, crowd, wide-angle, etc.)
- Filter by template status
- Grid/list of ALL prompts showing:
  - Prompt text (truncated)
  - Tags
  - Last used date
  - Number of sections using it
  - Template indicator
  - "Use for [Current Section]" button

**Benefits**:
- Easy to find successful prompts
- Reuse across sections
- Discover patterns (which prompts work best)
- Template system for common scenarios

### Tab 3: Image Gallery (Unified Across All Sections)
**Purpose**: Browse ALL generated images, find reference images

**Contains**:
- Search bar
- Filters:
  - By section (multi-select)
  - By status (approved/pending/rejected)
  - By model (flux-pro, flux-dev, etc.)
  - By date range
  - Global references only toggle
- Grid view of ALL images showing:
  - Image thumbnail
  - Section badge (e.g., "FC", "Pit GA")
  - Status badge (✓ approved, ⏳ pending, ✗ rejected)
  - Model name
  - Date
  - Actions:
    - "Use as Reference"
    - "Set as Primary for [Section]"
    - "Mark as Global Reference"

**Benefits**:
- See all generated images at once
- Easy comparison across sections
- Find best reference images
- Identify successful patterns

## Implementation Plan

### Phase 1: Tab Navigation Structure
- Add tab state management
- Create tab navigation UI
- Reorganize existing components into tabs

### Phase 2: Unified Image Gallery
- Load ALL images (not filtered by section)
- Add section badges
- Add filter controls
- Add "Use as Reference" functionality

### Phase 3: Unified Prompt Library
- Load ALL prompts (not filtered by section)
- Add tag display
- Add filter controls
- Add "Use for Section" functionality

### Phase 4: Polish
- Add search functionality
- Add loading states
- Add empty states
- Improve mobile responsiveness

## Expected Benefits

### Better UX:
- **Clearer mental model**: Tabs separate different tasks
- **Less overwhelming**: One focused view at a time
- **Better discovery**: See everything, filter as needed

### Better Workflow:
- **Prompt reuse**: Find a great prompt once, use everywhere
- **Reference library**: All images accessible for reference
- **Cross-section learning**: See what works in other sections

### Faster Iteration:
- **No section switching**: All data in one place
- **Quick filtering**: Find exactly what you need
- **Batch operations**: See patterns across all sections

## Migration Notes

### Backward Compatible:
- All existing data works as-is
- No database schema changes needed
- Existing components reused

### Data Loading:
- Generate tab: Load only current section data (fast)
- Prompt Library tab: Load all prompts (lazy load)
- Image Gallery tab: Load all images (paginated)

### Performance:
- Implement pagination for large galleries
- Add virtual scrolling for long lists
- Cache loaded data in state
