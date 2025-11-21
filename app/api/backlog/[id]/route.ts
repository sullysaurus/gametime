import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// DELETE a photo from backlog
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the photo first to delete from storage
    const { data: photo, error: fetchError } = await (supabase as any)
      .from('photo_backlog')
      .select('image_url, thumbnail_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching photo:', fetchError);
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Extract file paths from URLs and delete from storage
    if (photo.image_url) {
      const mainPath = photo.image_url.split('/generated-images/').pop();
      if (mainPath) {
        await (supabase as any).storage.from('generated-images').remove([mainPath]);
      }
    }

    if (photo.thumbnail_url) {
      const thumbPath = photo.thumbnail_url.split('/generated-images/').pop();
      if (thumbPath) {
        await (supabase as any).storage.from('generated-images').remove([thumbPath]);
      }
    }

    // Delete from database
    const { error: deleteError } = await (supabase as any)
      .from('photo_backlog')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting photo:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/backlog/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH to update notes or tags
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes, tags } = body;

    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;

    const { data, error } = await (supabase as any)
      .from('photo_backlog')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating photo:', error);
      return NextResponse.json(
        { error: 'Failed to update photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ photo: data });
  } catch (error) {
    console.error('Error in PATCH /api/backlog/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
