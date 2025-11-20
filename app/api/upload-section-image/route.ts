import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// Server-side Supabase client with service role for storage uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured. Image storage is required.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const sectionId = formData.get('sectionId') as string

    if (!file || !sectionId) {
      return NextResponse.json(
        { error: 'File and sectionId are required' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('Compressing uploaded image to WebP...')

    // Compress image to WebP
    const compressedImage = await sharp(buffer)
      .webp({ quality: 80 })
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()

    // Upload to Supabase Storage
    const fileName = `section-${sectionId}-${Date.now()}.webp`
    const filePath = `sections/${fileName}`

    console.log(`Uploading section image to storage: ${filePath}`)

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

    // Update section with new image URL
    const { error: updateError } = await supabaseAdmin
      .from('sections')
      .update({ current_image_url: publicUrl })
      .eq('id', sectionId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error(`Failed to update section: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl
    })

  } catch (error) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload image'
    return NextResponse.json(
      {
        error: message,
        details: error,
      },
      { status: 500 }
    )
  }
}
