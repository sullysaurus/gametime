import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string | null;
    const tags = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get original image dimensions
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    // Compress image to WebP format
    const compressedBuffer = await sharp(buffer)
      .resize(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Create thumbnail (400px wide)
    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 70 })
      .toBuffer();

    // Upload main image to Supabase Storage
    const timestamp = Date.now();
    const mainFileName = `backlog/main-${timestamp}.webp`;
    const { data: mainUploadData, error: mainUploadError } = await (supabase as any).storage
      .from('generated-images')
      .upload(mainFileName, compressedBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (mainUploadError) {
      console.error('Error uploading main image:', mainUploadError);
      return NextResponse.json(
        { error: 'Failed to upload main image' },
        { status: 500 }
      );
    }

    // Upload thumbnail to Supabase Storage
    const thumbnailFileName = `backlog/thumb-${timestamp}.webp`;
    const { data: thumbUploadData, error: thumbUploadError } = await (supabase as any).storage
      .from('generated-images')
      .upload(thumbnailFileName, thumbnailBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (thumbUploadError) {
      console.error('Error uploading thumbnail:', thumbUploadError);
      // Continue even if thumbnail fails
    }

    // Get public URLs
    const { data: mainUrlData } = (supabase as any).storage
      .from('generated-images')
      .getPublicUrl(mainFileName);

    const { data: thumbUrlData } = thumbUploadData
      ? (supabase as any).storage
          .from('generated-images')
          .getPublicUrl(thumbnailFileName)
      : { data: null };

    // Parse tags if provided
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : null;

    // Insert into photo_backlog table
    const { data: backlogData, error: backlogError } = await (supabase as any)
      .from('photo_backlog')
      .insert({
        image_url: mainUrlData.publicUrl,
        thumbnail_url: thumbUrlData?.publicUrl || null,
        original_filename: file.name,
        file_size: file.size,
        width: originalWidth,
        height: originalHeight,
        notes: notes || null,
        tags: parsedTags,
      })
      .select()
      .single();

    if (backlogError) {
      console.error('Error inserting into backlog:', backlogError);
      return NextResponse.json(
        { error: 'Failed to save to backlog' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: backlogData,
    });
  } catch (error) {
    console.error('Error uploading photo to backlog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
