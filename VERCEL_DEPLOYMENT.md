# Vercel Deployment Guide

## Required Environment Variables

You need to set these environment variables in your Vercel project settings:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### Required (Production):

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
BFL_API_KEY=<your-black-forest-labs-api-key>
```

**Get your actual values from `.env.local` file.**

### Optional (if using AI Gateway):

```
AI_GATEWAY_API_KEY=<your-vercel-gateway-key>
AI_GATEWAY_URL=https://ai-gateway.vercel.sh/v1
```

### Optional (for text features with Claude/Gemini):

```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
GOOGLE_GENERATIVE_AI_API_KEY=<your-gemini-api-key>
```

## How to Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (gametime-ai)
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. For each variable:
   - Click **Add New**
   - Enter the **Key** (e.g., `BFL_API_KEY`)
   - Enter the **Value**
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **Save**
6. After adding all variables, redeploy your project

## Why We Removed the `env` Section from `vercel.json`

The `@secret_name` syntax in `vercel.json` references Vercel secrets that must be created separately.
Instead, we set environment variables directly in the Vercel UI, which is simpler and more flexible.
