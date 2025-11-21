import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST to assign a backlog photo to a section
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sectionId, deleteAfterAssign = true } = body;

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // Get the backlog photo
    const { data: photo, error: fetchError } = await (supabase as any)
      .from('photo_backlog')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !photo) {
      console.error('Error fetching photo:', fetchError);
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Update the section's current_image_url
    const { error: updateError } = await (supabase as any)
      .from('sections')
      .update({ current_image_url: photo.image_url })
      .eq('id', sectionId);

    if (updateError) {
      console.error('Error updating section:', updateError);
      return NextResponse.json(
        { error: 'Failed to assign photo to section' },
        { status: 500 }
      );
    }

    // Optionally delete from backlog after assignment
    if (deleteAfterAssign) {
      const { error: deleteError } = await (supabase as any)
        .from('photo_backlog')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting from backlog:', deleteError);
        // Continue even if delete fails - the photo was already assigned
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Photo assigned to section successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/backlog/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
