import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Black Forest Labs API configuration
const BFL_API_URL = 'https://api.bfl.ai/v1'
const BFL_API_KEY = process.env.BFL_API_KEY || ''

// BFL FLUX Models
type FluxModel =
  | 'flux-pro-1.1-ultra'
  | 'flux-pro-1.1'
  | 'flux-pro'
  | 'flux-dev'
  | 'flux-kontext-max'
  | 'flux-kontext-pro'

type GenerateImagePayload = {
  sectionId: string
  promptId: string
  prompt: string
  model?: FluxModel
  provider?: string
  // FLUX-specific parameters
  width?: number
  height?: number
  aspect_ratio?: string
  prompt_upsampling?: boolean
  seed?: number | null
  safety_tolerance?: number
  output_format?: 'jpeg' | 'png'
  raw?: boolean  // For Ultra model
  image_prompt?: string | null  // Base64 image for Ultra img2img
  image_prompt_strength?: number  // 0.0-1.0 for Ultra img2img
  steps?: number  // For dev model
  guidance?: number  // For dev model
}

// Convert width/height to aspect ratio for Ultra model
function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

async function generateWithBFL(payload: GenerateImagePayload): Promise<string> {
  const model = payload.model || 'flux-pro-1.1'
  const isUltra = model === 'flux-pro-1.1-ultra'
  const isKontext = model === 'flux-kontext-max' || model === 'flux-kontext-pro'

  // Build request body based on model
  const requestBody: Record<string, any> = {
    prompt: payload.prompt,
    prompt_upsampling: payload.prompt_upsampling ?? false,
    safety_tolerance: payload.safety_tolerance ?? 2,
    output_format: payload.output_format || 'jpeg',
  }

  // Add seed if provided
  if (payload.seed !== null && payload.seed !== undefined) {
    requestBody.seed = payload.seed
  }

  // Ultra and Kontext models use aspect_ratio, others use width/height
  if (isUltra || isKontext) {
    requestBody.aspect_ratio = payload.aspect_ratio || getAspectRatio(
      payload.width || 1024,
      payload.height || 1024
    )

    // Ultra-specific features
    if (isUltra) {
      if (payload.raw !== undefined) {
        requestBody.raw = payload.raw
      }

      if (payload.image_prompt) {
        requestBody.image_prompt = payload.image_prompt
        requestBody.image_prompt_strength = payload.image_prompt_strength ?? 0.1
      }
    }
  } else {
    requestBody.width = payload.width || 1024
    requestBody.height = payload.height || 1024
  }

  // Dev model supports steps and guidance
  if (model === 'flux-dev') {
    if (payload.steps) requestBody.steps = payload.steps
    if (payload.guidance) requestBody.guidance = payload.guidance
  }

  console.log(`Generating image with BFL ${model}...`, requestBody)

  // Step 1: Submit generation request
  const submitResponse = await fetch(`${BFL_API_URL}/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-key': BFL_API_KEY,
    },
    body: JSON.stringify(requestBody),
  })

  if (!submitResponse.ok) {
    const error = await submitResponse.json().catch(() => ({}))
    throw new Error(
      `BFL API error (${submitResponse.status}): ${error.message || submitResponse.statusText}`
    )
  }

  const { id, polling_url } = await submitResponse.json()
  console.log(`BFL task submitted: ${id}, polling: ${polling_url}`)

  // Step 2: Poll for result
  let attempts = 0
  const maxAttempts = 60 // 60 attempts * 2 seconds = 2 minutes max

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

    const pollResponse = await fetch(polling_url, {
      headers: { 'x-key': BFL_API_KEY },
    })

    if (!pollResponse.ok) {
      throw new Error(`Polling failed: ${pollResponse.statusText}`)
    }

    const result = await pollResponse.json()
    console.log(`Poll attempt ${attempts + 1}:`, result.status)

    if (result.status === 'Ready') {
      if (!result.sample) {
        throw new Error('No image URL in completed result')
      }

      // Download the image and convert to base64 for storage
      const imageResponse = await fetch(result.sample)
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image')
      }

      const arrayBuffer = await imageResponse.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = payload.output_format === 'png' ? 'image/png' : 'image/jpeg'

      return `data:${mimeType};base64,${base64}`
    }

    if (result.status === 'Error') {
      throw new Error(`BFL generation error: ${result.error || 'Unknown error'}`)
    }

    attempts++
  }

  throw new Error('Generation timeout - exceeded maximum polling attempts')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sectionId,
      promptId,
      prompt,
      model = 'flux-pro-1.1',
      provider = 'black-forest-labs',
      ...fluxParams
    }: GenerateImagePayload = body

    // Validate required fields
    if (!sectionId || !promptId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionId, promptId, prompt' },
        { status: 400 }
      )
    }

    // Validate BFL API key
    if (!BFL_API_KEY) {
      return NextResponse.json(
        { error: 'BFL_API_KEY not configured' },
        { status: 500 }
      )
    }

    console.log(`Generating image for section ${sectionId}, prompt ${promptId}`)

    // Generate image using BFL
    const imageUrl = await generateWithBFL({
      ...fluxParams,
      prompt,
      model: model as FluxModel,
      provider,
      sectionId,
      promptId,
    })

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
          ...fluxParams,
          prompt,
          model,
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
