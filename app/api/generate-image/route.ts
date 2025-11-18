import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

// Initialize OpenAI client (works with Vercel AI Gateway if configured)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_GATEWAY_URL, // Optional: Use Vercel AI Gateway
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sectionId,
      promptId,
      prompt,
      negativePrompt,
      model = 'dall-e-3',
      size = '1792x1024', // Closest to 1920x1080 for DALL-E 3
      quality = 'hd',
    } = body

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

    // Generate image with OpenAI DALL-E 3
    console.log(`Generating image with ${model}...`)
    const response = await openai.images.generate({
      model,
      prompt: fullPrompt,
      n: 1,
      size,
      quality,
      response_format: 'url',
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from API')
    }

    // Save to Supabase
    const { data: generatedImage, error: dbError } = await supabase
      .from('generated_images')
      .insert({
        section_id: sectionId,
        prompt_id: promptId,
        image_url: imageUrl,
        model_name: model,
        model_provider: 'openai',
        status: 'pending',
        generation_settings: {
          size,
          quality,
          prompt,
          negativePrompt,
        },
      })
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
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate image',
        details: error,
      },
      { status: 500 }
    )
  }
}
