import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Check environment variables
    const checks = {
      supabaseUrl: !!supabaseUrl,
      supabaseUrlValue: supabaseUrl,
      serviceKeyConfigured: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...',
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        checks,
        error: 'Missing environment variables'
      })
    }

    // Try to create client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        checks,
        error: 'Failed to list buckets',
        details: bucketsError
      })
    }

    // Test 2: Check if generated-images bucket exists
    const generatedImagesBucket = buckets?.find(b => b.name === 'generated-images')

    // Test 3: Try to list files in the bucket
    let filesListResult = null
    if (generatedImagesBucket) {
      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from('generated-images')
        .list('generated', { limit: 10 })

      filesListResult = {
        success: !filesError,
        fileCount: files?.length || 0,
        error: filesError?.message
      }
    }

    // Test 4: Try a small test upload
    let uploadTestResult = null
    try {
      const testData = Buffer.from('test')
      const testPath = `test/diagnostic-${Date.now()}.txt`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('generated-images')
        .upload(testPath, testData, {
          contentType: 'text/plain',
          upsert: false
        })

      uploadTestResult = {
        success: !uploadError,
        error: uploadError?.message
      }

      // Clean up test file
      if (!uploadError) {
        await supabaseAdmin.storage
          .from('generated-images')
          .remove([testPath])
      }
    } catch (uploadErr) {
      uploadTestResult = {
        success: false,
        error: uploadErr instanceof Error ? uploadErr.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      checks,
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      generatedImagesBucket: {
        exists: !!generatedImagesBucket,
        public: generatedImagesBucket?.public
      },
      filesList: filesListResult,
      uploadTest: uploadTestResult,
      recommendation: uploadTestResult?.success
        ? 'Storage is working! Images should upload correctly.'
        : 'Storage upload failed. Check the error details above.'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
