import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Buffer } from 'node:buffer'
import { supabase } from '@/lib/supabase'

// Initialize OpenAI client with Vercel AI Gateway
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key-for-build',
  baseURL: process.env.AI_GATEWAY_URL || 'https://gateway.vercel.ai/v1', // Vercel AI Gateway
})

function getBackgroundValue(
  value: string | null,
  model: string
): 'transparent' | 'opaque' | 'auto' | undefined {
  if (!value || model !== 'gpt-image-1') {
    return undefined
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === 'transparent' || normalized === 'opaque' || normalized === 'auto') {
    return normalized
  }
  return undefined
}

async function fetchImageBuffer(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to download reference image')
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function normalizeSizeForModel(size: string, model: string) {
  const normalized = size.trim().toLowerCase()
  if (model === 'gpt-image-1') {
    const allowed = new Set(['auto', '1024x1024', '1536x1024', '1024x1536'])
    return allowed.has(normalized) ? normalized : 'auto'
  }
  if (model === 'dall-e-3') {
    const allowed = new Set(['1024x1024', '1792x1024', '1024x1792'])
    return allowed.has(normalized) ? normalized : '1792x1024'
  }
  return size
}

type GenerateImagePayload = {
  sectionId: string
  promptId: string
  prompt: string
  negativePrompt?: string | null
  model?: string
  provider?: string
  size?: string
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  background?: string | null
  referenceImageUrl?: string | null
  useReferenceImage?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sectionId,
      promptId,
      prompt,
      negativePrompt,
      model = 'dall-e-3',
      provider = 'openai',
      size: requestedSize = '1792x1024',
      quality = 'hd',
      style = 'vivid',
      background = null,
      referenceImageUrl = null,
      useReferenceImage = false,
    }: GenerateImagePayload = body

    // Validate required fields
    if (!sectionId || !promptId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Combine prompt with negative prompt instruction if provided
    const fullPrompt = negativePrompt
      ? `${prompt}\n\nAvoid: ${negativePrompt}`
      : prompt

    const sanitizedBackground = getBackgroundValue(background, model)
    const targetSize = normalizeSizeForModel(requestedSize, model)
    const shouldUseReference =
      useReferenceImage && Boolean(referenceImageUrl) && model === 'gpt-image-1'

    let imageUrl: string | null = null

    if (shouldUseReference && referenceImageUrl) {
      console.log(`Enhancing existing image for ${model}...`)
      const referenceBuffer = await fetchImageBuffer(referenceImageUrl)

      // Convert Buffer to File for OpenAI API
      const imageFile = new File([referenceBuffer], 'reference.png', { type: 'image/png' })

      const editResponse = await openai.images.edit({
        model: model as 'gpt-image-1',
        prompt: fullPrompt,
        image: imageFile as any,
        n: 1,
        size: targetSize as '1024x1024' | '1536x1024' | '1024x1536' | 'auto',
        quality: quality === 'hd' ? 'high' : 'standard',
        background: sanitizedBackground as any,
        response_format: 'b64_json',
      })

      if (!editResponse.data) {
        throw new Error('No response data from API')
      }

      const edited = editResponse.data[0]?.b64_json
      if (!edited) {
        throw new Error('No edited image data returned from API')
      }
      imageUrl = `data:image/png;base64,${edited}`
    } else {
      console.log(`Generating image with ${model}...`)
      const response = await openai.images.generate({
        model,
        prompt: fullPrompt,
        n: 1,
        size: targetSize as any,
        quality,
        style,
        background: sanitizedBackground as any,
        response_format: model === 'gpt-image-1' ? 'b64_json' : 'url',
      } as any)

      const payload = response.data?.[0]
      imageUrl = payload?.url || (payload?.b64_json ? `data:image/png;base64,${payload.b64_json}` : null)
    }

    if (!imageUrl) {
      throw new Error('No image data returned from API')
    }

    // Save to Supabase
    const { data: generatedImage, error: dbError } = await supabase
      .from('generated_images')
      .insert({
        section_id: sectionId,
        prompt_id: promptId,
        image_url: imageUrl,
        model_name: model,
        model_provider: provider,
        status: 'pending',
        generation_settings: {
          size: requestedSize,
          resolvedSize: targetSize,
          quality,
          style,
          background,
          referenceImageUrl: referenceImageUrl || null,
          usedReferenceImage: shouldUseReference,
          prompt,
          negativePrompt,
        },
      } as any)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return NextResponse.json({
      success: true,
      image: generatedImage,
      imageUrl,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate image'
    return NextResponse.json(
      {
        error: message,
        details: error,
      },
      { status: 500 }
    )
  }
}
