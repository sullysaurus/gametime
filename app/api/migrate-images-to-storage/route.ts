import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
    // Check for service role key
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    // Get all base64 images
    const { data: base64Images, error: fetchError } = await (supabase as any)
      .from('generated_images')
      .select('id, image_url, section_id, model_name')
      .like('image_url', 'data:%')
      .limit(10) // Process 10 at a time to avoid timeout

    if (fetchError) {
      throw fetchError
    }

    if (!base64Images || base64Images.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No base64 images to migrate',
        migrated: 0
      })
    }

    console.log(`Migrating ${base64Images.length} base64 images to storage...`)

    const results = []

    for (const image of base64Images) {
      try {
        // Extract base64 data
        const base64Match = image.image_url.match(/^data:image\/(\w+);base64,(.+)$/)
        if (!base64Match) {
          console.error(`Invalid base64 format for image ${image.id}`)
          results.push({ id: image.id, success: false, error: 'Invalid base64 format' })
          continue
        }

        const [, format, base64Data] = base64Match
        const buffer = Buffer.from(base64Data, 'base64')

        // Compress to WebP
        console.log(`Compressing image ${image.id} to WebP...`)
        const compressedImage = await sharp(buffer)
          .webp({ quality: 80 })
          .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
          .toBuffer()

        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
        const filePath = `generated/${fileName}`

        console.log(`Uploading image ${image.id} to storage: ${filePath}`)

        const { error: uploadError } = await supabaseAdmin.storage
          .from('generated-images')
          .upload(filePath, compressedImage, {
            contentType: 'image/webp',
            cacheControl: '31536000', // 1 year cache
            upsert: false
          })

        if (uploadError) {
          console.error(`Upload error for image ${image.id}:`, uploadError)
          results.push({ id: image.id, success: false, error: uploadError.message })
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('generated-images')
          .getPublicUrl(filePath)

        console.log(`Image ${image.id} uploaded successfully: ${publicUrl}`)

        // Update database with new URL
        const { error: updateError } = await (supabase as any)
          .from('generated_images')
          .update({ image_url: publicUrl })
          .eq('id', image.id)

        if (updateError) {
          console.error(`Database update error for image ${image.id}:`, updateError)
          results.push({ id: image.id, success: false, error: updateError.message })
          continue
        }

        results.push({ id: image.id, success: true, url: publicUrl })
        console.log(`✓ Successfully migrated image ${image.id}`)

      } catch (error) {
        console.error(`Error migrating image ${image.id}:`, error)
        results.push({
          id: image.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${successCount} succeeded, ${failCount} failed`,
      migrated: successCount,
      failed: failCount,
      results: results
    })

  } catch (error) {
    console.error('Migration error:', error)
    const message = error instanceof Error ? error.message : 'Failed to migrate images'
    return NextResponse.json(
      {
        error: message,
        details: error,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    // Count base64 vs storage images
    const { data: allImages, error } = await (supabase as any)
      .from('generated_images')
      .select('image_url')

    if (error) throw error

    const base64Count = allImages?.filter((img: any) => img.image_url.startsWith('data:')).length || 0
    const storageCount = allImages?.filter((img: any) => img.image_url.startsWith('https:')).length || 0
    const totalCount = allImages?.length || 0

    return NextResponse.json({
      total: totalCount,
      base64: base64Count,
      storage: storageCount,
      needsMigration: base64Count > 0,
      serviceRoleConfigured: !!supabaseAdmin
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    )
  }
}
