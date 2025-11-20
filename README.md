# Red Rocks AI Image Generator

A production-ready Next.js application for generating, managing, and deploying AI-generated concert venue images using Black Forest Labs' FLUX models. Built for Red Rocks Amphitheatre ticket sections with a complete admin workflow, version-controlled prompts, and advanced img2img capabilities.

## 🎯 Project Overview

This application streamlines the creation of high-quality venue section images for ticket marketplaces. It features a sophisticated admin interface for prompt engineering, image generation with multiple FLUX model variants, approval workflows, and automatic deployment to production with Supabase Storage integration.

## 🚀 Technology Stack

### Frontend & Framework
- **Next.js 16.0.3** - React framework with App Router and Server Components
- **TypeScript** - Full type safety across the application
- **Tailwind CSS** - Utility-first styling with custom design system
- **React Hooks** - State management with useState, useEffect

### AI & Image Generation
- **Black Forest Labs FLUX Models** - State-of-the-art text-to-image generation
  - **FLUX Pro 1.1 Ultra** - Highest quality (up to 4MP), supports img2img
  - **FLUX Pro 1.1** - Fast generation with excellent quality
  - **FLUX Pro** - Original pro model for standard workflows
  - **FLUX Kontext (max/pro/dev)** - Specialized img2img transformation models
  - **FLUX Dev** - Development model with configurable steps and guidance

### Database & Storage
- **Supabase PostgreSQL** - Relational database for structured data
  - Sections, prompts, generated images, and metadata
  - Row-level security (RLS) policies
  - Real-time subscriptions for live updates
- **Supabase Storage** - Object storage for generated images
  - Public bucket with CDN caching (1-year cache headers)
  - Server-side image processing with Sharp

### Image Processing
- **Sharp** - High-performance Node.js image processing
  - WebP conversion (80% quality for optimal size/quality ratio)
  - Automatic resizing (max 2048px, maintains aspect ratio)
  - Server-side processing before storage upload

### Deployment
- **Vercel** - Edge deployment with automatic CI/CD
- **GitHub** - Version control and collaboration

## 🏗️ Architecture Highlights

### Prompt Management System

**Version-Controlled Prompt Engineering**
- Every prompt is versioned with incremental version numbers
- Active/inactive status tracking for A/B testing
- Full prompt history with rollback capability
- Template system for reusable prompts across sections
- Tags and notes for organizational context

```typescript
type Prompt = {
  id: string
  section_id: string
  prompt_text: string          // Main generation prompt
  negative_prompt: string | null // What to avoid
  version: number               // Incremental versioning
  is_active: boolean           // Only one active per section
  notes: string | null         // Internal documentation
  tags: string[]               // Categorization
  is_template: boolean         // Reusable across sections
  created_at: string
}
```

**Prompt Workflow:**
1. Edit prompt text in dedicated editor
2. Save creates new version (increments counter)
3. Automatically sets as active, deactivates previous
4. Full history preserved for rollback
5. Can restore any previous version

### Image Generation Pipeline

**Multi-Model FLUX Integration**
- Dynamic model selection with real-time parameter adjustment
- Model-specific features (aspect ratios, raw mode, dev parameters)
- Reference image support for img2img workflows
- Configurable generation settings persisted with each image

**Generation Settings:**
```typescript
type GenerationSettings = {
  model: FluxModel                    // Selected FLUX variant
  width: number                       // For non-aspect-ratio models
  height: number
  aspectRatio: string                 // For Ultra/Kontext (16:9, 1:1, etc.)
  outputFormat: 'jpeg' | 'png'
  seed: string                        // Reproducibility
  safetyTolerance: number            // 0-6 content filtering
  promptUpsampling: boolean          // AI prompt enhancement
  raw: boolean                       // Ultra-only authentic photography mode
  imagePromptStrength: number        // Reference image influence (0-1)
  steps: number                      // Dev model inference steps
  guidance: number                   // Dev model guidance scale
}
```

**Generation Flow:**
1. Select section → Loads active prompt
2. Configure settings in right panel
3. Primary section image automatically used as reference (for Ultra/Kontext)
4. Click generate → API processes request
5. Image generated via FLUX API
6. Server-side compression to WebP
7. Upload to Supabase Storage
8. Database record created with full metadata
9. Review queue populated for approval

### Image Approval Workflow

**Structured Review Process**
- Generated images enter "pending" status
- Side-by-side comparison with current section image
- Approve → Sets as primary section image
- Reject → Marks as rejected (kept for history)
- Pin as global reference → Available across all sections
- All actions tracked with timestamps

**Image Metadata:**
```typescript
type GeneratedImage = {
  id: string
  section_id: string
  prompt_id: string | null
  image_url: string                  // Supabase Storage URL
  model_name: string                 // FLUX variant used
  model_provider: 'black-forest-labs'
  status: 'pending' | 'approved' | 'rejected'
  generation_settings: object        // Full settings snapshot
  comparison_notes: string | null    // Review feedback
  is_global_reference: boolean       // Available to all sections
  created_at: string
  approved_at: string | null
}
```

### Storage Architecture

**Server-Side Image Processing**
- No base64 encoding (removed for performance and size)
- All images processed server-side with Sharp
- WebP format for 80% quality at ~60% smaller size than PNG
- Automatic resizing to max 2048px (maintains aspect ratio)
- Uploaded to Supabase Storage with 1-year cache headers

