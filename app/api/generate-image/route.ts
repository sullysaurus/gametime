import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import * as fal from '@fal-ai/serverless-client'

// Server-side Supabase client with service role for storage uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// fal.ai API configuration
const FAL_API_KEY = process.env.FAL_API_KEY || ''
if (FAL_API_KEY) {
  fal.config({ credentials: FAL_API_KEY })
}

// Black Forest Labs API configuration (fallback for non-LoRA models)
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
  | 'flux-kontext-dev'

type LoRAWeight = {
  path: string  // LoRA model path/identifier
  scale: number // Weight scale (typically 0.5-1.5)
}

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
  image_prompt_strength?: number  // 0.0-1.0 for Ultra and Kontext img2img
  input_image?: string | null  // Base64 image for Kontext img2img
  steps?: number  // For dev model
  guidance?: number  // For dev model
  loras?: LoRAWeight[]  // LoRA models (for dev model)
  // Image-to-image for fal.ai flux-dev
  reference_image_url?: string | null  // URL or base64 data URI for img2img
  img2img_strength?: number  // 0.0-1.0, controls transformation strength (default: 0.85)
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
  const isKontext = model === 'flux-kontext-max' || model === 'flux-kontext-pro' || model === 'flux-kontext-dev'

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

    // Kontext-specific features (input_image for img2img)
    if (isKontext) {
      if (payload.input_image) {
        requestBody.input_image = payload.input_image
        requestBody.image_prompt_strength = payload.image_prompt_strength ?? 0.1
      }
    }
  } else {
    requestBody.width = payload.width || 1024
    requestBody.height = payload.height || 1024
  }

  // Dev model supports steps, guidance, and LoRAs
  if (model === 'flux-dev') {
    if (payload.steps) requestBody.steps = payload.steps
    if (payload.guidance) requestBody.guidance = payload.guidance
    if (payload.loras && payload.loras.length > 0) {
      requestBody.loras = payload.loras
    }
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
      // BFL API returns nested structure: result.result.sample
      const imageUrl = result.result?.sample

      if (!imageUrl) {
        console.error('Unexpected response structure:', JSON.stringify(result, null, 2))
        throw new Error('No image URL in completed result')
      }

      // Download the image
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image')
      }

      const arrayBuffer = await imageResponse.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Require Supabase Storage - no base64 fallback
      if (!supabaseAdmin) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured. Image storage is required.')
      }

      console.log('Compressing image to WebP...')

      // Compress image to WebP for optimal performance
      // 80% quality provides excellent visual quality with ~60% size reduction
      const compressedImage = await sharp(buffer)
        .webp({ quality: 80 })
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .toBuffer()

      // Upload to Supabase Storage using service role (has full permissions)
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
      const filePath = `generated/${fileName}`

      console.log(`Uploading image to storage: ${filePath}`)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('generated-images')
        .upload(filePath, compressedImage, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 year cache
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      console.log(`Image uploaded successfully: ${filePath}`)

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('generated-images')
        .getPublicUrl(filePath)

      console.log(`Public URL: ${publicUrl}`)

      return publicUrl
    }

    if (result.status === 'Error' || result.status === 'Failed') {
      throw new Error(`BFL generation error: ${result.error || 'Unknown error'}`)
    }

    attempts++
  }

  throw new Error('Generation timeout - exceeded maximum polling attempts')
}

async function generateWithFal(payload: GenerateImagePayload): Promise<string> {
  // Determine if this is image-to-image or text-to-image
  const isImg2Img = payload.reference_image_url && payload.reference_image_url.trim() !== ''
  const endpoint = isImg2Img ? 'fal-ai/flux-lora/image-to-image' : 'fal-ai/flux-lora'

  console.log(`Generating image with fal.ai ${endpoint}...`, {
    prompt: payload.prompt.substring(0, 100),
    loras: payload.loras,
    steps: payload.steps,
    guidance: payload.guidance,
    img2img: isImg2Img,
    strength: payload.img2img_strength,
  })

  // Build fal.ai request
  const input: Record<string, any> = {
    prompt: payload.prompt,
    num_inference_steps: payload.steps || 28,
    guidance_scale: payload.guidance || 3.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: payload.output_format || 'jpeg',
  }

  // Add seed if provided
  if (payload.seed !== null && payload.seed !== undefined) {
    input.seed = payload.seed
  }

  // Add LoRAs if provided
  if (payload.loras && payload.loras.length > 0) {
    input.loras = payload.loras
  }

  // Add image-to-image parameters if reference image provided
  if (isImg2Img) {
    input.image_url = payload.reference_image_url
    input.strength = payload.img2img_strength ?? 0.85
    console.log('Using reference image for img2img transformation')
  }

  // Handle image size - fal.ai prefers named sizes but also accepts width/height
  if (payload.aspect_ratio) {
    input.image_size = payload.aspect_ratio
  } else {
    input.image_size = {
      width: payload.width || 1024,
      height: payload.height || 1024,
    }
  }

  // Call fal.ai API with appropriate endpoint
  const result = await fal.subscribe(endpoint, {
    input,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        console.log('fal.ai generation in progress...')
      }
    },
  }) as any

  // Get image URL from result
  const imageUrl = result.images?.[0]?.url
  if (!imageUrl) {
    console.error('Unexpected fal.ai response:', JSON.stringify(result, null, 2))
    throw new Error('No image URL in fal.ai result')
  }

  console.log('fal.ai image generated:', imageUrl)

  // Download the image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error('Failed to download generated image from fal.ai')
  }

  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Require Supabase Storage
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured. Image storage is required.')
  }

  console.log('Compressing image to WebP...')

  // Compress image to WebP
  const compressedImage = await sharp(buffer)
    .webp({ quality: 80 })
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  // Upload to Supabase Storage
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
  const filePath = `generated/${fileName}`

  console.log(`Uploading image to storage: ${filePath}`)

  const { error: uploadError } = await supabaseAdmin.storage
    .from('generated-images')
    .upload(filePath, compressedImage, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  console.log(`Image uploaded successfully: ${filePath}`)

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('generated-images')
    .getPublicUrl(filePath)

  console.log(`Public URL: ${publicUrl}`)

  return publicUrl
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

    // Validate API keys based on model
    const useFal = model === 'flux-dev'
    if (useFal && !FAL_API_KEY) {
      return NextResponse.json(
        { error: 'FAL_API_KEY not configured for flux-dev model' },
        { status: 500 }
      )
    }
    if (!useFal && !BFL_API_KEY) {
      return NextResponse.json(
        { error: 'BFL_API_KEY not configured' },
        { status: 500 }
      )
    }

    console.log(`Generating image for section ${sectionId}, prompt ${promptId}`)

    // Generate image using fal.ai for flux-dev (LoRA support), BFL for others
    const imageUrl = useFal
      ? await generateWithFal({
          ...fluxParams,
          prompt,
          model: model as FluxModel,
          provider: 'fal.ai',
          sectionId,
          promptId,
        })
      : await generateWithBFL({
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
        model_provider: useFal ? 'fal.ai' : provider,
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
