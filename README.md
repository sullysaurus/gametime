# Red Rocks AI Image Generator

A Next.js application for generating, comparing, and managing AI-generated concert venue images for Red Rocks Amphitheatre sections using OpenAI DALL-E 3 and Vercel AI Gateway.

## Features

- 🎨 **AI Image Generation**: Generate stunning concert venue images using DALL-E 3
- 🔄 **Model Switching**: Easily switch between different AI models via Vercel AI Gateway
- 📊 **Image Comparison**: Side-by-side comparison of original vs generated images
- ✅ **Approve/Reject Workflow**: Review and approve images before they go live
- ✏️ **Prompt Editor**: Edit and version control your image generation prompts
- 📝 **Iteration Tracking**: Keep track of all prompt versions and generated images
- 🎫 **Public Ticket Page**: Display approved images on a Gametime-style ticket listing

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI DALL-E 3 via Vercel AI SDK
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key
- Vercel account (for deployment)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd /Users/daniel-sullivan/projects/gametime-ai
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor
4. This will create all necessary tables, indexes, and seed data

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Then fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Vercel AI Gateway
# AI_GATEWAY_URL=https://your-gateway.vercel.app
```

**Where to find these:**
- Supabase URL & Key: Settings → API in your Supabase dashboard
- OpenAI API Key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the public ticket page.

Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin).

## Usage

### Admin Dashboard

1. Navigate to `/admin`
2. Select a section from the sidebar
3. **Edit Prompt**: Click "Edit Prompt" to modify the generation prompt
4. **Generate Image**: Select a model and click "Generate Image"
5. **Review**: Compare the new image with the current one
6. **Approve/Reject**: Approve to set as the current image, or reject to discard

#### Model Presets & Advanced Controls

- **Model presets**: Choose between DALL·E 3 (Ultra HD), GPT-Image 1 (Balanced), Stable Diffusion 3 (Detail), and FLUX.1 Pro (Creative). Each preset shows its recommended defaults but you can tweak them freely.
- **Size**: Accepts any `WIDTHxHEIGHT` value. Autocomplete lists the common 1024/1792 aspect ratios.
- **Quality**: Toggle `standard` vs `hd` for OpenAI models. HD consumes more credits but yields sharper textures.
- **Style**: Switch between `vivid` (high saturation) and `natural` (cinematic neutrality) for models that support it.
- **Background**: Supply `transparent`, `white`, hex colors, etc.—especially useful for GPT-Image 1 cutouts.
- All selected settings are logged alongside the Supabase record to make reproducing a winning combo trivial.
- **Reference Enhancements**: When you pick a section we automatically pull in its current public photo. Switch on “Use reference as input” (available for GPT-Image 1) to feed that photo into the generation call so you can iterate on the exact angle/lighting you already show on the ticketing page.

### Public Page

- Visit the homepage (`/`) to see all sections with their approved images
- Images display with badges (CHEAPEST, AMAZING DEAL, etc.)
- Shows pricing and section information

## Database Schema

### Tables

**sections**: Stores Red Rocks venue sections
- Section name, code, category
- Current image URL
- Pricing and badge information

**prompts**: Version-controlled prompts for image generation
- Linked to sections
- Tracks prompt text, negative prompts
- Version numbers and active status

**generated_images**: All generated images with metadata
- Links to section and prompt
- Model information
- Status (pending, approved, rejected)
- Generation settings and comparison notes

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository: `sullysaurus/gametime`
   - Vercel will auto-detect it as a Next.js project

3. **Configure Environment Variables**:
   Before deploying, add these in the Vercel dashboard (Settings → Environment Variables):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://aamjoctqvztopmmultsl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   AI_GATEWAY_API_KEY=vck_3tH9HOmrKG30QUurK3hdz2TnbwWFY2g7vWeDIYT1yiBxCCdmOf1Cti7V
   AI_GATEWAY_URL=https://ai-gateway.vercel.sh/v1
   ```

4. **Deploy!**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll get a URL like `https://gametime-xyz.vercel.app`

### Setting Up Vercel AI Gateway (Optional)

Vercel AI Gateway allows you to:
- Switch between AI providers seamlessly
- Monitor and log all requests
- Implement rate limiting and caching

See `docs/vercel-ai-gateway.md` for the full setup guide. At minimum you will need:

1. A Gateway URL that routes to your configured models (DALL·E 3, GPT-Image 1, Stable Diffusion 3, FLUX.1 Pro)
2. A Gateway Access Token (used as `OPENAI_API_KEY` locally)
3. `.env.local` updated with both `OPENAI_API_KEY` and `AI_GATEWAY_URL`

> ℹ️ DALL·E 3 + GPT-Image 1 run directly against OpenAI, while Stable Diffusion 3 and FLUX.1 Pro require the gateway to translate the OpenAI-compatible request into those providers.

## Adding More AI Models

To add support for additional models (Stable Diffusion, Midjourney, etc.):

1. Install the necessary SDK (e.g., `@replicate/replicate`)
2. Update `app/api/generate-image/route.ts` to handle the new model
3. Add the model to the `MODEL_PRESETS` array in `components/ImageGenerator.tsx`

Example for Replicate:

```typescript
// Install: npm install replicate

import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

// In the API route:
if (model === 'stable-diffusion-xl') {
  const output = await replicate.run(
    "stability-ai/sdxl:...",
    { input: { prompt } }
  )
  // Handle output...
}
```

## Project Structure

```
gametime-ai/
├── app/
│   ├── page.tsx                 # Public ticket listing
│   ├── admin/
│   │   └── page.tsx             # Admin dashboard
│   └── api/
│       ├── generate-image/       # Image generation endpoint
│       └── images/[id]/status/   # Image status update endpoint
├── components/
│   ├── ImageGenerator.tsx       # Image generation UI
│   ├── ImageComparison.tsx      # Side-by-side comparison
│   └── PromptEditor.tsx         # Prompt editing interface
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── database.types.ts        # TypeScript types
├── supabase-schema.sql          # Database schema
└── README.md
```

## Features Roadmap

- [ ] Batch image generation for all sections
- [ ] Image history view
- [ ] Prompt templates library
- [ ] A/B testing different prompts
- [ ] Image optimization and CDN integration
- [ ] Admin authentication
- [ ] Webhook notifications for new images

## Troubleshooting

### Images not loading

- Check that image URLs are accessible
- Verify Next.js `next.config.js` allows the image domains
- Check browser console for CORS errors

### Generation fails

- Verify OpenAI API key is correct
- Check API key has sufficient credits
- Review error messages in browser console and server logs

### Database connection issues

- Verify Supabase URL and anon key are correct
- Check that RLS policies allow access
- Confirm database schema was created successfully

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