**Storage Flow:**
```typescript
// 1. Fetch image from FLUX API
const imageResponse = await fetch(fluxApiUrl)
const buffer = await imageResponse.arrayBuffer()

// 2. Server-side compression
const compressedImage = await sharp(Buffer.from(buffer))
  .webp({ quality: 80 })
  .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
  .toBuffer()

// 3. Upload to Supabase Storage
const { data, error } = await supabaseAdmin.storage
  .from('generated-images')
  .upload(filePath, compressedImage, {
    contentType: 'image/webp',
    cacheControl: '31536000', // 1 year
    upsert: false
  })

// 4. Get public URL and store in database
const publicUrl = supabaseAdmin.storage
  .from('generated-images')
  .getPublicUrl(filePath).data.publicUrl
```

## 🎨 Admin Interface Features

### Streamlined UX Design

**Section Carousel**
- Horizontal scrolling section selector
- Current image thumbnails with badges
- Upload/delete functionality on hover
- Visual indication of selected section

**Linear Workflow (Always Visible):**
1. **Current Section Image** - Shows primary image (custom or local fallback)
2. **Edit Prompt** - Inline prompt editor with save versioning
3. **Generate New Image** - Single-click generation with settings in sidebar
4. **Review Queue** - Pending images appear automatically

**Settings Panel (Right Sidebar):**
- Model selection with descriptions
- Dimensions or aspect ratio (based on model)
- Output format, seed, safety tolerance
- Reference image influence slider
- Advanced settings (collapsible):
  - Prompt upsampling toggle
  - Raw mode (Ultra only)
  - Dev model steps/guidance

**Prompt History (Optional):**
- Collapsed by default in right sidebar
- Shows all previous versions
- One-click restore to any version
- Preserves full prompt evolution

### Global Reference System

**Cross-Section Image Reuse**
- Pin any approved image as global reference
- Available in all section generators
- Visual grid selector with section badges
- One-click selection as reference image
- Remove from global library option

## 📊 Database Schema

### Core Tables

**sections** - Venue section definitions
```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  section_code TEXT NOT NULL UNIQUE,
  category TEXT,
  current_image_url TEXT,           -- Primary display image
  row_info TEXT,
  price DECIMAL(10,2),
  deal_badge TEXT,                  -- "CHEAPEST", "AMAZING DEAL", etc.
  value_badge TEXT,                 -- "TOP 5% VALUE", etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

**prompts** - Version-controlled prompt system
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  version INTEGER NOT NULL,          -- Auto-incrementing version
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT false, -- Reusable template
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section_id, version)        -- One version per section
);
```

**generated_images** - All generated images with metadata
```sql
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  status TEXT DEFAULT 'pending',     -- pending/approved/rejected
  generation_settings JSONB,         -- Full settings snapshot
  comparison_notes TEXT,
  is_global_reference BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_prompts_section_active ON prompts(section_id, is_active);
CREATE INDEX idx_images_section_status ON generated_images(section_id, status);
CREATE INDEX idx_images_global_ref ON generated_images(is_global_reference);
```

## 🔑 Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For storage uploads

# Black Forest Labs (Required)
BFL_API_KEY=your-black-forest-labs-api-key

# Optional
NODE_ENV=production
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Black Forest Labs API key

### Installation

```bash
# Clone repository
git clone https://github.com/sullysaurus/gametime.git
cd gametime-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# (Execute supabase-schema.sql in Supabase SQL editor)

# Start development server
npm run dev
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
git push origin main  # Automatic deployment via GitHub integration
```

## 📈 Performance Optimizations

1. **Image Optimization**
   - WebP format reduces file size by ~60% vs PNG
   - Server-side Sharp processing (faster than client-side)
   - CDN caching with 1-year headers
   - Max 2048px prevents unnecessarily large files

2. **Database Efficiency**
   - Indexed queries for fast section/prompt lookups
   - Single active prompt per section (no complex filtering)
   - JSONB for flexible metadata storage

3. **API Design**
   - Server-side image processing reduces client load
   - Single endpoint for all FLUX models
   - Proper error handling with detailed logs

## 🎯 Key Technical Decisions

### Why FLUX Models?
- Superior quality vs DALL-E/Stable Diffusion for venue imagery
- img2img support for iterating on existing photos
- Multiple model variants for different use cases
- Raw mode for authentic photography aesthetics

### Why WebP + Server-Side Processing?
- 60% smaller files than PNG with minimal quality loss
- Faster page loads on public ticket page
- Server-side Sharp processing more reliable than client-side
- Consistent compression across all generated images

### Why Version-Controlled Prompts?
- Track prompt evolution and effectiveness
- A/B test different approaches
- Rollback to successful prompts
- Document learnings in notes/tags

### Why Supabase Storage vs Base64?
- Scalability (base64 bloats database size)
- CDN caching for faster delivery
- Proper HTTP caching headers
- Separation of concerns (storage vs data)

## 🔮 Future Enhancements

- [ ] Batch generation across all sections
- [ ] Automated prompt optimization with analytics
- [ ] Image variation generation from approved images
- [ ] Cost tracking per section/model
- [ ] API rate limiting and queue management
- [ ] Admin authentication with role-based access
- [ ] Webhook notifications for approvals
- [ ] Analytics dashboard for generation metrics

## 📝 License

MIT

---

**Built with ❤️ for demonstrating full-stack AI integration, database design, and production-ready image processing workflows.**
